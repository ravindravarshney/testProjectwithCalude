import React, { useState, useCallback } from 'react'
import { convertNotesToVideo } from '../services/videoService'
import ImageUpload from './ImageUpload'

const STATUS = { IDLE: 'idle', LOADING: 'loading', DONE: 'done', ERROR: 'error' }

export default function NotesConverter() {
  const [notes, setNotes] = useState('')
  const [style, setStyle] = useState('educational')
  const [duration, setDuration] = useState('short')
  const [status, setStatus] = useState(STATUS.IDLE)
  const [progress, setProgress] = useState(0)
  const [progressStep, setProgressStep] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  // Append OCR text to existing notes
  const handleImageText = useCallback((text) => {
    setNotes((prev) => (prev ? `${prev}\n\n${text}` : text))
  }, [])

  async function handleConvert() {
    if (!notes.trim()) return
    setStatus(STATUS.LOADING)
    setProgress(0)
    setError('')
    setResult(null)

    try {
      const data = await convertNotesToVideo(notes, { style, duration }, (pct, step) => {
        setProgress(pct)
        setProgressStep(step)
      })
      setResult(data)
      setStatus(STATUS.DONE)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
      setStatus(STATUS.ERROR)
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(result.youtubeUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleReset() {
    setStatus(STATUS.IDLE)
    setProgress(0)
    setProgressStep('')
    setResult(null)
    setError('')
    setNotes('')
  }

  const isLoading = status === STATUS.LOADING

  return (
    <div className="card">
      <h2>Notes → YouTube Video</h2>
      <p className="subtitle">
        Type your notes, upload a photo of handwritten notes, then convert to a YouTube video
        with voice narration and background music.
      </p>

      {/* Image upload for OCR */}
      <ImageUpload onTextExtracted={handleImageText} />

      {/* Notes textarea with browser spell check */}
      <label className="notes-label" htmlFor="notes">
        Your Notes
        <span className="spellcheck-badge">Spell check ON</span>
      </label>
      <textarea
        id="notes"
        className="notes-textarea"
        placeholder="Type or paste your notes here… or upload an image above.&#10;&#10;Tip: Spelling mistakes will be underlined automatically."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        disabled={isLoading}
        spellCheck={true}
        autoCorrect="on"
        autoCapitalize="sentences"
      />

      <div className="char-count">{notes.length} characters · {notes.trim().split(/\s+/).filter(Boolean).length} words</div>

      <div className="options-row">
        <select
          className="option-select"
          value={style}
          onChange={(e) => setStyle(e.target.value)}
          disabled={isLoading}
        >
          <option value="educational">Educational</option>
          <option value="storytelling">Storytelling</option>
          <option value="tutorial">Tutorial</option>
          <option value="summary">Summary</option>
        </select>

        <select
          className="option-select"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          disabled={isLoading}
        >
          <option value="short">Short (1–3 min)</option>
          <option value="medium">Medium (5–8 min)</option>
          <option value="long">Long (10–15 min)</option>
        </select>
      </div>

      <button
        className="convert-btn"
        onClick={handleConvert}
        disabled={!notes.trim() || isLoading}
      >
        {isLoading ? 'Converting...' : '▶ Convert to YouTube Video'}
      </button>

      {isLoading && (
        <div className="progress-section">
          <div className="progress-label">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
          <p className="progress-step">{progressStep}</p>
        </div>
      )}

      {status === STATUS.DONE && result && (
        <div className="result-box">
          <p className="result-title">Video Ready</p>
          <div className="result-url-row">
            <input className="result-url-input" value={result.youtubeUrl} readOnly />
            <button className="copy-btn" onClick={handleCopy}>
              {copied ? 'Copied!' : 'Copy URL'}
            </button>
          </div>
          <a className="open-btn" href={result.youtubeUrl} target="_blank" rel="noopener noreferrer">
            ▶ Open on YouTube
          </a>
          <span className="reset-link" onClick={handleReset}>
            Convert another note
          </span>
        </div>
      )}

      {status === STATUS.ERROR && (
        <div className="error-box">
          {error}
          <br />
          <span className="reset-link" onClick={handleReset}>Try again</span>
        </div>
      )}
    </div>
  )
}
