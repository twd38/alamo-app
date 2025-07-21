import { ImageLoaderProps } from 'next/image';

/**
 * Custom image loader for Cloudflare secure image urls
 */
export default function imageLoader({
  src,
  width,
  quality
}: ImageLoaderProps): string {
  // if src is a public image, return it
  if (src.startsWith('/images')) {
    return src;
  }

  // Get the signed url using the api/images/[...path]/route
  const signedUrlPath = `/api/images/${src}`;
  return signedUrlPath;
}
