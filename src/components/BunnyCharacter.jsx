import React from 'react'

export default function BunnyCharacter({ state = 'idle' }) {
  const speaking = state === 'speaking'
  const reacting = state === 'reacting'

  return (
    <div className={`char-wrap char-bunny char--${state}`}>
      <svg viewBox="0 0 120 170" xmlns="http://www.w3.org/2000/svg" width="105" height="138">
        {/* Ears */}
        <ellipse cx="40" cy="38" rx="13" ry="44" fill="#F0E0D0" transform="rotate(-8 40 38)" />
        <ellipse cx="40" cy="38" rx="7" ry="38" fill="#FFB6C1" transform="rotate(-8 40 38)" />
        <ellipse cx="80" cy="38" rx="13" ry="44" fill="#F0E0D0" transform="rotate(8 80 38)" />
        <ellipse cx="80" cy="38" rx="7" ry="38" fill="#FFB6C1" transform="rotate(8 80 38)" />

        {/* Body */}
        <ellipse cx="60" cy="128" rx="40" ry="42" fill="#F0E0D0" />

        {/* Arms */}
        <ellipse cx="22" cy="120" rx="13" ry="22" fill="#F0E0D0" transform="rotate(12 22 120)" />
        <ellipse cx="98" cy="120" rx="13" ry="22" fill="#F0E0D0" transform="rotate(-12 98 120)" />

        {/* Head */}
        <circle cx="60" cy="80" r="42" fill="#F0E0D0" />

        {/* Eyes */}
        <circle cx="44" cy="73" r="13" fill="white" />
        <circle cx="76" cy="73" r="13" fill="white" />
        <circle cx="44" cy="73" r="13" fill="none" stroke="#E0C8B0" strokeWidth="1.5" />
        <circle cx="76" cy="73" r="13" fill="none" stroke="#E0C8B0" strokeWidth="1.5" />

        {/* Iris */}
        <circle cx={speaking ? 46 : 44} cy="74" r="9" fill="#5BAAEE" />
        <circle cx={speaking ? 78 : 76} cy="74" r="9" fill="#5BAAEE" />

        {/* Pupils */}
        <circle cx={speaking ? 47 : 45} cy="75" r="5.5" fill="#1a1a2e" />
        <circle cx={speaking ? 79 : 77} cy="75" r="5.5" fill="#1a1a2e" />

        {/* Eye shine */}
        <circle cx="41" cy="69" r="3.5" fill="white" />
        <circle cx="73" cy="69" r="3.5" fill="white" />
        <circle cx="43" cy="71" r="1.8" fill="white" />
        <circle cx="75" cy="71" r="1.8" fill="white" />

        {/* Nose */}
        <ellipse cx="60" cy="88" rx="5" ry="4" fill="#FFB6C1" />

        {/* Mouth open/closed */}
        {speaking ? (
          <>
            <path d="M 51 95 Q 60 104 69 95" stroke="#B09080" strokeWidth="2.5" fill="none" />
            <ellipse cx="60" cy="99" rx="9" ry="6" fill="#FF9999" opacity="0.55" />
          </>
        ) : reacting ? (
          <path d="M 50 94 Q 60 106 70 94" stroke="#B09080" strokeWidth="2.5" fill="none" />
        ) : (
          <path d="M 52 94 Q 60 100 68 94" stroke="#B09080" strokeWidth="2" fill="none" />
        )}

        {/* Blush */}
        <ellipse cx="29" cy="83" rx="11" ry="8" fill="#FFB6C1" opacity="0.38" />
        <ellipse cx="91" cy="83" rx="11" ry="8" fill="#FFB6C1" opacity="0.38" />

        {/* Belly */}
        <ellipse cx="60" cy="126" rx="24" ry="28" fill="white" opacity="0.55" />

        {/* Feet */}
        <ellipse cx="43" cy="165" rx="16" ry="7" fill="#E8D0BC" />
        <ellipse cx="75" cy="165" rx="16" ry="7" fill="#E8D0BC" />
      </svg>

      {/* Name tag */}
      <div className="char-name">🥕 Buddy</div>
    </div>
  )
}
