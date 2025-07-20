/**
 * Custom image loader for secure images with optimization
 * This loader handles both secure API routes and public images
 */

export default function secureImageLoader({
  src,
  width,
  quality
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  // In development, return the original src
  if (process.env.NODE_ENV === 'development') {
    return src;
  }

  // Check if this is a secure API file route
  if (src.startsWith('/api/files/')) {
    // For secure files, use our secure image API with optimization parameters
    const fileId = src.split('/api/files/')[1];
    const params = new URLSearchParams();
    params.append('w', width.toString());
    if (quality) {
      params.append('q', quality.toString());
    }
    return `/api/images/${fileId}?${params.toString()}`;
  }

  // Check if this is already a full URL (for public images)
  if (src.startsWith('http')) {
    // Extract the path from the URL to use with Cloudflare Images
    const url = new URL(src);
    const pathname = url.pathname.startsWith('/')
      ? url.pathname.slice(1)
      : url.pathname;

    const params = [`width=${width}`];
    if (quality) {
      params.push(`quality=${quality}`);
    }
    const paramsString = params.join(',');

    // Use Cloudflare Images to optimize public images
    return `/cdn-cgi/image/${paramsString}/${pathname}`;
  }

  // For relative paths, use Cloudflare's image transformation
  const normalizeSrc = (src: string) => {
    return src.startsWith('/') ? src.slice(1) : src;
  };

  const params = [`width=${width}`];
  if (quality) {
    params.push(`quality=${quality}`);
  }
  const paramsString = params.join(',');

  return `/cdn-cgi/image/${paramsString}/${normalizeSrc(src)}`;
}
