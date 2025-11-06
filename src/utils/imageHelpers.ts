import { Alert, Platform } from 'react-native';
import { launchImageLibrary, launchCamera, Asset } from 'react-native-image-picker';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { usersApi } from '../api/users';

export interface ImageResult {
  uri: string;
  type: string;
  fileName: string;
  fileSize: number;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

/**
 * Validate image file
 */
export function validateImage(asset: Asset): { valid: boolean; error?: string } {
  if (!asset.uri) {
    return { valid: false, error: 'No image selected' };
  }

  if (!asset.type || !ACCEPTED_TYPES.includes(asset.type)) {
    return {
      valid: false,
      error: 'Please upload a JPEG, PNG, GIF, or WebP image',
    };
  }

  if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'File size must be less than 5MB',
    };
  }

  return { valid: true };
}

/**
 * Launch image library picker
 */
export async function pickImageFromLibrary(): Promise<ImageResult | null> {
  try {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
      selectionLimit: 1,
    });

    if (result.didCancel) {
      return null;
    }

    if (result.errorCode) {
      Alert.alert('Error', result.errorMessage || 'Failed to pick image');
      return null;
    }

    const asset = result.assets?.[0];
    if (!asset) {
      return null;
    }

    const validation = validateImage(asset);
    if (!validation.valid) {
      Alert.alert('Invalid Image', validation.error);
      return null;
    }

    return {
      uri: asset.uri!,
      type: asset.type || 'image/jpeg',
      fileName: asset.fileName || 'photo.jpg',
      fileSize: asset.fileSize || 0,
    };
  } catch (error) {
    console.error('Error picking image:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to pick image';
    Alert.alert('Error', errorMessage);
    return null;
  }
}

/**
 * Launch camera
 */
export async function pickImageFromCamera(): Promise<ImageResult | null> {
  try {
    const result = await launchCamera({
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
      saveToPhotos: true,
    });

    if (result.didCancel) {
      return null;
    }

    if (result.errorCode) {
      Alert.alert('Error', result.errorMessage || 'Failed to take photo');
      return null;
    }

    const asset = result.assets?.[0];
    if (!asset) {
      return null;
    }

    const validation = validateImage(asset);
    if (!validation.valid) {
      Alert.alert('Invalid Image', validation.error);
      return null;
    }

    return {
      uri: asset.uri!,
      type: asset.type || 'image/jpeg',
      fileName: asset.fileName || 'photo.jpg',
      fileSize: asset.fileSize || 0,
    };
  } catch (error) {
    console.error('Error taking photo:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to take photo';
    Alert.alert('Error', errorMessage);
    return null;
  }
}

/**
 * Normalize MIME type to standard format
 */
function normalizeMimeType(mimeType: string): string {
  // Normalize image/jpg to image/jpeg (standard MIME type)
  if (mimeType === 'image/jpg') {
    return 'image/jpeg';
  }
  return mimeType;
}

/**
 * Upload profile photo using presigned URL strategy
 */
export async function uploadProfilePhotoPresigned(
  subjectId: string,
  imageUri: string,
  mimeType: string
): Promise<{ profilePhotoUrl: string; profilePhotoKey: string }> {
  let permanentPath: string | null = null;

  try {
    console.log('\n=== PROFILE PHOTO UPLOAD STARTED ===');
    console.log('Subject ID:', subjectId);
    console.log('Subject ID type:', typeof subjectId);
    console.log('Subject ID length:', subjectId?.length);
    console.log('Image URI:', imageUri);
    console.log('Original MIME Type:', mimeType);

    // Normalize MIME type
    const normalizedMimeType = normalizeMimeType(mimeType);
    console.log('Normalized MIME Type:', normalizedMimeType);

    // Validate subject ID
    if (!subjectId) {
      throw new Error('Subject ID is required for photo upload');
    }

    // Step 1: Get presigned URL
    console.log('Step 1: Requesting presigned URL...');
    const { uploadUrl, photoKey } = await usersApi.getPresignedUploadUrl(subjectId, normalizedMimeType);
    console.log('Got presigned URL with photo key:', photoKey);

    // Step 2: Upload to S3
    console.log('Step 2: Uploading to S3...');
    console.log('Image URI:', imageUri);

    // Normalize path - remove file:// prefix for fs operations
    const filePath = imageUri.replace('file://', '');
    console.log('Normalized file path:', filePath);

    // iOS cleans up temp files quickly, so copy to permanent location immediately
    console.log('Copying file to permanent location...');
    permanentPath = `${ReactNativeBlobUtil.fs.dirs.DocumentDir}/temp_upload_${Date.now()}.jpg`;
    await ReactNativeBlobUtil.fs.cp(filePath, permanentPath);
    console.log('File copied to:', permanentPath);

    // Verify file exists and has content
    const fileInfo = await ReactNativeBlobUtil.fs.stat(permanentPath);
    console.log('File size:', fileInfo.size, 'bytes');

    if (!fileInfo.size || fileInfo.size === 0) {
      throw new Error('Copied file is empty');
    }

    // Upload from permanent location
    const uploadResponse = await ReactNativeBlobUtil.fetch(
      'PUT',
      uploadUrl,
      {
        'Content-Type': normalizedMimeType,
      },
      ReactNativeBlobUtil.wrap(permanentPath)
    );

    const statusCode = uploadResponse.info().status;
    console.log('S3 upload status:', statusCode);

    if (statusCode < 200 || statusCode >= 300) {
      const errorText = uploadResponse.text();
      console.error('S3 upload failed with status:', statusCode);
      console.error('S3 response:', errorText);
      throw new Error(`Failed to upload to S3: ${statusCode}`);
    }

    console.log('Upload to S3 successful');

    // Step 3: Confirm with backend
    console.log('Step 3: Confirming upload with backend...');
    const result = await usersApi.confirmProfilePhotoUpload(subjectId, photoKey);
    console.log('Upload confirmed:', result.profilePhotoUrl);
    console.log('=== PROFILE PHOTO UPLOAD COMPLETED ===\n');

    return {
      profilePhotoUrl: result.profilePhotoUrl,
      profilePhotoKey: result.profilePhotoKey,
    };
  } catch (error: any) {
    console.error('\n=== PROFILE PHOTO UPLOAD ERROR ===');
    console.error('Error type:', typeof error);
    console.error('Error name:', error?.name);
    console.error('Error message:', error?.message);
    console.error('Error status:', error?.status);
    console.error('Error code:', error?.code);
    console.error('Full error:', JSON.stringify(error, null, 2));
    console.error('===========================\n');

    // Create a more user-friendly error message
    let errorMessage = 'Failed to upload profile photo';
    if (error?.message) {
      errorMessage = error.message;
    }
    if (error?.status === 400) {
      errorMessage = 'Invalid request - please check the photo format and try again';
    }

    throw new Error(errorMessage);
  } finally {
    // Clean up temporary file
    if (permanentPath) {
      try {
        const exists = await ReactNativeBlobUtil.fs.exists(permanentPath);
        if (exists) {
          await ReactNativeBlobUtil.fs.unlink(permanentPath);
          console.log('Cleaned up temporary file:', permanentPath);
        }
      } catch (cleanupError) {
        console.warn('Failed to clean up temporary file:', cleanupError);
      }
    }
  }
}

/**
 * Show action sheet to select photo source
 */
export function showImagePickerActionSheet(
  onImageSelected: (imageResult: ImageResult) => void,
  options?: {
    includeCamera?: boolean;
    includeRemove?: boolean;
    onRemove?: () => void;
  }
): void {
  const {
    includeCamera = true,
    includeRemove = false,
    onRemove,
  } = options || {};

  const buttons: string[] = ['Choose from Library'];

  if (includeCamera) {
    buttons.push('Take Photo');
  }

  if (includeRemove && onRemove) {
    buttons.push('Remove Photo');
  }

  buttons.push('Cancel');

  Alert.alert('Profile Photo', 'Select an option', [
    {
      text: 'Choose from Library',
      onPress: async () => {
        const result = await pickImageFromLibrary();
        if (result) {
          onImageSelected(result);
        }
      },
    },
    ...(includeCamera ? [{
      text: 'Take Photo',
      onPress: async () => {
        const result = await pickImageFromCamera();
        if (result) {
          onImageSelected(result);
        }
      },
    }] : []),
    ...(includeRemove && onRemove ? [{
      text: 'Remove Photo',
      onPress: onRemove,
      style: 'destructive' as const,
    }] : []),
    {
      text: 'Cancel',
      style: 'cancel' as const,
    },
  ]);
}
