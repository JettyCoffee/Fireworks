/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // 确保音频文件被正确处理
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(mp3|m4a|wav)$/,
      use: {
        loader: 'file-loader',
        options: {
          publicPath: '/_next/static/media/',
          outputPath: 'static/media/',
          name: '[name].[hash].[ext]',
        },
      },
    });
    return config;
  },
  // 优化构建设置
  experimental: {
    optimizePackageImports: ['react', 'react-dom'],
  },
  // 静态资源优化
  images: {
    unoptimized: true,
  },
  // 禁用一些可能导致问题的优化
  swcMinify: true,
  poweredByHeader: false,
  reactStrictMode: true,
}

module.exports = nextConfig; 