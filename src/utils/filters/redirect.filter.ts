import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

export class Redirect {
	public constructor(public readonly location: string) {}
}

@Catch(Redirect)
export class RedirectFilter implements ExceptionFilter<Redirect> {
	catch(exception: Redirect, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();

		response.status(HttpStatus.SEE_OTHER).setHeader('Location', exception.location).end();
	}
}

