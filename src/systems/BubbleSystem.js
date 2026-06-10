import * as THREE from 'three';

const vertexShader = /* glsl */`
  uniform float uTime;

  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vWorldPos;

  void main() {
    vec4 worldPos = modelMatrix * instanceMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;

    vec3 worldNormal = normalize(mat3(modelMatrix * instanceMatrix) * normal);
    vNormal = worldNormal;

    vec3 camPos = cameraPosition;
    vViewDir = normalize(camPos - worldPos.xyz);

    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const fragmentShader = /* glsl */`
  uniform float uTime;

  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vWorldPos;

  // Moon direction (matches moonLight in UnderwaterScene)
  const vec3 MOON_DIR = normalize(vec3(5.0, 12.0, 4.0));

  void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(vViewDir);
    float NdotV = max(dot(N, V), 0.0);

    // Sharp Fresnel — glass edge glow
    float fresnel = pow(1.0 - NdotV, 2.2);

    // Tight primary specular (moon) — sharp hot-spot
    vec3 H = normalize(MOON_DIR + V);
    float spec = pow(max(dot(N, H), 0.0), 128.0);

    // Softer secondary fill light
    vec3 backDir = normalize(vec3(-3.0, 2.0, 3.0));
    vec3 H2 = normalize(backDir + V);
    float spec2 = pow(max(dot(N, H2), 0.0), 32.0) * 0.5;

    // Colored reflections — pink primary, purple secondary
    vec3 specPink   = vec3(1.0, 0.38, 0.72);
    vec3 specPurple = vec3(0.72, 0.28, 1.00);

    // Rim pulses between pink and purple over time
    float pulse = 0.5 + 0.5 * sin(uTime * 0.5);
    vec3 rimColor = mix(specPink, specPurple, pulse) * 1.1;

    // White glass body + colorful reflections
    vec3 color = vec3(1.0) * fresnel * 0.85   // white glassy rim
               + specPink  * spec    * 2.0    // pink hot-spot
               + specPurple * spec2  * 1.4;   // purple fill

    // Alpha: rim-heavy, center nearly invisible
    float alpha = fresnel * 0.80 + spec * 1.0 + spec2 * 0.5;
    alpha = clamp(alpha, 0.0, 0.95);

    gl_FragColor = vec4(color, alpha);
  }
`;

export class BubbleSystem {
  constructor(scene) {
    this.scene = scene;
    this.COUNT = 60;
    this._t    = 0;
    this._dummy = new THREE.Object3D();

    // Per-bubble state
    this._px     = new Float32Array(this.COUNT);
    this._py     = new Float32Array(this.COUNT);
    this._pz     = new Float32Array(this.COUNT);
    this._speeds = new Float32Array(this.COUNT);
    this._phases = new Float32Array(this.COUNT);
    this._sizes  = new Float32Array(this.COUNT);

    for (let i = 0; i < this.COUNT; i++) {
      this._px[i]     = (Math.random() - 0.5) * 14;
      this._py[i]     = (Math.random() - 0.5) * 8 - 2;
      this._pz[i]     = (Math.random() - 0.5) * 10 - 2;
      this._speeds[i] = 0.35 + Math.random() * 0.55;
      this._phases[i] = Math.random() * Math.PI * 2;
      this._sizes[i]  = 0.04 + Math.random() * 0.10;
    }

    const geo = new THREE.SphereGeometry(1, 16, 12);
    this._v = new THREE.Vector3(); // reusable vec

    this._uTime = { value: 0 };
    const mat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: { uTime: this._uTime },
      transparent: true,
      depthWrite: false,
      side: THREE.FrontSide,
    });

    this.mesh = new THREE.InstancedMesh(geo, mat, this.COUNT);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this._syncMatrices();
    scene.add(this.mesh);
  }

  _syncMatrices() {
    const d = this._dummy;
    for (let i = 0; i < this.COUNT; i++) {
      d.position.set(this._px[i], this._py[i], this._pz[i]);
      d.scale.setScalar(this._sizes[i]);
      d.updateMatrix();
      this.mesh.setMatrixAt(i, d.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  burst(origin, count = 30) {
    const n = Math.min(count, this.COUNT);
    const d = this._dummy;
    for (let i = 0; i < n; i++) {
      this._px[i] = origin.x + (Math.random() - 0.5) * 2;
      this._py[i] = origin.y;
      this._pz[i] = origin.z + (Math.random() - 0.5) * 2;
      this._speeds[i] = 1.2 + Math.random() * 1.0;
      d.position.set(this._px[i], this._py[i], this._pz[i]);
      d.scale.setScalar(this._sizes[i]);
      d.updateMatrix();
      this.mesh.setMatrixAt(i, d.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  update(delta, camera, mouseNDC) {
    this._t     += delta;
    this._uTime.value = this._t;

    // Unproject mouse NDC to world XY at z = -2 (bubble plane)
    let mwx = 1e9, mwy = 1e9;
    if (camera && mouseNDC) {
      this._v.set(mouseNDC.x, mouseNDC.y, 0.5).unproject(camera);
      const dir = this._v.sub(camera.position).normalize();
      const tVal = (-2 - camera.position.z) / dir.z;
      mwx = camera.position.x + dir.x * tVal;
      mwy = camera.position.y + dir.y * tVal;
    }

    const REPEL_R   = 2.2;
    const REPEL_STR = 3.0;
    const d = this._dummy;

    for (let i = 0; i < this.COUNT; i++) {
      // Float upward
      this._py[i] += this._speeds[i] * delta * 0.5;

      // Multi-frequency lateral sway — more organic
      this._px[i] += Math.sin(this._t * 0.9 + this._phases[i])          * delta * 0.05;
      this._px[i] += Math.sin(this._t * 0.35 + this._phases[i] * 1.7)   * delta * 0.02;

      // Cursor repulsion in world XY
      const cdx = this._px[i] - mwx;
      const cdy = this._py[i] - mwy;
      const cd2 = cdx * cdx + cdy * cdy;
      if (cd2 < REPEL_R * REPEL_R && cd2 > 0.0001) {
        const cd    = Math.sqrt(cd2);
        const force = (1 - cd / REPEL_R) * REPEL_STR * delta;
        this._px[i] += (cdx / cd) * force;
        this._py[i] += (cdy / cd) * force;
      }

      // Wrap at top
      if (this._py[i] > 5.5) {
        this._py[i]     = -6;
        this._px[i]     = (Math.random() - 0.5) * 14;
        this._speeds[i] = 0.35 + Math.random() * 0.55;
      }

      // Pulsing size
      const pulse = 1.0 + 0.22 * Math.sin(this._t * 1.4 + this._phases[i]);
      d.position.set(this._px[i], this._py[i], this._pz[i]);
      d.scale.setScalar(this._sizes[i] * pulse);
      d.updateMatrix();
      this.mesh.setMatrixAt(i, d.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
