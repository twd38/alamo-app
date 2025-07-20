# Cloudflare R2 + Next.js Image Component Setup

This setup integrates Cloudflare R2 storage with Next.js Image component for automatic image optimization.

## Configuration

### 1. Custom Image Loader
The `imageLoader.ts` file handles image optimization through Cloudflare's `/cdn-cgi/image/` service.

### 2. Next.js Configuration
`next.config.ts` is configured to use the custom loader and allows images from your R2 domain.

## Important: Update Your R2 Domain

You need to update `next.config.ts` with your actual R2 public domain:

```typescript
{
  protocol: 'https',
  hostname: 'your-r2-domain.com', // Replace with your actual domain
  pathname: '/**'
}
```

## Cloudflare Setup Required

For this to work properly, you need to:

1. **Set up a custom domain** for your R2 bucket (not the default `.r2.cloudflarestorage.com`)
2. **Enable Image Resizing** in your Cloudflare dashboard:
   - Go to Speed > Optimization > Image Resizing
   - Enable "Image Resizing"
   - Enable "Resize images from any origin" (for development)

## Usage Examples

### Basic Image Usage
```tsx
import Image from 'next/image';

// For R2 URLs
<Image
  src="https://your-r2-domain.com/path/to/image.jpg"
  alt="Description"
  width={500}
  height={300}
/>
```

### With Responsive Sizing
```tsx
<Image
  src="https://your-r2-domain.com/path/to/image.jpg"
  alt="Description"
  width={500}
  height={300}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  className="w-full h-auto"
/>
```

### With Priority Loading
```tsx
<Image
  src="https://your-r2-domain.com/hero-image.jpg"
  alt="Hero image"
  width={1200}
  height={600}
  priority
  sizes="100vw"
/>
```

## How It Works

1. **Next.js Image component** requests an image with specific dimensions
2. **Custom loader** (`imageLoader.ts`) transforms the request into a Cloudflare Images URL
3. **Cloudflare Images** optimizes and serves the image from your R2 bucket
4. **Browser receives** optimized image in the best format (WebP, AVIF, etc.)

## Benefits

- ✅ Automatic image optimization (format, compression, resizing)
- ✅ Responsive images with `srcset`
- ✅ Lazy loading by default
- ✅ Better Core Web Vitals scores
- ✅ CDN delivery through Cloudflare
- ✅ No additional API routes needed

## Development vs Production

- **Development**: Returns original images (no optimization)
- **Production**: Full Cloudflare Images optimization

## Troubleshooting

### Images not loading?
1. Check that your R2 domain is correctly configured in `next.config.ts`
2. Verify Image Resizing is enabled in Cloudflare dashboard
3. Ensure your custom domain is properly set up for R2

### No optimization happening?
1. Make sure you're in production mode (`NODE_ENV=production`)
2. Check that Cloudflare Images is enabled for your domain
3. Verify the `/cdn-cgi/image/` endpoint is accessible

### CORS issues?
Add appropriate CORS headers to your R2 bucket configuration.