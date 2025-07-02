/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed output: 'export' to enable API routes and database functionality
  distDir: './dist', // Changes the build output directory to `./dist/`.
  trailingSlash: true, // Ensures compatibility with static hosting
  images: {
    unoptimized: true, // Keep for better compatibility
  },
}

export default nextConfig
