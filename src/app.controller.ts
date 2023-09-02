import { Body, Controller, Get, HttpStatus, Post, Query, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Response } from 'express';
import { DateTime } from 'luxon';
import { AppService } from './app.service';
import { DataService } from './data/data.service';
import { DiscordService } from './discord/discord.service';
import { ConfirmDTO, CreateDivisionDTO, CreateMeetingDTO, DeleteDivisionDTO, DeleteMeetingDTO, LoginDTO } from './dtos';
import { ErrorPage } from './utils/filters/error.filter';
import { Redirect } from './utils/filters/redirect.filter';
import { AuthGuard } from './utils/guards/auth.guard';
import { ConfigGuard } from './utils/guards/config.guard';
import { $if, $ifel, page } from './utils/html';
import { Token, parseTime } from './utils/utils';

@Controller()
export class AppController {
	constructor(private readonly appService: AppService, private readonly data: DataService, private readonly discord: DiscordService) {}

	@Get('/')
	public landing(): string {
		return page('URT Scheduler - Landing')`
			<a href="/meetings" role="button">Schedule a Meeting</a>
			<a href="/config" role="button">Edit Config</a>
		`;
	}

	@Get('/meetings')
	@UseGuards(AuthGuard)
	public async meetings(@Token() token: string): Promise<string> {
		const userId = this.data.tokens.find((t) => t.token === token)!.userId;
		const canCreate = await this.appService.canCreateMeeting(userId);

		return page('URT Scheduler - Meetings')`
			<h1>Meetings</h1>
			${$ifel(this.data.meetings.length === 0)`<h2>No Meetings Currently...</h2>``
			<table>
				<thead>
					<tr>
						<th scope="col">ID</th>
						<th scope="col">Time</th>
						<th scope="col">Division</th>
						<th scope="col">Recurring</th>
						<th scope="col">Heads Up</th>
						${$if(canCreate)`<th scope="col"></th>`}
					</tr>
				</thead>
				<tbody>
					${this.data.meetings
						.map(
							(meeting) => `
					<tr>
						<td>${meeting.id}</td>
						<td>${DateTime.fromObject(meeting.time).toLocaleString(DateTime.DATETIME_FULL)}</td>
						<td>${meeting.division}</td>
						<td>${meeting.recurring ? 'Yes' : 'No'}</td>
						<td>${meeting.sendHeadsUp ? 'Yes' : 'No'}</td>
						${$if(canCreate)`<td>
							<form action="/delete-meeting" method="POST">
								<input type="hidden" name="id" value="${meeting.id}"></input>
								<button type="submit" class="error table-btn">Delete</button>
							</form>
						</td>`}
					</tr>
					`
						)
						.join('')}
				</tbody>
			</table>
			`}
			${$if(canCreate)`<a href="/new-meeting" role="button">New Meeting</a>`}
		`;
	}

	@Get('/new-meeting')
	@UseGuards(AuthGuard)
	public async createMeeting(@Token() token: string): Promise<string> {
		const userId = this.data.tokens.find((t) => t.token === token)!.userId;

		if (!(await this.appService.canCreateMeeting(userId))) {
			throw new UnauthorizedException(new ErrorPage('You are not allowed to create meetings', { 'View Meetings': '/meetings' }));
		}

		return page('URT Scheduler - New Meeting')`
			<form action="/new-meeting" method="POST">
			<label>
				Meeting Name
				<input type="type" name="name">
			</label>
			<label>
				Date
				<div class="row">
					<input type="type" name="date" placeholder="MM/DD">
					<span data-tooltip="Can also use keywords 'today' or 'tomorrow'" data-placement="left"><i class="fa-solid fa-circle-info"></i></span>
				</div>
			</label>
			<label>
				Time
				<div class="row time">
					<input type="text" name="time" placeholder="HH:MM">
					<select name="ampm">
						<option>AM</option>
						<option selected>PM</option>
					</select>
				</div>
			</label>
			<label>
				Division
				<select name="division">
					${this.data.divisions
						.map(
							(division) => `
					<option>${division.name}</option>
					`
						)
						.join('')}
				</select>
			</label>
			<label>
				Recurring
				<input type="checkbox" name="recurring" role="switch">
			</label>
			<label>
				Send "Heads Up" Message
				<input type="checkbox" name="sendHeadsUp" role="switch">
			</label>
			<button type="submit">Create</button>
		</form>
		`;
	}

	@Post('/new-meeting')
	public createMeetingAPI(@Body() { ampm, date, name, division, time, recurring, sendHeadsUp }: CreateMeetingDTO): never {
		this.data.meetings = [
			...this.data.meetings,
			{ id: randomUUID(), name, division, recurring, sendHeadsUp, time: parseTime(date, time, ampm).toObject() }
		];

		throw new Redirect('/meetings');
	}

	@Post('/delete-meeting')
	public deleteMeetingAPI(@Body() { id }: DeleteMeetingDTO): never {
		this.data.meetings = this.data.meetings.filter((meeting) => meeting.id !== id);

		throw new Redirect('/config');
	}

	@Get('/config')
	@UseGuards(AuthGuard, ConfigGuard)
	public async config(@Token() token: string): Promise<string> {
		const userId = this.data.tokens.find((t) => t.token === token)!.userId;
		const canConfig = await this.appService.isAdmin(userId);

		return page('URT Scheduler - Config')`
			<h1>Edit Config</h1>
			${$ifel(this.data.divisions.length === 0)`<h2>No Divisions Currently...</h2>``
			<table>
				<thead>
					<tr>
						<th scope="col">Name</th>
						<th scope="col">Channel ID</th>
						<th scope="col">Role ID</th>
						<th scope="col">Voice Channel ID</th>
						${$if(canConfig)`<th scope="col"></th>`}
					</tr>
				</thead>
				<tbody>
					${this.data.divisions
						.map(
							(division, i) => `
					<tr>
						<td>${division.name}</td>
						<td>${division.channelId}</td>
						<td>${division.roleId}</td>
						<td>${division.voiceChannelId}</td>
						${$if(canConfig)`<td>
							<form action="/delete-division" method="POST">
								<input type="hidden" name="idx" value="${i}"></input>
								<button type="submit" class="error table-btn">Delete</button>
							</form>
						</td>`}
					</tr>
					`
						)
						.join('')}
				</tbody>
			</table>
			`}
			<a href="/new-division" role="button">New Division</a>
		`;
	}

	@Get('/new-division')
	public async createDivision(): Promise<string> {
		const roles = await this.discord.getAllRoles();
		const textChannels = await this.discord.getTextChannels();
		const voiceChannels = await this.discord.getVoiceChannels();

		return page('URT Scheduler - New Division')`
			<form action="/new-division" method="POST">
			<label>
				Name
				<input type="text" name="name">
			</label>
			<label>
				Division Channel
				<select name="channelId">
					${textChannels
						.map(
							(channel) => `
					<option value="${channel.id}">${channel.name}</option>
					`
						)
						.join('')}
				</select>
			</label>
			<label>
				Division Role
				<select name="roleId">
					${roles
						.map(
							(role) => `
					<option value="${role.id}">${role.name}</option>
					`
						)
						.join('')}
				</select>
			</label>
			<label>
				Meeting Voice Channel
				<select name="voiceChannelId">
					${voiceChannels
						.map(
							(channel) => `
					<option value="${channel.id}">${channel.name}</option>
					`
						)
						.join('')}
				</select>
			</label>
			<button type="submit">Create</button>
		</form>
		`;
	}

	@Post('/new-division')
	public createDivisionAPI(@Body() newDivision: CreateDivisionDTO): never {
		this.data.divisions = [...this.data.divisions, newDivision];

		throw new Redirect('/config');
	}

	@Post('/delete-division')
	public deleteDivisionAPI(@Body() { idx }: DeleteDivisionDTO): never {
		if (this.data.divisions.length > idx && idx >= 0) {
			const name = this.data.divisions[idx].name;

			this.data.divisions = [...this.data.divisions.slice(0, idx), ...this.data.divisions.slice(idx + 1)];
			this.data.meetings = this.data.meetings.filter((meeting) => meeting.name !== name);
		}

		throw new Redirect('/config');
	}

	@Get('/login')
	public login(@Query('redirectTo') redirectTo?: string): string {
		return page('URT Scheduler - Login')`
			<h1>Login</h1>
			<form action="/login" method="POST">
				<label>
					Username or Discord ID
					<input type="text" name="nameOrId">
				</label>
				${$if(redirectTo !== undefined)`<input type="hidden" name="redirectTo" value="${redirectTo}">`}
				<button type="submit">Login</button>
			</form>
		`;
	}

	@Post('/login')
	public async loginAPI(@Body() { nameOrId, redirectTo }: LoginDTO): Promise<never> {
		const nonce = await this.appService.beginLoginAttempt(nameOrId, redirectTo);

		throw new Redirect(`/confirm?nonce=${nonce}`);
	}

	@Get('/confirm')
	public confirm(@Query('nonce') nonce: string): string {
		if (nonce === undefined) {
			throw new Redirect('/login');
		}

		return page('URT Scheduler - Login')`
			<h1>Login</h1>
			<form action="/confirm" method="POST">
				<label>
					Enter OTP (One-Time Password)
					<input type="text" name="discordNonce">
				</label>
				<input type="hidden" name="clientNonce" value="${nonce}">
				<button type="submit">Login</button>
			</form>
		`;
	}

	@Post('/confirm')
	public confirmAPI(@Body() { clientNonce, discordNonce }: ConfirmDTO, @Res() res: Response): void {
		const result = this.appService.confirmLoginAttempt(clientNonce, discordNonce);

		if (!result) {
			throw new UnauthorizedException(new ErrorPage('Incorrect password', { Retry: `/confirm?nonce=${clientNonce}`, 'Back to Login': '/login' }));
		} else {
			if (result.redirectTo !== undefined) {
				res.status(HttpStatus.SEE_OTHER).setHeader('Location', result.redirectTo).setHeader('Set-Cookie', `urts:token="${result.token}"`).end();
			} else {
				res.status(HttpStatus.SEE_OTHER).setHeader('Location', '/').setHeader('Set-Cookie', `urts:token="${result.token}"`).end();
			}
		}
	}
}

