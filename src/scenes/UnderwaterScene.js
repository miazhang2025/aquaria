import * as THREE from 'three';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { EffectComposer }  from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass }      from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass }      from 'three/examples/jsm/postprocessing/ShaderPass.js';

import { Octopus }            from '../characters/Octopus.js';
import { Axolotl }            from '../characters/Axolotl.js';
import { BubbleSystem }       from '../systems/BubbleSystem.js';
import { CameraController }   from '../systems/CameraController.js';
import { ConversationSystem } from '../systems/ConversationSystem.js';
import { NarrativeScroll }    from '../systems/NarrativeScroll.js';
import { SpeechBubble }       from '../ui/SpeechBubble.js';

const WarpShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime:    { value: 0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    varying vec2 vUv;

    // Hash-based white noise
    float hash(vec2 p) {
      p = fract(p * vec2(234.34, 435.345));
      p += dot(p, p + 34.23);
      return fract(p.x * p.y);
    }

    void main() {
      vec2 uv = vUv;

      // Underwater warp
      float wave = sin(uv.y * 18.0 + uTime * 0.9) * sin(uv.x * 14.0 + uTime * 0.7);
      uv.x += wave * 0.0022;
      uv.y += wave * 0.0016;

      vec4 color = texture2D(tDiffuse, uv);

      // Dynamic grain — different seed every frame via uTime
      float grain = hash(uv + fract(uTime * 0.1337));
      grain = (grain - 0.5) * 0.09;   // ±4.5% strength
      color.rgb += grain;

      gl_FragColor = color;
    }
  `,
};

const ChromaticAberrationShader = {
  uniforms: {
    tDiffuse: { value: null },
    amount:   { value: 0.003 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float amount;
    varying vec2 vUv;
    void main() {
      vec2 dir = vUv - 0.5;
      float dist = length(dir);
      vec2 offset = normalize(dir) * amount * dist * dist;
      float r = texture2D(tDiffuse, vUv + offset).r;
      float g = texture2D(tDiffuse, vUv).g;
      float b = texture2D(tDiffuse, vUv - offset).b;
      gl_FragColor = vec4(r, g, b, 1.0);
    }
  `,
};

export class UnderwaterScene {
  constructor(renderer, cssLayer) {
    this.renderer  = renderer;
    this.cssLayer  = cssLayer;
    this.scene     = new THREE.Scene();
    this.camera    = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
    this._clock    = new THREE.Timer();
    this._hoveredChar = null;
    this._raycaster   = new THREE.Raycaster();
    this._mouse       = new THREE.Vector2();

    this._buildScene();
    this._buildPostProcessing();
    this._buildCSS2DRenderer();
    this._buildCharacters();
    this._buildConversation();
    this._buildInteraction();

    this.cameraController = new CameraController(this.camera);
    this.narrative = new NarrativeScroll(this.camera);
  }

  _buildScene() {
    this.scene.background = new THREE.Color(0x6a9aaa);

    // Lights for characters and bubbles
    const ambient = new THREE.AmbientLight(0xBEE0E8, 1.5);
    this.scene.add(ambient);

    const moonLight = new THREE.DirectionalLight(0xFFF9ED, 0.7);
    moonLight.position.set(5, 12, 4);
    this.scene.add(moonLight);

    const fillLight = new THREE.DirectionalLight(0xA3D3DF, 0.7);
    fillLight.position.set(-4, 4, 3);
    this.scene.add(fillLight);

    // Bubble system
    this.bubbles = new BubbleSystem(this.scene);
    this._t = 0;

    // Load underwater environment from Three.js editor export
    this._jsonReady = fetch('/assets/underwater.json')
      .then(r => r.json())
      .then(editorJSON => {
        const loader = new THREE.ObjectLoader();
        const loadedScene = loader.parse(editorJSON.scene);
        const envGroup = new THREE.Group();
        envGroup.position.set(3.5, -4, -10);
        envGroup.scale.set(3, 3, 3);
        loadedScene.children.slice().forEach(child => {
          loadedScene.remove(child);
          envGroup.add(child);
        });
        this.scene.add(envGroup);
      });
  }

  _buildPostProcessing() {
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));

    // Very subtle bloom — just a little glow on glossy characters
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.08, 0.4, 0.7
    );
    this.composer.addPass(bloom);

    // Chromatic aberration barely perceptible — just enough depth
    const chroma = new ShaderPass(ChromaticAberrationShader);
    chroma.uniforms.amount.value = 0.0008;
    this.composer.addPass(chroma);

    // Subtle underwater warp distortion
    this._warpPass = new ShaderPass(WarpShader);
    this.composer.addPass(this._warpPass);
  }

  _buildCSS2DRenderer() {
    this.css2d = new CSS2DRenderer();
    this.css2d.setSize(window.innerWidth, window.innerHeight);
    this.css2d.domElement.style.position = 'absolute';
    this.css2d.domElement.style.top = '0';
    this.css2d.domElement.style.pointerEvents = 'none';
    this.cssLayer.appendChild(this.css2d.domElement);
  }

  _buildCharacters() {
    // Characters sit lower, bigger — bottom-center composition like the reference
    this.octopus  = new Octopus(this.scene, { position: new THREE.Vector3(-1.4, -1.2, 0), scale: 1.5 });
    this.axolotl = new Axolotl(this.scene, { position: new THREE.Vector3( 1.4, -1.4, 0), scale: 1.4 });

    this.octopusBubble  = new SpeechBubble(this.css2d, 'bubble1');
    this.axolotlBubble = new SpeechBubble(this.css2d, 'bubble2');

    // Otto bubble sits just above-left of body; Mochi just above-right
    this.octopusBubble.attachTo(this.octopus.group,   new THREE.Vector3(-1.0, 1.4, 0));
    this.axolotlBubble.attachTo(this.axolotl.group,  new THREE.Vector3( 1.0, 1.2, 0));

    // Initial clickables from placeholders; rebuilt after GLTF loads
    this._rebuildClickables();

    this._modelsReady = Promise.all([
      this.octopus.loadGLTF('/assets/models/Octopus.glb',  { rotationY: -Math.PI / 2 }),
      this.axolotl.loadGLTF('/assets/models/Axolotl.glb', { rotationY: -Math.PI / 2 }),
    ]).then(() => this._rebuildClickables());
  }

  get ready() {
    return Promise.all([this._jsonReady, this._modelsReady]);
  }

  _rebuildClickables() {
    this._clickables = [];
    this.octopus.group.traverse(m  => { if (m.isMesh) { m.userData.character = this.octopus;  this._clickables.push(m); } });
    this.axolotl.group.traverse(m => { if (m.isMesh) { m.userData.character = this.axolotl; this._clickables.push(m); } });
  }

  _buildConversation() {
    this.conversation = new ConversationSystem(
      this.octopus, this.octopusBubble,
      this.axolotl, this.axolotlBubble
    );

    // Schedule random Octopus hits
    this._scheduleHit();
  }

  _scheduleHit() {
    const delay = 12000 + Math.random() * 18000;
    this._hitTimer = setTimeout(() => {
      if (!this._hoveredChar) {
        this.octopus.hitCharacter(this.axolotl);
      }
      this._scheduleHit();
    }, delay);
  }

  _buildInteraction() {
    const chatContainer = document.getElementById('chat-input-container');
    const chatInput     = document.getElementById('chat-input');
    const chatSubmit    = document.getElementById('chat-submit');

    this._hoverLeaveTimer = null;
    this._chatTarget      = null; // persists while input is visible, even after mouse leaves

    const openChat = (char) => {
      clearTimeout(this._hoverLeaveTimer);
      this._chatTarget = char;

      const wp = char.group.position.clone();
      wp.project(this.camera);
      const sx = (wp.x * 0.5 + 0.5) * window.innerWidth;
      const sy = (1 - (wp.y * 0.5 + 0.5)) * window.innerHeight + 90;
      chatContainer.style.left      = `${sx}px`;
      chatContainer.style.top       = `${sy}px`;
      chatContainer.style.bottom    = 'auto';
      chatContainer.style.transform = 'translateX(-50%)';

      chatContainer.classList.add('visible');
      chatInput.dataset.target = char.name;
      chatInput.placeholder    = `talk to ${char.name}...`;
      chatInput.focus();
    };

    const scheduleCloseChat = () => {
      clearTimeout(this._hoverLeaveTimer);
      this._hoverLeaveTimer = setTimeout(() => {
        // Keep open while user has focus inside the chat box
        if (chatContainer.contains(document.activeElement)) {
          scheduleCloseChat();
          return;
        }
        this._chatTarget = null;
        chatContainer.classList.remove('visible');
        chatContainer.style.left = chatContainer.style.top = '';
        chatContainer.style.bottom = chatContainer.style.transform = '';
        chatInput.dataset.target = '';
        this.conversation.resume();
      }, 1500);
    };

    window.addEventListener('mousemove', e => {
      this._mouse.x =  (e.clientX / window.innerWidth)  * 2 - 1;
      this._mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

      this._raycaster.setFromCamera(this._mouse, this.camera);
      const hits    = this._raycaster.intersectObjects(this._clickables);
      const hitChar = hits.length > 0 ? hits[0].object.userData.character : null;

      if (hitChar === this._hoveredChar) return;

      if (this._hoveredChar) {
        this._hoveredChar.onHoverLeave();
        this._hoveredChar = null;
      }

      if (hitChar) {
        this._hoveredChar = hitChar;
        hitChar.onHoverEnter();
        this.conversation.pause();
        openChat(hitChar);
      } else {
        scheduleCloseChat();
      }
    });

    const submit = () => {
      const text = chatInput.value.trim();
      if (!text || !this._chatTarget) return;
      chatInput.value = '';
      this.conversation.sendUserMessage(text, this._chatTarget);
    };

    chatSubmit.addEventListener('click', submit);
    chatInput.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
  }

  start() {
    this.conversation.startIdle();
    // NarrativeScroll owns the camera + story text after the dive (snap-synced),
    // replacing the old free-scroll spline so the two never fight.
    this.narrative.start();
  }

  triggerSection(section) {
    // Freeze the scroll narrative while the menu conversation plays; resume when it ends.
    this.narrative.lockScroll();
    this.conversation.triggerSection(section, () => this.narrative.unlockScroll());
  }

  update() {
    this._clock.update();
    const delta = Math.min(this._clock.getDelta(), 0.05);
    this._t += delta;

    this.octopus.update(delta);
    this.axolotl.update(delta);
    this.bubbles.update(delta, this.camera, this._mouse);
    this.narrative.update();

    if (this._warpPass) this._warpPass.uniforms.uTime.value = this._t;
  }

  render() {
    this.composer.render();
    this.css2d.render(this.scene, this.camera);
  }

  resize(w, h) {
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.composer.setSize(w, h);
    this.css2d.setSize(w, h);
  }
}
