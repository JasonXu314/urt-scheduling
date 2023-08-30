import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { DataService } from 'src/data/data.service';
import { Redirect } from '../filters/redirect.filter';

@Injectable()
export class AuthGuard implements CanActivate {
	public constructor(private readonly dataService: DataService) {}

	canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
		const req = context.switchToHttp().getRequest<Request>();

		const token = req.cookies['urts:token'];

		if (token === undefined) {
			throw new Redirect('/login');
		}

		if (this.dataService.tokens.some((t) => t.token === token)) {
			return true;
		} else {
			return false;
		}
	}
}

