import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? "",
  trailingSlash: true,
  images: { unoptimized: true },
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
};

export default withSentryConfig(nextConfig, {
  silent: !process.env.SENTRY_AUTH_TOKEN,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
});
