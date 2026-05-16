/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@rainbow-me/rainbowkit',
  ],
  // Exclude heavy packages from server-side bundle
  serverExternalPackages: [
    '@bnb-chain/greenfield-js-sdk',
    '@tensorflow/tfjs',
    '@xenova/transformers',
  ],
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    }
    // Only enable WASM on client - prevents server blocking compile
    if (!isServer) {
      config.experiments = {
        ...config.experiments,
        asyncWebAssembly: true,
        layers: true,
      }
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
