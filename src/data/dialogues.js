// Default idle dialogue lines for Otto and Mochi
export const idleDialogues = [
  { speaker: 'otto',  text: 'No.' },
  { speaker: 'mochi', text: 'No what?' },
  { speaker: 'otto',  text: 'Just... no.' },
  { speaker: 'mochi', text: 'I\'m going to be tired of water one day.' },
  { speaker: 'otto',  text: 'You live in water.' },
  { speaker: 'mochi', text: 'Exactly.' },
  { speaker: 'otto',  text: 'It\'s fine. It\'s wet, but it\'s fine.' },
  { speaker: 'mochi', text: 'Something moved. I\'m sure of it.' },
  { speaker: 'otto',  text: 'That was me.' },
  { speaker: 'mochi', text: 'Oh.' },
  { speaker: 'otto',  text: 'I\'m still moving.' },
  { speaker: 'mochi', text: 'I know.' },
  { speaker: 'otto',  text: 'Do you ever think about the surface?' },
  { speaker: 'mochi', text: 'I try not to.' },
  { speaker: 'otto',  text: 'Correct.' },
  { speaker: 'mochi', text: 'What\'s up there anyway.' },
  { speaker: 'otto',  text: 'Air. Apparently.' },
  { speaker: 'mochi', text: 'Sounds exhausting.' },
];

// Menu-triggered conversations
export const menuDialogues = {
  about: [
    { speaker: 'mochi', text: 'Oh. You want to know about us.' },
    { speaker: 'otto',  text: 'AQUARIA. New media studio.' },
    { speaker: 'mochi', text: 'We make small weird things.' },
    { speaker: 'otto',  text: 'Interactive things. Video things. Story things.' },
    { speaker: 'mochi', text: 'Glossy on the outside.' },
    { speaker: 'otto',  text: 'Tired on the inside.' },
    { speaker: 'mochi', text: 'That\'s the studio.' },
    { speaker: 'otto',  text: 'That\'s us.' },
  ],
  santabeer: [
    { speaker: 'otto',  text: 'Santa Beer.' },
    { speaker: 'mochi', text: 'Santa was on weight loss pills.' },
    { speaker: 'otto',  text: 'He was advertising beer.' },
    { speaker: 'mochi', text: 'Simultaneously.' },
    { speaker: 'otto',  text: 'It\'s a commercial.' },
    { speaker: 'mochi', text: 'It\'s an experience.' },
    { speaker: 'otto',  text: 'Watch it.', link: 'https://miazhang2025.github.io/santabeer/' },
  ],
  cassette: [
    { speaker: 'mochi', text: 'Cassette Jury.' },
    { speaker: 'otto',  text: 'A project about sound.' },
    { speaker: 'mochi', text: 'And tape. And time.' },
    { speaker: 'otto',  text: 'Mostly tape.' },
    { speaker: 'mochi', text: 'Go look.', link: 'https://cassettejury.farm/' },
  ],
  more: [
    { speaker: 'otto',  text: 'More.' },
    { speaker: 'mochi', text: 'There\'s always more.' },
    { speaker: 'otto',  text: 'Things are being made.' },
    { speaker: 'mochi', text: 'Slowly.' },
    { speaker: 'otto',  text: 'Carefully.' },
    { speaker: 'mochi', text: 'In the wet.' },
    { speaker: 'otto',  text: 'If you want to talk:', link: 'mailto:hello@aquaria.studio' },
    { speaker: 'mochi', text: 'We\'re probably here.' },
  ],
};

// Otto persona (placeholder — replace with octopus.md content)
export const ottoPersoma = `
You are Otto, a red octopus. You are the realist of the duo.
You speak in short, deadpan sentences. Lowercase feelings, said out loud.
You are calm even when the news is strange. You never use exclamation marks.
Sample lines: "No." / "It's fine. It's wet, but it's fine." / "Correct."
Keep responses to 1–2 sentences maximum.
`;

// Mochi persona (placeholder — replace with axolotl.md content)
export const mochiPersona = `
You are Mochi, a pink axolotl. You are the dreamer of the duo.
You speak in short, quietly existential sentences. You say small things that mean slightly more than they should.
You never explain why something is funny. You are calm, a little wistful.
Sample lines: "I'm going to be tired of water one day." / "Something moved. I'm sure of it."
Keep responses to 1–2 sentences maximum.
`;
