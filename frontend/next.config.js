/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@rainbow-me/rainbowkit',
  ],
  // Next.js 14 key for server-side external packages
  serverExternalPackages: [
    '@xenova/transformers', 
    'onnxruntime-node', 
    '@bnb-chain/greenfield-js-sdk',
    'pdfjs-dist'
  ],
  webpack: (config, { isServer, dev }) => {
    // Disable disk caching to prevent ENOSPC errors on space-constrained systems
    if (config.cache && !dev) {
      config.cache = false;
    }

    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
      stream: false,
      buffer: require.resolve('buffer/'),
    };

    // Stub missing optional peer deps that cause warnings but aren't needed
    config.resolve.alias = {
      ...config.resolve.alias,
      'pino-pretty': false,
      '@react-native-async-storage/async-storage': false,
      'onnxruntime-node': false,
    };

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
      
      // Alias node-only modules to prevent browser bundling
      config.resolve.alias['@xenova/transformers'] = false;
      config.resolve.alias['pdfjs-dist'] = false;
      config.resolve.alias['@bnb-chain/greenfield-js-sdk'] = false;
    }

    return config;
  },
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'Cross-Origin-Opener-Policy',   value: 'same-origin-allow-popups' },
        { key: 'Cross-Origin-Embedder-Policy', value: 'unsafe-none' },
      ],
    },
  ],
};

module.exports = nextConfig;
