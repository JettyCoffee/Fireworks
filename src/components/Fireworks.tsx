'use client';

import React, { useEffect, useRef } from 'react';
import { FireworkType, ParticleType } from '../types/firework';

class SoundPool {
    private launchSounds: HTMLAudioElement[];
    private explosionSounds: HTMLAudioElement[];
    private bgMusic: HTMLAudioElement;
    private currentLaunch: number;
    private currentExplosion: number;
    private initialized: boolean = false;

    constructor() {
        this.launchSounds = Array(3).fill(null).map(() => new Audio('https://cdn.pixabay.com/download/audio/2022/03/24/audio_d007e49a6e.mp3?filename=swish-6435.mp3'));
        this.explosionSounds = Array(3).fill(null).map(() => new Audio('https://cdn.pixabay.com/download/audio/2022/10/23/audio_946b4c601d.mp3?filename=firework-explosion-6288.mp3'));
        this.bgMusic = new Audio('/sounds/haoyunlai.m4a');
        this.currentLaunch = 0;
        this.currentExplosion = 0;
    }

    initialize(): void {
        if (this.initialized) return;
        
        this.launchSounds.forEach(sound => {
            sound.load();
            sound.volume = 0.15;
        });
        this.explosionSounds.forEach(sound => {
            sound.load();
            sound.volume = 0.2;
        });

        this.bgMusic.loop = true;
        this.bgMusic.volume = 0.4;
        this.bgMusic.load();
        
        this.initialized = true;
    }

    playLaunch(): void {
        if (!this.initialized) return;
        const sound = this.launchSounds[this.currentLaunch];
        if (sound.currentTime > 0) {
            sound.currentTime = 0;
        }
        sound.play().catch(() => {});
        this.currentLaunch = (this.currentLaunch + 1) % this.launchSounds.length;
    }

    playExplosion(): void {
        if (!this.initialized) return;
        const sound = this.explosionSounds[this.currentExplosion];
        if (sound.currentTime > 0) {
            sound.currentTime = 0;
        }
        sound.play().catch(() => {});
        this.currentExplosion = (this.currentExplosion + 1) % this.explosionSounds.length;
    }

    startBgMusic(): void {
        if (!this.initialized) return;
        this.bgMusic.play().catch(() => {});
    }

    stopBgMusic(): void {
        if (!this.initialized) return;
        this.bgMusic.pause();
        this.bgMusic.currentTime = 0;
    }
}

class Firework implements FireworkType {
    private phase: 'launch' | 'decelerate' | 'explode' = 'launch';
    private readonly launchSpeed: number;
    private readonly minSpeed: number = 0.3;

    public startX: number;
    public startY: number;
    public targetX: number;
    public targetY: number;
    public distanceToTarget: number;
    public distanceTraveled: number = 0;
    public coordinates: number[][];
    public angle: number;
    public speed: number;
    public friction: number;
    public hue: number;
    public brightness: number;
    public alpha: number;
    public decay: number = 0;

    constructor(
        public x: number,
        public y: number,
        targetX: number,
        targetY: number,
        private ctx: CanvasRenderingContext2D,
        private soundPool: SoundPool
    ) {
        this.startX = x;
        this.startY = y;
        this.targetX = targetX;
        this.targetY = targetY;
        this.distanceToTarget = Math.sqrt(Math.pow(this.targetX - x, 2) + Math.pow(this.targetY - y, 2));
        this.coordinates = [];
        this.angle = Math.atan2(this.targetY - y, this.targetX - x);
        
        // 根据屏幕高度调整初始速度
        const screenHeight = window.innerHeight;
        this.launchSpeed = Math.min(this.distanceToTarget / (screenHeight * 0.04), 12);
        this.speed = this.launchSpeed;
        this.friction = 0.98;
        this.hue = Math.random() * 360;
        this.brightness = Math.random() * 20 + 80;
        this.alpha = 1;

        // 减少轨迹点数量以提高性能
        for (let i = 0; i < 4; i++) {
            this.coordinates.push([x, y]);
        }
    }

    update(particles: Particle[]): boolean {
        // 更新轨迹
        this.coordinates.pop();
        this.coordinates.unshift([this.x, this.y]);

        // 计算当前位置到目标的距离
        const distanceToTarget = Math.sqrt(
            Math.pow(this.targetX - this.x, 2) + Math.pow(this.targetY - this.y, 2)
        );

        // 计算已经走过的距离的百分比
        const progress = 1 - (distanceToTarget / this.distanceToTarget);

        // 状态机逻辑
        switch (this.phase) {
            case 'launch':
                // 前15%保持全速
                if (progress <= 0.15) {
                    this.speed = this.launchSpeed;
                } else {
                    this.phase = 'decelerate';
                }
                break;

            case 'decelerate':
                // 减速阶段
                const decelerateProgress = (progress - 0.15) / 0.85;
                // 使用三次方曲线使减速更自然
                const speedFactor = 1 - Math.pow(decelerateProgress, 3);
                this.speed = this.launchSpeed * speedFactor;

                // 当速度降到最小值或非常接近目标点时，直接爆炸
                if (this.speed <= this.minSpeed || distanceToTarget < 1) {
                    this.x = this.targetX;
                    this.y = this.targetY;
                    this.phase = 'explode';
                }
                break;

            case 'explode':
                // 爆炸阶段
                const particleCount = Math.floor(Math.random() * 50) + 150;
                for (let i = 0; i < particleCount; i++) {
                    particles.push(new Particle(this.x, this.y, this.ctx, this.hue));
                }
                this.soundPool.playExplosion();
                return false;
        }

        // 如果不是爆炸阶段，更新位置
        if (this.phase !== 'explode') {
            const vx = Math.cos(this.angle) * this.speed;
            const vy = Math.sin(this.angle) * this.speed;
            this.x += vx;
            this.y += vy;
        }

        return true;
    }

    draw(): void {
        this.ctx.beginPath();
        this.ctx.moveTo(
            this.coordinates[this.coordinates.length - 1][0],
            this.coordinates[this.coordinates.length - 1][1]
        );
        this.ctx.lineTo(this.x, this.y);
        this.ctx.strokeStyle = `hsla(${this.hue}, 100%, ${this.brightness}%, ${this.alpha})`;
        this.ctx.lineWidth = 3;
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        this.ctx.fillStyle = `hsla(${this.hue}, 100%, ${this.brightness}%, ${this.alpha})`;
        this.ctx.fill();
    }
}

class Particle implements ParticleType {
    public coordinates: number[][];
    public angle: number;
    public speed: number;
    public friction: number;
    public gravity: number;
    public hue: number;
    public brightness: number;
    public alpha: number;
    public decay: number;
    
    constructor(
        public x: number,
        public y: number,
        private ctx: CanvasRenderingContext2D,
        hue: number
    ) {
        this.coordinates = [];
        this.angle = Math.random() * Math.PI * 2;
        // 根据屏幕大小调整粒子速度
        const screenSize = Math.min(window.innerWidth, window.innerHeight);
        this.speed = Math.random() * (screenSize * 0.015) + (screenSize * 0.01);
        this.friction = 0.95;
        this.gravity = 0.6;  // 降低重力效果
        this.hue = hue + Math.random() * 20 - 10;
        this.brightness = Math.random() * 30 + 70;
        this.alpha = 1;
        this.decay = Math.random() * 0.02 + 0.015;  // 稍微加快衰减速度

        // 减少轨迹点数量
        for (let i = 0; i < 5; i++) {
            this.coordinates.push([x, y]);
        }
    }

    update(): boolean {
        this.coordinates.pop();
        this.coordinates.unshift([this.x, this.y]);

        this.speed *= this.friction;
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed + this.gravity;
        this.alpha -= this.decay;

        return this.alpha >= 0.1;
    }

    draw(): void {
        this.ctx.beginPath();
        const lastCoord = this.coordinates[this.coordinates.length - 1];
        this.ctx.moveTo(lastCoord[0], lastCoord[1]);
        this.ctx.lineTo(this.x, this.y);
        
        this.ctx.strokeStyle = `hsla(${this.hue}, 100%, ${this.brightness}%, ${this.alpha})`;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, 1.2, 0, Math.PI * 2);
        this.ctx.fillStyle = `hsla(${this.hue}, 100%, ${this.brightness}%, ${this.alpha})`;
        this.ctx.fill();
    }
}

const Fireworks: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fireworks = useRef<Firework[]>([]);
    const particles = useRef<Particle[]>([]);
    const animationFrameId = useRef<number | null>(null);
    const soundPool = useRef<SoundPool | null>(null);
    const [showHint, setShowHint] = React.useState(true);
    const [isFirstInteraction, setIsFirstInteraction] = React.useState(true);
    const [score, setScore] = React.useState(0);

    useEffect(() => {
        soundPool.current = new SoundPool();
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const setCanvasSize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        const handleInteraction = (x: number, y: number) => {
            if (isFirstInteraction) {
                if (soundPool.current) {
                    soundPool.current.initialize();
                    soundPool.current.startBgMusic();
                }
                setIsFirstInteraction(false);
                setShowHint(false);
            }

            setScore(prev => prev + 1);

            // 在移动端，从底部发射烟花
            const startX = window.innerWidth / 2;
            const startY = window.innerHeight;
            
            if (soundPool.current) {
                soundPool.current.playLaunch();
                fireworks.current.push(new Firework(
                    startX,
                    startY,
                    x,
                    y,
                    ctx,
                    soundPool.current
                ));
            }
        };

        const handleClick = (e: MouseEvent) => {
            handleInteraction(e.clientX, e.clientY);
        };

        const handleTouch = (e: TouchEvent) => {
            e.preventDefault(); // 防止滚动和缩放
            const touch = e.touches[0];
            handleInteraction(touch.clientX, touch.clientY);
        };

        setCanvasSize();
        window.addEventListener('resize', setCanvasSize);
        canvas.addEventListener('click', handleClick);
        canvas.addEventListener('touchstart', handleTouch);

        // 动画循环
        const loop = () => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            let i = fireworks.current.length;
            while (i--) {
                if (!fireworks.current[i].update(particles.current)) {
                    fireworks.current.splice(i, 1);
                } else {
                    fireworks.current[i].draw();
                }
            }

            i = particles.current.length;
            while (i--) {
                if (!particles.current[i].update()) {
                    particles.current.splice(i, 1);
                } else {
                    particles.current[i].draw();
                }
            }

            animationFrameId.current = requestAnimationFrame(loop);
        };

        loop();

        return () => {
            window.removeEventListener('resize', setCanvasSize);
            canvas.removeEventListener('click', handleClick);
            canvas.removeEventListener('touchstart', handleTouch);
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
            if (soundPool.current) {
                soundPool.current.stopBgMusic();
            }
        };
    }, [isFirstInteraction]);

    return (
        <div className="relative w-screen h-screen bg-black overflow-hidden">
            {/* 计分板 */}
            <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-10">
                <div className="bg-black bg-opacity-30 px-4 py-2 rounded-full 
                    flex items-center gap-2 border border-white border-opacity-10">
                    <span className="text-white text-opacity-80">已放</span>
                    <span className="text-white text-xl font-bold">{score}</span>
                    <span className="text-white text-opacity-80">个烟花</span>
                </div>
            </div>

            <canvas
                ref={canvasRef}
                className="block touch-none"
            />

            {/* 提示文本 */}
            {showHint && (
                <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                    pointer-events-none z-10">
                    <div className="bg-black bg-opacity-40 px-6 py-3 rounded-lg
                        text-white text-xl text-center">
                        点击屏幕放烟花
                    </div>
                </div>
            )}
        </div>
    );
};

export default Fireworks; 