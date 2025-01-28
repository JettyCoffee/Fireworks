'use client';

import { useEffect, useRef } from 'react';
import { FireworkType, ParticleType } from '../types/firework';

class Firework implements FireworkType {
    constructor(
        public x: number,
        public y: number,
        public targetX: number,
        public targetY: number,
        public ctx: CanvasRenderingContext2D
    ) {
        this.startX = x;
        this.startY = y;
        this.distanceToTarget = Math.sqrt(Math.pow(targetX - x, 2) + Math.pow(targetY - y, 2));
        this.distanceTraveled = 0;
        this.coordinates = [];
        this.angle = Math.atan2(targetY - y, targetX - x);
        this.speed = 2;
        this.friction = 0.99;
        this.hue = Math.random() * 360;
        this.brightness = Math.random() * 50 + 50;
        this.alpha = 1;
        this.decay = Math.random() * 0.03 + 0.02;

        for (let i = 0; i < 3; i++) {
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
            createParticles(this.targetX, this.targetY, this.ctx, particles);
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
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }
}

class Particle implements ParticleType {
    coordinates: number[][];
    
    constructor(
        public x: number,
        public y: number,
        public ctx: CanvasRenderingContext2D
    ) {
        this.coordinates = [];
        this.angle = Math.random() * Math.PI * 2;
        this.speed = Math.random() * 10 + 2;
        this.friction = 0.95;
        this.gravity = 1;
        this.hue = Math.random() * 360;
        this.brightness = Math.random() * 50 + 50;
        this.alpha = 1;
        this.decay = Math.random() * 0.02 + 0.02;

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
        this.ctx.moveTo(
            this.coordinates[this.coordinates.length - 1][0],
            this.coordinates[this.coordinates.length - 1][1]
        );
        this.ctx.lineTo(this.x, this.y);
        this.ctx.strokeStyle = `hsla(${this.hue}, 100%, ${this.brightness}%, ${this.alpha})`;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }
}

function createParticles(x: number, y: number, ctx: CanvasRenderingContext2D, particles: Particle[]) {
    for (let i = 0; i < 30; i++) {
        particles.push(new Particle(x, y, ctx));
    }
}

export default function Fireworks() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fireworks = useRef<Firework[]>([]);
    const particles = useRef<Particle[]>([]);
    const animationFrameId = useRef<number>();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const setCanvasSize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        const loop = () => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
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
            const startX = canvas.width / 2;
            const startY = canvas.height;
            fireworks.current.push(new Firework(startX, startY, e.clientX, e.clientY, ctx));
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
} 