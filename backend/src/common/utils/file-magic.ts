/**
 * Magic-byte signatures for accepted image formats.
 * Validates the actual file content, not just the MIME type header.
 */
const SIGNATURES: Array<{ mime: string; bytes: number[]; offset?: number }> = [
  { mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  { mime: 'image/png',  bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mime: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 },
  // HEIC — ftyp box at offset 4 contains 'ftyp' followed by brand codes
  { mime: 'image/heic', bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 },
];

export function detectMimeFromBytes(buffer: Buffer): string | null {
  for (const sig of SIGNATURES) {
    const offset = sig.offset ?? 0;
    if (buffer.length < offset + sig.bytes.length) continue;
    const matches = sig.bytes.every((b, i) => buffer[offset + i] === b);
    if (matches) return sig.mime;
  }
  return null;
}

export function validateFileMagicBytes(
  file: Express.Multer.File,
  allowedMimeTypes: readonly string[],
): void {
  const detected = detectMimeFromBytes(file.buffer);

  if (!detected) {
    throw new Error('UNRECOGNIZED_FILE_SIGNATURE');
  }

  if (detected !== file.mimetype) {
    throw new Error('MIME_TYPE_MISMATCH');
  }

  if (!(allowedMimeTypes as string[]).includes(detected)) {
    throw new Error('INVALID_FILE_TYPE');
  }
}
