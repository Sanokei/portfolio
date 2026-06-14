// carousel.js - CRT televisions inside the broken wall openings.

import * as THREE from 'three';

const CYCLE_INTERVAL = 5.2;
const CROSSFADE_DURATION = 0.35;
// Require more than a one-pixel edge hit before waking video playback.
const MIN_VISIBLE_PIXELS = 12;
const textureLoader = new THREE.TextureLoader();

const RETRO_CHANNELS = [
  {
    key: 'cartoons',
    label: 'CARTOONS',
    color: '#f3c950',
    videoId: 'dQw4w9WgXcQ',
  },
  {
    key: 'commercials',
    label: 'COMMERCIALS',
    color: '#ef7c45',
    videoId: 'dQw4w9WgXcQ',
  },
  {
    key: 'sports',
    label: 'SPORTS',
    color: '#70b879',
    videoId: 'dQw4w9WgXcQ',
  },
];

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

// YouTube iframe management
const youtubeLayer = document.getElementById('youtube-layer');
let activeYouTubeCrt = null;
let activeYouTubeIframe = null;

function buildYouTubeUrl(videoId) {
  return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&controls=0&disablekb=1&modestbranding=1&loop=1&playlist=${videoId}&playsinline=1&rel=0`;
}

function showYouTubeForCrt(crt, channel) {
  hideYouTube();
  if (!youtubeLayer || !channel.videoId) return;

  const iframe = document.createElement('iframe');
  iframe.src = buildYouTubeUrl(channel.videoId);
  iframe.allow = 'autoplay';
  iframe.style.position = 'absolute';
  iframe.style.border = 'none';
  iframe.style.pointerEvents = 'none';
  iframe.style.display = 'none';
  youtubeLayer.appendChild(iframe);
  activeYouTubeIframe = iframe;
  activeYouTubeCrt = crt;
}

function hideYouTube() {
  if (activeYouTubeIframe) {
    activeYouTubeIframe.remove();
    activeYouTubeIframe = null;
  }
  activeYouTubeCrt = null;
}

function createTextureForAsset(asset, project) {
  if (!asset) return { texture: createStaticTexture(), video: null, loaded: true };

  if (asset.type === 'youtube') {
    return {
      texture: createStaticTexture(),
      video: null,
      youtubeId: asset.src,
      loaded: true,
    };
  }

  if (asset.type === 'video') {
    const video = document.createElement('video');
    video.src = asset.src;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';
    video.preload = 'auto';

    const fallbackTexture = createStaticTexture();
    const videoTexture = new THREE.VideoTexture(video);
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;
    videoTexture.colorSpace = THREE.SRGBColorSpace;

    const item = {
      texture: fallbackTexture,
      fallbackTexture,
      videoTexture,
      video,
      loaded: false,
      playPending: false,
    };

    const markReady = () => {
      item.texture = videoTexture;
      item.loaded = true;
    };

    video.addEventListener('loadeddata', markReady, { once: true });
    video.addEventListener('canplay', markReady, { once: true });
    video.addEventListener('error', () => { item.loaded = true; }, { once: true });
    video.load();

    if (video.readyState >= 2) markReady();

    return item;
  }

  const texture = createStaticTexture();
  const item = { texture, video: null, loaded: false };
  textureLoader.load(
    asset.src,
    (loaded) => {
      loaded.colorSpace = THREE.SRGBColorSpace;
      texture.image = loaded.image;
      texture.needsUpdate = true;
      item.loaded = true;
    },
    undefined,
    () => { item.loaded = true; /* show static instead of blocking */ },
  );
  return item;
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
  const knobMat = new THREE.MeshStandardMaterial({ color: 0xc7bda8, emissive: 0x000000, roughness: 0.52, metalness: 0.2 });
  const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
  const channelButtons = [];

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
    const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.035, 20), knobMat.clone());
    knob.rotation.x = Math.PI / 2;
    knob.position.set(cd.crtW * 0.5 + 0.17, 0.26 - i * 0.25, 0.24);
    group.add(knob);

    const hit = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.06, 18), hitMat);
    hit.rotation.x = Math.PI / 2;
    hit.position.copy(knob.position);
    hit.userData.visibleKnob = knob;
    group.add(hit);
    channelButtons.push({ hit, knob, channel: RETRO_CHANNELS[i] });
  }

  return { group, screen, channelButtons };
}

function setRetroChannel(crt, channelIndex) {
  const channel = crt.retroChannels[channelIndex];
  if (!channel) return;

  pauseVideos(crt);
  crt.state.retroMode = true;
  crt.state.fadeTimer = CROSSFADE_DURATION;
  crt.state.retroChannel = channel.key;
  showYouTubeForCrt(crt, channel);

  for (const button of crt.buttons) {
    const active = button.channel.key === channel.key;
    button.knob.material.color.set(active ? 0xffd991 : 0xc7bda8);
    button.knob.material.emissive.set(active ? 0x6a3f12 : 0x000000);
  }
}

function findNextIndex(crt, fromIndex) {
  // Walk forward through media, wrapping around, skipping
  // anything that hasn't finished loading.  Falls back to the
  // current index if nothing else is ready.
  for (let i = 1; i <= crt.media.length; i++) {
    const idx = (fromIndex + i) % crt.media.length;
    if (crt.media[idx].loaded) return idx;
  }
  return fromIndex;
}

function countLoaded(media) {
  let n = 0;
  for (const m of media) if (m.loaded) n++;
  return n;
}

function syncActiveTexture(crt) {
  const item = crt.media[crt.state.active];
  if (!item) return;

  const uniforms = crt.material.uniforms;
  if (uniforms.uMap.value !== item.texture) {
    uniforms.uMap.value = item.texture;
  }
}

function ensureDisplayableActive(crt) {
  const activeItem = crt.media[crt.state.active];
  if (!activeItem) return;

  if (activeItem.loaded || activeItem.video) {
    syncActiveTexture(crt);
    return;
  }

  const nextReady = findNextIndex(crt, crt.state.active);
  if (nextReady !== crt.state.active && crt.media[nextReady].loaded) {
    crt.state.active = nextReady;
    crt.state.pending = nextReady;
    crt.state.fading = false;
    crt.state.fadeTimer = 0;
  }

  syncActiveTexture(crt);
}

function createCrt(cd) {
  const assets = cd.project.assets.length ? cd.project.assets : [null];
  const media = assets.map(asset => createTextureForAsset(asset, cd.project));

  // Start on the first actually-loaded asset so the screen isn't
  // blank/static while an image is still fetching.
  let startIdx = 0;
  for (let i = 0; i < media.length; i++) {
    if (media[i].loaded) { startIdx = i; break; }
  }

  const material = makeScreenMaterial(media[startIdx].texture);
  const { group, channelButtons } = makeCrtShell(cd, material);
  group.position.set(cd.worldX, cd.worldY, cd.mediaZ);

  const crt = {
    group,
    material,
    media,
    retroChannels: RETRO_CHANNELS.map(channel => ({ ...channel })),
    buttons: channelButtons,
    state: {
      timer: 0,
      active: startIdx,
      // Crossfade: fadeTimer counts down from CROSSFADE_DURATION.
      // At 50 % we swap the texture; the screen never goes dark.
      fading: false,
      fadeTimer: 0,
      pending: 0,
      retroMode: false,
      retroChannel: null,
      // wasVisible lets us only start videos when the CRT first
      // scrolls onto the screen (not while it sits above/below).
      wasVisible: false,
    },
  };

  channelButtons.forEach((button, index) => {
    button.hit.userData.crtButton = {
      label: `70s ${button.channel.label.toLowerCase()}`,
      onClick: () => setRetroChannel(crt, index),
    };
  });

  return crt;
}

function pauseVideos(crt) {
  for (const item of crt.media) {
    item.playPending = false;
    if (item.video && !item.video.paused) item.video.pause();
  }
}

function syncActiveVideo(crt) {
  for (let i = 0; i < crt.media.length; i++) {
    const item = crt.media[i];
    const video = crt.media[i].video;
    if (!video) continue;

    if (i === crt.state.active) {
      if (video.paused && !item.playPending) {
        item.playPending = true;
        try {
          Promise.resolve(video.play())
            .catch(() => {})
            .finally(() => { item.playPending = false; });
        } catch {
          item.playPending = false;
        }
      }
    } else if (!video.paused) {
      item.playPending = false;
      video.pause();
    }
  }
}

export function buildCarousels(scene, cavityData, camera, renderer) {
  const crts = cavityData.map((cd) => {
    const crt = createCrt(cd);
    crt.cd = cd; // store layout data for projection
    scene.add(crt.group);
    return crt;
  });
  const buttons = crts.flatMap(crt => crt.buttons.map(button => button.hit));

  const canvas = renderer.domElement;

  function projectCrtToScreen(crt) {
    camera.updateMatrixWorld();

    const cd = crt.cd;
    const halfW = cd.crtW / 2;
    const halfH = cd.crtH / 2;

    // World-space corners of the CRT screen plane
    const worldCorners = [
      new THREE.Vector3(cd.worldX - halfW, cd.worldY + halfH, cd.mediaZ + 0.182),
      new THREE.Vector3(cd.worldX + halfW, cd.worldY + halfH, cd.mediaZ + 0.182),
      new THREE.Vector3(cd.worldX + halfW, cd.worldY - halfH, cd.mediaZ + 0.182),
      new THREE.Vector3(cd.worldX - halfW, cd.worldY - halfH, cd.mediaZ + 0.182),
    ];

    const outOfView = worldCorners.map((wc) => {
      const projected = wc.clone().project(camera);
      return {
        x: (projected.x * 0.5 + 0.5) * canvas.clientWidth,
        y: (-projected.y * 0.5 + 0.5) * canvas.clientHeight,
        behind: projected.z > 1,
      };
    });

    const anyBehind = outOfView.some(c => c.behind);
    if (anyBehind) return null;

    // Compute bounding box in screen space
    const xs = outOfView.map(c => c.x);
    const ys = outOfView.map(c => c.y);
    return {
      left: Math.min(...xs),
      top: Math.min(...ys),
      width: Math.max(...xs) - Math.min(...xs),
      height: Math.max(...ys) - Math.min(...ys),
    };
  }

  function isScreenActuallyVisible(rect) {
    if (!rect || rect.width <= 0 || rect.height <= 0) return false;

    const width = canvas.clientWidth || canvas.width || window.innerWidth;
    const height = canvas.clientHeight || canvas.height || window.innerHeight;
    const visibleWidth = Math.min(width, rect.left + rect.width) - Math.max(0, rect.left);
    const visibleHeight = Math.min(height, rect.top + rect.height) - Math.max(0, rect.top);

    return visibleWidth >= MIN_VISIBLE_PIXELS && visibleHeight >= MIN_VISIBLE_PIXELS;
  }

  function update(dt) {
    for (const crt of crts) {
      const screenRect = projectCrtToScreen(crt);
      const screenVisible = isScreenActuallyVisible(screenRect);
      crt.group.visible = screenVisible;

      if (!screenVisible) {
        // Scrolled away or fully outside the camera view: park playback.
        pauseVideos(crt);
        crt.state.wasVisible = false;
        if (crt === activeYouTubeCrt) {
          crt.state.retroMode = false;
          hideYouTube();
          crt.material.uniforms.uOpacity.value = 1;
        }
        continue;
      }

      const uniforms = crt.material.uniforms;
      uniforms.uTime.value += dt;

      const activeItem = crt.media[crt.state.active];
      const hasYoutube = activeItem && activeItem.youtubeId;

      if (hasYoutube && activeYouTubeCrt !== crt) {
        pauseVideos(crt);
        crt.state.wasVisible = false;
        crt.state.retroMode = false;
        showYouTubeForCrt(crt, { videoId: activeItem.youtubeId });
      }

      // ── Retro / YouTube mode ──────────────────────────────────
      if (crt.state.retroMode || hasYoutube) {
        pauseVideos(crt);
        crt.state.wasVisible = false;

        if (crt.state.fadeTimer > 0) {
          crt.state.fadeTimer = Math.max(0, crt.state.fadeTimer - dt);
          const t = 1 - crt.state.fadeTimer / CROSSFADE_DURATION;
          uniforms.uOpacity.value = 1.0 - t * 0.85;
        } else {
          uniforms.uOpacity.value = 0.15;
        }

        if (crt === activeYouTubeCrt && activeYouTubeIframe) {
          const rect = screenRect;
          if (rect) {
            activeYouTubeIframe.style.display = 'block';
            activeYouTubeIframe.style.left = rect.left + 'px';
            activeYouTubeIframe.style.top = rect.top + 'px';
            activeYouTubeIframe.style.width = rect.width + 'px';
            activeYouTubeIframe.style.height = rect.height + 'px';
            activeYouTubeIframe.style.borderRadius = '6% / 8%';
          }
        }
        continue;
      }

      // Wake on first real camera visibility.
      ensureDisplayableActive(crt);

      if (!crt.state.wasVisible) {
        crt.state.wasVisible = true;
        crt.state.timer = 0;
      }
      syncActiveVideo(crt);

      // Restore full opacity when returning from retro mode.
      if (uniforms.uOpacity.value < 1 && !crt.state.fading) {
        uniforms.uOpacity.value = Math.min(1, uniforms.uOpacity.value + dt * 3);
      }

      const state = crt.state;
      const loadedCount = countLoaded(crt.media);

      if (state.fading) {
        // Smooth crossfade via opacity dip — the screen never goes
        // dark or shows static.  Dip to ~0.45 at midpoint, swap the
        // texture, then rise back to 1.0.
        state.fadeTimer -= dt;
        const t = 1 - state.fadeTimer / CROSSFADE_DURATION;
        uniforms.uOpacity.value = 1.0 - Math.sin(t * Math.PI) * 0.55;

        if (t >= 0.5 && state.active !== state.pending) {
          state.active = state.pending;
          uniforms.uMap.value = crt.media[state.active].texture;
          syncActiveVideo(crt);
        }

        if (state.fadeTimer <= 0) {
          state.fading = false;
          state.timer = 0;
          uniforms.uOpacity.value = 1;
        }
      } else if (loadedCount >= 2) {
        // Only auto-cycle when at least two assets are ready —
        // otherwise stay on the current one; no needless blink.
        state.timer += dt;
        uniforms.uStatic.value = 0.03;
        if (state.timer >= CYCLE_INTERVAL) {
          state.pending = findNextIndex(crt, state.active);
          if (state.pending !== state.active) {
            state.fading = true;
            state.fadeTimer = CROSSFADE_DURATION;
          } else {
            state.timer = 0;
          }
        }
      } else {
        // Single (or zero) loaded assets — don't cycle, don't fade.
        uniforms.uStatic.value = 0.03;
      }
    }
  }

  function dispose() {
    hideYouTube();
    for (const crt of crts) {
      pauseVideos(crt);
      for (const item of crt.media) {
        if (item.video) {
          item.video.pause();
          item.video.removeAttribute('src');
          item.video.load();
        }
        const textures = new Set([item.texture, item.fallbackTexture, item.videoTexture].filter(Boolean));
        for (const texture of textures) texture.dispose();
      }
      crt.material.dispose();
    }
  }

  return {
    carousels: crts,
    buttons,
    update,
    dispose,
  };
}
