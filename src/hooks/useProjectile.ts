import { useRef, useState } from "react";

const GRAVITY = 9.81;
const PIXELS_PER_METER = 20;
const AIR_DENSITY = 1.225;
const Cd = 0.47;
const radius = 0.1;
const area = Math.PI * radius ** 2;

export const useProjectile = (
  canvasRef: React.RefObject<HTMLCanvasElement>,
  settings: { velocity: number; angle: number; mass: number; air: boolean }
) => {
  const [stats, setStats] = useState({
    time: 0,
    height: 0,
    range: 0,
    speed: 0,
  });
  const [isPaused, setPaused] = useState(false);
  const animationRef = useRef<number | null>(null);
  const projectile = useRef<Projectile | null>(null);
  const baseY = 550;

  class Projectile {
    x = 0;
    y = 0;
    vx: number;
    vy: number;
    t = 0;
    mass: number;
    useAir: boolean;
    trail: { x: number; y: number }[] = [];

    constructor(v: number, angle: number, m: number, air: boolean) {
      this.mass = m;
      this.useAir = air;
      this.vx = v * Math.cos(angle);
      this.vy = v * Math.sin(angle);
    }

    step(dt: number) {
      const v = Math.hypot(this.vx, this.vy);
      let ax = 0;
      let ay = -GRAVITY;

      if (this.useAir && v > 0.01) {
        const drag = 0.5 * AIR_DENSITY * Cd * area * v * v;
        ax -= (drag / this.mass) * (this.vx / v);
        ay -= (drag / this.mass) * (this.vy / v);
      }

      this.vx += ax * dt;
      this.vy += ay * dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.t += dt;
      this.trail.push({ x: this.x, y: this.y });
    }
  }

  const drawArrow = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    dx: number,
    dy: number,
    color: string
  ) => {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + dx, y + dy);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    const angle = Math.atan2(dy, dx);
    const head = 6;
    ctx.beginPath();
    ctx.moveTo(x + dx, y + dy);
    ctx.lineTo(
      x + dx - head * Math.cos(angle - 0.4),
      y + dy - head * Math.sin(angle - 0.4)
    );
    ctx.lineTo(
      x + dx - head * Math.cos(angle + 0.4),
      y + dy - head * Math.sin(angle + 0.4)
    );
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  };

  const animate = () => {
    if (isPaused) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx || !projectile.current) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    projectile.current.step(0.02);

    const s = PIXELS_PER_METER;
    const p = projectile.current;

    // Draw trail
    ctx.beginPath();
    for (let i = 0; i < p.trail.length - 1; i++) {
      const p1 = p.trail[i];
      const p2 = p.trail[i + 1];
      ctx.moveTo(p1.x * s + 50, baseY - p1.y * s);
      ctx.lineTo(p2.x * s + 50, baseY - p2.y * s);
    }
    ctx.strokeStyle = "#00ff99";
    ctx.stroke();

    // Projectile
    ctx.beginPath();
    ctx.arc(p.x * s + 50, baseY - p.y * s, 8, 0, 2 * Math.PI);
    ctx.fillStyle = "#ff4444";
    ctx.fill();

    // Vectors
    drawArrow(ctx, p.x * s + 50, baseY - p.y * s, p.vx * s * 0.1, -p.vy * s * 0.1, "#ffcc00");
    drawArrow(ctx, p.x * s + 50, baseY - p.y * s, 0, GRAVITY * s * -0.05, "#00aaff");

    // Ground
    ctx.fillStyle = "#333";
    ctx.fillRect(0, baseY, canvas.width, 5);

    // Update stats
    setStats({
      time: p.t,
      height: Math.max(0, p.y),
      range: p.x,
      speed: Math.hypot(p.vx, p.vy),
    });

    if (p.y >= 0) animationRef.current = requestAnimationFrame(animate);
  };

  const start = () => {
    cancelAnimationFrame(animationRef.current!);
    const { velocity, angle, mass, air } = settings;
    projectile.current = new Projectile(
      velocity,
      (angle * Math.PI) / 180,
      mass,
      air
    );
    setPaused(false);
    animate();
  };

  const pause = () => {
    setPaused((prev) => {
      if (prev) animate();
      return !prev;
    });
  };

  const reset = () => {
    cancelAnimationFrame(animationRef.current!);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    projectile.current = null;
    setStats({ time: 0, height: 0, range: 0, speed: 0 });
  };

  return { start, pause, reset, updateStats: setStats, stats, isPaused };
};
