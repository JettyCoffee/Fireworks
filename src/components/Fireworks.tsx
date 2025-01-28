'use client';

import React, { useEffect, useRef } from 'react';
import { FireworkType, ParticleType } from '../types/firework';

class SoundPool {
    private launchSounds: HTMLAudioElement[];
    private explosionSounds: HTMLAudioElement[];
    private bgMusic: HTMLAudioElement;
    private currentLaunch: number;
    private currentExplosion: number;

    constructor() {
        this.launchSounds = Array(3).fill(null).map(() => new Audio('https://cdn.pixabay.com/download/audio/2022/03/24/audio_d007e49a6e.mp3?filename=swish-6435.mp3'));
        this.explosionSounds = Array(3).fill(null).map(() => new Audio('https://cdn.pixabay.com/download/audio/2022/10/23/audio_946b4c601d.mp3?filename=firework-explosion-6288.mp3'));
        this.bgMusic = new Audio('/sounds/haoyunlai.m4a');
        this.currentLaunch = 0;
        this.currentExplosion = 0;

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
    public targetX: number;
    public targetY: number;
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
        targetX: number,
        targetY: number,
        private ctx: CanvasRenderingContext2D,
        private soundPool: SoundPool
    ) {
        this.startX = x;
        this.startY = y;
        this.targetX = targetX + (Math.random() - 0.5) * 40;
        this.targetY = targetY + (Math.random() - 0.5) * 40;
        this.distanceToTarget = Math.sqrt(Math.pow(this.targetX - x, 2) + Math.pow(this.targetY - y, 2));
        this.distanceTraveled = 0;
        this.coordinates = [];
        this.angle = Math.atan2(this.targetY - y, this.targetX - x);
        this.speed = Math.random() * 2 + 10;
        this.friction = 0.99;
        this.hue = Math.random() * 360;
        this.brightness = Math.random() * 20 + 80;
        this.alpha = 1;
        this.decay = Math.random() * 0.03 + 0.02;

        for (let i = 0; i < 6; i++) {
            this.coordinates.push([x, y]);
        }
    }

    update(particles: Particle[]): boolean {
        this.coordinates.pop();
        this.coordinates.unshift([this.x, this.y]);

        const currentDistance = Math.sqrt(
            Math.pow(this.x - this.startX, 2) + Math.pow(this.y - this.startY, 2)
        );
        const progress = currentDistance / this.distanceToTarget;

        if (progress <= 0.15) {
            this.friction = 0.99;
        } else {
            const slowdownProgress = (progress - 0.15) / 0.85;
            const frictionFactor = Math.pow(slowdownProgress, 2) * 0.2;
            this.friction = 0.99 - frictionFactor;
            
            if (progress > 0.8) {
                const finalSlowdown = (progress - 0.8) / 0.2;
                this.friction *= (1 - finalSlowdown * 0.1);
            }
        }

        this.speed *= this.friction;
        const vx = Math.cos(this.angle) * this.speed;
        const vy = Math.sin(this.angle) * this.speed;

        const distanceToTarget = Math.sqrt(
            Math.pow(this.targetX - this.x, 2) + Math.pow(this.targetY - this.y, 2)
        );

        if (distanceToTarget < 10 || this.speed < 1.5) {
            const particleCount = Math.floor(Math.random() * 50) + 150;
            for (let i = 0; i < particleCount; i++) {
                particles.push(new Particle(this.x, this.y, this.ctx, this.hue));
            }
            this.soundPool.playExplosion();
            return false;
        }

        this.x += vx;
        this.y += vy;
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
        this.speed = Math.random() * 8 + 4;
        this.friction = 0.95;
        this.gravity = 0.8;
        this.hue = hue + Math.random() * 20 - 10;
        this.brightness = Math.random() * 30 + 70;
        this.alpha = 1;
        this.decay = Math.random() * 0.02 + 0.01;

        for (let i = 0; i < 8; i++) {
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

function createParticles(x: number, y: number, ctx: CanvasRenderingContext2D, particles: Particle[], hue: number) {
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