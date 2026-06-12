// carousel.js - CRT televisions inside the broken wall openings.

import * as THREE from 'three';

const CYCLE_INTERVAL = 5.2;
const CHANNEL_FLIP_DURATION = 0.55;
const VIEWPORT_CULL_RANGE = 6.5;
const textureLoader = new THREE.TextureLoader();

const screenVertex = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 p = position;
    vec2 c = uv - 0.5;
    p.z += dot(c, c) * 0.08;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const screenFragment = `
  uniform sampler2D uMap;
  uniform float uTime;
  uniform float uStatic;
  uniform float uOpacity;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    vec2 uv = vUv;
    vec2 c = uv - 0.5;
    uv += c * dot(c, c) * 0.08;

    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) discard;

    vec3 col = texture2D(uMap, uv).rgb;
    float scan = 0.82 + 0.18 * sin((uv.y + uTime * 0.025) * 900.0);
    float grille = 0.92 + 0.08 * sin(uv.x * 1350.0);
    float vignette = smoothstep(0.86, 0.28, length(c));
    float noise = hash(vec2(uv.x * 420.0 + uTime * 31.0, uv.y * 260.0 - uTime * 19.0));
    vec3 staticCol = vec3(noise);

    col = mix(col, staticCol, uStatic);
    col *= scan * grille * vignette;
    col += vec3(0.08, 0.1, 0.07) * (1.0 - vignette);

    gl_FragColor = vec4(col, uOpacity);
  }
`;

function createCanvasTexture(draw) {
  const canvas = document.createElement('canvas');
  canvas.width = 384;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  draw(ctx, canvas.width, canvas.height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createStaticTexture() {
  return createCanvasTexture((ctx, width, height) => {
    ctx.fillStyle = '#101614';
    ctx.fillRect(0, 0, width, height);
    const image = ctx.createImageData(width, height);
    for (let i = 0; i < image.data.length; i += 4) {
      const n = Math.random() * 130 + 40;
      image.data[i] = n * 0.8;
      image.data[i + 1] = n;
      image.data[i + 2] = n * 0.82;
      image.data[i + 3] = 255;
    }
    ctx.putImageData(image, 0, 0);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    for (let y = 0; y < height; y += 5) ctx.fillRect(0, y, width, 2);
  });
}

function createTextureForAsset(asset, project) {
  if (!asset) return { texture: createStaticTexture(), video: null };

  if (asset.type === 'video') {
    const video = document.createElement('video');
    video.src = asset.src;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';
    video.preload = 'metadata';

    const texture = new THREE.VideoTexture(video);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.colorSpace = THREE.SRGBColorSpace;
    return { texture, video };
  }

  const texture = createStaticTexture();
  textureLoader.load(
    asset.src,
    (loaded) => {
      loaded.colorSpace = THREE.SRGBColorSpace;
      texture.image = loaded.image;
      texture.needsUpdate = true;
    },
    undefined,
    () => {},
  );
  return { texture, video: null };
}

function makeScreenMaterial(initialTexture) {
  return new THREE.ShaderMaterial({
    vertexShader: screenVertex,
    fragmentShader: screenFragment,
    transparent: true,
    uniforms: {
      uMap: { value: initialTexture },
      uTime: { value: 0 },
      uStatic: { value: 0 },
      uOpacity: { value: 1 },
    },
  });
}

function makeCrtShell(cd, screenMaterial) {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2a2520, roughness: 0.72, metalness: 0.04 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0x11100e, roughness: 0.68, metalness: 0.05 });
  const knobMat = new THREE.MeshStandardMaterial({ color: 0xc7bda8, roughness: 0.52, metalness: 0.2 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(cd.crtW + 0.34, cd.crtH + 0.28, 0.32), bodyMat);
  body.position.z = -0.035;
  group.add(body);

  const bezel = new THREE.Mesh(new THREE.BoxGeometry(cd.crtW + 0.08, cd.crtH + 0.08, 0.05), trimMat);
  bezel.position.z = 0.15;
  group.add(bezel);

  const screen = new THREE.Mesh(new THREE.PlaneGeometry(cd.crtW, cd.crtH, 12, 8), screenMaterial);
  screen.position.z = 0.182;
  group.add(screen);

  const rightPanel = new THREE.Mesh(new THREE.BoxGeometry(0.22, cd.crtH + 0.08, 0.07), trimMat);
  rightPanel.position.set(cd.crtW * 0.5 + 0.17, 0, 0.19);
  group.add(rightPanel);

  for (let i = 0; i < 3; i++) {
    const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.035, 20), knobMat);
    knob.rotation.x = Math.PI / 2;
    knob.position.set(cd.crtW * 0.5 + 0.17, 0.26 - i * 0.25, 0.24);
    group.add(knob);
  }

  const antennaMat = new THREE.MeshStandardMaterial({ color: 0x161616, roughness: 0.45, metalness: 0.4 });
  const leftAntenna = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.56, 8), antennaMat);
  leftAntenna.position.set(-0.25, cd.crtH * 0.5 + 0.28, -0.02);
  leftAntenna.rotation.z = -0.42;
  const rightAntenna = leftAntenna.clone();
  rightAntenna.position.x = 0.25;
  rightAntenna.rotation.z = 0.42;
  group.add(leftAntenna, rightAntenna);

  return { group, screen };
}

function createCrt(cd) {
  const assets = cd.project.assets.length ? cd.project.assets : [null];
  const media = assets.map(asset => createTextureForAsset(asset, cd.project));
  const material = makeScreenMaterial(media[0].texture);
  const { group } = makeCrtShell(cd, material);
  group.position.set(cd.worldX, cd.worldY, cd.mediaZ);

  return {
    group,
    material,
    media,
    state: {
      timer: Math.random() * CYCLE_INTERVAL,
      active: 0,
      flipping: false,
      flipTimer: 0,
      pending: 0,
    },
  };
}

function pauseVideos(crt) {
  for (const item of crt.media) {
    if (item.video && !item.video.paused) item.video.pause();
  }
}

function syncActiveVideo(crt) {
  for (let i = 0; i < crt.media.length; i++) {
    const video = crt.media[i].video;
    if (!video) continue;

    if (i === crt.state.active) {
      if (video.paused) video.play().catch(() => {});
    } else if (!video.paused) {
      video.pause();
    }
  }
}

export function buildCarousels(scene, cavityData) {
  const crts = cavityData.map((cd) => {
    const crt = createCrt(cd);
    scene.add(crt.group);
    return crt;
  });

  return {
    carousels: crts,
    update(dt, cameraY) {
      for (const crt of crts) {
        const visible = Math.abs(crt.group.position.y - cameraY) <= VIEWPORT_CULL_RANGE;
        crt.group.visible = visible;

        if (!visible) {
          pauseVideos(crt);
          continue;
        }

        const uniforms = crt.material.uniforms;
        uniforms.uTime.value += dt;
        syncActiveVideo(crt);

        if (crt.media.length < 2) {
          uniforms.uStatic.value = 0.04;
          continue;
        }

        const state = crt.state;
        if (state.flipping) {
          state.flipTimer += dt;
          const t = Math.min(state.flipTimer / CHANNEL_FLIP_DURATION, 1);
          uniforms.uStatic.value = Math.sin(t * Math.PI) * 0.95;

          if (state.flipTimer >= CHANNEL_FLIP_DURATION * 0.45 && state.active !== state.pending) {
            state.active = state.pending;
            uniforms.uMap.value = crt.media[state.active].texture;
            syncActiveVideo(crt);
          }

          if (t >= 1) {
            state.flipping = false;
            state.timer = 0;
            uniforms.uStatic.value = 0.04;
          }
        } else {
          state.timer += dt;
          uniforms.uStatic.value = 0.035;
          if (state.timer >= CYCLE_INTERVAL) {
            state.pending = (state.active + 1) % crt.media.length;
            state.flipping = true;
            state.flipTimer = 0;
          }
        }
      }
    },
  };
}
