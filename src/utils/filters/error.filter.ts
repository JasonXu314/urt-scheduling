import { ArgumentsHost, Catch, HttpException } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Response } from 'express';
import { $if, page } from '../html';

export class ErrorPage {
	public constructor(public readonly message: string, public readonly links: Record<string, string>, public readonly jsonDump: any = null) {}
}

@Catch()
export class ErrorPageFilter extends BaseExceptionFilter {
	public catch(exception: unknown, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();

		if (exception instanceof HttpException && exception.getResponse() instanceof ErrorPage) {
			const err = exception.getResponse() as ErrorPage;

			response.status(exception.getStatus()).setHeader('Content-Type', 'text/html').send(page('URT Scheduling - Error')`
				<h1>An error occured:</h1>
				<p class="error">${err.message}</p>
				${$if(err.jsonDump !== null)`
				<h2>JSON Dump:</h2>
				<code>${JSON.stringify(err.jsonDump, null, 4)}</code>
				<br>`}
				<div class="row">
					${Object.entries(err.links)
						.map(([label, href]) => `<a href="${href}" role="button">${label}</a>`)
						.join('')}
				</div>
			`);
		} else {
			super.catch(exception, host);
		}
	}
}

