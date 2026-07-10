/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["192.168.178.60"],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
