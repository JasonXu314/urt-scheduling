import { ActionRowBuilder, ButtonBuilder } from '@discordjs/builders';
import { randomUUID } from 'crypto';
import { APIButtonComponent, ButtonStyle, Client, GatewayIntentBits, TextChannel, TextInputBuilder, TextInputStyle } from 'discord.js';
import { parseTime } from './utils';

const ROLE_IDS = ['410642595925065738', '410642139530133527', '410641725824958486'];
const ROLE_NAMES = ['Computing Division Lead', 'Mechanical Division Lead', 'Electrical Division Lead'];
const CHANNEL_IDS = {
	Computing: '410645750763094027',
	Mechanical: '410645717145616385',
	Electrical: '410645331022184461'
};

const DIVISIONS = ROLE_NAMES.map((name) => name.split(' ')[0]);

interface Meeting {
	id: string;
	day: string;
	time: string;
	division: string;
}

const incompleteMeetings: Map<string, Meeting> = new Map(),
	meetings: Map<string, Meeting> = new Map();

const client = new Client({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.on('ready', () => {
	client.channels.fetch('1135044217635340379').then((channel) => {
		if (!channel) {
			console.error('ch not found');
		}
	});
});

client.on('messageCreate', (message) => {
	if (message.author.id !== client.user.id) {
		if (message.mentions.users.has(client.user.id)) {
			const user = message.member;
			const btns: APIButtonComponent[] = [];

			ROLE_IDS.forEach((id, i) => {
				if (user.roles.valueOf().has(id) || user.id === '209438695202357249') {
					btns.push(new ButtonBuilder({ label: `${DIVISIONS[i]} Meeting`, style: ButtonStyle.Primary, custom_id: DIVISIONS[i] }).toJSON());
				}
			});

			if (btns.length === 0) {
				message.reply({ content: 'You are not a division leader.' });
			} else {
				const row = new ActionRowBuilder<ButtonBuilder>({ components: btns }).toJSON();

				message.reply({ content: 'Choose a division', components: [row] }).catch((err) => {
					console.log(err.rawError.errors.components[0]);
				});
			}
		}
	}
});

client.on('interactionCreate', (interaction) => {
	if (interaction.isButton()) {
		const id = interaction.customId;

		if (/retry:[0-9a-zA-Z\-]+/.test(id)) {
			const meetingId = id.split(':')[1];
			const { division, day, time } = incompleteMeetings.get(meetingId);

			const title = `New ${division} Meeting`;
			const dayInput = new TextInputBuilder().setCustomId('day').setLabel('Date/Day').setStyle(TextInputStyle.Short).setRequired(true).setValue(day);
			const timeInput = new TextInputBuilder().setCustomId('time').setLabel('When?').setStyle(TextInputStyle.Short).setRequired(true).setValue(time);
			const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(dayInput);
			const row2 = new ActionRowBuilder<TextInputBuilder>().addComponents(timeInput);
			interaction.showModal({ custom_id: `modal:${meetingId}`, components: [row1.toJSON(), row2.toJSON()], title });
		} else {
			const division = id;
			const meetingId = randomUUID();

			const dayInput = new TextInputBuilder({ custom_id: 'day', label: 'Date/Day', style: TextInputStyle.Short, required: true }).toJSON();
			const timeInput = new TextInputBuilder({ custom_id: 'time', label: 'When?', style: TextInputStyle.Short, required: true }).toJSON();
			const row1 = new ActionRowBuilder<TextInputBuilder>({ components: [dayInput] }).toJSON();
			const row2 = new ActionRowBuilder<TextInputBuilder>({ components: [timeInput] }).toJSON();

			incompleteMeetings.set(meetingId, { id: meetingId, day: '', time: '', division });
			interaction.showModal({ custom_id: `modal:${meetingId}`, components: [row1, row2], title: `New ${division} Meeting` });
		}
	} else if (interaction.isModalSubmit()) {
		const day = interaction.fields.getTextInputValue('day').toLowerCase();
		const time = interaction.fields.getTextInputValue('time').toLowerCase();
		const meetingId = interaction.customId.split(':')[1];
		const { id, division } = incompleteMeetings.get(meetingId);

		if (!/(?:tomorrow|today|\d{1,2}(?:\/|-)\d{2}(?:(?:\/|-)\d{4})?)/.test(day)) {
			const btn = new ButtonBuilder().setCustomId(`retry:${meetingId}`).setLabel('Retry').setStyle(ButtonStyle.Primary);
			const row = new ActionRowBuilder<ButtonBuilder>().addComponents(btn);

			interaction.deferUpdate();
			interaction.message.edit({
				content: 'Date must be one of the following: `tomorrow`, `today`, `MM-DD`, `MM-DD-YYYY`, `MM/DD/YY`',
				components: [row.toJSON()]
			});

			const { id, division } = incompleteMeetings.get(meetingId);
			incompleteMeetings.set(meetingId, { id, division, day, time });
			return;
		}

		if (!/(?:\dhr|now|\d{1,2}(?::\d{2})?)/.test(time)) {
			const btn = new ButtonBuilder().setCustomId(`retry:${meetingId}`).setLabel('Retry').setStyle(ButtonStyle.Primary);
			const row = new ActionRowBuilder<ButtonBuilder>().addComponents(btn);

			interaction.deferUpdate();
			interaction.message.edit({ content: 'Time must be one of the following: `Hhr`, `now`, `H`, `H:MM`', components: [row.toJSON()] });

			const { id, division } = incompleteMeetings.get(meetingId);
			incompleteMeetings.set(meetingId, { id, division, day, time });
			return;
		}

		const dateTime = parseTime(day, time);
		setTimeout(() => {
			client.channels.fetch(CHANNEL_IDS[division]).then((channel: TextChannel) => {
				channel.send({ content: 'Meeting now!' });
				meetings.delete(id);
			});
		}, dateTime.diffNow().toMillis());
		// console.log(dateTime.diffNow().toMillis());

		interaction.deferUpdate();
		interaction.message.edit({ content: `Meeting \`${id}\` scheduled for ${dateTime.toString()}.`, components: [] });
		client.channels.fetch(CHANNEL_IDS[division]).then((channel: TextChannel) => {
			channel.send({ content: `Meeting scheduled for ${dateTime.toString()}!` });
		});
	}
});

client.login(process.env.TOKEN);

