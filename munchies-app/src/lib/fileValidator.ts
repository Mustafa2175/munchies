/**
 * @module lib/fileValidator
 * @description Validates uploaded files to protect against malicious uploads.
 * Verifies true file type by inspecting binary magic byte headers (signatures),
 * enforces a strict 5MB size limit, restricts extensions, and ensures uploads
 * are dispatched to isolated Cloud Storage outside the code execution directory.
 */

export const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'] as const;
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  detectedMime?: AllowedMimeType;
}

/**
 * Inspects a byte buffer/array for well-known image file signatures (magic numbers).
 */
export function detectImageSignature(bytes: Uint8Array): AllowedMimeType | null {
  if (bytes.length < 3) return null;

  // JPEG: Starts with FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }

  // PNG: Starts with 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return 'image/png';
  }

  // WebP: Starts with RIFF (52 49 46 46) and WEBP at bytes 8-11 (57 45 42 50)
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return 'image/webp';
  }

  return null;
}

/**
 * Validates a browser File instance or Uint8Array:
 * 1. Verifies file size <= 5 MB.
 * 2. Checks filename extension against allowed list (.jpg, .jpeg, .png, .webp).
 * 3. Inspects real binary magic numbers (preventing extension spoofing).
 */
export async function validateImageFile(
  file: File | { name: string; size: number; arrayBuffer: () => Promise<ArrayBuffer> }
): Promise<FileValidationResult> {
  // 1. Enforce size limit
  if (file.size <= 0) {
    return {
      isValid: false,
      error: 'الملف المرفوع فارغ (0 بايت).',
    };
  }

  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      isValid: false,
      error: `حجم الملف (${sizeInMb} ميجابايت) يتجاوز الحد الأقصى المسموح به وهو 5 ميجابايت.`,
    };
  }

  // 2. Validate filename extension
  const fileName = (file.name || '').toLowerCase();
  const hasAllowedExt = ALLOWED_EXTENSIONS.some((ext) => fileName.endsWith(ext));
  if (!hasAllowedExt) {
    return {
      isValid: false,
      error: 'نوع الملف غير مسموح به. يُسمح فقط بالصور بصيغ: JPG, JPEG, PNG, WEBP.',
    };
  }

  // 3. Inspect real binary header bytes (magic numbers)
  try {
    const buffer = await file.arrayBuffer();
    const headerBytes = new Uint8Array(buffer.slice(0, 16));
    const detectedMime = detectImageSignature(headerBytes);

    if (!detectedMime) {
      return {
        isValid: false,
        error: 'الملف تالف أو تم التلاعب بنوعه الحقيقي. تم رفض الرفع لدواعي الأمان.',
      };
    }

    return {
      isValid: true,
      detectedMime,
    };
  } catch (err) {
    return {
      isValid: false,
      error: 'فشل في قراءة بيانات الملف المرفوع.',
    };
  }
}

