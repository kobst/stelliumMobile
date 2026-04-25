import ReactNativeBlobUtil from 'react-native-blob-util';
import { relationshipUsersApi } from '../../../shared/api/relationshipUsers';

function normalizeMimeType(mime: string): string {
  if (mime === 'image/jpg') return 'image/jpeg';
  return mime;
}

export interface UploadedSubjectPhoto {
  profilePhotoUrl: string;
  profilePhotoKey: string;
}

/**
 * Upload a profile photo for a relationship-app subject using the presigned-S3
 * flow. Subject must be the signed-in account-self or an owned guest subject.
 *
 * Flow: POST /presigned-url -> PUT bytes to S3 -> POST /confirm.
 */
export async function uploadSubjectProfilePhoto(
  subjectId: string,
  imageUri: string,
  mimeType: string
): Promise<UploadedSubjectPhoto> {
  if (!subjectId) throw new Error('subjectId is required');
  const normalizedMime = normalizeMimeType(mimeType);

  let permanentPath: string | null = null;
  try {
    const { uploadUrl, photoKey } = await relationshipUsersApi.getSubjectPhotoPresignedUrl(
      subjectId,
      normalizedMime
    );

    const filePath = imageUri.replace('file://', '');
    permanentPath = `${ReactNativeBlobUtil.fs.dirs.DocumentDir}/rel_temp_upload_${Date.now()}.jpg`;
    await ReactNativeBlobUtil.fs.cp(filePath, permanentPath);
    const fileInfo = await ReactNativeBlobUtil.fs.stat(permanentPath);
    if (!fileInfo.size || fileInfo.size === 0) {
      throw new Error('Selected image file is empty');
    }

    const uploadResponse = await ReactNativeBlobUtil.fetch(
      'PUT',
      uploadUrl,
      { 'Content-Type': normalizedMime },
      ReactNativeBlobUtil.wrap(permanentPath)
    );
    const status = uploadResponse.info().status;
    if (status < 200 || status >= 300) {
      throw new Error(`S3 upload failed with status ${status}`);
    }

    const confirmed = await relationshipUsersApi.confirmSubjectPhotoUpload(subjectId, photoKey);
    return {
      profilePhotoUrl: confirmed.profilePhotoUrl,
      profilePhotoKey: confirmed.profilePhotoKey,
    };
  } finally {
    if (permanentPath) {
      try {
        const exists = await ReactNativeBlobUtil.fs.exists(permanentPath);
        if (exists) {
          await ReactNativeBlobUtil.fs.unlink(permanentPath);
        }
      } catch {
        // ignore cleanup failures
      }
    }
  }
}
