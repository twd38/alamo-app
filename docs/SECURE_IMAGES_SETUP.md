# Secure Cloudflare R2 + Next.js Image Component Setup

This setup provides **secure, authenticated access** to images stored in Cloudflare R2 while maintaining optimization through Next.js Image component.

## 🔒 Security Features

- ✅ **Authentication required** for all image access
- ✅ **Access control** based on user permissions
- ✅ **Temporary signed URLs** for secure access
- ✅ **Image optimization** through Cloudflare (when possible)
- ✅ **No direct R2 URL exposure**

## How It Works

### For Secure Images (Private Files)
1. `Image` component requests `/api/files/{fileId}`
2. Custom loader redirects to `/api/images/{fileId}?w=300&q=80`
3. **Authentication check** validates user session
4. **Access control** verifies user permissions for this file
5. **Signed URL** generated for temporary R2 access
6. **Optimized image** served (when Cloudflare Images is configured)

### For Public Images
1. Regular Cloudflare Images optimization for public URLs
2. Direct `/cdn-cgi/image/` optimization

## Usage Examples

### Secure Images (File IDs)
```tsx
import Image from 'next/image';
import { getSecureImageUrl } from '@/lib/file-utils';

// Using file ID - secure access with authentication
<Image
  src={getSecureImageUrl(file.id)}
  alt="Secure image"
  width={500}
  height={300}
  sizes="(max-width: 768px) 100vw, 500px"
/>

// Or directly with file ID
<Image
  src="/api/files/file-id-here"
  alt="Secure image"
  width={500}
  height={300}
/>
```

### Public Images (Direct URLs)
```tsx
// Public R2 URLs - optimized but not secured
<Image
  src="https://your-r2-domain.com/public/image.jpg"
  alt="Public image"
  width={500}
  height={300}
/>
```

## Configuration Required

### 1. Access Control
Update `/api/images/[fileId]/route.ts` to enable the access control:

```typescript
// Uncomment these lines:
const hasAccess = await checkFileAccess(session.user.id, file);
if (!hasAccess) {
  return NextResponse.json({ error: 'Access denied' }, { status: 403 });
}
```

### 2. Environment Variables
```env
R2_CUSTOM_DOMAIN=your-custom-domain.com  # Optional: for better Cloudflare Images integration
```

## Security Model

### File Access Rules
Users can access images if they:
- **Created the file** (uploaded it)
- **Are assigned to the task/work order** the file is attached to
- **Have access to the board/project** containing the file
- **Are the author of a comment** containing the file
- **Have general access** to parts/instructions (configurable)

### Temporary Access
- **Signed URLs** expire after 1 hour
- **No permanent public access** to file content
- **Authentication required** for every request

## Performance Considerations

### Pros
- ✅ **Secure access control**
- ✅ **Image optimization** (when Cloudflare Images is set up)
- ✅ **Caching** through Next.js Image component
- ✅ **Responsive images** with proper `srcset`

### Cons
- ⚠️ **Additional API calls** for authentication
- ⚠️ **Signed URL generation** adds latency
- ⚠️ **Limited caching** due to temporary URLs

## Optimization Tips

### 1. Enable Cloudflare Images
Set up a custom domain for your R2 bucket and enable Cloudflare Images for automatic optimization.

### 2. Implement Caching
Consider implementing Redis caching for frequently accessed images:

```typescript
// Cache signed URLs for a shorter period
const cachedUrl = await redis.get(`image:${fileId}`);
if (cachedUrl) {
  return NextResponse.redirect(cachedUrl);
}
```

### 3. Use Appropriate Sizes
Always specify proper `sizes` prop for responsive images:

```tsx
<Image
  src={getSecureImageUrl(file.id)}
  alt="Description"
  width={800}
  height={600}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
/>
```

## Development vs Production

- **Development**: Returns original URLs (no optimization)
- **Production**: Full security + optimization pipeline

## Testing

Test your setup:

1. **Authenticated users** should see images
2. **Unauthenticated users** should get 401 errors
3. **Unauthorized users** should get 403 errors
4. **Image optimization** should work in production

## Migration from Public Setup

If migrating from public R2 URLs:

1. **Update image sources** to use `getSecureImageUrl(fileId)`
2. **Enable access control** in the API route
3. **Test authentication** thoroughly
4. **Monitor performance** impact

This setup provides enterprise-grade security for sensitive images while maintaining the performance benefits of modern image optimization.