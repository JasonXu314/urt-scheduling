import { IsIn, IsOptional, IsString, Validate } from 'class-validator';
import { IsCheckbox, fi } from './utils/utils';
import { DateString, DateValidator, TimeString, TimeValidator } from './utils/validators';

export class DeleteMeetingDTO {
	@IsString()
	id: string = fi();
}

export class LoginDTO {
	@IsString()
	nameOrId: string = fi();

	@IsString()
	@IsOptional()
	redirectTo: string = fi();
}

export class ConfirmDTO {
	@IsString()
	clientNonce: string = fi();

	@IsString()
	discordNonce: string = fi();
}

export class CreateDivisionDTO {
	@IsString()
	name: string = fi();

	@IsString()
	channelId: string = fi();

	@IsString()
	roleId: string = fi();

	@IsString()
	voiceChannelId: string = fi();
}

export class CreateMeetingDTO {
	@IsString()
	name: string = fi();

	@Validate(DateValidator)
	date: DateString = fi();

	@Validate(TimeValidator)
	time: TimeString = fi();

	@IsIn(['AM', 'PM'])
	ampm: 'AM' | 'PM' = fi();

	@IsString()
	division: string = fi();

	@IsCheckbox()
	recurring: boolean = fi();

	@IsCheckbox()
	sendHeadsUp: boolean = fi();
}

