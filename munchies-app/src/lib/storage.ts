/**
 * @module lib/storage
 * @description Firebase Storage helpers for uploading and managing images securely.
 * Enforces magic-byte validation, size limits, and stores assets in isolated Cloud Storage.
 */

import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/config/firebase';
import { validateImageFile } from './fileValidator';

export async function uploadImage(file: File, folder: string = 'products'): Promise<string> {
  // 1. Verify real file type (magic bytes) and size limit
  const validation = await validateImageFile(file);
  if (!validation.isValid) {
    throw new Error(validation.error || 'الملف المرفوع غير صالح لدواعي الأمان');
  }

  // 2. Generate secure unique filename and ensure upload is stored outside code directory
  const extension = file.name.split('.').pop() || 'jpg';
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 10)}.${extension}`;
  const storageRef = ref(storage, `${folder}/${fileName}`);

  const metadata = {
    contentType: validation.detectedMime || 'image/jpeg',
  };

  const snapshot = await uploadBytes(storageRef, file, metadata);
  return getDownloadURL(snapshot.ref);
}

export async function deleteImage(url: string): Promise<void> {
  try {
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting image from storage:', error);
  }
}
