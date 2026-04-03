import { withSentryConfig } from '@sentry/nextjs';
import path from 'node:path';

const nextConfig = {
  serverExternalPackages: ['@prisma/client', 'bcryptjs', 'pino', 'pino-pretty'],
  turbopack: {
    root: path.resolve('.'),
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/**',
      },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  // disableLogger / automaticVercelMonitors are deprecated in this Sentry integration.
});
