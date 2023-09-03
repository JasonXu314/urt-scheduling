import { Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { DateTime } from 'luxon';
import { DataService } from './data/data.service';
import { DiscordService } from './discord/discord.service';
import { DIV_LEAD_ROLE, WEBMASTER_ROLE } from './utils/constants';
import { ErrorPage } from './utils/filters/error.filter';

export interface LoginAttempt {
	discordNonce: string;
	userId: string;
	redirectTo: string | undefined;
}

export interface LoginResult {
	redirectTo: string | undefined;
	token: string;
}

@Injectable()
export class AppService {
	private readonly loginAttempts: Map<string, LoginAttempt> = new Map();
	private readonly timeouts: Map<string, NodeJS.Timeout> = new Map();

	public constructor(private readonly discord: DiscordService, private readonly data: DataService) {
		const cb = () => {
			data.meetings = data.meetings.filter((meeting) => {
				const now = DateTime.now().startOf('minute'),
					time = DateTime.fromObject(meeting.time);

				if (meeting.recurring) {
					if (now.weekday === time.weekday) {
						const shiftedTime = now.set({ hour: time.hour, minute: time.minute });

						if (meeting.sendHeadsUp) {
							const headsUpTime = shiftedTime.minus({ minute: 5 });

							if (now.hasSame(headsUpTime, 'minute')) {
								const division = data.divisions.find((division) => division.name === meeting.division)!;

								discord.sendMessage(
									division.channelId,
									`<@&${division.roleId}> ${meeting.name} in 5 minutes in <#${division.voiceChannelId}>!`
								);
							}
						}

						if (now.hasSame(shiftedTime, 'minute')) {
							const division = data.divisions.find((division) => division.name === meeting.division)!;

							discord.sendMessage(division.channelId, `<@&${division.roleId}> ${meeting.name} now in <#${division.voiceChannelId}>!`);
						}
					}

					return true;
				} else {
					if (meeting.sendHeadsUp) {
						const headsUpTime = time.minus({ minute: 5 });

						if (now.hasSame(headsUpTime, 'minute')) {
							const division = data.divisions.find((division) => division.name === meeting.division)!;

							discord.sendMessage(division.channelId, `<@&${division.roleId}> ${meeting.name} in 5 minutes in <#${division.voiceChannelId}>!`);
							return true;
						}
					}

					if (now.hasSame(time, 'minute')) {
						const division = data.divisions.find((division) => division.name === meeting.division)!;

						discord.sendMessage(division.channelId, `<@&${division.roleId}> ${meeting.name} now in <#${division.voiceChannelId}>!`);

						return false;
					} else {
						return true;
					}
				}
			});

			setTimeout(cb, DateTime.now().endOf('minute').diffNow().milliseconds);
		};

		cb();
	}

	public async beginLoginAttempt(nameOrId: string, redirectTo?: string): Promise<string> {
		const users = await this.discord.getUsers();

		const user = users.find((user) => user.nickname === nameOrId || user.id === nameOrId || user.user.globalName === nameOrId);

		if (!user) {
			throw new NotFoundException(new ErrorPage('User not found.', { 'Back to Login': '/login' }));
		} else {
			const clientNonce = randomBytes(8).toString('hex'),
				discordNonce = randomBytes(8).toString('hex');

			this.loginAttempts.set(clientNonce, { discordNonce, userId: user.id, redirectTo });

			const timeout = setTimeout(() => {
				this.loginAttempts.delete(clientNonce);
				this.timeouts.delete(clientNonce);
			}, 30_000);
			this.timeouts.set(clientNonce, timeout);

			this.discord.sendDM(user.id, discordNonce);
			return clientNonce;
		}
	}

	public confirmLoginAttempt(clientNonce: string, discordNonce: string): false | LoginResult {
		const attempt = this.loginAttempts.get(clientNonce);

		if (!attempt) {
			throw new NotFoundException('No login attempt found.');
		} else {
			if (discordNonce === attempt.discordNonce) {
				if (this.data.tokens.some((token) => token.userId === attempt.userId)) {
					const token = this.data.tokens.find((token) => token.userId === attempt.userId)!;

					return { token: token.token, redirectTo: attempt.redirectTo };
				} else {
					const token = randomBytes(16).toString('hex');
					this.data.tokens = [...this.data.tokens, { token, userId: attempt.userId }];

					return { token, redirectTo: attempt.redirectTo };
				}
			} else {
				return false;
			}
		}
	}

	public async isAdmin(id: string): Promise<boolean> {
		const roles = await this.discord.getRoles(id);

		return roles.some((role) => role.id === DIV_LEAD_ROLE || role.id === WEBMASTER_ROLE || /C\wO/.test(role.name));
	}

	public async canCreateMeeting(id: string): Promise<boolean> {
		const roles = await this.discord.getRoles(id);

		return roles.some((role) => role.id === DIV_LEAD_ROLE || role.id === WEBMASTER_ROLE || /C\wO/.test(role.name));
	}
}

