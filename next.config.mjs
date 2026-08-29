/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Next.js 15 root option
  allowedDevOrigins: ["192.168.1.9:3000", "localhost:3000", "127.0.0.1:3000"],
};

export default nextConfig;
