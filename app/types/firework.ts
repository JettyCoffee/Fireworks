export interface FireworkType {
    x: number;
    y: number;
    startX: number;
    startY: number;
    targetX: number;
    targetY: number;
    distanceToTarget: number;
    distanceTraveled: number;
    coordinates: number[][];
    angle: number;
    speed: number;
    friction: number;
    hue: number;
    brightness: number;
    alpha: number;
    decay: number;
}

export interface ParticleType {
    x: number;
    y: number;
    coordinates: number[][];
    angle: number;
    speed: number;
    friction: number;
    gravity: number;
    hue: number;
    brightness: number;
    alpha: number;
    decay: number;
} 