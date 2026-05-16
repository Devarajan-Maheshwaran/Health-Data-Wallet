/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@rainbow-me/rainbowkit',
    '@bnb-chain/greenfield-js-sdk',
  ],
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    }
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    }
    return config
  },
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'Cross-Origin-Opener-Policy',   value: 'same-origin' },
        { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
      ],
    },
  ],
}

module.exports = nextConfig
