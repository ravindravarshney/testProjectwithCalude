import React, { useState } from 'react'

function FeedbackButton() {
  const [showForm, setShowForm] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleButtonClick = () => {
    setShowForm(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setShowForm(false)
    setSubmitted(true)
    setFeedback('')
  }

  const handleChange = (e) => {
    setFeedback(e.target.value)
  }

  if (submitted) {
    return (
      <div>
        <p>Thank you for your feedback!</p>
      </div>
    )
  }

  if (showForm) {
    return (
      <div>
        <form onSubmit={handleSubmit}>
          <textarea
            value={feedback}
            onChange={handleChange}
            placeholder="Enter your feedback"
            aria-label="Feedback"
          />
          <button type="submit">Submit</button>
        </form>
      </div>
    )
  }

  return (
    <div>
      <button onClick={handleButtonClick}>Give Feedback</button>
    </div>
  )
}

export default FeedbackButton
