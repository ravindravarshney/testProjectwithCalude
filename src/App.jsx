import React, { useState } from 'react'
import './App.css'
import NotesConverter from './components/NotesConverter'
import StudyReels from './components/StudyReels'

const TABS = [
  { id: 'reels', label: '🎬 Study Reels' },
  { id: 'notes', label: '📝 Notes to Video' },
]

function Banner() {
  return (
    <header className="banner">
      <h1>Welcome to Ravindra Projects</h1>
      <p>Turn notes into YouTube videos · Study any topic with fun reels</p>
    </header>
  )
}

function App() {
  const [activeTab, setActiveTab] = useState('reels')

  return (
    <div>
      <Banner />

      <nav className="tab-bar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className={activeTab === 'reels' ? '' : 'container'}>
        {activeTab === 'notes' && <NotesConverter />}
        {activeTab === 'reels' && <StudyReels />}
      </main>
    </div>
  )
}

export default App
