/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@rainbow-me/rainbowkit',
  ],
  experimental: {
    // Next.js 14 key for server-side external packages
    serverComponentsExternalPackages: ['@xenova/transformers', 'onnxruntime-node'],
  },
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };

    // Stub missing optional peer deps that cause warnings but aren't needed
    config.resolve.alias = {
      ...config.resolve.alias,
      'pino-pretty': false,
      '@react-native-async-storage/async-storage': false,
    };

    // Exclude @xenova/transformers from client bundle
    const originalExternals = config.externals || [];
    config.externals = [
      ...(Array.isArray(originalExternals) ? originalExternals : [originalExternals]),
      function ({ request }, callback) {
        if (
          request === '@xenova/transformers' ||
          request === 'onnxruntime-node'
        ) {
          return callback(null, 'commonjs ' + request);
        }
        callback();
      },
    ];

    // Ignore .node native binaries
    config.module.rules.push({
      test: /\.node$/,
      use: 'ignore-loader',
    });

    if (!isServer) {
      config.experiments = {
        ...config.experiments,
        asyncWebAssembly: true,
        layers: true,
      };
    }

    return config;
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
};

module.exports = nextConfig;
