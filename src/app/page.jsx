'use client';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// 使用动态导入并禁用 SSR
const Fireworks = dynamic(() => import('../components/Fireworks'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 w-full h-full bg-black flex items-center justify-center">
      <div className="text-white text-lg">加载中...</div>
    </div>
  ),
});

export default function Home() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 w-full h-full bg-black flex items-center justify-center">
        <div className="text-white text-lg">加载中...</div>
      </div>
    }>
      <Fireworks />
    </Suspense>
  );
} 