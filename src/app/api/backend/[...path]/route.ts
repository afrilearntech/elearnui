import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE = 'elearn_session';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const PUBLIC_AUTH_PATHS = new Set([
  'auth/admin',
  'auth/content',
  'auth/parent',
  'auth/student',
  'onboarding/profilesetup',
]);
const MAX_PROXY_BODY_BYTES = 105 * 1024 * 1024;

function getBackendBaseUrl(): string {
  const configured = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!configured) {
    throw new Error('API base URL is not configured');
  }

  const url = new URL(configured);
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('API base URL must use HTTP or HTTPS');
  }
  return configured.replace(/\/$/, '');
}

function isSameOriginRequest(request: NextRequest): boolean {
  if (SAFE_METHODS.has(request.method)) return true;

  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite && !['same-origin', 'none'].includes(fetchSite)) return false;

  const origin = request.headers.get('origin');
  return !origin || origin === request.nextUrl.origin;
}

function responseHeaders(upstream: Response): Headers {
  const headers = new Headers();
  for (const name of ['content-type', 'content-disposition', 'last-modified']) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  headers.set('Cache-Control', 'no-store');
  headers.set('X-Content-Type-Options', 'nosniff');
  return headers;
}

async function readRequestBody(request: NextRequest): Promise<ArrayBuffer | undefined> {
  if (SAFE_METHODS.has(request.method) || !request.body) return undefined;

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > MAX_PROXY_BODY_BYTES) {
      await reader.cancel();
      throw new RangeError('Request body exceeds the upload limit.');
    }
    chunks.push(value);
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body.buffer;
}

async function proxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ detail: 'Cross-site request rejected.' }, { status: 403 });
  }

  const contentLength = Number(request.headers.get('content-length') || 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_PROXY_BODY_BYTES) {
    return NextResponse.json({ detail: 'Request body exceeds the upload limit.' }, { status: 413 });
  }

  let backendBase: string;
  try {
    backendBase = getBackendBaseUrl();
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'API configuration is invalid';
    return NextResponse.json({ detail }, { status: 503 });
  }

  const { path } = await context.params;
  const encodedPath = path.map((segment) => encodeURIComponent(segment)).join('/');
  const target = `${backendBase}/${encodedPath}/${request.nextUrl.search}`;
  const headers = new Headers();
  const accept = request.headers.get('accept');
  const contentType = request.headers.get('content-type');
  if (accept) headers.set('Accept', accept);
  if (contentType) headers.set('Content-Type', contentType);

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token && !PUBLIC_AUTH_PATHS.has(encodedPath)) {
    headers.set('Authorization', `Token ${token}`);
  }

  let body: ArrayBuffer | undefined;
  try {
    body = await readRequestBody(request);
  } catch (error) {
    if (error instanceof RangeError) {
      return NextResponse.json({ detail: error.message }, { status: 413 });
    }
    return NextResponse.json({ detail: 'Unable to read request body.' }, { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      body,
      cache: 'no-store',
      redirect: 'manual',
      signal: request.signal,
    });
  } catch {
    return NextResponse.json({ detail: 'Unable to reach the API service.' }, { status: 502 });
  }

  const headersForClient = responseHeaders(upstream);
  const contentTypeValue = upstream.headers.get('content-type') || '';
  let nextResponse: NextResponse;
  let issuedToken: string | null = null;

  if (contentTypeValue.includes('application/json')) {
    const text = await upstream.text();
    let payload: unknown;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = { detail: 'The API returned malformed JSON.' };
    }

    if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
      const record = payload as Record<string, unknown>;
      if (upstream.ok && typeof record.token === 'string' && record.token) {
        issuedToken = record.token;
        record.token = 'cookie-session';
      }
    }

    nextResponse = NextResponse.json(payload, {
      status: upstream.status,
      headers: headersForClient,
    });
  } else {
    const bodyBuffer = upstream.status === 204 ? null : await upstream.arrayBuffer();
    nextResponse = new NextResponse(bodyBuffer, {
      status: upstream.status,
      headers: headersForClient,
    });
  }

  if (issuedToken) {
    nextResponse.cookies.set(SESSION_COOKIE, issuedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });
  } else if (upstream.status === 401) {
    nextResponse.cookies.delete(SESSION_COOKIE);
  }

  return nextResponse;
}

export const dynamic = 'force-dynamic';

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
