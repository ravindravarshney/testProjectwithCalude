import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

// Use local worker bundled with the app — no CDN dependency
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

const PALETTE = [
  ['#ff6b6b', '#feca57'], ['#48dbfb', '#ff9ff3'],
  ['#1dd1a1', '#ffeaa7'], ['#a29bfe', '#fd79a8'],
  ['#fdcb6e', '#e17055'], ['#00b894', '#6c5ce7'],
]

const BADGES = ['🌟 Fun Fact!', '🧠 Did You Know?', '🔬 Study Time!', '💡 Key Point!', '🎉 Important!', '🚀 Remember!']

const EMOJI_MAP = [
  [/evolut|species|adapt|natural/i, '🧬'], [/animal|bird|mammal/i, '🦁'],
  [/plant|tree|forest/i, '🌿'],           [/ocean|sea|water/i, '🌊'],
  [/science|experiment|lab/i, '🔬'],      [/history|ancient|war/i, '⚔️'],
  [/math|number|equation/i, '🔢'],        [/space|star|planet/i, '⭐'],
  [/computer|software|code/i, '💻'],      [/art|music|paint/i, '🎨'],
  [/health|body|medicine/i, '💊'],        [/book|chapter|theory/i, '📖'],
]

/**
 * Extract text from a PDF File and return an array of FactObjects
 * ready for CartoonReel.
 *
 * @param {File} file
 * @param {(pct: number, msg: string) => void} onProgress
 * @returns {Promise<{ facts: FactObject[], title: string }>}
 */
export async function extractFactsFromPDF(file, onProgress) {
  onProgress(5, 'Reading PDF...')

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  const totalPages = pdf.numPages
  const pageTexts  = []

  for (let i = 1; i <= totalPages; i++) {
    onProgress(5 + Math.round((i / totalPages) * 60), `Reading page ${i} of ${totalPages}...`)
    const page        = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    const text        = textContent.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
    if (text.length > 20) pageTexts.push(text)
  }

  onProgress(70, 'Splitting into topics...')

  const fullText = pageTexts.join('\n\n')
  const facts    = textToFacts(fullText)

  // Use first 60 chars of PDF name as title
  const title = file.name.replace(/\.pdf$/i, '').slice(0, 60)

  onProgress(100, `Found ${facts.length} topics!`)
  return { facts, title }
}

// ── Text → Facts ──────────────────────────────────────────────────────────────

function textToFacts(text) {
  // Clean up common PDF artifacts
  const cleaned = text
    .replace(/\f/g, '\n\n')             // form feeds → paragraph breaks
    .replace(/([a-z])-\n([a-z])/g, '$1$2') // rejoin hyphenated words
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  // Split into sentences
  const raw = cleaned.split(/(?<=[.!?])\s+/)

  const sentences = raw.filter((s) => {
    const l = s.trim().length
    return l >= 40 && l <= 400 &&
      !/^(page|figure|table|chapter|\d+)\s/i.test(s.trim())
  })

  const facts = []
  let i = 0

  while (i < sentences.length) {
    const s1 = sentences[i]?.trim() || ''
    const s2 = sentences[i + 1]?.trim() || ''
    const combined = s2 && s1.length + s2.length + 1 <= 240
      ? `${s1} ${s2}`
      : s1

    if (combined.length >= 40) {
      const idx = facts.length
      facts.push({
        id:    `pdf-${idx}`,
        text:  combined,
        emoji: pickEmoji(combined),
        badge: BADGES[idx % BADGES.length],
        bg:    PALETTE[idx % PALETTE.length],
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
  return '📖'
}
