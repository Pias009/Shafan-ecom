// Cloudinary helper: uploads images to Cloudinary and returns the cloud URL.
// If Cloudinary isn't configured, this will gracefully return the original URL.
import { v2 as cloudinary } from 'cloudinary'

function isConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  )
}

if (isConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME as string,
    api_key: process.env.CLOUDINARY_API_KEY as string,
    api_secret: process.env.CLOUDINARY_API_SECRET as string,
    secure: true,
  })
}

export async function uploadFromUrl(url: string): Promise<string> {
  if (!isConfigured()) return url
  try {
    const res = await cloudinary.uploader.upload(url, {
      folder: 'ecommerce/products',
      // Optional: resize/optimize during upload
      transformation: { width: 800, height: 800, crop: 'limit' },
      // Let Cloudinary decide the public_id; unique filenames help avoid collisions
      use_filename: true,
      unique_filename: true,
    })
    return res.secure_url
  } catch (e) {
    console.error('Cloudinary upload failed for', url, e)
    // Fallback to original URL if upload fails
    return url
  }
}

export async function uploadFromUrls(urls: string[]): Promise<string[]> {
  if (!isConfigured()) return urls
  const uploads = urls.map((u) => uploadFromUrl(u).catch(() => u))
  return Promise.all(uploads)
}
