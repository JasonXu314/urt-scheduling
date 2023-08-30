import { Injectable } from '@nestjs/common';
import { readFileSync, writeFileSync } from 'fs';
import { Data, Divisions, Meetings, Tokens } from './data.model';

@Injectable()
export class DataService {
	private _data: Data;

	public constructor() {
		try {
			this._data = JSON.parse(readFileSync('data.json').toString());
		} catch {
			this._data = { meetings: [], tokens: [], divisions: [] };
			this._flush();
		}
	}

	public get meetings(): Meetings {
		return this._data.meetings;
	}

	public set meetings(newMeetings: Meetings) {
		this._data.meetings = newMeetings;
		this._flush();
	}

	public get tokens(): Tokens {
		return this._data.tokens;
	}

	public set tokens(newTokens: Tokens) {
		this._data.tokens = newTokens;
		this._flush();
	}

	public get divisions(): Divisions {
		return this._data.divisions;
	}

	public set divisions(newDivisions: Divisions) {
		this._data.divisions = newDivisions;
		this._flush();
	}

	private _flush(): void {
		writeFileSync('data.json', JSON.stringify(this._data, null, 4));
	}
}

