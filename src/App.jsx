import React from 'react'
import './App.css'
import NotesConverter from './components/NotesConverter'

function Banner() {
  return (
    <header className="banner">
      <h1>Welcome to Ravindra Projects</h1>
      <p>Turn your notes into YouTube videos in seconds</p>
    </header>
  )
}

function App() {
  return (
    <div>
      <Banner />
      <main className="container">
        <NotesConverter />
      </main>
    </div>
  )
}

export default App
