"use client";

import { Mesh, Program, Renderer, Triangle } from "ogl";
import { useEffect, useRef } from "react";

interface LiquidChromeProps {
  baseColor?: [number, number, number];
  speed?: number;
  amplitude?: number;
  frequencyX?: number;
  frequencyY?: number;
  interactive?: boolean;
}

const VERT = `attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}`;

const FRAG = `precision highp float;

uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uBaseColor;
uniform float uSpeed;
uniform float uAmplitude;
uniform float uFrequencyX;
uniform float uFrequencyY;
uniform vec2 uMouse;

float sdSphere(vec3 p, float s) {
  return length(p) - s;
}

float map(vec3 p) {
  float d = sdSphere(p, 1.0);
  float freq = uFrequencyX;
  float amp = uAmplitude;
  float t = uTime * uSpeed;

  d += sin(p.x * freq + t) * amp;
  d += sin(p.y * uFrequencyY + t * 1.3) * amp * 0.8;
  d += sin(p.z * freq * 0.7 + t * 0.7) * amp * 0.6;
  d += sin((p.x + p.y) * freq * 1.5 + t * 1.1) * amp * 0.4;

  float mouseInfluence = length(p.xy - (uMouse * 2.0 - 1.0));
  d += exp(-mouseInfluence * 3.0) * 0.15 * sin(t * 3.0);

  return d;
}

vec3 calcNormal(vec3 p) {
  vec2 e = vec2(0.001, 0.0);
  return normalize(vec3(
    map(p + e.xyy) - map(p - e.xyy),
    map(p + e.yxy) - map(p - e.yxy),
    map(p + e.yyx) - map(p - e.yyx)
  ));
}

void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - uResolution.xy) / min(uResolution.x, uResolution.y);

  vec3 ro = vec3(0.0, 0.0, 3.0);
  vec3 rd = normalize(vec3(uv, -1.5));

  float t = 0.0;
  float d;
  vec3 p;

  for (int i = 0; i < 64; i++) {
    p = ro + rd * t;
    d = map(p);
    if (d < 0.001) break;
    t += d * 0.5;
    if (t > 20.0) break;
  }

  vec3 color = uBaseColor * 0.1;

  if (d < 0.01) {
    vec3 normal = calcNormal(p);

    vec3 lightDir1 = normalize(vec3(1.0, 1.0, 1.0));
    vec3 lightDir2 = normalize(vec3(-1.0, 0.5, 0.5));

    float diff1 = max(dot(normal, lightDir1), 0.0);
    float diff2 = max(dot(normal, lightDir2), 0.0);

    vec3 viewDir = normalize(ro - p);
    vec3 halfDir1 = normalize(lightDir1 + viewDir);
    vec3 halfDir2 = normalize(lightDir2 + viewDir);
    float spec1 = pow(max(dot(normal, halfDir1), 0.0), 64.0);
    float spec2 = pow(max(dot(normal, halfDir2), 0.0), 32.0);

    float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 3.0);

    vec3 chromeReflect = mix(uBaseColor, vec3(1.0), fresnel * 0.8);
    vec3 iridescentColor = vec3(
      0.5 + 0.5 * sin(normal.x * 5.0 + uTime * uSpeed),
      0.5 + 0.5 * sin(normal.y * 5.0 + uTime * uSpeed * 1.1 + 2.094),
      0.5 + 0.5 * sin(normal.z * 5.0 + uTime * uSpeed * 0.9 + 4.189)
    );

    color = chromeReflect * (diff1 * 0.7 + diff2 * 0.3);
    color += vec3(1.0) * (spec1 * 0.8 + spec2 * 0.3);
    color += iridescentColor * fresnel * 0.3;
    color += uBaseColor * 0.05;
  }

  color = pow(color, vec3(0.4545));
  gl_FragColor = vec4(color, 1.0);
}`;

export default function LiquidChrome({
  baseColor = [0.1, 0.1, 0.1],
  speed = 0.2,
  amplitude = 0.5,
  frequencyX = 3,
  frequencyY = 2,
  interactive = true,
}: LiquidChromeProps) {
  const ctnRef = useRef<HTMLDivElement>(null);
  const propsRef = useRef({ baseColor, speed, amplitude, frequencyX, frequencyY, interactive });
  propsRef.current = { baseColor, speed, amplitude, frequencyX, frequencyY, interactive };
  const mouseRef = useRef([0.5, 0.5]);

  useEffect(() => {
    const ctn = ctnRef.current;
    if (!ctn) return;

    const renderer = new Renderer({ antialias: true });
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
    if (interactive) {
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
        uBaseColor: { value: baseColor },
        uSpeed: { value: speed },
        uAmplitude: { value: amplitude },
        uFrequencyX: { value: frequencyX },
        uFrequencyY: { value: frequencyY },
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
        programRef.current.uniforms.uTime.value = t * 0.001;
        programRef.current.uniforms.uBaseColor.value = p.baseColor ?? [0.1, 0.1, 0.1];
        programRef.current.uniforms.uSpeed.value = p.speed ?? 0.2;
        programRef.current.uniforms.uAmplitude.value = p.amplitude ?? 0.5;
        programRef.current.uniforms.uFrequencyX.value = p.frequencyX ?? 3;
        programRef.current.uniforms.uFrequencyY.value = p.frequencyY ?? 2;
        if (p.interactive) {
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
  }, [baseColor, speed, amplitude, frequencyX, frequencyY, interactive]);

  return <div ref={ctnRef} style={{ width: "100%", height: "100%" }} />;
}
