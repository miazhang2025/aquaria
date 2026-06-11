import * as THREE from 'three';
import { Character } from './Character.js';

export class Axolotl extends Character {
  constructor(scene, options = {}) {
    super(scene, {
      name: 'axolotl',
      color: 0xECB4CD,
      position: new THREE.Vector3(1.6, 0, 0),
      ...options,
    });
  }

  _buildMesh(options) {
    const color = options.color || 0xECB4CD;
    const mat = new THREE.MeshPhysicalMaterial({
      color,
      roughness: 0.1,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
    });
    const darkMat = new THREE.MeshPhysicalMaterial({ color: 0xd4889a, roughness: 0.1, clearcoat: 1 });
    const eyeMat  = new THREE.MeshPhysicalMaterial({ color: 0x16242B, roughness: 0.2 });
    const eyeWhiteMat = new THREE.MeshPhysicalMaterial({ color: 0xFFF9ED, roughness: 0.3 });

    // Body — elongated box-ish
    const bodyGeo = new THREE.CapsuleGeometry(0.28, 0.55, 8, 16);
    this.bodyMesh = new THREE.Mesh(bodyGeo, mat);
    this.bodyMesh.rotation.z = Math.PI / 2;
    this.group.add(this.bodyMesh);

    // Head
    const headGeo = new THREE.SphereGeometry(0.3, 32, 32);
    const head = new THREE.Mesh(headGeo, mat);
    head.position.set(0.55, 0.05, 0);
    head.scale.set(1, 0.88, 0.9);
    this.group.add(head);

    // Eyes — wide apart, surprised
    const eyeWhiteGeo = new THREE.SphereGeometry(0.1, 16, 16);
    const eyeGeo = new THREE.SphereGeometry(0.065, 16, 16);
    [[-0.18, 0], [0.18, 0]].forEach(([yOff]) => {
      const white = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
      white.position.set(0.76, 0.1 + yOff, 0.2);
      this.group.add(white);
      const eye = new THREE.Mesh(eyeGeo, eyeMat);
      eye.position.set(0.8, 0.1 + yOff, 0.26);
      this.group.add(eye);
    });

    // External gills (feathery stubs on head)
    for (let i = 0; i < 3; i++) {
      const gillGeo = new THREE.CylinderGeometry(0.025, 0.008, 0.22 - i * 0.04, 6);
      const gill = new THREE.Mesh(gillGeo, darkMat);
      gill.position.set(0.42 + i * 0.06, 0.38, 0);
      gill.rotation.z = -0.3 + i * 0.15;
      this.gills = this.gills || [];
      this.gills.push({ mesh: gill, phase: i * 1.2 });
      this.group.add(gill);
    }

    // 4 stubby legs
    [[-0.3, -0.32, 0.2], [-0.3, -0.32, -0.2], [0.2, -0.32, 0.2], [0.2, -0.32, -0.2]].forEach(([x, y, z]) => {
      const legGeo = new THREE.CapsuleGeometry(0.055, 0.14, 4, 8);
      const leg = new THREE.Mesh(legGeo, mat);
      leg.position.set(x, y, z);
      leg.rotation.z = z > 0 ? 0.3 : -0.3;
      this.group.add(leg);
    });

    // Dorsal fin
    const finGeo = new THREE.PlaneGeometry(0.5, 0.18);
    const finMat = new THREE.MeshPhysicalMaterial({
      color: 0xf5c8d8,
      roughness: 0.2,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
    });
    const fin = new THREE.Mesh(finGeo, finMat);
    fin.position.set(0, 0.34, 0);
    this.fin = fin;
    this.group.add(fin);

    // Tail fin
    const tailGeo = new THREE.PlaneGeometry(0.22, 0.28);
    const tail = new THREE.Mesh(tailGeo, finMat);
    tail.position.set(-0.65, 0, 0);
    tail.rotation.y = Math.PI / 2;
    this.tail = tail;
    this.group.add(tail);
  }

  update(delta) {
    super.update(delta);
    if (!this.isHovered) {
      this._t = (this._t || 0) + delta;
      if (this.tail) this.tail.rotation.x = Math.sin(this._t * 1.8) * 0.25;
      if (this.fin)  this.fin.rotation.x  = Math.sin(this._t * 2.2) * 0.08;
      if (this.gills) {
        this.gills.forEach(({ mesh, phase }) => {
          mesh.rotation.z = -0.3 + Math.sin(this._t * 1.4 + phase) * 0.12;
        });
      }
    }
  }

  _onGLTFLoaded() {
    this.tail  = null;
    this.fin   = null;
    this.gills = null;
  }
}
