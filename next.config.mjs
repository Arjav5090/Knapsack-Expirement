/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  output: 'export',                // 👈 important: tells Next to generate static HTML
  basePath: '/knapsack-experiment' // 👈 replace with your repo name
}

export default nextConfig
