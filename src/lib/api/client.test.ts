import { describe, expect, it } from 'vitest';

import { normalizeListResponse, stripServerManagedFields } from './client';

describe('normalizeListResponse', () => {
  it('keeps legacy array responses compatible', () => {
    expect(normalizeListResponse<number>([1, 2, 3])).toEqual([1, 2, 3]);
  });

  it('extracts Django REST Framework paginated results', () => {
    expect(
      normalizeListResponse<{ id: number }>({
        count: 1,
        next: null,
        previous: null,
        results: [{ id: 7 }],
      }),
    ).toEqual([{ id: 7 }]);
  });

  it('supports endpoint-specific list envelopes', () => {
    expect(normalizeListResponse({ teachers: [{ id: 2 }] }, ['teachers'])).toEqual([{ id: 2 }]);
  });

  it('returns an empty list for malformed payloads', () => {
    expect(normalizeListResponse(null)).toEqual([]);
    expect(normalizeListResponse({ results: 'not-an-array' })).toEqual([]);
  });
});

describe('stripServerManagedFields', () => {
  it('removes creator-supplied ownership and moderation fields', () => {
    expect(
      stripServerManagedFields({
        title: 'Fractions',
        given_by: 4,
        status: 'APPROVED',
        moderation_comment: 'skip review',
      }),
    ).toEqual({ title: 'Fractions' });
  });
});
