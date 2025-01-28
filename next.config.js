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
          publicPath: './',  // 修改为相对路径
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
  // 移除 headers 配置，因为在静态导出时不起作用
  basePath: '',  // 添加基础路径配置
  assetPrefix: './',  // 添加资源前缀配置
}

module.exports = nextConfig; 