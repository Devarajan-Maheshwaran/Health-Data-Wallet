/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@rainbow-me/rainbowkit'],
  experimental: {
    serverComponentsExternalPackages: [
      'onnxruntime-node',
      '@bnb-chain/greenfield-js-sdk',
      'pdfjs-dist',
    ],
    // Do NOT include @xenova/transformers here — it must load client-side
  },
  webpack: (config, { isServer, dev }) => {
    if (config.cache && !dev) config.cache = false;

    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false, path: false, crypto: false,
      stream: false, buffer: require.resolve('buffer/'),
    };

    config.resolve.alias = {
      ...config.resolve.alias,
      'pino-pretty': false,
      '@react-native-async-storage/async-storage': false,
      'onnxruntime-node': false,
    };

    config.module.rules.push({ test: /\.node$/, use: 'ignore-loader' });

    if (!isServer) {
      config.experiments = {
        ...config.experiments,
        asyncWebAssembly: true,
        layers: true,
      };

      // REMOVED: config.resolve.alias['@xenova/transformers'] = false
      // WHY: That line was stripping transformers from the browser bundle
      // entirely, forcing a full runtime parse on every page load.
      // We want transformers available as a lazy dynamic import() instead.

      // Still exclude server-only packages from browser bundle
      config.resolve.alias['pdfjs-dist'] = false;
      config.resolve.alias['@bnb-chain/greenfield-js-sdk'] = false;
    }

    return config;
  },
  headers: async () => [
    {
      // Add long-lived cache for ONNX/WASM model files fetched from CDN
      // These are content-addressed so safe to cache for 1 year
      source: '/(.*)',
      headers: [
        { key: 'Cross-Origin-Opener-Policy',   value: 'same-origin-allow-popups' },
        { key: 'Cross-Origin-Embedder-Policy',  value: 'unsafe-none' },
        // Allow browser to cache model weight fetches aggressively
        { key: 'Vary', value: 'Accept-Encoding' },
      ],
    },
    {
      // Specifically for any locally-served WASM or model files
      source: '/models/(.*)',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        { key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' },
      ],
    },
  ],
};

module.exports = nextConfig;
