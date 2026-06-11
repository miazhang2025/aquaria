import * as THREE from 'three';
import { gsap } from 'gsap';

import { EntryScene }     from './scenes/EntryScene.js';
import { UnderwaterScene } from './scenes/UnderwaterScene.js';
import { Menu }           from './ui/Menu.js';

// ── Renderer ──────────────────────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
document.getElementById('app').appendChild(renderer.domElement);

const cssLayer = document.getElementById('css2d-layer');

// ── Scenes ────────────────────────────────────────────────────────────────
const entryScene     = new EntryScene(renderer);
const underwaterScene = new UnderwaterScene(renderer, cssLayer);

// ── State ─────────────────────────────────────────────────────────────────
let activeScene = 'entry'; // 'entry' | 'underwater'
let rafId;

// ── Entry screen animation ────────────────────────────────────────────────
function animateWordmark() {
  const eyebrow = document.getElementById('eyebrow');
  const letters = document.querySelectorAll('#wordmark span');
  const enterBtn = document.getElementById('enter-btn');

  gsap.timeline()
    .to(eyebrow, { opacity: 1, duration: 0.6, ease: 'power2.out', delay: 0.4 })
    .to(letters, {
      y: 0,
      duration: 0.9,
      stagger: 0.07,
      ease: 'power3.out',
    }, '-=0.2')
    .to(enterBtn, { opacity: 1, duration: 0.6, ease: 'power2.out' }, '-=0.2');
}

// ── Dive transition ────────────────────────────────────────────────────────
async function enterWater() {
  const entryScreen = document.getElementById('entry-screen');
  const moon        = document.getElementById('moon');
  const diveLoader  = document.getElementById('dive-loader');

  // Fade out entry screen
  gsap.to(entryScreen, {
    opacity: 0,
    duration: 0.8,
    ease: 'power2.in',
    onComplete: () => { entryScreen.style.display = 'none'; },
  });

  // Dive loader: appear immediately, hold briefly, then dissolve into the descent
  gsap.timeline()
    .set(diveLoader, { pointerEvents: 'auto' })
    .to(diveLoader, { opacity: 1, duration: 0.3, ease: 'power2.out' })
    .to(diveLoader, { opacity: 0, duration: 1.1, ease: 'power2.inOut' }, '+=0.8')
    .set(diveLoader, { pointerEvents: 'none', display: 'none' });

  // Switch renderer to underwater scene
  activeScene = 'underwater';

  // Fade in moon (the AQUARIA wordmark is revealed by the story system after the dive)
  gsap.to(moon, { opacity: 1, duration: 1.5, delay: 0.5 });

  // Trigger bubble burst
  underwaterScene.bubbles.burst(new THREE.Vector3(0, 2, 0), 40);

  // Run dive camera animation
  await underwaterScene.cameraController.diveIn();

  // Start conversations + scroll
  underwaterScene.start();
  // Wire up Claude API key from env
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (apiKey) underwaterScene.conversation.setApiKey(apiKey);

  // Show menu (moon is already faded in above)
  menu.show();
}

// ── Menu ───────────────────────────────────────────────────────────────────
const menu = new Menu(section => {
  underwaterScene.triggerSection(section);
});

// ── Enter button ───────────────────────────────────────────────────────────
document.getElementById('enter-btn').addEventListener('click', enterWater);

// ── Render loop ────────────────────────────────────────────────────────────
function tick() {
  rafId = requestAnimationFrame(tick);

  if (activeScene === 'entry') {
    const delta = 0.016;
    entryScene.update(delta);
    entryScene.render();
  } else {
    underwaterScene.update();
    underwaterScene.render();
  }
}

// ── Resize ─────────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h);
  entryScene.resize(w, h);
  underwaterScene.resize(w, h);
});

// ── Boot ───────────────────────────────────────────────────────────────────
function boot() {
  document.getElementById('loading').style.display = 'none';
  animateWordmark();
  tick();
}

// Wait for fonts + all assets (scene JSON + GLTF models) before showing Enter
Promise.all([
  document.fonts.ready,
  underwaterScene.ready,
]).then(() => setTimeout(boot, 100));
