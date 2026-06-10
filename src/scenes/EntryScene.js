import * as THREE from 'three';
import { gsap } from 'gsap';

export class EntryScene {
  constructor(renderer) {
    this.renderer = renderer;
    this.scene    = new THREE.Scene();
    this.camera   = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    this.camera.position.set(0, 2, 6);
    this.camera.lookAt(0, 0, 0);

    this.scene.background = new THREE.Color(0xA3D3DF);
    this.scene.fog = new THREE.Fog(0xBEE0E8, 8, 25);

    this._buildWater();
    this._buildLighting();
    this._t = 0;
  }

  _buildLighting() {
    const ambient = new THREE.AmbientLight(0xBEE0E8, 0.8);
    this.scene.add(ambient);
    // Moon light from top-right
    const moonLight = new THREE.DirectionalLight(0xFFF9ED, 1.4);
    moonLight.position.set(4, 8, 3);
    this.scene.add(moonLight);
  }

  _buildWater() {
    // Animated water surface plane
    const geo = new THREE.PlaneGeometry(30, 30, 64, 64);
    const mat = new THREE.MeshPhysicalMaterial({
      color: 0xA3D3DF,
      roughness: 0.1,
      metalness: 0,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide,
      wireframe: false,
    });
    this.waterMesh = new THREE.Mesh(geo, mat);
    this.waterMesh.rotation.x = -Math.PI / 2;
    this.waterMesh.position.y = -0.5;
    this.scene.add(this.waterMesh);

    // Store verts for wave animation
    this._waterPositions = geo.attributes.position;
    this._waterBaseY = Float32Array.from(this._waterPositions.array);
  }

  update(delta) {
    this._t += delta;
    // Animate water verts
    const pos = this._waterPositions;
    for (let i = 0; i < pos.count; i++) {
      const x = this._waterBaseY[i * 3];
      const z = this._waterBaseY[i * 3 + 2];
      pos.setY(i, Math.sin(x * 0.5 + this._t) * 0.12 + Math.cos(z * 0.4 + this._t * 0.8) * 0.08);
    }
    pos.needsUpdate = true;
    this.waterMesh.geometry.computeVertexNormals();
    // Gentle camera sway
    this.camera.position.x = Math.sin(this._t * 0.3) * 0.15;
    this.camera.position.y = 2 + Math.cos(this._t * 0.25) * 0.08;
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  resize(w, h) {
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }
}
