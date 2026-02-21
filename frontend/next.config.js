/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  env: {
    // IMPORTANT: Change this to your deployed backend URL when deploying to production
    // For local development: "http://localhost:5000"
    // For production: Deploy backend to Render/Railway/Heroku and use that URL
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "https://smartbiz-sl-oy4l.onrender.com",
  },
};

module.exports = nextConfig;
