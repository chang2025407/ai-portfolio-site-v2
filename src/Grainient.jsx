import { useEffect, useRef } from "react";
import { Color, Mesh, Program, Renderer, Triangle } from "ogl";

const vertexShader = `
attribute vec2 position;
attribute vec2 uv;

varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragmentShader = `
precision highp float;

uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform float uColorBalance;
uniform float uWarpStrength;
uniform float uWarpFrequency;
uniform float uWarpSpeed;
uniform float uWarpAmplitude;
uniform float uBlendAngle;
uniform float uBlendSoftness;
uniform float uRotationAmount;
uniform float uNoiseScale;
uniform float uGrainAmount;
uniform float uGrainScale;
uniform float uGrainAnimated;
uniform float uContrast;
uniform float uGamma;
uniform float uSaturation;
uniform float uCenterX;
uniform float uCenterY;
uniform float uZoom;

varying vec2 vUv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);

  return mix(
    mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;

  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p *= 2.02;
    amplitude *= 0.5;
  }

  return value;
}

vec3 adjustSaturation(vec3 color, float saturation) {
  float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
  return mix(vec3(luminance), color, saturation);
}

void main() {
  vec2 uv = vUv;
  vec2 aspect = vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
  vec2 centered = (uv - 0.5) * aspect;
  centered = (centered - vec2(uCenterX, uCenterY)) / max(uZoom, 0.001);

  float angle = radians(uBlendAngle + sin(uTime * 0.24) * uRotationAmount * 0.025);
  mat2 rotation = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
  vec2 p = rotation * centered;

  float warp = fbm(p * uWarpFrequency + vec2(uTime * uWarpSpeed, -uTime * uWarpSpeed * 0.36));
  p += vec2(
    sin((p.y + warp) * uWarpAmplitude * 0.045),
    cos((p.x - warp) * uWarpAmplitude * 0.04)
  ) * uWarpStrength * 0.075;

  vec2 direction = normalize(vec2(cos(angle), sin(angle)));
  float base = dot(p, direction) + 0.5 + uColorBalance * 0.2;
  float cloud = fbm(p * uNoiseScale + warp + uTime * 0.05);
  float blend = smoothstep(0.1, 0.9, base + (cloud - 0.5) * uBlendSoftness * 1.8);

  vec3 color = mix(uColor1, uColor2, blend);
  float warmArea = smoothstep(0.38, 0.88, fbm(p * 1.2 + vec2(-uTime * 0.08, uTime * 0.04)));
  color = mix(color, uColor3, warmArea * 0.32);

  float grainSeed = uTime * 60.0 * uGrainAnimated;
  float grain = hash(gl_FragCoord.xy * uGrainScale + grainSeed);
  color += (grain - 0.5) * uGrainAmount;

  color = (color - 0.5) * uContrast + 0.5;
  color = pow(max(color, 0.0), vec3(1.0 / max(uGamma, 0.001)));
  color = adjustSaturation(color, uSaturation);

  gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

export default function Grainient({
  color1 = "#EAF4FF",
  color2 = "#D8EBFA",
  color3 = "#F4EFE6",
  timeSpeed = 0.12,
  colorBalance = 0.25,
  warpStrength = 0.65,
  warpFrequency = 3,
  warpSpeed = 0.8,
  warpAmplitude = 32,
  blendAngle = 18,
  blendSoftness = 0.18,
  rotationAmount = 120,
  noiseScale = 1.2,
  grainAmount = 0.03,
  grainScale = 1.4,
  grainAnimated = false,
  contrast = 1.08,
  gamma = 1,
  saturation = 0.85,
  centerX = -0.2,
  centerY = 0,
  zoom = 0.92,
  maxDpr = 1,
  maxFps = 24,
  maxRenderHeight = 1600,
  className = "",
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    let renderer;
    let animationFrame = 0;
    let intersectionObserver;
    let resizeObserver;
    let isDocumentVisible = document.visibilityState === "visible";
    let isLooping = false;
    let isVisible = false;
    let lastFrameTime = 0;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const frameDuration = 1000 / maxFps;

    try {
      renderer = new Renderer({
        alpha: true,
        antialias: false,
        dpr: Math.min(window.devicePixelRatio || 1, maxDpr),
      });
    } catch {
      return undefined;
    }

    const gl = renderer.gl;
    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: [1, 1] },
        uColor1: { value: new Color(color1) },
        uColor2: { value: new Color(color2) },
        uColor3: { value: new Color(color3) },
        uColorBalance: { value: colorBalance },
        uWarpStrength: { value: warpStrength },
        uWarpFrequency: { value: warpFrequency },
        uWarpSpeed: { value: warpSpeed },
        uWarpAmplitude: { value: warpAmplitude },
        uBlendAngle: { value: blendAngle },
        uBlendSoftness: { value: blendSoftness },
        uRotationAmount: { value: rotationAmount },
        uNoiseScale: { value: noiseScale },
        uGrainAmount: { value: grainAmount },
        uGrainScale: { value: grainScale },
        uGrainAnimated: { value: grainAnimated ? 1 : 0 },
        uContrast: { value: contrast },
        uGamma: { value: gamma },
        uSaturation: { value: saturation },
        uCenterX: { value: centerX },
        uCenterY: { value: centerY },
        uZoom: { value: zoom },
      },
    });
    const mesh = new Mesh(gl, { geometry, program });

    gl.canvas.className = "grainient-canvas";
    container.appendChild(gl.canvas);

    const resize = () => {
      const width = Math.max(1, container.clientWidth);
      const height = Math.max(
        1,
        Math.min(
          container.clientHeight || window.innerHeight,
          window.innerHeight * 1.45,
          maxRenderHeight
        )
      );

      renderer.setSize(width, height);
      gl.canvas.style.width = "100%";
      gl.canvas.style.height = "100%";
      program.uniforms.uResolution.value = [width, height];
    };

    const renderFrame = (time = 0) => {
      program.uniforms.uTime.value = time * 0.001 * timeSpeed;
      renderer.render({ scene: mesh });
    };

    const render = (time) => {
      if (!isLooping) return;

      if (isVisible && isDocumentVisible && time - lastFrameTime >= frameDuration) {
        renderFrame(time);
        lastFrameTime = time;
      }

      animationFrame = requestAnimationFrame(render);
    };

    const startLoop = () => {
      if (isLooping || reducedMotion.matches) return;
      isLooping = true;
      lastFrameTime = 0;
      animationFrame = requestAnimationFrame(render);
    };

    const stopLoop = () => {
      isLooping = false;
      cancelAnimationFrame(animationFrame);
      animationFrame = 0;
    };

    const updateLoop = () => {
      if (isVisible && isDocumentVisible) {
        startLoop();
      } else {
        stopLoop();
      }
    };

    const handleVisibilityChange = () => {
      isDocumentVisible = document.visibilityState === "visible";
      updateLoop();
    };

    resize();
    renderFrame(0);
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        if (isVisible) {
          renderFrame(performance.now());
        }
        updateLoop();
      },
      { rootMargin: "280px 0px", threshold: 0.01 }
    );
    intersectionObserver.observe(container);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopLoop();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      intersectionObserver?.disconnect();
      resizeObserver?.disconnect();
      if (gl.canvas.parentNode === container) {
        container.removeChild(gl.canvas);
      }
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [
    blendAngle,
    blendSoftness,
    centerX,
    centerY,
    color1,
    color2,
    color3,
    colorBalance,
    contrast,
    gamma,
    grainAmount,
    grainAnimated,
    grainScale,
    maxDpr,
    maxFps,
    maxRenderHeight,
    noiseScale,
    rotationAmount,
    saturation,
    timeSpeed,
    warpAmplitude,
    warpFrequency,
    warpSpeed,
    warpStrength,
    zoom,
  ]);

  return <div aria-hidden="true" className={className} ref={containerRef} />;
}
