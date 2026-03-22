import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FeedbackButton from './FeedbackButton'

describe('FeedbackButton', () => {
  test('renders the feedback button', () => {
    render(<FeedbackButton />)
    expect(screen.getByRole('button', { name: /give feedback/i })).toBeInTheDocument()
  })

  test('clicking button shows feedback form', async () => {
    const user = userEvent.setup()
    render(<FeedbackButton />)

    await user.click(screen.getByRole('button', { name: /give feedback/i }))

    expect(screen.getByRole('textbox', { name: /feedback/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument()
  })

  test('user can type in the textarea', async () => {
    const user = userEvent.setup()
    render(<FeedbackButton />)

    await user.click(screen.getByRole('button', { name: /give feedback/i }))

    const textarea = screen.getByRole('textbox', { name: /feedback/i })
    await user.type(textarea, 'Great app!')

    expect(textarea).toHaveValue('Great app!')
  })

  test('submitting form shows thank-you message', async () => {
    const user = userEvent.setup()
    render(<FeedbackButton />)

    await user.click(screen.getByRole('button', { name: /give feedback/i }))
    await user.type(screen.getByRole('textbox', { name: /feedback/i }), 'Great app!')
    await user.click(screen.getByRole('button', { name: /submit/i }))

    expect(screen.getByText(/thank you for your feedback/i)).toBeInTheDocument()
  })

  test('form hides after submission', async () => {
    const user = userEvent.setup()
    render(<FeedbackButton />)

    await user.click(screen.getByRole('button', { name: /give feedback/i }))
    await user.click(screen.getByRole('button', { name: /submit/i }))

    expect(screen.queryByRole('textbox', { name: /feedback/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /submit/i })).not.toBeInTheDocument()
  })
})
