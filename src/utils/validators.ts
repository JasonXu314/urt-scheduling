import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

export type DateString = 'tomorrow' | 'today' | `${number}/${number}` | `${number}/${number}/${number}`;
export type TimeString = 'now' | `${number}hr` | `${number}:${number}`;

@ValidatorConstraint()
export class DateValidator implements ValidatorConstraintInterface {
	public validate(value: any): boolean | Promise<boolean> {
		return typeof value === 'string' && /^(tomorrow|today|\d{1,2}[-/]\d{1,2}([-/]\d{4})?)$/.test(value);
	}

	public defaultMessage?(validationArguments?: ValidationArguments | undefined): string {
		return `${validationArguments?.property || 'Date'} must be one of the following: 'tomorrow', 'today', 'MM/DD', or 'MM/DD/YYYY'`;
	}
}

@ValidatorConstraint()
export class TimeValidator implements ValidatorConstraintInterface {
	public validate(value: any): boolean | Promise<boolean> {
		return typeof value === 'string' && /^(now|\d{1,2}hr|\d{1,2}:\d{1,2})$/.test(value);
	}

	public defaultMessage?(validationArguments?: ValidationArguments | undefined): string {
		return `${validationArguments?.property || 'Time'} must be one of the following: 'now', 'HHhr', or 'HH:MM'`;
	}
}

