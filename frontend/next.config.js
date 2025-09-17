/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Permissions-Policy', value: "camera=(self)" },
          { key: 'Feature-Policy', value: "camera 'self'" },
        ],
      },
    ]
  },
}

module.exports = nextConfig
