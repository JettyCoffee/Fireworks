/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // 改为静态导出
  // 确保音频文件被正确处理
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(mp3|m4a|wav)$/,
      use: {
        loader: 'file-loader',
        options: {
          publicPath: '/',
          outputPath: 'static/media/',
          name: '[name].[hash].[ext]',
        },
      },
    });
    return config;
  },
  // 基本优化
  reactStrictMode: true,
  compress: true,
  trailingSlash: true,
  // 静态资源优化
  images: {
    unoptimized: true,
  },
  // 禁用不必要的功能
  poweredByHeader: false,
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
}

module.exports = nextConfig; 