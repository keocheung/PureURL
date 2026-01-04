/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);

		const path = url.pathname.replace(/^\/+/, '').replace(/\/+$/, '');
		if (!path) {
			return new Response('Missing path', { status: 400 });
		}

		const resp = await fetch(`https://b23.tv/${path}`, {
			redirect: 'manual',
			headers: {
				'User-Agent': 'Mozilla/5.0 (Cloudflare Workers)',
			},
		});

		const location = resp.headers.get('Location');
		if (!location) {
			return new Response('Upstream missing Location', { status: 502 });
		}

		let locUrl;
		try {
			locUrl = new URL(location);
		} catch {
			return new Response('Invalid Location URL', { status: 502 });
		}

		const allowedHosts = new Set(['www.bilibili.com', 'bilibili.com', 'm.bilibili.com']);

		if (!allowedHosts.has(locUrl.hostname)) {
			return new Response('Forbidden redirect host', { status: 502 });
		}

		const p = locUrl.searchParams.get('p');
		const t = locUrl.searchParams.get('t');
		const startProgress = locUrl.searchParams.get('start_progress');
		locUrl.search = '';
		if (p) {
			locUrl.searchParams.set('p', p);
		}
		if (t) {
			locUrl.searchParams.set('t', t);
		}
		if (startProgress && startProgress.length > 3) {
			locUrl.searchParams.set('t', startProgress.slice(0, -3) + '.' + startProgress.slice(-3));
		}

		return new Response(null, {
			status: 302,
			headers: {
				Location: locUrl.toString(),
				'Cache-Control': 'no-store',
			},
		});
	},
} satisfies ExportedHandler<Env>;
