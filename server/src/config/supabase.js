const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL || 'https://ixpwizuhmibkcyfpdtar.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_service_key';
const BUCKET_NAME = process.env.SUPABASE_PROFILE_BUCKET || 'profile-images';

let supabaseClient = null;

const getSupabaseClient = () => {
  if (!supabaseClient) {
    const url = process.env.SUPABASE_URL || supabaseUrl;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey;

    if (!url || !key || key.includes('PASTE_YOUR') || key === 'dummy_service_key') {
      throw new Error('Supabase storage is not configured properly on the server.');
    }

    supabaseClient = createClient(url, key, {
      auth: { persistSession: false },
    });
  }
  return supabaseClient;
};

/**
 * Upload profile photo buffer to Supabase Storage bucket.
 * Storage Path format: profiles/{userId}/{timestamp}-{random}.{ext}
 */
const uploadProfileImage = async (fileBuffer, mimeType, userId) => {
  try {
    const client = getSupabaseClient();

    // Map MIME type to file extension
    let ext = 'jpg';
    if (mimeType === 'image/png') ext = 'png';
    else if (mimeType === 'image/webp') ext = 'webp';
    else if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') ext = 'jpg';
    else {
      throw new Error('Please upload a valid JPG, PNG, or WebP image.');
    }

    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
    const filePath = `profiles/${userId}/${fileName}`;

    // Upload binary buffer to Supabase Storage bucket
    const { data, error } = await client.storage
      .from(BUCKET_NAME)
      .upload(filePath, fileBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      console.error('Supabase storage upload error:', error.message);
      if (error.message && error.message.toLowerCase().includes('bucket not found')) {
        throw new Error(`Storage bucket "${BUCKET_NAME}" does not exist on Supabase.`);
      }
      throw new Error('Failed to upload image to storage service.');
    }

    // Get public URL
    const { data: publicUrlData } = client.storage
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
    const client = getSupabaseClient();
    let storagePath = publicUrlOrPath;
    if (publicUrlOrPath.includes(`/public/${BUCKET_NAME}/`)) {
      storagePath = publicUrlOrPath.split(`/public/${BUCKET_NAME}/`)[1];
    } else if (publicUrlOrPath.startsWith('http')) {
      return; // Non-Supabase external URL (e.g. unsplash), skip deletion
    }

    if (storagePath) {
      await client.storage.from(BUCKET_NAME).remove([storagePath]);
    }
  } catch (err) {
    console.warn('Failed to delete old profile image from Supabase Storage:', err.message);
  }
};

module.exports = {
  getSupabaseClient,
  uploadProfileImage,
  deleteProfileImage,
  BUCKET_NAME,
};
