import { gsap } from 'gsap';

export class Menu {
  constructor(onSelect) {
    this.onSelect = onSelect;
    this._open = false;

    this.overlay  = document.getElementById('menu-overlay');
    this.moon     = document.getElementById('moon');
    this.closeBtn = document.getElementById('menu-close');
    this.items    = Array.from(document.querySelectorAll('.menu-item'));

    this.moon.addEventListener('click', () => this.open());
    this.closeBtn.addEventListener('click', () => this.close());

    this.items.forEach(item => {
      item.addEventListener('click', () => {
        const section = item.dataset.section;
        this.close(() => this.onSelect(section));
      });
    });
  }

  // Called after dive — moon is already faded in by main.js, just make it clickable
  show() {}

  open() {
    if (this._open) return;
    this._open = true;
    this.overlay.classList.add('open');
    gsap.fromTo(this.items,
      { opacity: 0, x: 30 },
      { opacity: 0.62, x: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out' }
    );
  }

  close(onComplete) {
    if (!this._open) { onComplete?.(); return; }
    gsap.to(this.items, {
      opacity: 0,
      x: 20,
      duration: 0.3,
      stagger: 0.04,
      ease: 'power2.in',
      onComplete: () => {
        this._open = false;
        this.overlay.classList.remove('open');
        onComplete?.();
      },
    });
  }
}
