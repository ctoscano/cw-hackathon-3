"use client";

import { useCallback, useEffect, useRef } from "react";

interface WavesProps {
  lineColor?: string;
  backgroundColor?: string;
  waveSpeedX?: number;
  waveSpeedY?: number;
  waveAmpX?: number;
  waveAmpY?: number;
  xGap?: number;
  yGap?: number;
  friction?: number;
  tension?: number;
  maxCursorMove?: number;
  style?: React.CSSProperties;
}

class Grad {
  x: number;
  y: number;
  z: number;
  constructor(x: number, y: number, z: number) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
  dot2(x: number, y: number) {
    return this.x * x + this.y * y;
  }
}

class Noise {
  private grad3: Grad[];
  private p: number[];
  private perm: number[] = [];
  private gradP: Grad[] = [];

  constructor(seed = 0) {
    this.grad3 = [
      new Grad(1, 1, 0),
      new Grad(-1, 1, 0),
      new Grad(1, -1, 0),
      new Grad(-1, -1, 0),
      new Grad(1, 0, 1),
      new Grad(-1, 0, 1),
      new Grad(1, 0, -1),
      new Grad(-1, 0, -1),
      new Grad(0, 1, 1),
      new Grad(0, -1, 1),
      new Grad(0, 1, -1),
      new Grad(0, -1, -1),
    ];
    this.p = [
      151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69,
      142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219,
      203, 117, 35, 11, 32, 57, 177, 33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175,
      74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230,
      220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209,
      76, 132, 187, 208, 89, 18, 169, 200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198,
      173, 186, 3, 64, 52, 217, 226, 250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212,
      207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213, 119, 248, 152, 2, 44,
      154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9, 129, 22, 39, 253, 19, 98, 108, 110, 79,
      113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12,
      191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157,
      184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236, 205, 93, 222, 114, 67, 29,
      24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180,
    ];
    this.seed(seed);
  }

  seed(seedVal: number) {
    let s = seedVal;
    if (s > 0 && s < 1) s *= 65536;
    s = Math.floor(s);
    if (s < 256) s |= s << 8;
    this.perm = new Array(512);
    this.gradP = new Array(512);
    for (let i = 0; i < 256; i++) {
      let v: number;
      if (i & 1) v = this.p[i] ^ (s & 255);
      else v = this.p[i] ^ ((s >> 8) & 255);
      this.perm[i] = this.perm[i + 256] = v;
      this.gradP[i] = this.gradP[i + 256] = this.grad3[v % 12];
    }
  }

  private fade(t: number) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(a: number, b: number, t: number) {
    return (1 - t) * a + t * b;
  }

  perlin2(xIn: number, yIn: number) {
    let X = Math.floor(xIn);
    let Y = Math.floor(yIn);
    const x = xIn - X;
    const y = yIn - Y;
    X &= 255;
    Y &= 255;
    const n00 = this.gradP[X + this.perm[Y]].dot2(x, y);
    const n01 = this.gradP[X + this.perm[Y + 1]].dot2(x, y - 1);
    const n10 = this.gradP[X + 1 + this.perm[Y]].dot2(x - 1, y);
    const n11 = this.gradP[X + 1 + this.perm[Y + 1]].dot2(x - 1, y - 1);
    const u = this.fade(x);
    return this.lerp(this.lerp(n00, n10, u), this.lerp(n01, n11, u), this.fade(y));
  }
}

export default function Waves({
  lineColor = "#ffffff",
  backgroundColor = "transparent",
  waveSpeedX = 0.0125,
  waveSpeedY = 0.005,
  waveAmpX = 32,
  waveAmpY = 16,
  xGap = 10,
  yGap = 32,
  friction = 0.925,
  tension = 0.005,
  maxCursorMove = 100,
  style,
}: WavesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const boundRef = useRef({ width: 0, height: 0 });
  const noiseRef = useRef(new Noise(Math.random()));
  const linesRef = useRef<{ x: number; y: number; wave: { x: number; y: number } }[][]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000, lx: -1000, ly: -1000, sx: 0, sy: 0 });
  const animRef = useRef(0);
  const tickRef = useRef(0);

  const initLines = useCallback(() => {
    const { width, height } = boundRef.current;
    linesRef.current = [];
    const osc = { x: waveAmpX, y: waveAmpY };
    const totalLines = Math.ceil(height / yGap);
    for (let i = 0; i <= totalLines; i++) {
      const pts: { x: number; y: number; wave: { x: number; y: number } }[] = [];
      const totalPts = Math.ceil(width / xGap);
      for (let j = 0; j <= totalPts; j++) {
        pts.push({
          x: xGap * j,
          y: yGap * i + (height - totalLines * yGap) / 2,
          wave: { x: 0, y: 0 },
        });
      }
      linesRef.current.push(pts);
    }
  }, [waveAmpX, waveAmpY, xGap, yGap]);

  const movePoints = useCallback(
    (t: number) => {
      const noise = noiseRef.current;
      const m = mouseRef.current;
      for (const line of linesRef.current) {
        for (const p of line) {
          const move =
            noise.perlin2((p.x + t * waveSpeedX) * 0.002, (p.y + t * waveSpeedY) * 0.002) * 12;
          p.wave.x = Math.cos(move) * waveAmpX;
          p.wave.y = Math.sin(move) * waveAmpY;

          const dx = p.x - m.x;
          const dy = p.y - m.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            const f = (1 - dist / 100) * maxCursorMove;
            p.wave.x += (m.sx * f - p.wave.x * 0.01) * tension * 10;
            p.wave.y += (m.sy * f - p.wave.y * 0.01) * tension * 10;
          }
        }
      }
    },
    [waveSpeedX, waveSpeedY, waveAmpX, waveAmpY, maxCursorMove, tension],
  );

  const drawLines = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const { width, height } = boundRef.current;
    ctx.clearRect(0, 0, width, height);
    ctx.beginPath();
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1;

    for (const line of linesRef.current) {
      for (let j = 0; j < line.length - 1; j++) {
        const p = line[j];
        const next = line[j + 1];
        const px = p.x + p.wave.x;
        const py = p.y + p.wave.y;
        const nx = next.x + next.wave.x;
        const ny = next.y + next.wave.y;
        if (j === 0) ctx.moveTo(px, py);
        ctx.quadraticCurveTo(px, py, (px + nx) / 2, (py + ny) / 2);
      }
    }
    ctx.stroke();
  }, [lineColor]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    ctxRef.current = canvas.getContext("2d");

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const w = parent.offsetWidth;
      const h = parent.offsetHeight;
      canvas.width = w;
      canvas.height = h;
      boundRef.current = { width: w, height: h };
      initLines();
    };

    const handleMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const m = mouseRef.current;
      m.lx = m.x;
      m.ly = m.y;
      m.x = e.clientX - rect.left;
      m.y = e.clientY - rect.top;
      m.sx += (m.x - m.lx) * tension;
      m.sy += (m.y - m.ly) * tension;
    };

    const animate = () => {
      tickRef.current++;
      const m = mouseRef.current;
      m.sx *= friction;
      m.sy *= friction;
      movePoints(tickRef.current);
      drawLines();
      animRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener("resize", resize);
    canvas.addEventListener("mousemove", handleMouse);
    resize();
    animate();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", handleMouse);
    };
  }, [initLines, movePoints, drawLines, friction, tension]);

  return (
    <div style={{ width: "100%", height: "100%", backgroundColor, ...style }}>
      <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} />
    </div>
  );
}
