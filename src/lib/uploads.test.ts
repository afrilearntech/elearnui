import { describe, expect, it } from 'vitest';

import {
  validateCsvUpload,
  validateDocumentUpload,
  validateImageUpload,
  validateSolutionUpload,
} from './uploads';

function upload(name: string, type: string, size = 16): File {
  return new File([new Uint8Array(size)], name, { type });
}

describe('upload validation', () => {
  it('accepts supported uploads', () => {
    expect(() => validateCsvUpload(upload('students.csv', 'text/csv'))).not.toThrow();
    expect(() => validateImageUpload(upload('cover.webp', 'image/webp'))).not.toThrow();
    expect(() => validateDocumentUpload(upload('lesson.pdf', 'application/pdf'))).not.toThrow();
    expect(() => validateSolutionUpload(upload('answer.txt', 'text/plain'))).not.toThrow();
  });

  it('rejects files with unsupported extensions or MIME types', () => {
    expect(() => validateImageUpload(upload('payload.svg', 'image/svg+xml'))).toThrow('unsupported file extension');
    expect(() => validateImageUpload(upload('photo.jpg', 'text/html'))).toThrow('unsupported content type');
  });

  it('enforces the backend size limits', () => {
    expect(() => validateCsvUpload(upload('students.csv', 'text/csv', 2 * 1024 * 1024 + 1))).toThrow(
      '2 MB limit',
    );
    expect(() => validateImageUpload(upload('cover.png', 'image/png', 5 * 1024 * 1024 + 1))).toThrow(
      '5 MB limit',
    );
  });
});
