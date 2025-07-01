/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Outputs a Single-Page Application (SPA).
  distDir: './dist', // Changes the build output directory to `./dist/`.
  trailingSlash: true, // Ensures compatibility with static hosting
  images: {
    unoptimized: true, // Required for static export
  },
}

export default nextConfig
