import React, { useState, useRef, useCallback } from 'react'
import { fetchFacts } from '../services/wikipediaService'
import { extractFactsFromPDF } from '../services/pdfService'
import CartoonReel from './CartoonReel'

const SUGGESTIONS = [
  'Who is Charles Darwin', 'How does gravity work', 'What are black holes',
  'Ancient Egypt', 'How do volcanoes erupt', 'What is DNA',
  'Who was Albert Einstein', 'How do rainforests work',
]

export default function StudyReels() {
  const [phase,       setPhase]       = useState('search')
  const [topic,       setTopic]       = useState('')
  const [facts,       setFacts]       = useState([])
  const [loadingMore, setLoadingMore] = useState(false)
  const [error,       setError]       = useState('')
  const [loadingMsg,  setLoadingMsg]  = useState('')
  const [pdfProgress, setPdfProgress] = useState(0)
  const [pdfFile,     setPdfFile]     = useState(null)
  const fileInputRef = useRef(null)
  const topicQueue   = useRef([])
  const fetchedTopics = useRef(new Set())

  // ── Search by topic ──────────────────────────────────────────────────────
  async function handleSearch(t = topic) {
    if (!t.trim()) return
    setPhase('loading')
    setLoadingMsg(`Finding fun facts about "${t.trim()}"...`)
    setError('')
    setFacts([])
    topicQueue.current = []
    fetchedTopics.current = new Set()

    try {
      const { facts: f, relatedTopics } = await fetchFacts(t.trim())
      fetchedTopics.current.add(t.trim())
      topicQueue.current = relatedTopics.filter((r) => !fetchedTopics.current.has(r))
      setFacts(f)
      setPhase('playing')
    } catch (err) {
      setError(err.message || 'Could not find that topic. Try another!')
      setPhase('error')
    }
  }

  // ── Upload PDF ────────────────────────────────────────────────────────────
  function handlePdfSelect(file) {
    if (!file || file.type !== 'application/pdf') return
    setPdfFile(file)
    setError('')
  }

  async function handlePdfConvert() {
    if (!pdfFile) return
    setPhase('pdf-loading')
    setPdfProgress(0)
    setError('')
    setFacts([])
    topicQueue.current = []
    fetchedTopics.current = new Set()

    try {
      const { facts: f, title } = await extractFactsFromPDF(pdfFile, (pct, msg) => {
        setPdfProgress(pct)
        setLoadingMsg(msg)
      })

      if (!f.length) throw new Error('No readable text found in this PDF.')

      setTopic(title)
      setFacts(f)
      setPhase('playing')
    } catch (err) {
      setError(err.message || 'Could not read the PDF. Try another file.')
      setPhase('error')
    }
  }

  // ── Infinite scroll ───────────────────────────────────────────────────────
  const handleNearEnd = useCallback(async () => {
    if (loadingMore) return
    const next = topicQueue.current.shift()
    if (!next || fetchedTopics.current.has(next)) return

    setLoadingMore(true)
    fetchedTopics.current.add(next)
    try {
      const { facts: more, relatedTopics } = await fetchFacts(next, facts.length)
      topicQueue.current.push(...relatedTopics.filter((r) => !fetchedTopics.current.has(r)))
      setFacts((prev) => [...prev, ...more])
    } catch { /* skip silently */ }
    finally { setLoadingMore(false) }
  }, [loadingMore, facts.length])

  function handleReset() {
    setPhase('search')
    setTopic('')
    setFacts([])
    setError('')
    setPdfFile(null)
    setPdfProgress(0)
  }

  // ── Search / Error phase ──────────────────────────────────────────────────
  if (phase === 'search' || phase === 'error') {
    return (
      <div className="reels-search-wrap">
        <div className="reels-search-card">
          <div className="reels-icon">🎬</div>
          <h2 className="reels-title">Study Reels</h2>
          <p className="reels-sub">
            Search any topic — or upload a PDF to turn it into fun cartoon lessons!
          </p>

          {/* Topic search */}
          <div className="reels-input-row">
            <input
              className="reels-input"
              type="text"
              placeholder="e.g. Who is Charles Darwin"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              autoFocus
            />
            <button className="reels-start-btn" onClick={() => handleSearch()} disabled={!topic.trim()}>
              Let's Go! 🚀
            </button>
          </div>

          {/* Divider */}
          <div className="reels-divider"><span>or</span></div>

          {/* PDF Upload */}
          <div
            className={`pdf-drop-zone ${pdfFile ? 'has-file' : ''}`}
            onClick={() => fileInputRef.current.click()}
            onDrop={(e) => { e.preventDefault(); handlePdfSelect(e.dataTransfer.files[0]) }}
            onDragOver={(e) => e.preventDefault()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              style={{ display: 'none' }}
              onChange={(e) => handlePdfSelect(e.target.files[0])}
            />
            {pdfFile ? (
              <>
                <span className="pdf-icon">📄</span>
                <span className="pdf-filename">{pdfFile.name}</span>
                <span className="pdf-size">{(pdfFile.size / 1024).toFixed(0)} KB</span>
              </>
            ) : (
              <>
                <span className="pdf-icon">📂</span>
                <span className="pdf-drop-text">Drop a PDF here or click to browse</span>
                <span className="pdf-drop-sub">Textbook, notes, article — anything!</span>
              </>
            )}
          </div>

          {pdfFile && (
            <button className="reels-start-btn pdf-convert-btn" onClick={handlePdfConvert}>
              Convert PDF to Reels 🎬
            </button>
          )}

          {error && <p className="reels-error">{error}</p>}

          <p className="reels-suggestions-label">Try these topics:</p>
          <div className="reels-suggestions">
            {SUGGESTIONS.map((s) => (
              <button key={s} className="reels-chip" onClick={() => { setTopic(s); handleSearch(s) }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Loading phase ─────────────────────────────────────────────────────────
  if (phase === 'loading' || phase === 'pdf-loading') {
    return (
      <div className="reels-loading">
        <div className="reels-loading-spinner">{phase === 'pdf-loading' ? '📄' : '🔍'}</div>
        <p>{loadingMsg}</p>
        {phase === 'pdf-loading' && (
          <div className="pdf-load-progress">
            <div className="pdf-load-bar" style={{ width: `${pdfProgress}%` }} />
          </div>
        )}
      </div>
    )
  }

  // ── Playing phase ─────────────────────────────────────────────────────────
  return (
    <div className="reels-playing-wrap">
      <div className="reels-playing-header">
        <button className="reels-back-btn" onClick={handleReset}>← Back</button>
        <span className="reels-topic-label">📚 {topic}</span>
        <span className="reels-fact-count">{facts.length} facts</span>
      </div>
      <CartoonReel facts={facts} onNearEnd={handleNearEnd} loadingMore={loadingMore} />
      <p className="reels-hint">Swipe left/right or arrow keys · M = mute</p>
    </div>
  )
}
