"use client";

import { useEffect, useRef } from "react";

interface LightningProps {
  hue?: number;
  xOffset?: number;
  speed?: number;
  intensity?: number;
  size?: number;
}

const VERT = `attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}`;

const FRAG = `precision highp float;

uniform float uTime;
uniform vec2 uResolution;
uniform float uHue;
uniform float uXOffset;
uniform float uSpeed;
uniform float uIntensity;
uniform float uSize;

float hash(float n) {
  return fract(sin(n) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float n = i.x + i.y * 57.0;
  return mix(mix(hash(n), hash(n + 1.0), f.x), mix(hash(n + 57.0), hash(n + 58.0), f.x), f.y);
}

float fbm(vec2 p) {
  float f = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 5; i++) {
    f += amp * noise(p);
    p *= 2.02;
    amp *= 0.5;
  }
  return f;
}

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  uv.x += uXOffset * 0.1;

  float t = uTime * uSpeed;
  float x = uv.x * 2.0 * uSize;
  float bolt = fbm(vec2(x, t * 3.0)) * 2.0 - 1.0;
  bolt += fbm(vec2(x * 3.0, t * 5.0)) * 0.5;

  float centerY = 0.5 + bolt * 0.3;
  float dist = abs(uv.y - centerY);

  float core = exp(-dist * 80.0 * uIntensity) * 1.5;
  float glow = exp(-dist * 15.0 * uIntensity) * 0.5;
  float outerGlow = exp(-dist * 5.0 * uIntensity) * 0.15;

  float branches = 0.0;
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float boltB = fbm(vec2(x * (2.0 + fi), t * 4.0 + fi * 10.0)) * 2.0 - 1.0;
    float bCenterY = centerY + boltB * 0.15;
    float bDist = abs(uv.y - bCenterY);
    branches += exp(-bDist * 60.0 * uIntensity) * 0.3;
    branches += exp(-bDist * 20.0 * uIntensity) * 0.1;
  }

  float total = core + glow + outerGlow + branches;

  float hue = uHue / 360.0;
  vec3 coreColor = hsv2rgb(vec3(hue, 0.3, 1.0));
  vec3 glowColor = hsv2rgb(vec3(hue + 0.05, 0.8, 0.8));
  vec3 outerColor = hsv2rgb(vec3(hue + 0.1, 0.6, 0.4));

  vec3 col = coreColor * core + glowColor * (glow + branches) + outerColor * outerGlow;

  float flicker = 0.85 + 0.15 * sin(t * 20.0 + fbm(vec2(t * 10.0, 0.0)) * 10.0);
  col *= flicker;

  gl_FragColor = vec4(col, total);
}`;

export default function Lightning({
  hue = 230,
  xOffset = 0,
  speed = 1,
  intensity = 1,
  size = 1,
}: LightningProps) {
  const ctnRef = useRef<HTMLDivElement>(null);
  const propsRef = useRef({ hue, xOffset, speed, intensity, size });
  propsRef.current = { hue, xOffset, speed, intensity, size };

  useEffect(() => {
    const ctn = ctnRef.current;
    if (!ctn) return;

    const canvas = document.createElement("canvas");
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    ctn.appendChild(canvas);

    const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false });
    if (!gl) return;

    function createShader(gl: WebGLRenderingContext, type: number, src: string) {
      const s = gl.createShader(type);
      if (!s) return null;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    }

    const vs = createShader(gl, gl.VERTEX_SHADER, VERT);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, FRAG);
    const program = gl.createProgram();
    if (!program || !vs || !fs) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const pos = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, "uTime");
    const uRes = gl.getUniformLocation(program, "uResolution");
    const uHue = gl.getUniformLocation(program, "uHue");
    const uXOff = gl.getUniformLocation(program, "uXOffset");
    const uSpd = gl.getUniformLocation(program, "uSpeed");
    const uInt = gl.getUniformLocation(program, "uIntensity");
    const uSz = gl.getUniformLocation(program, "uSize");

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    function resize() {
      if (!ctn || !gl) return;
      canvas.width = ctn.offsetWidth;
      canvas.height = ctn.offsetHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    }

    window.addEventListener("resize", resize);
    resize();

    let animId = 0;
    const start = performance.now();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (!gl) return;
      const t = (performance.now() - start) * 0.001;
      const p = propsRef.current;
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uTime, t);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uHue, p.hue);
      gl.uniform1f(uXOff, p.xOffset);
      gl.uniform1f(uSpd, p.speed);
      gl.uniform1f(uInt, p.intensity);
      gl.uniform1f(uSz, p.size);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      if (ctn.contains(canvas)) ctn.removeChild(canvas);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  return <div ref={ctnRef} style={{ width: "100%", height: "100%" }} />;
}
