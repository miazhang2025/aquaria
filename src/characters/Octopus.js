import * as THREE from 'three';
import { gsap } from 'gsap';
import { Character } from './Character.js';

export class Octopus extends Character {
  constructor(scene, options = {}) {
    super(scene, {
      name: 'octopus',
      color: 0xD9503E,
      position: new THREE.Vector3(-1.6, 0, 0),
      ...options,
    });
  }
  _buildMesh(options) {
    const color = options.color || 0xD9503E;
    const mat = new THREE.MeshPhysicalMaterial({
      color,
      roughness: 0.08,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
    });

    // Body — slightly squashed sphere
    const bodyGeo = new THREE.SphereGeometry(0.45, 32, 32);
    this.bodyMesh = new THREE.Mesh(bodyGeo, mat);
    this.bodyMesh.scale.y = 0.85;
    this.group.add(this.bodyMesh);

    // Head dome
    const headGeo = new THREE.SphereGeometry(0.32, 32, 32);
    const head = new THREE.Mesh(headGeo, mat);
    head.position.y = 0.38;
    head.scale.y = 1.2;
    this.group.add(head);

    // Eyes — wide apart, slightly surprised
    const eyeGeo = new THREE.SphereGeometry(0.07, 16, 16);
    const eyeMat = new THREE.MeshPhysicalMaterial({ color: 0x16242B, roughness: 0.2 });
    const eyeWhiteMat = new THREE.MeshPhysicalMaterial({ color: 0xFFF9ED, roughness: 0.3 });

    const eyeWhiteGeo = new THREE.SphereGeometry(0.11, 16, 16);
    [[-0.22, 0], [0.22, 0]].forEach(([x]) => {
      const white = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
      white.position.set(x, 0.44, 0.25);
      this.group.add(white);
      const eye = new THREE.Mesh(eyeGeo, eyeMat);
      eye.position.set(x, 0.44, 0.32);
      this.group.add(eye);
    });

    // 8 tentacles
    this.tentacles = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const tentacleGeo = new THREE.CylinderGeometry(0.04, 0.01, 0.7, 8);
      const tentacle = new THREE.Mesh(tentacleGeo, mat);
      tentacle.position.set(
        Math.cos(angle) * 0.35,
        -0.4,
        Math.sin(angle) * 0.35
      );
      tentacle.rotation.z = Math.cos(angle) * 0.5;
      tentacle.rotation.x = Math.sin(angle) * 0.5;
      this.tentacles.push({ mesh: tentacle, angle, phase: Math.random() * Math.PI * 2 });
      this.group.add(tentacle);
    }
  }

  update(delta) {
    super.update(delta);
    if (!this.isHovered && this.tentacles?.length) {
      this._t = (this._t || 0) + delta;
      this.tentacles.forEach(({ mesh, angle, phase }) => {
        mesh.rotation.z = Math.cos(angle) * 0.5 + Math.sin(this._t * 1.5 + phase) * 0.18;
        mesh.rotation.x = Math.sin(angle) * 0.5 + Math.cos(this._t * 1.2 + phase) * 0.12;
      });
    }
  }

  _onGLTFLoaded() {
    this.tentacles = [];
  }

  // Trigger a hit on target character
  hitCharacter(target) {
    const hitTl = gsap.timeline();
    hitTl
      .to(this.group.position, {
        x: target.position.x - 0.6,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: () => target.receiveHit(this.group.position),
      })
      .to(this.group.position, {
        x: -1.6,
        duration: 0.5,
        ease: 'power2.out',
        delay: 0.1,
      });
  }
}
