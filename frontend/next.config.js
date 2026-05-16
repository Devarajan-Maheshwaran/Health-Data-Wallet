/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@rainbow-me/rainbowkit',
  ],
  // Exclude from server-side bundle
  serverExternalPackages: ['@xenova/transformers', 'onnxruntime-node'],
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    }

    // Exclude from client-side bundle using function form
    const originalExternals = config.externals || [];
    config.externals = [
      ...(Array.isArray(originalExternals) ? originalExternals : [originalExternals]),
      function({ request }, callback) {
        if (request === '@xenova/transformers' || request === 'onnxruntime-node') {
          return callback(null, 'commonjs ' + request);
        }
        callback();
      },
    ];

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
