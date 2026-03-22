import React from 'react'

export default function BunnyCharacter({ state = 'idle' }) {
  const speaking    = state === 'speaking'
  const confused    = state === 'confused'
  const celebrating = state === 'celebrating'
  const wrong       = state === 'wrong'

  return (
    <div className={`char-wrap char-bunny char--${state}`}>
      <svg viewBox="0 0 120 170" xmlns="http://www.w3.org/2000/svg" width="105" height="138">

        {/* Ears — droop when wrong, wiggle when celebrating */}
        <ellipse cx="40" cy="38" rx="13" ry="44" fill="#F0E0D0"
          transform={wrong ? 'rotate(-35 40 80)' : confused ? 'rotate(-15 40 80)' : 'rotate(-8 40 38)'} />
        <ellipse cx="40" cy="38" rx="7"  ry="38" fill="#FFB6C1"
          transform={wrong ? 'rotate(-35 40 80)' : confused ? 'rotate(-15 40 80)' : 'rotate(-8 40 38)'} />
        <ellipse cx="80" cy="38" rx="13" ry="44" fill="#F0E0D0"
          transform={wrong ? 'rotate(35 80 80)' : confused ? 'rotate(15 80 80)' : 'rotate(8 80 38)'} />
        <ellipse cx="80" cy="38" rx="7"  ry="38" fill="#FFB6C1"
          transform={wrong ? 'rotate(35 80 80)' : confused ? 'rotate(15 80 80)' : 'rotate(8 80 38)'} />

        {/* Body */}
        <ellipse cx="60" cy="128" rx="40" ry="42" fill="#F0E0D0" />

        {/* Arms — raised when celebrating */}
        <ellipse cx="22" cy={celebrating ? 108 : 120} rx="13" ry="22" fill="#F0E0D0"
          transform={celebrating ? 'rotate(-40 22 120)' : 'rotate(12 22 120)'} />
        <ellipse cx="98" cy={celebrating ? 108 : 120} rx="13" ry="22" fill="#F0E0D0"
          transform={celebrating ? 'rotate(40 98 120)' : 'rotate(-12 98 120)'} />

        {/* Head */}
        <circle cx="60" cy="80" r="42" fill="#F0E0D0" />

        {/* Eyes */}
        <circle cx="44" cy="73" r="13" fill="white" />
        <circle cx="76" cy="73" r="13" fill="white" />

        {/* Iris — misaligned when confused */}
        <circle cx={confused ? 40 : 44} cy={confused ? 69 : 74} r="9" fill="#5BAAEE" />
        <circle cx={confused ? 80 : 76} cy={confused ? 77 : 74} r="9" fill="#5BAAEE" />

        {/* Pupils */}
        <circle cx={confused ? 41 : speaking ? 46 : 45}
                cy={confused ? 70 : 75} r="5.5" fill="#1a1a2e" />
        <circle cx={confused ? 81 : speaking ? 78 : 77}
                cy={confused ? 78 : 75} r="5.5" fill="#1a1a2e" />

        {/* Eye shine */}
        <circle cx="41" cy="69" r="3.5" fill="white" />
        <circle cx="73" cy="69" r="3.5" fill="white" />

        {/* Eyebrows */}
        {(confused || wrong) && (
          <>
            <line x1="34" y1="59" x2="54" y2="63" stroke="#C0A090" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="86" y1="59" x2="66" y2="63" stroke="#C0A090" strokeWidth="2.5" strokeLinecap="round" />
          </>
        )}
        {celebrating && (
          <>
            <line x1="34" y1="62" x2="54" y2="58" stroke="#C0A090" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="86" y1="62" x2="66" y2="58" stroke="#C0A090" strokeWidth="2.5" strokeLinecap="round" />
          </>
        )}

        {/* Nose */}
        <ellipse cx="60" cy="88" rx="5" ry="4" fill="#FFB6C1" />

        {/* Mouth */}
        {speaking ? (
          <>
            <path d="M 51 95 Q 60 104 69 95" stroke="#B09080" strokeWidth="2.5" fill="none" />
            <ellipse cx="60" cy="99" rx="9" ry="6" fill="#FF9999" opacity="0.55" />
          </>
        ) : celebrating ? (
          <path d="M 48 94 Q 60 108 72 94" stroke="#B09080" strokeWidth="3" fill="none" />
        ) : wrong ? (
          <path d="M 52 100 Q 60 94 68 100" stroke="#B09080" strokeWidth="2.5" fill="none" />
        ) : confused ? (
          <path d="M 52 96 Q 56 93 60 96 Q 64 99 68 96" stroke="#B09080" strokeWidth="2" fill="none" />
        ) : (
          <path d="M 52 94 Q 60 100 68 94" stroke="#B09080" strokeWidth="2" fill="none" />
        )}

        {/* Blush — bigger when wrong */}
        <ellipse cx="29" cy="83" rx={wrong ? 15 : 11} ry={wrong ? 10 : 8}
          fill="#FFB6C1" opacity={wrong ? 0.6 : 0.38} />
        <ellipse cx="91" cy="83" rx={wrong ? 15 : 11} ry={wrong ? 10 : 8}
          fill="#FFB6C1" opacity={wrong ? 0.6 : 0.38} />

        {/* Belly */}
        <ellipse cx="60" cy="126" rx="24" ry="28" fill="white" opacity="0.55" />

        {/* Feet */}
        <ellipse cx="43" cy="165" rx="16" ry="7" fill="#E8D0BC" />
        <ellipse cx="75" cy="165" rx="16" ry="7" fill="#E8D0BC" />

        {/* Stars when celebrating */}
        {celebrating && (
          <>
            <text x="8"  y="55" fontSize="14">🎉</text>
            <text x="96" y="55" fontSize="14">🎉</text>
          </>
        )}
        {confused && (
          <text x="90" y="45" fontSize="16">❓</text>
        )}
      </svg>
      <div className="char-name">🥕 Buddy</div>
    </div>
  )
}
