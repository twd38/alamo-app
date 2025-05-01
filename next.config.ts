module.exports = {
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb',
    },
  },
  transpilePackages: ['three'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: ''
      },
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
        pathname: ''
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: ''
      },
      {
        protocol: 'https',
        hostname: '*',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'api.zoneomics.com',
        pathname: '/**'
      },
    ]
  },
}