import { DateTime } from 'luxon';

export function parseTime(day: string, time: string): DateTime {
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
				const pm = now.hour >= 12;

				dateTime = dateTime.set({ hour: pm ? Number(hour) + 12 : Number(hour), minute: minute !== undefined ? Number(minute) : now.hour });
			}
	}

	return dateTime.startOf('minute');
}

