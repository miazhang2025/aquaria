// Personas are authored in markdown and loaded verbatim as the LLM system prompt
import octopusPersonaMd from './octopus.md?raw';
import axolotlPersonaMd from './axolotl.md?raw';

// Default idle dialogue lines for the octopus and the axolotl
export const idleDialogues = [
  { speaker: 'octopus', text: 'No.' },
  { speaker: 'axolotl', text: 'No what?' },
  { speaker: 'octopus', text: 'Just... no.' },
  { speaker: 'axolotl', text: 'I\'m going to be tired of water one day.' },
  { speaker: 'octopus', text: 'You live in water.' },
  { speaker: 'axolotl', text: 'Exactly.' },
  { speaker: 'octopus', text: 'It\'s fine. It\'s wet, but it\'s fine.' },
  { speaker: 'axolotl', text: 'Something moved. I\'m sure of it.' },
  { speaker: 'octopus', text: 'That was me.' },
  { speaker: 'axolotl', text: 'Oh.' },
  { speaker: 'octopus', text: 'I\'m still moving.' },
  { speaker: 'axolotl', text: 'I know.' },
  { speaker: 'octopus', text: 'Do you ever think about the surface?' },
  { speaker: 'axolotl', text: 'I try not to.' },
  { speaker: 'octopus', text: 'Correct.' },
  { speaker: 'axolotl', text: 'What\'s up there anyway.' },
  { speaker: 'octopus', text: 'Air. Apparently.' },
  { speaker: 'axolotl', text: 'Sounds exhausting.' },
];

// Menu-triggered conversations
export const menuDialogues = {
  about: [
    { speaker: 'axolotl', text: 'Oh. You want to know about us.' },
    { speaker: 'octopus', text: 'AQUARIA. New media studio.' },
    { speaker: 'axolotl', text: 'We make small weird things.' },
    { speaker: 'octopus', text: 'Interactive things. Video things. Story things.' },
    { speaker: 'axolotl', text: 'Glossy on the outside.' },
    { speaker: 'octopus', text: 'Tired on the inside.' },
    { speaker: 'axolotl', text: 'That\'s the studio.' },
    { speaker: 'octopus', text: 'That\'s us.' },
  ],
  santabeer: [
    { speaker: 'octopus', text: 'Santa Beer.' },
    { speaker: 'axolotl', text: 'Santa was on weight loss pills.' },
    { speaker: 'octopus', text: 'He was advertising beer.' },
    { speaker: 'axolotl', text: 'Simultaneously.' },
    { speaker: 'octopus', text: 'It\'s a commercial.' },
    { speaker: 'axolotl', text: 'It\'s an experience.' },
    { speaker: 'octopus', text: 'Watch it.', link: 'https://miazhang2025.github.io/santabeer/' },
  ],
  cassette: [
    { speaker: 'axolotl', text: 'Cassette Jury.' },
    { speaker: 'octopus', text: 'A project about sound.' },
    { speaker: 'axolotl', text: 'And tape. And time.' },
    { speaker: 'octopus', text: 'Mostly tape.' },
    { speaker: 'axolotl', text: 'Go look.', link: 'https://cassettejury.farm/' },
  ],
  more: [
    { speaker: 'octopus', text: 'More.' },
    { speaker: 'axolotl', text: 'There\'s always more.' },
    { speaker: 'octopus', text: 'Things are being made.' },
    { speaker: 'axolotl', text: 'Slowly.' },
    { speaker: 'octopus', text: 'Carefully.' },
    { speaker: 'axolotl', text: 'In the wet.' },
    { speaker: 'octopus', text: 'If you want to talk:', link: 'mailto:hello@aquaria.studio' },
    { speaker: 'axolotl', text: 'We\'re probably here.' },
  ],
};

// Personas — authored in octopus.md / axolotl.md, used as the LLM system prompt
export const octopusPersona = octopusPersonaMd;
export const axolotlPersona = axolotlPersonaMd;

// Direction for auto idle banter between the octopus and the axolotl
export const idleBrief =
  'Two friends idling in the tank, talking about nothing in particular — the water, ' +
  'the surface far above, a small movement, being a little bored. Quiet, deadpan, ' +
  'faintly existential. No topic, no point, just two creatures passing time.';

// Per-section config for menu-triggered conversations.
//   brief    — direction handed to the LLM
//   count    — how many lines the LLM should generate
//   append   — guaranteed functional line(s) added after generation (links / contact)
//   fallback — used verbatim when there's no API key or generation fails
export const sectionConfig = {
  about: {
    brief:
      'Introduce the studio AQUARIA to a visitor: a new media studio for soft, glossy, ' +
      'slightly tired little underwater worlds. It makes small, weird things — interactive ' +
      'things, video things, story things. Glossy on the outside, tired on the inside. ' +
      'The octopus and the axolotl are introducing themselves and the studio together.',
    count: 6,
    append: [],
    fallback: menuDialogues.about,
  },
  santabeer: {
    brief:
      'React to your own project "Santa Beer": a surreal commercial where Santa was on ' +
      'weight-loss pills while advertising beer, simultaneously. One deadpan line, then ' +
      'you will hand over a link.',
    count: 1,
    append: [
      { speaker: 'octopus', text: 'Watch it.', link: 'https://miazhang2025.github.io/santabeer/' },
    ],
    fallback: menuDialogues.santabeer,
  },
  cassette: {
    brief:
      'React to your own project "Cassette Jury": a project about sound, tape and time — ' +
      'mostly tape. One quiet line, then you will hand over a link.',
    count: 1,
    append: [
      { speaker: 'axolotl', text: 'Go look.', link: 'https://cassettejury.farm/' },
    ],
    fallback: menuDialogues.cassette,
  },
  more: {
    brief:
      'Hint that more projects are slowly, carefully being made, in the wet. Two short ' +
      'lines that lead toward offering a way to get in touch.',
    count: 2,
    append: [
      { speaker: 'octopus', text: 'If you want to talk:', link: 'mailto:hello@aquaria.studio' },
    ],
    fallback: menuDialogues.more,
  },
};
