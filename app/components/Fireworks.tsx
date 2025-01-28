'use client';

import React, { useEffect, useRef } from 'react';
import { FireworkType, ParticleType } from '../types/firework';

// 创建音效类
class SoundPool {
    private launchSounds: HTMLAudioElement[];
    private explosionSounds: HTMLAudioElement[];
    private bgMusic: HTMLAudioElement;
    private currentLaunch: number;
    private currentExplosion: number;

    constructor() {
        // 使用更合适的音效
        this.launchSounds = Array(3).fill(null).map(() => new Audio('https://cdn.pixabay.com/download/audio/2022/03/24/audio_d007e49a6e.mp3?filename=swish-6435.mp3'));
        this.explosionSounds = Array(3).fill(null).map(() => new Audio('https://cdn.pixabay.com/download/audio/2022/10/23/audio_946b4c601d.mp3?filename=firework-explosion-6288.mp3'));
        // 使用本地的好运来背景音乐
        this.bgMusic = new Audio('/sounds/haoyunlai.m4a');
        this.currentLaunch = 0;
        this.currentExplosion = 0;

        // 预加载音频并设置音量
        this.launchSounds.forEach(sound => {
            sound.load();
            sound.volume = 0.15;
        });
        this.explosionSounds.forEach(sound => {
            sound.load();
            sound.volume = 0.2;
        });

        // 设置背景音乐
        this.bgMusic.loop = true;
        this.bgMusic.volume = 0.4;
        this.bgMusic.load();
    }

    playLaunch(): void {
        const sound = this.launchSounds[this.currentLaunch];
        if (sound.currentTime > 0) {
            sound.currentTime = 0;
        }
        void sound.play();
        this.currentLaunch = (this.currentLaunch + 1) % this.launchSounds.length;
    }

    playExplosion(): void {
        const sound = this.explosionSounds[this.currentExplosion];
        if (sound.currentTime > 0) {
            sound.currentTime = 0;
        }
        void sound.play();
        this.currentExplosion = (this.currentExplosion + 1) % this.explosionSounds.length;
    }

    startBgMusic(): void {
        void this.bgMusic.play();
    }

    stopBgMusic(): void {
        this.bgMusic.pause();
        this.bgMusic.currentTime = 0;
    }
}

class Firework implements FireworkType {
    public startX: number;
    public startY: number;
    public distanceToTarget: number;
    public distanceTraveled: number;
    public coordinates: number[][];
    public angle: number;
    public speed: number;
    public friction: number;
    public hue: number;
    public brightness: number;
    public alpha: number;
    public decay: number;

    constructor(
        public x: number,
        public y: number,
        public targetX: number,
        public targetY: number,
        public ctx: CanvasRenderingContext2D,
        private soundPool: SoundPool
    ) {
        this.startX = x;
        this.startY = y;
        // 减小随机偏移，使烟花更精确
        this.targetX = targetX + (Math.random() - 0.5) * 40;
        this.targetY = targetY + (Math.random() - 0.5) * 40;
        this.distanceToTarget = Math.sqrt(Math.pow(this.targetX - x, 2) + Math.pow(this.targetY - y, 2));
        this.distanceTraveled = 0;
        this.coordinates = [];
        this.angle = Math.atan2(this.targetY - y, this.targetX - x);
        // 调整速度使运动更流畅
        this.speed = Math.random() * 3 + 8;
        this.friction = 0.98;
        this.hue = Math.random() * 360;
        this.brightness = Math.random() * 20 + 80;
        this.alpha = 1;
        this.decay = Math.random() * 0.03 + 0.02;

        // 增加尾迹长度
        for (let i = 0; i < 6; i++) {
            this.coordinates.push([x, y]);
        }
    }

    update(particles: Particle[]): boolean {
        this.coordinates.pop();
        this.coordinates.unshift([this.x, this.y]);

        this.speed *= this.friction;
        const vx = Math.cos(this.angle) * this.speed;
        const vy = Math.sin(this.angle) * this.speed;
        this.distanceTraveled = Math.sqrt(
            Math.pow(this.x - this.startX, 2) + Math.pow(this.y - this.startY, 2)
        );

        if (this.distanceTraveled >= this.distanceToTarget) {
            createParticles(this.targetX, this.targetY, this.ctx, particles, this.hue);
            this.soundPool.playExplosion();
            return false;
        }

        this.x += vx;
        this.y += vy;
        return true;
    }

    draw(): void {
        this.ctx.beginPath();
        // 移动到最后一个坐标点
        this.ctx.moveTo(
            this.coordinates[this.coordinates.length - 1][0],
            this.coordinates[this.coordinates.length - 1][1]
        );
        this.ctx.lineTo(this.x, this.y);
        this.ctx.strokeStyle = `hsla(${this.hue}, 100%, ${this.brightness}%, ${this.alpha})`;
        this.ctx.lineWidth = 3;
        this.ctx.stroke();

        // 添加发光效果
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
        public ctx: CanvasRenderingContext2D,
        hue: number,
        public shape: number = Math.floor(Math.random() * 3)
    ) {
        this.coordinates = [];
        // 修改爆炸模式，使其更加发散
        this.angle = Math.random() * Math.PI * 2;
        this.speed = Math.random() * 15 + 5; // 增加初始速度
        this.friction = 0.95;
        this.gravity = 0.3; // 减小重力影响
        this.hue = hue + Math.random() * 20 - 10;
        this.brightness = Math.random() * 20 + 80;
        this.alpha = 1;
        this.decay = Math.random() * 0.015 + 0.003; // 减慢衰减速度

        // 增加尾迹长度
        for (let i = 0; i < 5; i++) {
            this.coordinates.push([x, y]);
        }
    }

    update(): boolean {
        this.coordinates.pop();
        this.coordinates.unshift([this.x, this.y]);

        // 减缓速度衰减
        this.speed *= this.friction;
        
        // 更新位置
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed + this.gravity;
        
        // 减缓透明度衰减
        this.alpha -= this.decay;

        return this.alpha >= 0.05; // 延长粒子生命周期
    }

    draw(): void {
        this.ctx.beginPath();
        
        // 根据形状绘制不同的粒子
        switch(this.shape) {
            case 0: // 星形
                this.drawStar();
                break;
            case 1: // 圆形
                this.drawCircle();
                break;
            case 2: // 闪光点
                this.drawSparkle();
                break;
        }

        // 增强发光效果
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = `hsla(${this.hue}, 100%, ${this.brightness}%, ${this.alpha})`;
        this.ctx.fillStyle = `hsla(${this.hue}, 100%, ${this.brightness}%, ${this.alpha})`;
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
    }

    private drawStar(): void {
        const size = 2;
        for (let i = 0; i < 5; i++) {
            const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
            const x = this.x + Math.cos(angle) * size;
            const y = this.y + Math.sin(angle) * size;
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        this.ctx.closePath();
    }

    private drawCircle(): void {
        this.ctx.arc(this.x, this.y, 1.5, 0, Math.PI * 2);
    }

    private drawSparkle(): void {
        const size = 2;
        for (let i = 0; i < 4; i++) {
            const angle = (Math.PI / 2) * i;
            this.ctx.moveTo(this.x, this.y);
            this.ctx.lineTo(
                this.x + Math.cos(angle) * size,
                this.y + Math.sin(angle) * size
            );
        }
    }
}

function createParticles(x: number, y: number, ctx: CanvasRenderingContext2D, particles: Particle[], hue: number) {
    // 增加粒子数量
    const particleCount = Math.floor(Math.random() * 50) + 100;
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle(x, y, ctx, hue));
    }
}

const Fireworks: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fireworks = useRef<Firework[]>([]);
    const particles = useRef<Particle[]>([]);
    const animationFrameId = useRef<number | null>(null);
    const soundPool = useRef<SoundPool | null>(null);
    const musicStarted = useRef<boolean>(false);

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

        const loop = () => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
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

        const handleClick = (e: MouseEvent) => {
            if (!musicStarted.current && soundPool.current) {
                soundPool.current.startBgMusic();
                musicStarted.current = true;
            }

            const startX = canvas.width / 2;
            const startY = canvas.height;
            
            if (soundPool.current) {
                soundPool.current.playLaunch();
                fireworks.current.push(new Firework(
                    startX,
                    startY,
                    e.clientX,
                    e.clientY,
                    ctx,
                    soundPool.current
                ));
            }
        };

        setCanvasSize();
        window.addEventListener('resize', setCanvasSize);
        canvas.addEventListener('click', handleClick);
        loop();

        return () => {
            window.removeEventListener('resize', setCanvasSize);
            canvas.removeEventListener('click', handleClick);
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
            if (soundPool.current) {
                soundPool.current.stopBgMusic();
            }
        };
    }, []);

    return (
        <div className="relative w-screen h-screen bg-black">
            <canvas
                ref={canvasRef}
                className="block"
            />
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-2xl font-sans pointer-events-none animate-pulse text-center">
                点击屏幕任意位置放烟花
            </div>
        </div>
    );
};

export default Fireworks; 