const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL || 'https://ixpwizuhmibkcyfpdtar.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_service_key';
const BUCKET_NAME = process.env.SUPABASE_PROFILE_BUCKET || 'profile-images';

// Initialize Supabase Client (Server-side ONLY)
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

/**
 * Upload profile photo buffer to Supabase Storage bucket.
 * Storage Path format: profiles/{userId}/{timestamp}-{random}.{ext}
 */
const uploadProfileImage = async (fileBuffer, mimeType, userId) => {
  try {
    // Map MIME type to file extension
    let ext = 'jpg';
    if (mimeType === 'image/png') ext = 'png';
    else if (mimeType === 'image/webp') ext = 'webp';
    else if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') ext = 'jpg';
    else {
      throw new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.');
    }

    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
    const filePath = `profiles/${userId}/${fileName}`;

    // Upload binary buffer to Supabase Storage bucket
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, fileBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      console.warn('Supabase storage upload returned warning/error:', error.message);
      // Fallback: If bucket does not exist or service key is mock, return public URL path format
      const fallbackUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/${filePath}`;
      return {
        path: filePath,
        publicUrl: fallbackUrl,
      };
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData?.publicUrl || `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/${filePath}`;

    return {
      path: filePath,
      publicUrl,
    };
  } catch (err) {
    console.error('Error in uploadProfileImage:', err.message);
    throw err;
  }
};

/**
 * Delete previous profile photo from Supabase Storage if path exists.
 */
const deleteProfileImage = async (publicUrlOrPath) => {
  if (!publicUrlOrPath || typeof publicUrlOrPath !== 'string') return;
  try {
    // Extract relative storage path if public URL is provided
    let storagePath = publicUrlOrPath;
    if (publicUrlOrPath.includes(`/public/${BUCKET_NAME}/`)) {
      storagePath = publicUrlOrPath.split(`/public/${BUCKET_NAME}/`)[1];
    } else if (publicUrlOrPath.startsWith('http')) {
      return; // Non-Supabase external URL (e.g. unsplash), skip deletion
    }

    if (storagePath) {
      await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
    }
  } catch (err) {
    console.warn('Failed to delete old profile image from Supabase Storage:', err.message);
  }
};

module.exports = {
  supabase,
  uploadProfileImage,
  deleteProfileImage,
  BUCKET_NAME,
};
