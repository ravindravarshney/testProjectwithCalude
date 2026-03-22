/**
 * Converts a plain fact string into a fun 2-character dialogue
 * between Professor Hoot (owl) and Buddy (bunny).
 */

const OWL_INTROS = [
  "Hooo hooo! Did you know that",
  "Class is in session! Listen up:",
  "Great question! Here's the scoop:",
  "Fascinating! Pay attention, Buddy:",
  "Oh oh oh! Here's something amazing:",
]

const BUNNY_REACTIONS = [
  "Wooow! That's SO cool! 🌟",
  "No way! I had NO idea! 😲",
  "That's incredible, Professor! 🎉",
  "Mind = totally blown! ✨",
  "Whoa! I'm gonna tell ALL my friends! 🐰",
  "Wowww! I love learning! 🥕",
]

const BUNNY_MID = [
  "Wait wait wait... really?!",
  "Ooh ooh! And then what happened?",
  "That sounds amazing! Tell me more!",
  "Wow! But how does that work?",
]

const OWL_CLOSERS = [
  "And that's why it's so important!",
  "Isn't nature just wonderful?",
  "Science is truly amazing, right?",
  "And now you know! 🎓",
]

export function factToDialogue(factText, factIndex) {
  const sentences = (factText.match(/[^.!?]+[.!?]*/g) || [factText])
    .map((s) => s.trim())
    .filter((s) => s.length > 15)

  const owlIntro = OWL_INTROS[factIndex % OWL_INTROS.length]
  const bunnyReact = BUNNY_REACTIONS[factIndex % BUNNY_REACTIONS.length]
  const bunnyMid = BUNNY_MID[factIndex % BUNNY_MID.length]

  if (sentences.length === 0) return []

  if (sentences.length === 1) {
    return [
      { speaker: 'owl',   text: sentences[0] },
      { speaker: 'bunny', text: bunnyReact },
    ]
  }

  if (sentences.length === 2) {
    return [
      { speaker: 'owl',   text: sentences[0] },
      { speaker: 'bunny', text: bunnyMid },
      { speaker: 'owl',   text: sentences[1] },
      { speaker: 'bunny', text: bunnyReact },
    ]
  }

  // 3+ sentences — interleave with bunny reactions
  const lines = []
  sentences.forEach((s, i) => {
    if (i === 0) {
      lines.push({ speaker: 'owl', text: s })
    } else if (i % 2 === 1) {
      lines.push({ speaker: 'bunny', text: i === sentences.length - 1 ? bunnyReact : bunnyMid })
      lines.push({ speaker: 'owl', text: s })
    }
  })
  if (lines[lines.length - 1]?.speaker === 'owl') {
    lines.push({ speaker: 'bunny', text: bunnyReact })
  }

  return lines
}
