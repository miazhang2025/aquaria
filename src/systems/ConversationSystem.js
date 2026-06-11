import {
  idleDialogues,
  idleBrief,
  sectionConfig,
  octopusPersona,
  axolotlPersona,
} from '../data/dialogues.js';

const MODEL = 'claude-haiku-4-5-20251001';

export class ConversationSystem {
  constructor(octopus, octopusSpeechBubble, axolotl, axolotlSpeechBubble) {
    this.octopus = octopus;
    this.axolotl = axolotl;
    this.octopusBubble = octopusSpeechBubble;
    this.axolotlBubble = axolotlSpeechBubble;

    this._paused    = false;
    this._timers    = new Set(); // all pending timer IDs

    // Monotonic token: bumped whenever the conversation state changes
    // (pause / new interaction) so stale async LLM results can be dropped.
    this._convToken = 0;

    // Idle banter is consumed from a queue that's topped up with LLM exchanges.
    // Seeded with the hardcoded lines so it always has something, even offline.
    this._idleQueue = [...idleDialogues];
    this._refilling = false;

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
    this._convToken++;             // invalidate any in-flight generation
    this._timers.forEach(id => clearTimeout(id));
    this._timers.clear();
    this.octopusBubble.hide();
    this.axolotlBubble.hide();
    this.octopus.setTalking(false);
    this.axolotl.setTalking(false);
  }

  resume() {
    this._paused = false;
    this._scheduleNext(2000);
  }

  // ── Menu-triggered conversation ─────────────────────────────────────────
  // Generate banter from the section brief, then append the guaranteed
  // functional line(s) (links / contact). Falls back to hardcoded lines.
  async triggerSection(section, onComplete) {
    this.pause();
    const cfg = sectionConfig[section];
    if (!cfg) { onComplete?.(); return; }

    const token = this._convToken;
    const generated = await this._generateExchange(cfg.brief, cfg.count);
    if (token !== this._convToken) { onComplete?.(); return; } // superseded by a newer interaction

    const lines = generated
      ? [...generated, ...(cfg.append || [])]
      : cfg.fallback;

    this._paused = false;
    this._playSequence(lines, () => { this.startIdle(); onComplete?.(); });
  }

  // ── Hover-to-talk: single in-character reply ────────────────────────────
  async sendUserMessage(text, character) {
    // Don't clear pause — the system stays paused the entire interaction
    const bubble  = character.name === 'octopus' ? this.octopusBubble : this.axolotlBubble;
    const persona = character.name === 'octopus' ? octopusPersona : axolotlPersona;

    bubble.show('...', 0);
    character.setTalking(true);

    try {
      const reply = await this._callLLM(persona, text, 80);
      bubble.show(reply, 8000);
    } catch {
      bubble.show('...', 3000);
    } finally {
      character.setTalking(false);
    }
  }

  // ── LLM helpers ─────────────────────────────────────────────────────────

  // Generic single-message call. Returns the assistant text.
  async _callLLM(system, userMessage, maxTokens = 120) {
    if (!this._apiKey) throw new Error('no api key');

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this._apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: maxTokens,
        system,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    return data.content[0].text;
  }

  // Generate a two-character exchange as [{ speaker, text }].
  // Returns null on no-key / error / unparseable output so callers fall back.
  async _generateExchange(brief, count) {
    if (!this._apiKey) return null;

    const system = `You write extremely short, deadpan dialogue between two underwater characters for an interactive studio site.

THE OCTOPUS — red, the realist. ${octopusPersona.trim()}

THE AXOLOTL — pink, the dreamer. ${axolotlPersona.trim()}

Rules:
- Reply with ONLY a JSON array, no markdown fences, no commentary.
- Each item is {"speaker": "octopus" | "axolotl", "text": "..."}.
- Alternate speakers. Keep each line to about one breath (under ~10 words).
- Lowercase feelings, no exclamation marks, no emoji.`;

    try {
      const raw = await this._callLLM(system, `Write exactly ${count} line(s). ${brief}`, 60 + count * 40);
      const lines = this._parseExchange(raw);
      return lines.length ? lines : null;
    } catch {
      return null;
    }
  }

  _parseExchange(raw) {
    // Tolerate stray prose / code fences around the JSON array.
    const start = raw.indexOf('[');
    const end   = raw.lastIndexOf(']');
    if (start === -1 || end === -1) return [];
    try {
      const parsed = JSON.parse(raw.slice(start, end + 1));
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter(l => l && typeof l.text === 'string' && l.text.trim())
        .map(l => ({
          speaker: l.speaker === 'axolotl' ? 'axolotl' : 'octopus',
          text: l.text.trim(),
        }));
    } catch {
      return [];
    }
  }

  // ── Playback ────────────────────────────────────────────────────────────

  _playSequence(lines, onComplete) {
    let i = 0;
    const next = () => {
      if (this._paused) return;
      if (i >= lines.length) { onComplete?.(); return; }

      const line   = lines[i++];
      const isOct  = line.speaker === 'octopus';
      const bubble = isOct ? this.octopusBubble : this.axolotlBubble;
      const char   = isOct ? this.octopus : this.axolotl;

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

  // Pull the next idle line, keeping the queue topped up with LLM exchanges.
  _takeIdleLine() {
    if (this._idleQueue.length === 0) this._idleQueue.push(...idleDialogues);
    if (this._idleQueue.length <= 4) this._refillIdle();
    return this._idleQueue.shift();
  }

  _refillIdle() {
    if (this._refilling || !this._apiKey) return;
    this._refilling = true;
    this._generateExchange(idleBrief, 6)
      .then(lines => { if (lines) this._idleQueue.push(...lines); })
      .finally(() => { this._refilling = false; });
  }

  _scheduleNext(delay = null) {
    if (this._paused) return;
    const d = delay ?? (3000 + Math.random() * 3000);
    this._setTimeout(() => {
      if (this._paused) return;

      const line = this._takeIdleLine();
      if (!line) { this._scheduleNext(); return; }

      const isOct  = line.speaker === 'octopus';
      const bubble = isOct ? this.octopusBubble : this.axolotlBubble;
      const char   = isOct ? this.octopus : this.axolotl;

      char.setTalking(true);
      if (line.link) {
        bubble.showWithLink(line.text, line.link);
      } else {
        bubble.show(line.text, 0);
      }

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
