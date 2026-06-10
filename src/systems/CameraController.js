import * as THREE from 'three';
import { gsap } from 'gsap';

const SPLINE_POINTS = [
  new THREE.Vector3(0,  3,  6),   // 0% — The Membrane (near surface)
  new THREE.Vector3(0,  1,  5),   // 15%
  new THREE.Vector3(0,  0,  5),   // 25% — Conversation Depth (default)
  new THREE.Vector3(0, -0.5, 5),  // 55%
  new THREE.Vector3(2.5, -1, 4),  // 65% — The Drift (lateral arc)
  new THREE.Vector3(3,  -1.5, 4.5),
  new THREE.Vector3(0,  -0.8, 5), // 80%
  new THREE.Vector3(0,  1.5, 4.5),// 90% — Abyss Glance (tilts up)
  new THREE.Vector3(0,  0,  5),   // 100% → returns to Conversation Depth
];

const LOOKAT_POINTS = [
  new THREE.Vector3(0, -1,  0),
  new THREE.Vector3(0, -0.5, 0),
  new THREE.Vector3(0,  0,  0),
  new THREE.Vector3(0,  0,  0),
  new THREE.Vector3(1.5, 0, 0),
  new THREE.Vector3(1.5, -0.5, 0),
  new THREE.Vector3(0,  0,  0),
  new THREE.Vector3(0,  3,  0),   // look up at surface
  new THREE.Vector3(0,  0,  0),
];

const CONVERSATION_DEPTH_T = 0.22; // default resting scroll position

export class CameraController {
  constructor(camera) {
    this.camera = camera;
    this._spline     = new THREE.CatmullRomCurve3(SPLINE_POINTS, false, 'catmullrom', 0.5);
    this._lookSpline = new THREE.CatmullRomCurve3(LOOKAT_POINTS, false, 'catmullrom', 0.5);
    this._scrollTarget  = CONVERSATION_DEPTH_T;
    this._scrollCurrent = CONVERSATION_DEPTH_T;
    this._active = false;
    this._returnTimer = null;

    // Set initial camera position
    this._applyT(CONVERSATION_DEPTH_T);
  }

  // Called once on Enter click — GSAP tween from surface to underwater
  async diveIn(onComplete) {
    return new Promise(resolve => {
      const proxy = { t: 0 };
      gsap.fromTo(proxy, { t: 0 }, {
        t: CONVERSATION_DEPTH_T,
        duration: 3.2,
        ease: 'power2.inOut',
        onUpdate: () => this._applyT(proxy.t),
        onComplete: () => {
          this._active = true;
          onComplete?.();
          resolve();
        },
      });
    });
  }

  enableScroll() {
    this._active = true;
    window.addEventListener('wheel', this._onWheel.bind(this), { passive: true });
  }

  _onWheel(e) {
    if (!this._active) return;
    this._scrollTarget = Math.max(0, Math.min(1, this._scrollTarget + e.deltaY * 0.0005));
    clearTimeout(this._returnTimer);
    // Auto-return toward conversation depth after 2s of no scrolling
    this._returnTimer = setTimeout(() => {
      if (this._scrollTarget > 0.55) {
        gsap.to(this, { _scrollTarget: CONVERSATION_DEPTH_T, duration: 2.5, ease: 'power2.inOut' });
      }
    }, 2000);
  }

  update(delta) {
    if (!this._active) return;
    // Water-drag lerp
    this._scrollCurrent += (this._scrollTarget - this._scrollCurrent) * Math.min(delta * 2, 1) * 0.06 * 60;
    this._applyT(Math.max(0, Math.min(1, this._scrollCurrent)));
  }

  _applyT(t) {
    const pos    = this._spline.getPoint(t);
    const lookAt = this._lookSpline.getPoint(t);
    this.camera.position.copy(pos);
    this.camera.lookAt(lookAt);
  }
}
