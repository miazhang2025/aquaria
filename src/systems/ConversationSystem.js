import { idleDialogues, menuDialogues } from '../data/dialogues.js';

export class ConversationSystem {
  constructor(otto, ottoSpeechBubble, mochi, mochiSpeechBubble) {
    this.otto = otto;
    this.mochi = mochi;
    this.ottoBubble = ottoSpeechBubble;
    this.mochiBubble = mochiSpeechBubble;

    this._paused    = false;
    this._idleIndex = 0;
    this._timers    = new Set(); // all pending timer IDs

    this._apiKey = null;
  }

  // Track every timer so pause() can cancel all of them atomically
  _setTimeout(fn, delay) {
    let id;
    id = setTimeout(() => {
      this._timers.delete(id);
      fn();
    }, delay);
    this._timers.add(id);
    return id;
  }

  setApiKey(key) { this._apiKey = key; }

  startIdle() {
    this._paused = false;
    this._scheduleNext();
  }

  pause() {
    this._paused = true;
    this._timers.forEach(id => clearTimeout(id));
    this._timers.clear();
    this.ottoBubble.hide();
    this.mochiBubble.hide();
    this.otto.setTalking(false);
    this.mochi.setTalking(false);
  }

  resume() {
    this._paused = false;
    this._scheduleNext(2000);
  }

  triggerSection(section) {
    this.pause();
    const lines = menuDialogues[section];
    if (!lines) return;
    this._playSequence(lines, () => this.startIdle());
  }

  async sendUserMessage(text, character) {
    // Don't clear pause — the system stays paused the entire interaction
    const bubble = character.name === 'otto' ? this.ottoBubble : this.mochiBubble;
    const persona = character.name === 'otto'
      ? (await import('../data/dialogues.js')).ottoPersoma
      : (await import('../data/dialogues.js')).mochiPersona;

    bubble.show('...', 0);
    character.setTalking(true);

    try {
      const reply = await this._callLLM(persona, text);
      bubble.show(reply, 8000);
    } catch {
      bubble.show('...', 3000);
    } finally {
      character.setTalking(false);
    }
  }

  async _callLLM(persona, userMessage) {
    if (!this._apiKey) return 'My voice is somewhere else right now.';

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this._apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 80,
        system: persona,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    return data.content[0].text;
  }

  _playSequence(lines, onComplete) {
    let i = 0;
    const next = () => {
      if (this._paused) return;
      if (i >= lines.length) { onComplete?.(); return; }

      const line   = lines[i++];
      const isOtto = line.speaker === 'otto';
      const bubble = isOtto ? this.ottoBubble : this.mochiBubble;
      const char   = isOtto ? this.otto : this.mochi;

      char.setTalking(true);
      if (line.link) {
        bubble.showWithLink(line.text, line.link);
      } else {
        bubble.show(line.text, 0);
      }

      const showDur = 2500 + line.text.length * 70;
      this._setTimeout(() => {
        bubble.hide();
        char.setTalking(false);
        this._setTimeout(next, 600);
      }, showDur);
    };
    next();
  }

  _scheduleNext(delay = null) {
    if (this._paused) return;
    const d = delay ?? (3000 + Math.random() * 3000);
    this._setTimeout(() => {
      if (this._paused) return;

      const line   = idleDialogues[this._idleIndex % idleDialogues.length];
      this._idleIndex++;
      const isOtto = line.speaker === 'otto';
      const bubble = isOtto ? this.ottoBubble : this.mochiBubble;
      const char   = isOtto ? this.otto : this.mochi;

      char.setTalking(true);
      bubble.show(line.text, 0);

      const showDur = 2500 + line.text.length * 75;
      this._setTimeout(() => {
        if (this._paused) return;
        bubble.hide();
        char.setTalking(false);
        this._scheduleNext();
      }, showDur);
    }, d);
  }
}
