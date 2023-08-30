export type Tagger<T = string> = (strings: TemplateStringsArray, ...expressions: any[]) => T;

export function join(strings: TemplateStringsArray, expressions: any[]) {
	return strings
		.slice(1)
		.reduce((str, part, i) => str + (typeof expressions[i] === 'string' ? expressions[i] : JSON.stringify(expressions[i])) + part, strings[0]);
}

export function defaultJoiner(strings: TemplateStringsArray, ...expressions: any[]) {
	return join(strings, expressions);
}

export function page(title: string, head = ''): Tagger {
	return (strings: TemplateStringsArray, ...expressions: any[]) => `
	<html data-theme="dark">
		<head>
			<title>${title}</title>
			<link rel="stylesheet" href="https://mypico.jasonxu.dev/min"></link>
			${head}
			<style>
			.row {
				align-items: center;
			}
			
			.row.time > input:first-child {
				flex-basis: content;
				flex-grow: 1;
			}

			.row.time > *:not(:first-child) {
				flex-basis: content;
				flex-grow: 0;
			}

			.row span[data-tooltip] {
				height: fit-content;
				border-bottom: none;
			}

			body {
				display: flex;
				flex-direction: row;
			}

			body aside {
				margin: 1em 2em;
			}

			table button.table-btn {
				margin-bottom: 0;
			}
			</style>
		</head>
		<body>
			<aside class="main-nav">
				<nav>
					<ul>
						<li>
							<a href="/meetings">Meetings</a>
						</li>
						<li>
							<a href="/config">Config</a>
						</li>
					</ul>
				</nav>
			</aside>
			<main class="container">
				${join(strings, expressions)}
			</main>
		</body>
	</html>
	`;
}

export function $if(condition: boolean): Tagger {
	return condition ? defaultJoiner : () => '';
}

export function $ifel(condition: boolean): Tagger<Tagger> {
	return condition
		? (strings: TemplateStringsArray, ...expressions: any[]) =>
				() =>
					join(strings, expressions)
		: () => defaultJoiner;
}

