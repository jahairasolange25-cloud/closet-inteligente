import { detectMimeFromBytes, validateFileMagicBytes } from './file-magic';

const JPEG_MAGIC = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
const PNG_MAGIC  = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const HEIC_MAGIC = Buffer.concat([Buffer.from([0x00, 0x00, 0x00, 0x18]), Buffer.from('ftyp'), Buffer.alloc(50)]);
const FAKE_MAGIC = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04]);

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'] as const;

function mockFile(buffer: Buffer, mimetype: string): Express.Multer.File {
  return { buffer, mimetype, size: buffer.length } as Express.Multer.File;
}

describe('detectMimeFromBytes', () => {
  it('detects JPEG', () => expect(detectMimeFromBytes(JPEG_MAGIC)).toBe('image/jpeg'));
  it('detects PNG', ()  => expect(detectMimeFromBytes(PNG_MAGIC)).toBe('image/png'));
  it('detects HEIC', () => expect(detectMimeFromBytes(HEIC_MAGIC)).toBe('image/heic'));
  it('returns null for unknown bytes', () => expect(detectMimeFromBytes(FAKE_MAGIC)).toBeNull());
});

describe('validateFileMagicBytes', () => {
  it('passes for valid JPEG', () => {
    expect(() => validateFileMagicBytes(mockFile(JPEG_MAGIC, 'image/jpeg'), ALLOWED)).not.toThrow();
  });

  it('passes for valid PNG', () => {
    expect(() => validateFileMagicBytes(mockFile(PNG_MAGIC, 'image/png'), ALLOWED)).not.toThrow();
  });

  it('throws UNRECOGNIZED_FILE_SIGNATURE for unknown bytes', () => {
    expect(() => validateFileMagicBytes(mockFile(FAKE_MAGIC, 'image/jpeg'), ALLOWED)).toThrow('UNRECOGNIZED_FILE_SIGNATURE');
  });

  it('throws MIME_TYPE_MISMATCH when MIME header does not match bytes', () => {
    // PNG bytes but claims to be JPEG
    expect(() => validateFileMagicBytes(mockFile(PNG_MAGIC, 'image/jpeg'), ALLOWED)).toThrow('MIME_TYPE_MISMATCH');
  });

  it('throws INVALID_FILE_TYPE for disallowed MIME type', () => {
    const pdfMagic = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d]); // %PDF-
    expect(() => validateFileMagicBytes(mockFile(pdfMagic, 'application/pdf'), ALLOWED)).toThrow('UNRECOGNIZED_FILE_SIGNATURE');
  });
});
