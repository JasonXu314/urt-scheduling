import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { AppService } from 'src/app.service';
import { DataService } from 'src/data/data.service';
import { Redirect } from '../filters/redirect.filter';

@Injectable()
export class ConfigGuard implements CanActivate {
	public constructor(private readonly dataService: DataService, private readonly appService: AppService) {}

	public async canActivate(context: ExecutionContext): Promise<boolean> {
		const req = context.switchToHttp().getRequest<Request>();

		const token = req.cookies['urts:token'];

		if (token === undefined) {
			throw new Redirect('/login');
		}

		if (this.dataService.tokens.some((t) => t.token === token)) {
			const id = this.dataService.tokens.find((t) => t.token === token)!.userId;

			return this.appService.isAdmin(id);
		} else {
			return false;
		}
	}
}

