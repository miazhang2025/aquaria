import * as THREE from 'three';
import { gsap } from 'gsap';

// Each beat is one synced stop: a camera framing + a styled text block.
// Beat 0 is the AQUARIA wordmark; 1–5 are the intro story; then it loops.
// Text alignment and the camera's lateral drift are composed to balance each other
// (left-aligned text → camera pushed right so the characters sit opposite, etc.).
const BEATS = [
  {
    cls: 'hero display',
    size: 'clamp(56px, 10vw, 150px)',
    lines: ['AQUA<span class="accent">R</span>IA'],
    cam: { pos: [0, 0, 5], look: [0, 0, 0] },
  },
  {
    cls: 'left display',
    size: 'clamp(30px, 5vw, 66px)',
    lines: ['Once there was a tank', 'nobody was watching.'],
    cam: { pos: [0.85, 0.55, 5.2], look: [0.45, -0.1, 0] },
  },
  {
    cls: 'left mono',
    size: 'clamp(15px, 1.5vw, 20px)',
    lines: [
      'An octopus and an axolotl climbed in anyway.',
      'The octopus kept asking why the water was there.',
      'The axolotl said nothing, and started building',
      'things that could live in it.',
    ],
    cam: { pos: [1.05, -0.1, 4.7], look: [0.3, -0.4, 0] },
  },
  {
    cls: 'center mono',
    size: 'clamp(16px, 1.5vw, 22px)',
    lines: [
      'They weren’t trying to make anything <span class="accent">popular</span>.',
      'They made worlds that were soft to touch',
      'and a little sad to look at,',
      'and filled them with creatures who don’t say much.',
    ],
    cam: { pos: [0, -0.5, 4.3], look: [0, -0.3, 0] },
  },
  {
    cls: 'right mono',
    size: 'clamp(16px, 1.5vw, 22px)',
    lines: [
      'People walked past the tank.',
      'Some tapped the glass and left.',
      'A few stayed, got their sleeves wet,',
      '<span class="soft">and didn’t want to go home.</span>',
    ],
    cam: { pos: [-1.4, -0.5, 4.7], look: [-0.5, -0.4, 0] },
  },
  {
    cls: 'center display',
    size: 'clamp(34px, 5vw, 64px)',
    lines: ['That’s still going on.', 'The water’s fine.', '<span class="accent">You can come in.</span>'],
    cam: { pos: [0, 0.25, 4.1], look: [0, -0.05, 0] },
  },
];

const WHEEL_THRESHOLD = 42;   // accumulated deltaY before a beat advances
const MOVE_DUR        = 1.2;  // camera + text settle together over this many seconds

export class NarrativeScroll {
  constructor(camera) {
    this.camera = camera;
    this.textEl = document.getElementById('story-text');

    this._look    = new THREE.Vector3(...BEATS[0].cam.look);
    this._index   = 0;
    this._accum   = 0;
    this._animating = false;
    this._enabled = false;
    this._locked  = false;   // suspended while a menu conversation is playing
    this._reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this._onWheel = this._onWheel.bind(this);
  }

  start() {
    if (this._enabled) return;
    this._enabled = true;
    this._index = 0;
    this._look.set(...BEATS[0].cam.look);
    window.addEventListener('wheel', this._onWheel, { passive: true });

    // Settle the camera onto beat 0 (in case the dive ended slightly off) and reveal AQUARIA
    const p = BEATS[0].cam.pos;
    gsap.to(this.camera.position, {
      x: p[0], y: p[1], z: p[2],
      duration: this._reduced ? 0 : 1.2, ease: 'power2.out',
    });
    this._renderBeat(0);
    this._animateLinesIn(1, this._reduced ? 0 : 1.0, 0.2);
  }

  // Suspend / resume scroll-driven beat changes (camera keeps its current framing).
  // Used while a menu-triggered conversation is on screen.
  lockScroll()   { this._locked = true;  this._accum = 0; }
  unlockScroll() { this._locked = false; this._accum = 0; }

  // lookAt is recomputed each frame from the tweened target vector
  update() {
    if (!this._enabled) return;
    this.camera.lookAt(this._look);
  }

  _onWheel(e) {
    if (!this._enabled || this._locked || this._animating) return;
    // Reset accumulation on direction change so a flick can't carry over
    if (Math.sign(e.deltaY) !== Math.sign(this._accum)) this._accum = 0;
    this._accum += e.deltaY;

    if (this._accum >= WHEEL_THRESHOLD) { this._accum = 0; this._step(1); }
    else if (this._accum <= -WHEEL_THRESHOLD) { this._accum = 0; this._step(-1); }
  }

  _step(dir) {
    const n = BEATS.length;
    const target = ((this._index + dir) % n + n) % n;
    this._goTo(target, dir);
  }

  // One synchronized transition: text crossfades out, camera flies to the new
  // framing, and the new text settles in exactly as the camera stops.
  _goTo(index, dir) {
    this._animating = true;
    const D     = this._reduced ? 0 : MOVE_DUR;
    const inDur = this._reduced ? 0 : 0.7;
    const beat  = BEATS[index];

    const tl = gsap.timeline({
      onComplete: () => {
        this._index = index;
        // brief cooldown so a long scroll gesture doesn't skip beats
        gsap.delayedCall(this._reduced ? 0 : 0.15, () => { this._animating = false; });
      },
    });

    // Camera position + lookAt target move together
    tl.to(this.camera.position, {
      x: beat.cam.pos[0], y: beat.cam.pos[1], z: beat.cam.pos[2],
      duration: D, ease: 'power2.inOut',
    }, 0);
    tl.to(this._look, {
      x: beat.cam.look[0], y: beat.cam.look[1], z: beat.cam.look[2],
      duration: D, ease: 'power2.inOut',
    }, 0);

    // Current text fades out up front
    tl.to(this.textEl, { opacity: 0, duration: this._reduced ? 0 : 0.35, ease: 'power2.in' }, 0);

    // New text lands right as the camera finishes
    tl.add(() => {
      this._renderBeat(index);
      this._animateLinesIn(dir, inDur, 0);
    }, Math.max(0, D - inDur));
  }

  _renderBeat(index) {
    const beat = BEATS[index];
    this.textEl.className = beat.cls;
    this.textEl.style.setProperty('--story-size', beat.size);
    this.textEl.innerHTML = beat.lines.map(l => `<span class="line">${l}</span>`).join('');
  }

  _animateLinesIn(dir, duration, delay) {
    const lines = this.textEl.querySelectorAll('.line');
    gsap.set(this.textEl, { opacity: 1 });
    gsap.fromTo(lines,
      { opacity: 0, y: dir >= 0 ? 22 : -22, filter: 'blur(6px)' },
      {
        opacity: 1, y: 0, filter: 'blur(0px)',
        duration, delay,
        stagger: this._reduced ? 0 : 0.08,
        ease: 'power3.out',
      });
  }
}
