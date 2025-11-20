/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  env: {
    GHL_APP_CLIENT_ID: process.env.GHL_APP_CLIENT_ID,
    GHL_APP_CLIENT_SECRET: process.env.GHL_APP_CLIENT_SECRET,
    GHL_API_DOMAIN: process.env.GHL_API_DOMAIN,
  },
}

module.exports = nextConfig
