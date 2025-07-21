module.exports = {
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb'
    }
  },
  transpilePackages: ['three'],
  images: {
    loader: 'custom',
    loaderFile: './src/lib/imageLoader.ts',
    domains: [
      'https://0a1c1daebffa04c4354e44a3fddb1a9b.r2.cloudflarestorage.com'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'api.zoneomics.com',
        pathname: '/**'
      },
      // Add your R2 public URL hostname here
      // Replace with your actual R2 public domain
      {
        protocol: 'https',
        hostname: 'r2.americanhousing.co',
        pathname: '/**'
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/api/images/**'
      },
      {
        protocol: 'https',
        hostname: 'localhost',
        port: '3000',
        pathname: '/api/images/**'
      }
    ]
  }
};
