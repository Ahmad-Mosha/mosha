/** @type {import('next').NextConfig} */
const nextConfig = {
  // `next build` and `next dev` share .next by default, so building while
  // the dev server is running wipes its manifests and the app 500s until
  // restarted. Give builds their own directory.
  distDir: process.env.NODE_ENV === "production" ? ".next-build" : ".next",
  reactStrictMode: true,
  // Next.js 15 root option
  allowedDevOrigins: ["192.168.1.9:3000", "localhost:3000", "127.0.0.1:3000"],
};

export default nextConfig;
