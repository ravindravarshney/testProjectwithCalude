import React, { useState } from 'react'
import { convertNotesToVideo } from '../services/videoService'

const STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  DONE: 'done',
  ERROR: 'error',
}

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

  async function handleConvert() {
    if (!notes.trim()) return
    setStatus(STATUS.LOADING)
    setProgress(0)
    setError('')
    setResult(null)

    try {
      const data = await convertNotesToVideo(
        notes,
        { style, duration },
        (pct, step) => {
          setProgress(pct)
          setProgressStep(step)
        }
      )
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

  return (
    <div className="card">
      <h2>Notes → YouTube Video</h2>
      <p className="subtitle">
        Paste your notes below and we'll turn them into a YouTube video.
      </p>

      <label className="notes-label" htmlFor="notes">
        Your Notes
      </label>
      <textarea
        id="notes"
        className="notes-textarea"
        placeholder="Type or paste your notes here…&#10;&#10;e.g. Today I learned about React hooks. useState lets you add state to functional components..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        disabled={status === STATUS.LOADING}
      />

      <div className="options-row">
        <select
          className="option-select"
          value={style}
          onChange={(e) => setStyle(e.target.value)}
          disabled={status === STATUS.LOADING}
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
          disabled={status === STATUS.LOADING}
        >
          <option value="short">Short (1–3 min)</option>
          <option value="medium">Medium (5–8 min)</option>
          <option value="long">Long (10–15 min)</option>
        </select>
      </div>

      <button
        className="convert-btn"
        onClick={handleConvert}
        disabled={!notes.trim() || status === STATUS.LOADING}
      >
        {status === STATUS.LOADING ? 'Converting...' : 'Convert to YouTube Video'}
      </button>

      {status === STATUS.LOADING && (
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
            <input
              className="result-url-input"
              value={result.youtubeUrl}
              readOnly
            />
            <button className="copy-btn" onClick={handleCopy}>
              {copied ? 'Copied!' : 'Copy URL'}
            </button>
          </div>
          <a
            className="open-btn"
            href={result.youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
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
          <span className="reset-link" onClick={handleReset}>
            Try again
          </span>
        </div>
      )}
    </div>
  )
}
