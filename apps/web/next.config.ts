import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: [
    '@noctara/shared',
    '@noctara/policy',
    '@noctara/model-router',
    '@noctara/tools',
    '@noctara/memory',
    '@noctara/agent-core',
    '@noctara/voice',
    '@noctara/autonomy',
    '@noctara/github',
    '@noctara/realtime'
  ],
  eslint: {
    ignoreDuringBuilds: true
  },
  webpack: (config) => {
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs']
    };
    return config;
  }
};

export default nextConfig;
