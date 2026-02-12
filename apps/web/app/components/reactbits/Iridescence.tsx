"use client";

import { Mesh, Program, Renderer, Triangle } from "ogl";
import { useEffect, useRef } from "react";

interface IridescenceProps {
  color?: [number, number, number];
  speed?: number;
  amplitude?: number;
  mouseReact?: boolean;
}

const VERT = `attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}`;

const FRAG = `precision highp float;

uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uColor;
uniform float uAmplitude;
uniform vec2 uMouse;

vec3 palette(float t) {
  vec3 a = uColor;
  vec3 b = vec3(0.5, 0.5, 0.5);
  vec3 c = vec3(1.0, 1.0, 1.0);
  vec3 d = vec3(0.263, 0.416, 0.557);
  return a + b * cos(6.28318 * (c * t + d));
}

void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - uResolution.xy) / min(uResolution.x, uResolution.y);

  vec2 uv0 = uv;
  vec3 finalColor = vec3(0.0);

  for (float i = 0.0; i < 4.0; i++) {
    uv = fract(uv * 1.5) - 0.5;

    float mouseInfluence = length(uv0 - uMouse * 2.0 + 1.0) * 0.1;
    float d = length(uv) * exp(-length(uv0));
    d += mouseInfluence * 0.05;

    vec3 col = palette(length(uv0) + i * 0.4 + uTime * 0.4);

    d = sin(d * 8.0 + uTime) / 8.0;
    d = abs(d);
    d = pow(0.01 / d, 1.2) * uAmplitude;

    finalColor += col * d;
  }

  gl_FragColor = vec4(finalColor, 1.0);
}`;

export default function Iridescence({
  color = [1, 1, 1],
  speed = 1.0,
  amplitude = 0.1,
  mouseReact = true,
}: IridescenceProps) {
  const ctnRef = useRef<HTMLDivElement>(null);
  const propsRef = useRef({ color, speed, amplitude, mouseReact });
  propsRef.current = { color, speed, amplitude, mouseReact };
  const mouseRef = useRef([0.5, 0.5]);

  useEffect(() => {
    const ctn = ctnRef.current;
    if (!ctn) return;

    const renderer = new Renderer({ alpha: true, antialias: true });
    const gl = renderer.gl;

    const programRef: { current: Program | undefined } = { current: undefined };

    function resize() {
      if (!ctn) return;
      renderer.setSize(ctn.offsetWidth, ctn.offsetHeight);
      if (programRef.current) {
        programRef.current.uniforms.uResolution.value = [ctn.offsetWidth, ctn.offsetHeight];
      }
    }

    const handleMouse = (e: MouseEvent) => {
      const rect = (gl.canvas as HTMLCanvasElement).getBoundingClientRect();
      mouseRef.current = [
        (e.clientX - rect.left) / rect.width,
        1.0 - (e.clientY - rect.top) / rect.height,
      ];
    };

    window.addEventListener("resize", resize);
    if (mouseReact) {
      ctn.addEventListener("mousemove", handleMouse);
    }

    const geometry = new Triangle(gl);
    if (geometry.attributes.uv) (geometry.attributes as Record<string, unknown>).uv = undefined;

    programRef.current = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: [ctn.offsetWidth, ctn.offsetHeight] },
        uColor: { value: color },
        uAmplitude: { value: amplitude },
        uMouse: { value: [0.5, 0.5] },
      },
    });

    const mesh = new Mesh(gl, { geometry, program: programRef.current });
    ctn.appendChild(gl.canvas as HTMLCanvasElement);
    (gl.canvas as HTMLCanvasElement).style.width = "100%";
    (gl.canvas as HTMLCanvasElement).style.height = "100%";

    let animId = 0;
    const update = (t: number) => {
      animId = requestAnimationFrame(update);
      if (programRef.current) {
        const p = propsRef.current;
        programRef.current.uniforms.uTime.value = t * 0.001 * (p.speed ?? 1.0);
        programRef.current.uniforms.uColor.value = p.color ?? [1, 1, 1];
        programRef.current.uniforms.uAmplitude.value = p.amplitude ?? 0.1;
        if (p.mouseReact) {
          programRef.current.uniforms.uMouse.value = mouseRef.current;
        }
        renderer.render({ scene: mesh });
      }
    };

    animId = requestAnimationFrame(update);
    resize();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      ctn.removeEventListener("mousemove", handleMouse);
      if (ctn.contains(gl.canvas as HTMLCanvasElement)) {
        ctn.removeChild(gl.canvas as HTMLCanvasElement);
      }
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [color, amplitude, mouseReact]);

  return <div ref={ctnRef} style={{ width: "100%", height: "100%" }} />;
}
