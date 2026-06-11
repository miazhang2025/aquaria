import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { gsap } from 'gsap';

const COLORS = {
  coral:   0xD9503E,
  axolotl: 0xECB4CD,
  ink:     0x16242B,
  paper:   0xFFF9ED,
};

export class Character {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.name = options.name || 'character';
    this.isHovered = false;
    this.isTalking = false;

    this.group = new THREE.Group();
    this.group.position.copy(options.position || new THREE.Vector3(0, 0, 0));
    if (options.scale) this.group.scale.setScalar(options.scale);
    scene.add(this.group);

    this._buildMesh(options);
    this._startBob();
  }

  _buildMesh(options) {
    // Subclasses override — base is just a sphere
    const geo = new THREE.SphereGeometry(0.5, 32, 32);
    const mat = new THREE.MeshPhysicalMaterial({
      color: options.color || 0xffffff,
      roughness: 0.1,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
    });
    this.bodyMesh = new THREE.Mesh(geo, mat);
    this.group.add(this.bodyMesh);
  }

  // Swap in a real GLTF when assets arrive
  loadModel(gltf) {
    this.group.remove(this.bodyMesh);
    this.bodyMesh = gltf.scene;
    this.group.add(this.bodyMesh);
    this._mixer = new THREE.AnimationMixer(this.bodyMesh);
    if (gltf.animations?.length) {
      this._mixer.clipAction(gltf.animations[0]).play();
    }
  }

  loadGLTF(url, { rotationY = 0 } = {}) {
    return new Promise((resolve, reject) => {
      new GLTFLoader().load(url, (gltf) => {
        // Clear placeholder meshes, but keep attached CSS2D objects (speech bubbles)
        this.group.children.slice().forEach(child => {
          if (!child.isCSS2DObject) this.group.remove(child);
        });

        const model = gltf.scene;
        model.rotation.y = rotationY;

        // Normalize to ~1 unit and center
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0) model.scale.setScalar(1 / maxDim);
        box.setFromObject(model);
        model.position.sub(box.getCenter(new THREE.Vector3()));

        this.bodyMesh = model;
        this.group.add(model);

        if (gltf.animations?.length) {
          this._mixer = new THREE.AnimationMixer(model);
          this._mixer.clipAction(gltf.animations[0]).play();
        }

        this._onGLTFLoaded?.();
        resolve();
      }, undefined, reject);
    });
  }

  _startBob() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    this._bobTween = gsap.to(this.group.position, {
      y: this.group.position.y + 0.18,
      duration: 2.2 + Math.random() * 0.6,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut',
    });
  }

  pauseMovement() {
    this._bobTween?.pause();
  }

  resumeMovement() {
    this._bobTween?.resume();
  }

  // Called by Octopus when it hits Mochi
  receiveHit(fromPosition) {
    const dir = this.group.position.clone().sub(fromPosition).normalize();
    const origin = this.group.position.clone();
    gsap.timeline()
      .to(this.group.position, {
        x: origin.x + dir.x * 1.4,
        y: origin.y + dir.y * 0.3,
        duration: 0.25,
        ease: 'power2.out',
      })
      .to(this.group.position, {
        x: origin.x,
        y: origin.y,
        duration: 1.2,
        ease: 'elastic.out(1, 0.5)',
        delay: 0.3,
      });
  }

  setTalking(val) {
    this.isTalking = val;
    if (val && !this.isHovered) {
      gsap.to(this.group.scale, { x: 1.06, y: 1.06, z: 1.06, duration: 0.15, yoyo: true, repeat: 1 });
    }
  }

  onHoverEnter() {
    this.isHovered = true;
    this.pauseMovement();
    gsap.to(this.group.scale, { x: 1.08, y: 1.08, z: 1.08, duration: 0.3, ease: 'back.out(2)' });
  }

  onHoverLeave() {
    this.isHovered = false;
    this.resumeMovement();
    gsap.to(this.group.scale, { x: 1, y: 1, z: 1, duration: 0.3 });
  }

  update(delta) {
    if (this._mixer) this._mixer.update(delta);
  }

  get position() { return this.group.position; }
}
