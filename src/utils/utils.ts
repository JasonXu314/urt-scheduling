import { ExecutionContext, applyDecorators, createParamDecorator } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsIn } from 'class-validator';
import { Request } from 'express';
import { DateTime } from 'luxon';

export const Token = createParamDecorator((_: never, ctx: ExecutionContext) => {
	const req = ctx.switchToHttp().getRequest<Request>();

	return req.cookies['urts:token'];
});

export const IsCheckbox = () =>
	applyDecorators(
		IsIn(['on', undefined]),
		Transform(({ obj, key, value }) => {
			obj[key] = value === 'on';
		})
	);

export function fi<T>(): T {
	return undefined as T;
}

export function parseTime(day: string, time: string, ampm: 'AM' | 'PM'): DateTime {
	const now = DateTime.now();
	let dateTime: DateTime = now.set({});

	switch (day) {
		case 'tomorrow':
			dateTime = dateTime.plus({ days: 1 });
			break;
		case 'today':
			break;
		default:
			const [month, date, year] = day.split(/[-/]/);

			dateTime = dateTime.set({ month: Number(month), day: Number(date), year: year !== undefined ? Number(year) : now.year });
	}

	switch (time) {
		case 'now':
			break;
		default:
			if (/^\dhr$/.test(time)) {
				dateTime = dateTime.plus({ hours: Number(time.slice(0, -2)) });
			} else {
				const [hour, minute] = time.split(':');

				dateTime = dateTime.set({
					hour: ampm === 'PM' ? (Number(hour) % 12) + 12 : Number(hour) % 12,
					minute: minute !== undefined ? Number(minute) : 0
				});
			}
	}

	return dateTime.startOf('minute');
}

