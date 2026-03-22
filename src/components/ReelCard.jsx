import React from 'react'

export default function ReelCard({ fact, direction, index, total }) {
  const [from, to] = fact.bg
  return (
    <div
      className={`reel-card reel-card--${direction}`}
      style={{ background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)` }}
    >
      <div className="reel-badge">{fact.badge}</div>
      <div className="reel-emoji">{fact.emoji}</div>
      <p className="reel-text">{fact.text}</p>
      <div className="reel-counter">{index + 1} / {total}</div>
    </div>
  )
}
