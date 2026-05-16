/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@rainbow-me/rainbowkit',
  ],
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    }

    // Exclude onnxruntime and xenova from ALL bundles (server + client)
    const externals = ['onnxruntime-node', '@xenova/transformers'];
    if (Array.isArray(config.externals)) {
      config.externals = [...config.externals, ...externals];
    } else if (typeof config.externals === 'object') {
      externals.forEach(pkg => { config.externals[pkg] = pkg; });
    } else {
      config.externals = externals;
    }

    // Ignore .node binary files
    config.module.rules.push({
      test: /\.node$/,
      use: 'ignore-loader',
    })

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
