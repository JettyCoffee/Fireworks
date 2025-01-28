'use client';
import dynamic from 'next/dynamic';

const Fireworks = dynamic(() => import('../components/Fireworks'), {
  ssr: false
});

export default function Home() {
  return <Fireworks />;
} 