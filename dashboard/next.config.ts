import type { NextConfig } from 'next'

const config: NextConfig = {
  // Dashboard reads sites/*/config.json files from the parent repo folder
  // at runtime. No image optimization needed since we don't render site images.
  typedRoutes: false,
}

export default config
