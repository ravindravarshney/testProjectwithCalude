const WIKI = 'https://en.wikipedia.org/w/api.php'

const PALETTE = [
  ['#ff6b6b', '#feca57'],
  ['#48dbfb', '#ff9ff3'],
  ['#1dd1a1', '#ffeaa7'],
  ['#a29bfe', '#fd79a8'],
  ['#fdcb6e', '#e17055'],
  ['#00b894', '#6c5ce7'],
  ['#ff7675', '#74b9ff'],
  ['#55efc4', '#fdcb6e'],
]

const EMOJI_MAP = [
  [/evolut|species|adapt|natural select/i, '🧬'],
  [/animal|bird|fish|mammal|reptile|insect|creature/i, '🦁'],
  [/plant|tree|flower|forest|jungle/i, '🌿'],
  [/ocean|sea|water|marine|island/i, '🌊'],
  [/volcano|earthquake|geology|fossil|rock/i, '🪨'],
  [/ship|voyage|travel|expedition|journey/i, '🚢'],
  [/book|wrote|publish|theory|idea/i, '📖'],
  [/born|birth|child|young|famil/i, '👶'],
  [/discover|found|observ|experiment/i, '🔍'],
  [/science|scientist|biolog|chemist|physic/i, '🔬'],
  [/star|planet|space|universe|solar/i, '⭐'],
  [/brain|mind|thought|intelligen/i, '🧠'],
  [/food|eat|diet|nutrition/i, '🍎'],
  [/art|music|paint|creat/i, '🎨'],
  [/math|number|calculat|formula/i, '🔢'],
  [/war|battle|army|soldier/i, '⚔️'],
  [/king|queen|royal|empire/i, '👑'],
  [/money|econom|trade|market/i, '💰'],
  [/medicine|disease|health|doctor/i, '💊'],
  [/computer|technolog|internet|digital/i, '💻'],
]

const FALLBACK_TOPICS = [
  'Black holes', 'Volcanoes', 'Ancient Egypt',
  'Dinosaurs', 'Rainforests', 'DNA', 'The Moon',
]

const BADGES = ['🌟 Fun Fact!', '🧠 Did You Know?', '🔬 Science Time!', '💡 Cool Fact!', '🎉 Amazing!', '🚀 Wow!']

/**
 * Main export: fetch facts for a topic + related topic names for infinite scroll.
 * @param {string} topic
 * @param {number} startId - used to generate unique IDs when appending
 * @returns {{ facts: FactObject[], relatedTopics: string[] }}
 */
export async function fetchFacts(topic, startId = 0) {
  const title = await searchTitle(topic)
  const [text, relatedTopics] = await Promise.all([
    fetchExtract(title),
    fetchRelatedTopics(title),
  ])
  const facts = parseIntoFacts(text, startId)
  return { facts, relatedTopics }
}

// ── Wikipedia API helpers ─────────────────────────────────────────────────────

async function searchTitle(query) {
  const params = new URLSearchParams({
    action: 'query',
    list: 'search',
    srsearch: query,
    format: 'json',
    origin: '*',
    srlimit: 1,
  })
  const resp = await fetch(`${WIKI}?${params}`)
  const data = await resp.json()
  const results = data?.query?.search
  if (!results?.length) throw new Error(`No Wikipedia page found for "${query}"`)
  return results[0].title
}

async function fetchExtract(title) {
  const params = new URLSearchParams({
    action: 'query',
    prop: 'extracts',
    explaintext: true,
    exsectionformat: 'plain',
    titles: title,
    format: 'json',
    origin: '*',
  })
  const resp = await fetch(`${WIKI}?${params}`)
  const data = await resp.json()
  const pages = data?.query?.pages
  const page = Object.values(pages)[0]
  return page?.extract || ''
}

async function fetchRelatedTopics(title) {
  const params = new URLSearchParams({
    action: 'query',
    list: 'search',
    srsearch: title,
    format: 'json',
    origin: '*',
    srlimit: 10,
    sroffset: 1,
  })
  const resp = await fetch(`${WIKI}?${params}`)
  const data = await resp.json()
  const results = data?.query?.search || []
  const related = results.map((r) => r.title).filter((t) => t !== title)
  return related.length ? related : FALLBACK_TOPICS
}

// ── Text → Facts ──────────────────────────────────────────────────────────────

export function parseIntoFacts(text, startId = 0) {
  const cleaned = text
    .replace(/\n=+[^=]+=+\n/g, ' ') // remove section headers
    .replace(/\[\d+\]/g, '')          // remove citation numbers [1]
    .replace(/\s+/g, ' ')
    .trim()

  const raw = cleaned.split(/(?<=[.!?])\s+/)

  const sentences = raw.filter((s) => {
    const l = s.trim().length
    return l >= 40 && l <= 400 && !/^(See also|References|Notes|External|Further)/i.test(s)
  })

  const facts = []
  let i = 0

  while (i < sentences.length) {
    const s1 = sentences[i]?.trim() || ''
    const s2 = sentences[i + 1]?.trim() || ''
    const combined = s2 && s1.length + s2.length + 1 <= 220 ? `${s1} ${s2}` : s1

    if (combined.length >= 40) {
      const idx = startId + facts.length
      facts.push({
        id: `fact-${idx}`,
        text: combined,
        emoji: pickEmoji(combined),
        badge: BADGES[idx % BADGES.length],
        bg: PALETTE[idx % PALETTE.length],
      })
    }

    i += combined.includes(s2) && s2 ? 2 : 1
  }

  return facts
}

function pickEmoji(text) {
  for (const [pattern, emoji] of EMOJI_MAP) {
    if (pattern.test(text)) return emoji
  }
  return '💡'
}
