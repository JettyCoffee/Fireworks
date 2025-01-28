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
  // 网络配置
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-Requested-With, Content-Type, Authorization',
          },
        ],
      },
    ];
  },
  // 移动端优化
  poweredByHeader: false,
  reactStrictMode: true,
  compress: true,
}

module.exports = nextConfig; 