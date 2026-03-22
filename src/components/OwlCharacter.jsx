import React from 'react'

export default function OwlCharacter({ state = 'idle' }) {
  const speaking    = state === 'speaking'
  const confused    = state === 'confused'
  const celebrating = state === 'celebrating'
  const wrong       = state === 'wrong'

  return (
    <div className={`char-wrap char-owl char--${state}`}>
      <svg viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg" width="110" height="145">

        {/* Graduation cap */}
        <rect x="32" y="11" width="56" height="9" rx="3" fill="#2d2d2d" />
        <rect x="50" y="4"  width="20" height="10" rx="3" fill="#2d2d2d" />
        <line x1="84" y1="16" x2="96" y2="30" stroke="#FFD700" strokeWidth="2.5" />
        <circle cx="97" cy="32" r="5" fill="#FFD700" />

        {/* Body */}
        <ellipse cx="60" cy="122" rx="38" ry="40" fill="#A0703A" />

        {/* Wings — raised when celebrating */}
        <ellipse cx="24" cy={celebrating ? 108 : 122} rx="16" ry="26"
          fill="#7A5528"
          transform={celebrating ? 'rotate(-25 24 100)' : speaking ? 'rotate(-10 24 100)' : undefined}
          className={speaking ? 'owl-wing-left' : ''}
          style={{ transformOrigin: '24px 100px' }}
        />
        <ellipse cx="96" cy={celebrating ? 108 : 122} rx="16" ry="26"
          fill="#7A5528"
          transform={celebrating ? 'rotate(25 96 100)' : speaking ? 'rotate(10 96 100)' : undefined}
          className={speaking ? 'owl-wing-right' : ''}
          style={{ transformOrigin: '96px 100px' }}
        />

        {/* Head — tilt when confused */}
        <g transform={confused ? 'rotate(-10 60 62)' : wrong ? 'rotate(8 60 62)' : undefined}>
          <circle cx="60" cy="62" r="42" fill="#C8890E" />

          {/* Ear tufts */}
          <ellipse cx="36" cy="26" rx="9" ry="16" fill="#A0703A" transform="rotate(-18 36 26)" />
          <ellipse cx="84" cy="26" rx="9" ry="16" fill="#A0703A" transform="rotate(18 84 26)" />

          {/* Face disc */}
          <ellipse cx="60" cy="67" rx="30" ry="25" fill="#F0D090" />

          {/* Eye whites */}
          <circle cx="44" cy="60" r="14" fill="white" />
          <circle cx="76" cy="60" r="14" fill="white" />

          {/* Pupils — misaligned when confused */}
          <circle cx={confused ? 40 : celebrating ? 44 : speaking ? 46 : 44}
                  cy={confused ? 56 : 61} r="8" fill="#1a1a2e" />
          <circle cx={confused ? 80 : celebrating ? 76 : speaking ? 78 : 76}
                  cy={confused ? 64 : 61} r="8" fill="#1a1a2e" />

          {/* Eye shine */}
          <circle cx="41" cy="56" r="3" fill="white" />
          <circle cx="73" cy="56" r="3" fill="white" />

          {/* Eyebrows — raised when celebrating, furrowed when confused/wrong */}
          {(confused || wrong) && (
            <>
              <line x1="34" y1="44" x2="54" y2="48" stroke="#7A5528" strokeWidth="3" strokeLinecap="round" />
              <line x1="86" y1="44" x2="66" y2="48" stroke="#7A5528" strokeWidth="3" strokeLinecap="round" />
            </>
          )}
          {celebrating && (
            <>
              <line x1="34" y1="46" x2="54" y2="42" stroke="#7A5528" strokeWidth="3" strokeLinecap="round" />
              <line x1="86" y1="46" x2="66" y2="42" stroke="#7A5528" strokeWidth="3" strokeLinecap="round" />
            </>
          )}

          {/* Beak */}
          {speaking || celebrating ? (
            <>
              <polygon points="60,72 51,80 69,80" fill="#FF8800" />
              <polygon points="60,77 51,80 69,80" fill="#CC5500" />
              <ellipse cx="60" cy="79" rx="9" ry="4" fill="#FF6655" opacity="0.7" />
            </>
          ) : wrong ? (
            <path d="M 50 80 Q 60 72 70 80" stroke="#FF8800" strokeWidth="3" fill="none" />
          ) : (
            <polygon points="60,72 52,79 68,79" fill="#FF8800" />
          )}

          {/* Stars / swirls when celebrating */}
          {celebrating && (
            <>
              <text x="22" y="40" fontSize="12">⭐</text>
              <text x="88" y="40" fontSize="12">⭐</text>
            </>
          )}
          {confused && (
            <text x="85" y="36" fontSize="16">❓</text>
          )}
        </g>

        {/* Belly */}
        <ellipse cx="60" cy="118" rx="20" ry="26" fill="#F0D090" opacity="0.6" />

        {/* Feet */}
        <ellipse cx="47" cy="158" rx="10" ry="5" fill="#FF8800" />
        <ellipse cx="68" cy="158" rx="10" ry="5" fill="#FF8800" />
      </svg>
      <div className="char-name">🎓 Prof. Hoot</div>
    </div>
  )
}
