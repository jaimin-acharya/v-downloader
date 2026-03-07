/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.ytimg.com' },
      { protocol: 'https', hostname: '**.cdninstagram.com' },
      { protocol: 'https', hostname: '**.fbcdn.net' },
      { protocol: 'https', hostname: '**.twimg.com' },
      { protocol: 'https', hostname: '**.tiktokcdn.com' },
      { protocol: 'https', hostname: '**.vimeocdn.com' },
      { protocol: 'https', hostname: 'placehold.co' },
    ],
  },
  async rewrites() {
    // Only apply these locally. On Vercel, api/*.py files are served automatically at /api/*
    if (process.env.VERCEL) return [];

    return [
      {
        source: '/api/info',
        destination: '/api/local-info',
      },
      {
        source: '/api/download',
        destination: '/api/local-download',
      },
    ];
  },
};

export default nextConfig
