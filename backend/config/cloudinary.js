const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Extract Cloudinary public_id from secure_url
 */
function getPublicIdFromUrl(url) {
  if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) return null;
  try {
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;
    let pathStr = parts[1];
    // Remove version string prefix if present (e.g. v1721545678/)
    pathStr = pathStr.replace(/^v\d+\//, '');
    // Strip file extension
    const lastDotIndex = pathStr.lastIndexOf('.');
    if (lastDotIndex !== -1) {
      pathStr = pathStr.substring(0, lastDotIndex);
    }
    return pathStr;
  } catch (err) {
    return null;
  }
}

/**
 * Upload a local file to Cloudinary.
 * @param {string} filePath - absolute path to the file on disk
 * @param {string} folder   - Cloudinary folder, e.g. 'neet-app/questions'
 * @returns {Promise<string>} the secure_url of the uploaded image
 */
async function uploadToCloudinary(filePath, folder = 'neet-app/questions') {
  const result = await cloudinary.uploader.upload(filePath, {
    folder,
    resource_type: 'image',
    quality: 'auto',
    fetch_format: 'auto',
  });
  return result.secure_url;
}

/**
 * Delete an image from Cloudinary by its secure URL.
 * @param {string} url - the Cloudinary image URL to delete
 */
async function deleteFromCloudinary(url) {
  const publicId = getPublicIdFromUrl(url);
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error(`[Cloudinary Delete Error] Failed to delete ${publicId}:`, err);
  }
}

module.exports = { cloudinary, uploadToCloudinary, deleteFromCloudinary };
