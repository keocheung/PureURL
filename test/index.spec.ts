import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { afterEach, describe, expect, it, vi } from 'vitest';
import worker from '../src/index';

// For now, you'll need to do something like this to get a correctly-typed
// `Request` to pass to `worker.fetch()`.
const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

describe('PureURL worker', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('returns 400 when path is missing', async () => {
		const request = new IncomingRequest('http://example.com/');
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(400);
		expect(await response.text()).toBe('Missing path');
	});

	it('returns 404 when route is unknown', async () => {
		const request = new IncomingRequest('http://example.com/unknown/path');
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(404);
		expect(await response.text()).toBe('Unknown route');
	});

	it('returns 400 when b23 path is missing', async () => {
		const request = new IncomingRequest('http://example.com/b23');
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(400);
		expect(await response.text()).toBe('Missing b23 path');
	});

	it('returns 502 when upstream has no Location header', async () => {
		vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 302 }));
		const request = new IncomingRequest('http://example.com/b23/abc');
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(502);
		expect(await response.text()).toBe('Upstream missing Location');
	});

	it('returns 502 when upstream Location is invalid', async () => {
		vi.spyOn(globalThis, 'fetch').mockResolvedValue(
			new Response(null, {
				status: 302,
				headers: { Location: 'not-a-url' },
			}),
		);
		const request = new IncomingRequest('http://example.com/b23/abc');
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(502);
		expect(await response.text()).toBe('Invalid Location URL');
	});

	it('returns 502 when upstream host is not allowed', async () => {
		vi.spyOn(globalThis, 'fetch').mockResolvedValue(
			new Response(null, {
				status: 302,
				headers: { Location: 'https://example.com/video/1' },
			}),
		);
		const request = new IncomingRequest('http://example.com/b23/abc');
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(502);
		expect(await response.text()).toBe('Forbidden redirect host');
	});

	it('rewrites allowed b23 redirects and preserves selected params', async () => {
		vi.spyOn(globalThis, 'fetch').mockResolvedValue(
			new Response(null, {
				status: 302,
				headers: {
					Location: 'https://www.bilibili.com/video/BV1xx?p=2&t=90&foo=bar&start_progress=12345',
				},
			}),
		);
		const request = new IncomingRequest('http://example.com/b23/abc');
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(302);
		expect(response.headers.get('Cache-Control')).toBe('no-store');
		expect(response.headers.get('Location')).toBe('https://www.bilibili.com/video/BV1xx?p=2&t=12.345');
	});
});
