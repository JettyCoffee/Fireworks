'use client';

import React, { useEffect, useRef, useState } from 'react';

// 使用相对路径导入音频文件
const bgMusic = '/sounds/haoyunlai.m4a';
const launchSound = '/sounds/launch.mp3';
const explosionSound = '/sounds/explosion.mp3';

class SoundPool {
    constructor() {
        this._initialized = false;
        this.audioContext = null;
        this.sounds = {
            launch: null,
            explosion: null,
            bgm: null
        };
    }

    get initialized() {
        return this._initialized;
    }

    async initialize() {
        if (this._initialized) return;
        
        try {
            // 创建音频上下文
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            
            // 创建音频元素并设置类型
            this.sounds.launch = new Audio();
            this.sounds.launch.src = launchSound;

            this.sounds.explosion = new Audio();
            this.sounds.explosion.src = explosionSound;

            this.sounds.bgm = new Audio();
            this.sounds.bgm.src = bgMusic;
            
            // 设置音频属性
            this.sounds.launch.volume = 0.3;
            this.sounds.explosion.volume = 0.4;
            this.sounds.bgm.volume = 0.2;
            this.sounds.bgm.loop = true;
            
            // 预加载音频
            const loadAudio = async (audio, name) => {
                try {
                    await new Promise((resolve, reject) => {
                        const handleLoad = () => {
                            audio.removeEventListener('error', handleError);
                            resolve();
                        };
                        
                        const handleError = (e) => {
                            audio.removeEventListener('canplaythrough', handleLoad);
                            console.error(`Error loading ${name}:`, e);
                            reject(new Error(`Failed to load ${name}`));
                        };
                        
                        audio.addEventListener('canplaythrough', handleLoad, { once: true });
                        audio.addEventListener('error', handleError, { once: true });
                        
                        // 设置加载超时
                        setTimeout(() => {
                            audio.removeEventListener('canplaythrough', handleLoad);
                            audio.removeEventListener('error', handleError);
                            reject(new Error(`Timeout loading ${name}`));
                        }, 5000);
                        
                        audio.load();
                    });
                    console.log(`${name} loaded successfully`);
                } catch (error) {
                    console.error(`Error loading ${name}:`, error);
                    throw error;
                }
            };

            // 按顺序加载音频文件
            await loadAudio(this.sounds.launch, 'launch sound');
            await loadAudio(this.sounds.explosion, 'explosion sound');
            await loadAudio(this.sounds.bgm, 'background music');
            
            // 唤醒音频上下文
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            this._initialized = true;
            console.log('Audio initialized successfully');
        } catch (error) {
            console.error('Error initializing audio:', error);
            throw error;
        }
    }

    async playLaunch() {
        if (!this._initialized || !this.sounds.launch) return;
        try {
            const sound = this.sounds.launch.cloneNode();
            sound.volume = 0.3;
            sound.currentTime = 0;
            await sound.play().catch(error => {
                console.error('Launch sound play error:', error);
                throw error;
            });
        } catch (error) {
            console.error('Error playing launch sound:', error);
        }
    }

    async playExplosion() {
        if (!this._initialized || !this.sounds.explosion) return;
        try {
            const sound = this.sounds.explosion.cloneNode();
            sound.volume = 0.4;
            sound.currentTime = 0;
            await sound.play().catch(error => {
                console.error('Explosion sound play error:', error);
                throw error;
            });
        } catch (error) {
            console.error('Error playing explosion sound:', error);
        }
    }

    async startBgMusic() {
        if (!this._initialized || !this.sounds.bgm) return;
        try {
            const bgm = this.sounds.bgm;
            bgm.currentTime = 0;
            
            // 尝试播放背景音乐
            try {
                await bgm.play();
                console.log('Background music started successfully');
            } catch (error) {
                console.error('Initial background music play failed:', error);
                
                // 如果自动播放失败，等待用户交互
                const resumeAudio = async () => {
                    try {
                        await bgm.play();
                        console.log('Background music resumed successfully');
                        ['click', 'touchstart'].forEach(event => {
                            document.removeEventListener(event, resumeAudio);
                        });
                    } catch (error) {
                        console.error('Resume background music failed:', error);
                    }
                };

                ['click', 'touchstart'].forEach(event => {
                    document.addEventListener(event, resumeAudio, { once: true });
                });
            }
        } catch (error) {
            console.error('Error in startBgMusic:', error);
        }
    }

    stopBgMusic() {
        if (!this._initialized || !this.sounds.bgm) return;
        try {
            this.sounds.bgm.pause();
            this.sounds.bgm.currentTime = 0;
        } catch (error) {
            console.error('Error stopping background music:', error);
        }
    }
}

class Firework {
    constructor(x, y, targetX, targetY, ctx, soundPool) {
        this.x = x;
        this.y = y;
        this.ctx = ctx;
        this.soundPool = soundPool;
        this.phase = 'launch';
        this.startX = x;
        this.startY = y;
        this.targetX = targetX;
        this.targetY = targetY;
        this.distanceToTarget = Math.sqrt(Math.pow(this.targetX - x, 2) + Math.pow(this.targetY - y, 2));
        this.distanceTraveled = 0;
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
        this.decay = 0;
        this.minSpeed = 0.3;

        // 减少轨迹点数量以提高性能
        for (let i = 0; i < 4; i++) {
            this.coordinates.push([x, y]);
        }
    }

    update(particles) {
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

    draw() {
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

class Particle {
    constructor(x, y, ctx, hue) {
        this.x = x;
        this.y = y;
        this.ctx = ctx;
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

    update() {
        this.coordinates.pop();
        this.coordinates.unshift([this.x, this.y]);

        this.speed *= this.friction;
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed + this.gravity;
        this.alpha -= this.decay;

        return this.alpha >= 0.1;
    }

    draw() {
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

const Fireworks = () => {
    const canvasRef = useRef(null);
    const fireworks = useRef([]);
    const particles = useRef([]);
    const animationFrameId = useRef(null);
    const soundPool = useRef(null);
    const [showHint, setShowHint] = React.useState(true);
    const [isFirstInteraction, setIsFirstInteraction] = React.useState(true);
    const [score, setScore] = React.useState(0);
    const [canvasSize, setCanvasSize] = useState({
        width: typeof window !== 'undefined' ? window.innerWidth : 0,
        height: typeof window !== 'undefined' ? window.innerHeight : 0,
    });

    useEffect(() => {
        const handleResize = () => {
            setCanvasSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (canvasRef.current) {
            canvasRef.current.width = canvasSize.width;
            canvasRef.current.height = canvasSize.height;
        }
    }, [canvasSize]);

    useEffect(() => {
        try {
            // 初始化音频
            const initAudio = async () => {
                try {
                    soundPool.current = new SoundPool();
                    
                    // 处理用户交互
                    const handleInteraction = async () => {
                        if (!soundPool.current) return;
                        
                        // 初始化音频
                        if (!soundPool.current.initialized) {
                            await soundPool.current.initialize();
                        }
                        
                        // 播放背景音乐
                        if (soundPool.current.initialized) {
                            await soundPool.current.startBgMusic();
                        }
                        
                        // 移除事件监听器
                        ['click', 'touchstart'].forEach(event => {
                            document.removeEventListener(event, handleInteraction);
                        });
                    };
                    
                    // 添加事件监听器
                    ['click', 'touchstart'].forEach(event => {
                        document.addEventListener(event, handleInteraction);
                    });
                } catch (error) {
                    console.error('Error in initAudio:', error);
                }
            };

            initAudio();

            const canvas = canvasRef.current;
            if (!canvas) {
                console.error('Canvas not found');
                return;
            }

            const ctx = canvas.getContext('2d', {
                alpha: false,
                willReadFrequently: false
            });
            if (!ctx) {
                console.error('Could not get canvas context');
                return;
            }

            const setCanvasSize = () => {
                try {
                    const dpr = window.devicePixelRatio || 1;
                    const displayWidth = window.innerWidth;
                    const displayHeight = window.innerHeight;
                    
                    canvas.width = displayWidth * dpr;
                    canvas.height = displayHeight * dpr;
                    
                    canvas.style.width = `${displayWidth}px`;
                    canvas.style.height = `${displayHeight}px`;
                    
                    ctx.scale(dpr, dpr);
                    
                    console.log(`Canvas size set to: ${canvas.width}x${canvas.height}, DPR: ${dpr}`);
                } catch (error) {
                    console.error('Error setting canvas size:', error);
                }
            };

            const handleInteraction = (x, y) => {
                try {
                    if (isFirstInteraction) {
                        setIsFirstInteraction(false);
                        setShowHint(false);
                    }

                    setScore(prev => prev + 1);

                    const startX = window.innerWidth / 2;
                    const startY = window.innerHeight;
                    
                    if (soundPool.current && ctx) {
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
                } catch (error) {
                    console.error('Error in handleInteraction:', error);
                }
            };

            const handleClick = (e) => {
                e.preventDefault();
                handleInteraction(e.clientX, e.clientY);
            };

            const handleTouch = (e) => {
                e.preventDefault();
                const touch = e.touches[0];
                if (touch) {
                    handleInteraction(touch.clientX, touch.clientY);
                }
            };

            setCanvasSize();
            window.addEventListener('resize', setCanvasSize);
            canvas.addEventListener('click', handleClick, { passive: false });
            canvas.addEventListener('touchstart', handleTouch, { passive: false });

            const loop = () => {
                try {
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
                } catch (error) {
                    console.error('Error in animation loop:', error);
                }
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
        } catch (error) {
            console.error('Error in useEffect:', error);
        }
    }, [isFirstInteraction]);

    return (
        <div className="fixed inset-0 w-full h-full bg-black overflow-hidden">
            <div className="fixed top-safe left-1/2 transform -translate-x-1/2 z-10 
                px-4 py-2 mt-2 md:mt-4">
                <div className="bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full 
                    flex items-center gap-2 border border-white/10
                    shadow-lg">
                    <span className="text-white/80 text-sm md:text-base">已放</span>
                    <span className="text-white text-lg md:text-xl font-bold">{score}</span>
                    <span className="text-white/80 text-sm md:text-base">个烟花</span>
                </div>
            </div>

            <canvas
                ref={canvasRef}
                className="touch-none w-full h-full"
                style={{
                    WebkitTapHighlightColor: 'transparent',
                }}
            />

            {showHint && (
                <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                    pointer-events-none z-10 px-4 w-full max-w-sm">
                    <div className="bg-black/40 backdrop-blur-sm px-6 py-3 rounded-lg
                        text-white text-lg md:text-xl text-center
                        shadow-lg">
                        点击屏幕放烟花
                    </div>
                </div>
            )}
        </div>
    );
};

export default Fireworks; 