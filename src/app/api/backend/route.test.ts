import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';

import { isSameOriginRequest } from './[...path]/route';


function postRequest(url: string, headers: Record<string, string>): NextRequest {
  return new NextRequest(url, { method: 'POST', headers });
}


describe('backend proxy origin validation', () => {
  it('accepts the concrete request origin even when fetch metadata is misleading', () => {
    const request = postRequest('http://127.0.0.1:3000/api/backend/auth/admin', {
      host: '127.0.0.1:3000',
      origin: 'http://127.0.0.1:3000',
      'sec-fetch-site': 'cross-site',
    });

    expect(isSameOriginRequest(request)).toBe(true);
  });

  it('accepts an origin matching the concrete host when the framework URL differs', () => {
    const request = postRequest('http://internal:3000/api/backend/auth/admin', {
      host: '127.0.0.1:3000',
      origin: 'http://127.0.0.1:3000',
    });

    expect(isSameOriginRequest(request)).toBe(true);
  });

  it('rejects a hostile origin even when fetch metadata says same-site', () => {
    const request = postRequest('http://127.0.0.1:3000/api/backend/auth/admin', {
      host: '127.0.0.1:3000',
      origin: 'https://attacker.example',
      'sec-fetch-site': 'same-site',
    });

    expect(isSameOriginRequest(request)).toBe(false);
  });
});
