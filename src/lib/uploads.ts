type UploadRule = {
  extensions: ReadonlySet<string>;
  contentTypes: ReadonlySet<string>;
  maxBytes: number;
  label: string;
};

const MEBIBYTE = 1024 * 1024;

const CSV_RULE: UploadRule = {
  extensions: new Set(['.csv']),
  contentTypes: new Set(['text/csv', 'application/csv', 'application/vnd.ms-excel', 'text/plain']),
  maxBytes: 2 * MEBIBYTE,
  label: 'CSV file',
};

const IMAGE_RULE: UploadRule = {
  extensions: new Set(['.jpg', '.jpeg', '.png', '.webp']),
  contentTypes: new Set(['image/jpeg', 'image/png', 'image/webp']),
  maxBytes: 5 * MEBIBYTE,
  label: 'Image',
};

const DOCUMENT_RULE: UploadRule = {
  extensions: new Set(['.pdf', '.ppt', '.pptx', '.doc', '.docx', '.mp3', '.mp4', '.wav', '.webm']),
  contentTypes: new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'audio/mpeg',
    'audio/wav',
    'video/mp4',
    'video/webm',
  ]),
  maxBytes: 100 * MEBIBYTE,
  label: 'Document',
};

const SOLUTION_RULE: UploadRule = {
  extensions: new Set([...DOCUMENT_RULE.extensions, ...IMAGE_RULE.extensions, '.txt']),
  contentTypes: new Set([...DOCUMENT_RULE.contentTypes, ...IMAGE_RULE.contentTypes, 'text/plain']),
  maxBytes: 100 * MEBIBYTE,
  label: 'Attachment',
};

function extensionOf(fileName: string): string {
  const separator = fileName.lastIndexOf('.');
  return separator >= 0 ? fileName.slice(separator).toLowerCase() : '';
}

function validateUpload(file: File, rule: UploadRule): void {
  if (!rule.extensions.has(extensionOf(file.name))) {
    throw new Error(`${rule.label} has an unsupported file extension.`);
  }
  if (file.type && !rule.contentTypes.has(file.type.toLowerCase())) {
    throw new Error(`${rule.label} has an unsupported content type.`);
  }
  if (file.size > rule.maxBytes) {
    throw new Error(`${rule.label} exceeds the ${Math.round(rule.maxBytes / MEBIBYTE)} MB limit.`);
  }
}

export const validateCsvUpload = (file: File) => validateUpload(file, CSV_RULE);
export const validateImageUpload = (file: File) => validateUpload(file, IMAGE_RULE);
export const validateDocumentUpload = (file: File) => validateUpload(file, DOCUMENT_RULE);
export const validateSolutionUpload = (file: File) => validateUpload(file, SOLUTION_RULE);

export const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp';
export const DOCUMENT_ACCEPT = '.pdf,.ppt,.pptx,.doc,.docx,.mp3,.mp4,.wav,.webm';
