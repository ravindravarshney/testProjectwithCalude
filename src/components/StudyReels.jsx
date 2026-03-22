import React, { useState, useRef, useCallback } from 'react'
import Tesseract from 'tesseract.js'
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
  const [loadPct,     setLoadPct]     = useState(0)
  const [pdfFile,     setPdfFile]     = useState(null)
  const [imgFile,     setImgFile]     = useState(null)

  const fileInputRef = useRef(null)
  const imgInputRef  = useRef(null)
  const topicQueue   = useRef([])
  const fetchedTopics = useRef(new Set())

  // ── Topic search ──────────────────────────────────────────────────────────
  async function handleSearch(t = topic) {
    if (!t.trim()) return
    setPhase('loading'); setLoadingMsg(`Finding fun facts about "${t.trim()}"...`)
    setError(''); setFacts([]); topicQueue.current = []; fetchedTopics.current = new Set()
    try {
      const { facts: f, relatedTopics } = await fetchFacts(t.trim())
      fetchedTopics.current.add(t.trim())
      topicQueue.current = relatedTopics.filter((r) => !fetchedTopics.current.has(r))
      setFacts(f); setPhase('playing')
    } catch (err) {
      setError(err.message || 'Could not find that topic. Try another!'); setPhase('error')
    }
  }

  // ── PDF upload ────────────────────────────────────────────────────────────
  async function handlePdfConvert(file = pdfFile) {
    if (!file) return
    setPhase('loading'); setLoadPct(0); setError(''); setFacts([])
    topicQueue.current = []; fetchedTopics.current = new Set()
    try {
      const { facts: f, title } = await extractFactsFromPDF(file, (pct, msg) => {
        setLoadPct(pct); setLoadingMsg(msg)
      })
      if (!f.length) throw new Error('No readable text found in this PDF.')
      setTopic(title); setFacts(f); setPhase('playing')
    } catch (err) {
      setError(err.message || 'Could not read the PDF. Try another file.'); setPhase('error')
    }
  }

  // ── Image upload (OCR) ───────────────────────────────────────────────────
  async function handleImageConvert(file = imgFile) {
    if (!file) return
    setPhase('loading'); setLoadPct(0); setLoadingMsg('Reading your image…'); setError(''); setFacts([])
    topicQueue.current = []; fetchedTopics.current = new Set()
    try {
      const { data: { text } } = await Tesseract.recognize(file, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setLoadPct(Math.round(m.progress * 85))
            setLoadingMsg(`Recognizing text… ${Math.round(m.progress * 100)}%`)
          }
        },
      })
      const cleaned = text.trim()
      if (!cleaned || cleaned.length < 40) throw new Error('Could not read enough text from this image.')

      // Re-use pdfService text parser by importing its internal textToFacts
      const { extractFactsFromText } = await import('../services/pdfService')
      const f = extractFactsFromText(cleaned)
      if (!f.length) throw new Error('Not enough text found in the image.')

      setTopic(file.name.replace(/\.[^.]+$/, '').slice(0, 60))
      setFacts(f); setPhase('playing')
    } catch (err) {
      setError(err.message || 'Could not read the image. Try a clearer photo.'); setPhase('error')
    }
  }

  // ── Infinite scroll ───────────────────────────────────────────────────────
  const handleNearEnd = useCallback(async () => {
    if (loadingMore) return
    const next = topicQueue.current.shift()
    if (!next || fetchedTopics.current.has(next)) return
    setLoadingMore(true); fetchedTopics.current.add(next)
    try {
      const { facts: more, relatedTopics } = await fetchFacts(next, facts.length)
      topicQueue.current.push(...relatedTopics.filter((r) => !fetchedTopics.current.has(r)))
      setFacts((prev) => [...prev, ...more])
    } catch { /* skip silently */ }
    finally { setLoadingMore(false) }
  }, [loadingMore, facts.length])

  function handleReset() {
    setPhase('search'); setTopic(''); setFacts([]); setError('')
    setPdfFile(null); setImgFile(null); setLoadPct(0)
  }

  // ── Search / Error UI ────────────────────────────────────────────────────
  if (phase === 'search' || phase === 'error') {
    return (
      <div className="reels-search-wrap">
        <div className="reels-search-card">
          <div className="reels-icon">🎬</div>
          <h2 className="reels-title">Study Reels</h2>
          <p className="reels-sub">
            Search any topic, upload a PDF, or snap a photo of your notes!
          </p>

          {/* Search */}
          <div className="reels-input-row">
            <input className="reels-input" type="text" placeholder="e.g. Who is Charles Darwin"
              value={topic} onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()} autoFocus />
            <button className="reels-start-btn" onClick={() => handleSearch()} disabled={!topic.trim()}>
              Go! 🚀
            </button>
          </div>

          <div className="reels-divider"><span>or upload</span></div>

          {/* Upload row */}
          <div className="upload-row">
            {/* PDF */}
            <div className={`upload-zone ${pdfFile ? 'has-file' : ''}`}
              onClick={() => fileInputRef.current.click()}
              onDrop={(e) => { e.preventDefault(); setPdfFile(e.dataTransfer.files[0]) }}
              onDragOver={(e) => e.preventDefault()}>
              <input ref={fileInputRef} type="file" accept="application/pdf" style={{ display:'none' }}
                onChange={(e) => setPdfFile(e.target.files[0])} />
              <span className="upload-zone-icon">📄</span>
              <span className="upload-zone-label">{pdfFile ? pdfFile.name.slice(0,22)+'…' : 'Upload PDF'}</span>
              {pdfFile && <button className="upload-go-btn" onClick={(e) => { e.stopPropagation(); handlePdfConvert() }}>Convert →</button>}
            </div>

            {/* Image */}
            <div className={`upload-zone ${imgFile ? 'has-file' : ''}`}
              onClick={() => imgInputRef.current.click()}
              onDrop={(e) => { e.preventDefault(); setImgFile(e.dataTransfer.files[0]) }}
              onDragOver={(e) => e.preventDefault()}>
              <input ref={imgInputRef} type="file" accept="image/*" style={{ display:'none' }}
                onChange={(e) => setImgFile(e.target.files[0])} />
              <span className="upload-zone-icon">🖼️</span>
              <span className="upload-zone-label">{imgFile ? imgFile.name.slice(0,22)+'…' : 'Upload Image'}</span>
              {imgFile && <button className="upload-go-btn" onClick={(e) => { e.stopPropagation(); handleImageConvert() }}>Convert →</button>}
            </div>
          </div>

          {error && <p className="reels-error">{error}</p>}

          <p className="reels-suggestions-label">Try these:</p>
          <div className="reels-suggestions">
            {SUGGESTIONS.map((s) => (
              <button key={s} className="reels-chip" onClick={() => { setTopic(s); handleSearch(s) }}>{s}</button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Loading UI ────────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className="reels-loading">
        <div className="reels-loading-spinner">🔍</div>
        <p>{loadingMsg || 'Loading…'}</p>
        {loadPct > 0 && (
          <div className="pdf-load-progress">
            <div className="pdf-load-bar" style={{ width: `${loadPct}%` }} />
          </div>
        )}
      </div>
    )
  }

  // ── Playing UI ────────────────────────────────────────────────────────────
  return (
    <div className="reels-playing-wrap">
      <div className="reels-playing-header">
        <button className="reels-back-btn" onClick={handleReset}>← Back</button>
        <span className="reels-topic-label">📚 {topic}</span>
        <span className="reels-fact-count">{facts.length} facts</span>
      </div>
      <CartoonReel facts={facts} onNearEnd={handleNearEnd} loadingMore={loadingMore} />
      <p className="reels-hint">← → arrow keys · M = mute · P = pause</p>
    </div>
  )
}
