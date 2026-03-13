type UnknownRecord = Record<string, unknown>;

const DEFAULT_LIST_KEYS = [
  'results',
  'data',
  'items',
  'users',
  'students',
  'parents',
  'teachers',
  'content_managers',
  'counties',
  'districts',
  'schools',
  'subjects',
  'lessons',
  'games',
  'reports',
];

export function normalizeAdminListResponse<T>(
  payload: unknown,
  preferredKeys: string[] = [],
): T[] {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (!payload || typeof payload !== 'object') {
    return [];
  }

  const obj = payload as UnknownRecord;
  const keysToCheck = [...preferredKeys, ...DEFAULT_LIST_KEYS];

  for (const key of keysToCheck) {
    const value = obj[key];
    if (Array.isArray(value)) {
      return value as T[];
    }
  }

  for (const value of Object.values(obj)) {
    if (Array.isArray(value)) {
      return value as T[];
    }
  }

  return [];
}
