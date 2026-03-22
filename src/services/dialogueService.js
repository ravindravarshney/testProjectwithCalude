/**
 * dialogueService.js
 *
 * Converts a plain fact into an INTERACTIVE Q&A dialogue between
 * Prof. Hoot (owl) and Buddy (bunny).
 *
 * Five rotating formats keep every reel feeling fresh:
 *   0 QUIZ       — Owl asks a question, Bunny guesses wrong, Owl reveals
 *   1 TRUE_FALSE — Interactive tap: kid answers TRUE or FALSE
 *   2 IMAGINE    — Creative analogy to explain the concept
 *   3 CHALLENGE  — "Bet you can't guess…" reveal
 *   4 STORY      — Mini story wrapping the fact
 */

// ── Template banks ─────────────────────────────────────────────────────────────

const WRONG_GUESSES = [
  "Umm… a flying potato? 🥔",
  "Is it… three rainbows stacked up? 🌈",
  "Maybe… a confused turtle? 🐢",
  "Ooh ooh! Tuesday?? 📅",
  "A very tiny dragon! 🐉",
  "Definitely… a disco ball? 🪩",
  "Some kind of invisible sandwich? 🥪",
  "I'm guessing… purple? 💜",
  "Has to be a talking rock! 🪨",
  "Obviously it's… uhh… spaghetti? 🍝",
]

const CORRECT_REACTIONS = [
  "YESSS! I knew it! 🎉",
  "I got it RIGHT?! I'm a GENIUS! 🧠",
  "Wooohooo! Give me five! 🙌",
  "OMG YES! That's so cool! ⭐",
  "I'm SO smart today! 😎",
]

const WRONG_REACTIONS = [
  "Awww, so close! A flying potato would've been cooler though… 😂",
  "Heehee, not quite! But that's what makes it SO surprising!",
  "Ha! I should've known that! So awesome! 🤣",
  "Ohhhh wow! I never would've guessed! 😲",
]

const IMAGINE_SEEDS = [
  "you could shrink down smaller than an ant",
  "you had a superpower related to this",
  "this happened right in front of you",
  "you had to explain this to a Martian",
  "this was in your favourite video game",
  "you discovered this for the very first time",
]

const STORY_OPENERS = [
  "Gather round! Story time! 📖",
  "Oh oh oh, listen to THIS story!",
  "Once upon a time in a land of learning…",
  "Let me tell you something WILD that actually happened…",
]

const CHALLENGE_OPENERS = [
  "Okay Buddy, I BET you can't guess this one…",
  "Challenge mode activated! 🎮 Ready?",
  "Think you're smart? Let's find out! 😏",
  "Here's the trickiest question of the day…",
]

// ── Main export ────────────────────────────────────────────────────────────────

/**
 * @param {string} factText
 * @param {number} factIndex
 * @returns {DialogueLine[]}
 *
 * DialogueLine: {
 *   speaker: 'owl'|'bunny',
 *   text: string,
 *   characterState: string,
 *   format: string,
 *   interactive?: { type, correctAnswer, onCorrect, onWrong },
 *   isReveal?: boolean,
 * }
 */
export function factToDialogue(factText, factIndex) {
  const format = ['QUIZ', 'TRUE_FALSE', 'IMAGINE', 'CHALLENGE', 'STORY'][factIndex % 5]

  switch (format) {
    case 'QUIZ':       return buildQuiz(factText, factIndex)
    case 'TRUE_FALSE': return buildTrueFalse(factText, factIndex)
    case 'IMAGINE':    return buildImagine(factText, factIndex)
    case 'CHALLENGE':  return buildChallenge(factText, factIndex)
    case 'STORY':      return buildStory(factText, factIndex)
    default:           return buildQuiz(factText, factIndex)
  }
}

// ── Format builders ────────────────────────────────────────────────────────────

function buildQuiz(fact, idx) {
  const question   = makeQuestion(fact)
  const wrongGuess = WRONG_GUESSES[idx % WRONG_GUESSES.length]
  const reaction   = WRONG_REACTIONS[idx % WRONG_REACTIONS.length]

  return [
    line('owl',   `🤔 Quiz time, Buddy! ${question}`,           'speaking',    'QUIZ'),
    line('bunny', wrongGuess,                                    'confused',    'QUIZ'),
    line('owl',   `Haha! Great guess! Actually… ${fact}`,        'speaking',    'QUIZ', true),
    line('bunny', reaction,                                      'celebrating', 'QUIZ'),
  ]
}

function buildTrueFalse(fact, idx) {
  const isTrue      = idx % 2 === 0
  const statement   = isTrue ? fact : makeFalseVersion(fact)
  const correct     = isTrue ? 'true' : 'false'
  const correctText = isTrue
    ? `That's TRUE! ${fact}`
    : `Nope, that's FALSE! The truth is: ${fact}`

  return [
    line('owl',
      `🎯 True or False, Buddy? "${statement}" — what do you think?`,
      'speaking', 'TRUE_FALSE',
      false,
      {
        type: 'TRUE_FALSE',
        correctAnswer: correct,
        onCorrect: {
          owlText:   `✅ CORRECT! You're a star! ${correctText}`,
          bunnyText: CORRECT_REACTIONS[idx % CORRECT_REACTIONS.length],
          owlState:  'celebrating',
          bunnyState: 'celebrating',
        },
        onWrong: {
          owlText:   `❌ Not quite! ${correctText}`,
          bunnyText: WRONG_REACTIONS[idx % WRONG_REACTIONS.length],
          owlState:  'speaking',
          bunnyState: 'wrong',
        },
      }
    ),
  ]
}

function buildImagine(fact, idx) {
  const seed = IMAGINE_SEEDS[idx % IMAGINE_SEEDS.length]
  return [
    line('owl',   `🌈 Buddy, imagine if ${seed}…`,              'speaking',    'IMAGINE'),
    line('bunny', `Ooh that sounds WILD! What would happen? 🤩`, 'confused',    'IMAGINE'),
    line('owl',   `Well — ${fact}`,                              'speaking',    'IMAGINE', true),
    line('bunny', `WHOA! My brain just exploded! 🤯`,            'celebrating', 'IMAGINE'),
  ]
}

function buildChallenge(fact, idx) {
  const opener   = CHALLENGE_OPENERS[idx % CHALLENGE_OPENERS.length]
  const question = makeQuestion(fact)
  return [
    line('owl',   `${opener} ${question}`,                       'speaking',    'CHALLENGE'),
    line('bunny', `Hmm hmm hmm… I have NO idea! 🤔`,             'confused',    'CHALLENGE'),
    line('owl',   `DRUMROLL please… 🥁 ${fact}`,                  'speaking',    'CHALLENGE', true),
    line('bunny', `INCREDIBLE! How did I not know that?! 🌟`,     'celebrating', 'CHALLENGE'),
  ]
}

function buildStory(fact, idx) {
  const opener = STORY_OPENERS[idx % STORY_OPENERS.length]
  const [subject, rest] = splitSubject(fact)
  return [
    line('owl',   `📖 ${opener} ${subject} had a BIG secret…`,   'speaking',    'STORY'),
    line('bunny', `Ooh I love secrets! Tell me! Tell me! 🐰`,    'listening',   'STORY'),
    line('owl',   `The secret was — ${rest || fact}`,             'speaking',    'STORY', true),
    line('bunny', `WOW! Best story ever! 🎉`,                     'celebrating', 'STORY'),
  ]
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function line(speaker, text, characterState, format, isReveal = false, interactive = null) {
  return { speaker, text, characterState, format, isReveal, interactive }
}

function makeQuestion(fact) {
  // Try to find a capitalized noun phrase to blank out
  const match = fact.match(/\b([A-Z][a-zA-Z]{3,}(?:\s[A-Z][a-zA-Z]{2,})?)\b/)
  if (match) {
    return `What do you think "${match[1]}" refers to in this fact: "${fact.replace(match[1], '???')}"?`
  }
  // Fallback — number question
  const numMatch = fact.match(/\b(\d[\d,]*)\b/)
  if (numMatch) {
    return `Can you guess the number? "${fact.replace(numMatch[1], '???')}"?`
  }
  return `What's the amazing thing about this? "${fact.slice(0, 80)}…"`
}

function makeFalseVersion(fact) {
  // Try swapping a number (double it)
  const numMatch = fact.match(/\b(\d+)\b/)
  if (numMatch) {
    const n    = parseInt(numMatch[1], 10)
    const fake = n > 10 ? Math.round(n / 2) : n * 3
    return fact.replace(numMatch[1], String(fake))
  }
  // Try swapping large/small superlatives
  if (/largest/i.test(fact)) return fact.replace(/largest/i, 'smallest')
  if (/smallest/i.test(fact)) return fact.replace(/smallest/i, 'largest')
  if (/first/i.test(fact))    return fact.replace(/first/i, 'last')
  if (/last/i.test(fact))     return fact.replace(/last/i, 'first')
  if (/hot/i.test(fact))      return fact.replace(/hot/i, 'cold')
  if (/fast/i.test(fact))     return fact.replace(/fast/i, 'slow')
  // Fallback: prefix with a negation hint
  return `${fact.slice(0, 40)}… (but is this actually true?)`
}

function splitSubject(fact) {
  const dotIdx = fact.indexOf('.')
  if (dotIdx > 20 && dotIdx < fact.length - 10) {
    return [fact.slice(0, dotIdx + 1), fact.slice(dotIdx + 1).trim()]
  }
  const commaIdx = fact.indexOf(',')
  if (commaIdx > 15 && commaIdx < fact.length - 10) {
    return [fact.slice(0, commaIdx), fact.slice(commaIdx + 1).trim()]
  }
  const words = fact.split(' ')
  const mid = Math.floor(words.length / 2)
  return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')]
}
