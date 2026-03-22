import React, { useRef, useState } from 'react'
import Tesseract from 'tesseract.js'

export default function ImageUpload({ onTextExtracted }) {
  const inputRef = useRef(null)
  const [status, setStatus] = useState('idle') // idle | loading | done | error
  const [progress, setProgress] = useState(0)

  async function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) return

    setStatus('loading')
    setProgress(0)

    try {
      const { data: { text } } = await Tesseract.recognize(file, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100))
          }
        },
      })

      const cleaned = text.trim()
      if (cleaned) {
        onTextExtracted(cleaned)
        setStatus('done')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }

    setTimeout(() => setStatus('idle'), 3000)
  }

  function handleDrop(e) {
    e.preventDefault()
    handleFile(e.dataTransfer.files[0])
  }

  function handleDragOver(e) {
    e.preventDefault()
  }

  return (
    <div
      className={`image-upload ${status}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={() => status === 'idle' && inputRef.current.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => handleFile(e.target.files[0])}
      />

      {status === 'idle' && (
        <>
          <span className="upload-icon">🖼</span>
          <span className="upload-text">Upload image to extract text</span>
          <span className="upload-sub">Click or drag & drop a photo of your notes</span>
        </>
      )}

      {status === 'loading' && (
        <>
          <span className="upload-icon spin">⚙</span>
          <span className="upload-text">Reading image... {progress}%</span>
          <div className="ocr-progress-track">
            <div className="ocr-progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </>
      )}

      {status === 'done' && (
        <>
          <span className="upload-icon">✓</span>
          <span className="upload-text">Text extracted and added to notes!</span>
        </>
      )}

      {status === 'error' && (
        <>
          <span className="upload-icon">✗</span>
          <span className="upload-text">Could not extract text. Try a clearer image.</span>
        </>
      )}
    </div>
  )
}
