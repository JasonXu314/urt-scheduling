export interface Meeting {
	id: string;
	name: string;
	time: Partial<Record<'year' | 'month' | 'day' | 'hour' | 'minute' | 'second' | 'millisecond', number>>;
	division: string;
	recurring: boolean;
	sendHeadsUp: boolean;
}

export interface Data {
	tokens: readonly { token: string; userId: string }[];
	meetings: readonly Meeting[];
	divisions: readonly { name: string; channelId: string; roleId: string; voiceChannelId: string }[];
}

export type Meetings = Data['meetings'];
export type Tokens = Data['tokens'];
export type Divisions = Data['divisions'];

