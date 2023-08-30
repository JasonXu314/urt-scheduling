import { ConsoleLogger, Injectable } from '@nestjs/common';
import { ChannelType, Client, GatewayIntentBits, GuildMember, Role, TextChannel, VoiceChannel } from 'discord.js';
import { DataService } from 'src/data/data.service';
import { GUILD } from 'src/utils/constants';

@Injectable()
export class DiscordService {
	private readonly client: Client;
	private readonly logger: ConsoleLogger = new ConsoleLogger('DiscordService');

	constructor(private readonly dataService: DataService) {
		this.client = new Client({
			intents: [
				GatewayIntentBits.Guilds,
				GatewayIntentBits.GuildMembers,
				GatewayIntentBits.DirectMessages,
				GatewayIntentBits.GuildMessages,
				GatewayIntentBits.MessageContent
			]
		});

		this.client.login(process.env.TOKEN);

		this.client.on('ready', () => {
			this.logger.log('Client Ready');
		});
	}

	public async getUsers(): Promise<GuildMember[]> {
		const guild = await this.client.guilds.fetch(GUILD);

		try {
			return (await guild.members.fetch()).map((user) => user);
		} catch (err) {
			console.log(err);
			throw err;
		}
	}

	public async getUserById(id: string): Promise<GuildMember> {
		const guild = await this.client.guilds.fetch(GUILD);

		return guild.members.fetch(id);
	}

	public async sendDM(id: string, message: string): Promise<void> {
		const user = await this.client.users.fetch(id);

		try {
			if (user.dmChannel) {
				await user.dmChannel.send(message);
			} else {
				(await user.createDM()).send(message);
			}
		} catch (err) {
			console.log(err);
		}
	}

	public async sendMessage(id: string, message: string): Promise<void> {
		const channel = await this.client.channels.fetch(id);

		if (channel?.isTextBased()) {
			channel.send(message);
		}
	}

	public async getRoles(id: string): Promise<Role[]> {
		const guild = await this.client.guilds.fetch(GUILD);

		return (await guild.members.fetch(id)).roles.valueOf().map((role) => role);
	}

	public async getAllRoles(): Promise<Role[]> {
		const guild = await this.client.guilds.fetch(GUILD);

		return guild.roles.valueOf().map((role) => role);
	}

	public async getTextChannels(): Promise<TextChannel[]> {
		const guild = await this.client.guilds.fetch(GUILD);

		return guild.channels
			.valueOf()
			.filter<TextChannel>((channel): channel is TextChannel => channel.type === ChannelType.GuildText)
			.map((channel) => channel);
	}

	public async getVoiceChannels(): Promise<VoiceChannel[]> {
		const guild = await this.client.guilds.fetch(GUILD);

		return guild.channels
			.valueOf()
			.filter<VoiceChannel>((channel): channel is VoiceChannel => channel.type === ChannelType.GuildVoice)
			.map((channel) => channel);
	}
}

