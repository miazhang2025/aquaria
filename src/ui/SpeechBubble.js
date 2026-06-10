import * as THREE from 'three';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

export class SpeechBubble {
  // bubbleType: 'bubble1' (Otto, wide) | 'bubble2' (Mochi, round)
  constructor(cssRenderer, bubbleType = 'bubble1') {
    this.cssRenderer = cssRenderer;
    this.el = document.createElement('div');
    this.el.className = `speech-bubble ${bubbleType}`;
    this.object = new CSS2DObject(this.el);
    this.object.visible = false;
    this._hideTimeout = null;
  }

  attachTo(parent, offset = new THREE.Vector3(0, 1.2, 0)) {
    this.object.position.copy(offset);
    parent.add(this.object);
  }

  show(text, duration = 4000) {
    clearTimeout(this._hideTimeout);
    this.el.textContent = text;
    this.object.visible = true;
    requestAnimationFrame(() => this.el.classList.add('visible'));

    if (duration > 0) {
      this._hideTimeout = setTimeout(() => this.hide(), duration);
    }
  }

  showWithLink(text, href) {
    clearTimeout(this._hideTimeout);
    this.el.innerHTML = '';
    const textNode = document.createTextNode(text + ' ');
    const link = document.createElement('a');
    link.href = href;
    link.target = '_blank';
    link.textContent = '↗';
    link.style.cssText = 'color: #D9503E; text-decoration: none; font-weight: 600; pointer-events: auto;';
    this.el.appendChild(textNode);
    this.el.appendChild(link);
    this.object.visible = true;
    requestAnimationFrame(() => this.el.classList.add('visible'));
  }

  hide() {
    this.el.classList.remove('visible');
    setTimeout(() => { this.object.visible = false; }, 300);
  }
}
