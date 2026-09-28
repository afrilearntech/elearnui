import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE = 'elearn_session';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const origin = request.headers.get('origin');
  const fetchSite = request.headers.get('sec-fetch-site');
  if (
    (origin && origin !== request.nextUrl.origin) ||
    (fetchSite && !['same-origin', 'none'].includes(fetchSite))
  ) {
    return NextResponse.json({ detail: 'Cross-site request rejected.' }, { status: 403 });
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const backendBase = (process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');

  if (token && backendBase) {
    try {
      await fetch(`${backendBase}/onboarding/logout/`, {
        method: 'POST',
        headers: { Authorization: `Token ${token}` },
        cache: 'no-store',
      });
    } catch {
      // Always clear the browser session, even if token revocation is unavailable.
    }
  }

  const response = NextResponse.json({ detail: 'Logged out.' });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
