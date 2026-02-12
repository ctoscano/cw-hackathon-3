"use client";

import { Geometry, Mesh, Program, Renderer } from "ogl";
import { useEffect, useRef } from "react";

interface ParticlesProps {
  particleCount?: number;
  particleSpread?: number;
  speed?: number;
  particleColors?: string[];
  moveParticlesOnHover?: boolean;
  particleBaseSize?: number;
  sizeRandomness?: number;
  cameraDistance?: number;
  alphaParticles?: boolean;
}

const VERT = `attribute vec3 position;
attribute vec3 aColor;
attribute float aSize;
attribute float aPhase;

uniform float uTime;
uniform float uSpeed;
uniform float uCameraDistance;
uniform vec2 uMouse;
uniform float uHover;

varying vec3 vColor;
varying float vAlpha;

// Simplex-ish noise
float hash(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.1, 0.1, 0.1));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

void main() {
  vColor = aColor;
  float t = uTime * uSpeed;

  vec3 pos = position;
  pos.x += sin(t * 0.5 + aPhase) * 0.3;
  pos.y += cos(t * 0.3 + aPhase * 1.4) * 0.3;
  pos.z += sin(t * 0.7 + aPhase * 0.8) * 0.2;

  // Mouse repulsion
  if (uHover > 0.5) {
    vec2 mouseWorld = uMouse * 10.0 - 5.0;
    vec2 diff = pos.xy - mouseWorld;
    float dist = length(diff);
    float force = smoothstep(3.0, 0.0, dist) * 2.0;
    pos.xy += normalize(diff + 0.001) * force;
  }

  float d = length(pos - vec3(0.0, 0.0, uCameraDistance));
  vAlpha = smoothstep(uCameraDistance * 2.0, 0.0, d);

  vec4 mvp = vec4(pos, 1.0);
  mvp.z -= uCameraDistance;
  float perspective = uCameraDistance / (uCameraDistance - mvp.z);
  mvp.xy *= perspective;
  mvp.z = mvp.z / (uCameraDistance * 2.0);

  gl_Position = vec4(mvp.xy / (uCameraDistance * 0.5), mvp.z, 1.0);
  gl_PointSize = aSize * perspective * 2.0;
}`;

const FRAG = `precision highp float;

varying vec3 vColor;
varying float vAlpha;
uniform float uAlpha;

void main() {
  vec2 center = gl_PointCoord - 0.5;
  float dist = length(center);
  float circle = smoothstep(0.5, 0.3, dist);
  float glow = exp(-dist * 4.0) * 0.5;
  float alpha = (circle + glow) * vAlpha * uAlpha;
  gl_FragColor = vec4(vColor, alpha);
}`;

function hexToRGB(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    Number.parseInt(h.substring(0, 2), 16) / 255,
    Number.parseInt(h.substring(2, 4), 16) / 255,
    Number.parseInt(h.substring(4, 6), 16) / 255,
  ];
}

export default function Particles({
  particleCount = 200,
  particleSpread = 10,
  speed = 0.1,
  particleColors = ["#ffffff", "#ff6b6b", "#4ecdc4"],
  moveParticlesOnHover = true,
  particleBaseSize = 100,
  sizeRandomness = 1,
  cameraDistance = 20,
  alphaParticles = true,
}: ParticlesProps) {
  const ctnRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef([0, 0]);
  const hoverRef = useRef(false);

  useEffect(() => {
    const ctn = ctnRef.current;
    if (!ctn) return;

    const renderer = new Renderer({ alpha: true, premultipliedAlpha: true, antialias: true });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const phases = new Float32Array(particleCount);

    const rgbColors = particleColors.map(hexToRGB);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * particleSpread;
      positions[i * 3 + 1] = (Math.random() - 0.5) * particleSpread;
      positions[i * 3 + 2] = (Math.random() - 0.5) * particleSpread;

      const col = rgbColors[i % rgbColors.length];
      colors[i * 3] = col[0];
      colors[i * 3 + 1] = col[1];
      colors[i * 3 + 2] = col[2];

      sizes[i] = particleBaseSize * (0.5 + Math.random() * sizeRandomness);
      phases[i] = Math.random() * Math.PI * 2;
    }

    const geometry = new Geometry(gl, {
      position: { size: 3, data: positions },
      aColor: { size: 3, data: colors },
      aSize: { size: 1, data: sizes },
      aPhase: { size: 1, data: phases },
    });

    const program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        uTime: { value: 0 },
        uSpeed: { value: speed },
        uCameraDistance: { value: cameraDistance },
        uMouse: { value: [0, 0] },
        uHover: { value: 0 },
        uAlpha: { value: alphaParticles ? 0.8 : 1.0 },
      },
      transparent: true,
      depthTest: false,
    });

    const mesh = new Mesh(gl, { mode: gl.POINTS, geometry, program });

    ctn.appendChild(gl.canvas as HTMLCanvasElement);
    (gl.canvas as HTMLCanvasElement).style.width = "100%";
    (gl.canvas as HTMLCanvasElement).style.height = "100%";

    function resize() {
      if (!ctn) return;
      renderer.setSize(ctn.offsetWidth, ctn.offsetHeight);
    }

    const handleMouse = (e: MouseEvent) => {
      const rect = (gl.canvas as HTMLCanvasElement).getBoundingClientRect();
      mouseRef.current = [
        (e.clientX - rect.left) / rect.width,
        1.0 - (e.clientY - rect.top) / rect.height,
      ];
    };

    const handleEnter = () => {
      hoverRef.current = true;
    };
    const handleLeave = () => {
      hoverRef.current = false;
    };

    window.addEventListener("resize", resize);
    if (moveParticlesOnHover) {
      ctn.addEventListener("mousemove", handleMouse);
      ctn.addEventListener("mouseenter", handleEnter);
      ctn.addEventListener("mouseleave", handleLeave);
    }
    resize();

    let animId = 0;
    const update = (t: number) => {
      animId = requestAnimationFrame(update);
      program.uniforms.uTime.value = t * 0.001;
      program.uniforms.uMouse.value = mouseRef.current;
      program.uniforms.uHover.value = hoverRef.current ? 1.0 : 0.0;
      renderer.render({ scene: mesh });
    };
    animId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      ctn.removeEventListener("mousemove", handleMouse);
      ctn.removeEventListener("mouseenter", handleEnter);
      ctn.removeEventListener("mouseleave", handleLeave);
      if (ctn.contains(gl.canvas as HTMLCanvasElement)) {
        ctn.removeChild(gl.canvas as HTMLCanvasElement);
      }
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [
    particleCount,
    particleSpread,
    speed,
    particleColors,
    moveParticlesOnHover,
    particleBaseSize,
    sizeRandomness,
    cameraDistance,
    alphaParticles,
  ]);

  return <div ref={ctnRef} style={{ width: "100%", height: "100%" }} />;
}
