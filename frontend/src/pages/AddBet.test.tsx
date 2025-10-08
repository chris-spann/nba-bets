import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { AddBet } from './AddBet'

// Mock the API
vi.mock('../lib/api', () => ({
  api: {
    createBet: vi.fn(),
  },
}))

// Wrapper component with providers
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  )
}

describe('AddBet', () => {
  it('renders the form with all required fields', () => {
    const Wrapper = createWrapper()
    render(<AddBet />, { wrapper: Wrapper })

    expect(screen.getByText('Add New Bet')).toBeInTheDocument()
    expect(screen.getByText('Record a new NBA prop bet')).toBeInTheDocument()

    // Check for form fields
    expect(screen.getByLabelText(/bet type/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/bet placed date/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/game date/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/team/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/opponent/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/prop line/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/wager amount/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/odds/i)).toBeInTheDocument()
  })

  it('shows player-specific fields when player prop is selected', () => {
    const Wrapper = createWrapper()
    render(<AddBet />, { wrapper: Wrapper })

    // Player prop should be selected by default
    expect(screen.getByLabelText(/player name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/prop type/i)).toBeInTheDocument()
  })

  it('shows team prop description field when team prop is selected', async () => {
    const user = userEvent.setup()
    const Wrapper = createWrapper()
    render(<AddBet />, { wrapper: Wrapper })

    const betTypeSelect = screen.getByLabelText(/bet type/i)
    await user.selectOptions(betTypeSelect, 'team_prop')

    await waitFor(() => {
      expect(screen.getByLabelText(/prop description/i)).toBeInTheDocument()
    })

    expect(screen.queryByLabelText(/player name/i)).not.toBeInTheDocument()
  })

  it('hides over/under field for spread bets', async () => {
    const user = userEvent.setup()
    const Wrapper = createWrapper()
    render(<AddBet />, { wrapper: Wrapper })

    const betTypeSelect = screen.getByLabelText(/bet type/i)
    await user.selectOptions(betTypeSelect, 'spread')

    await waitFor(() => {
      expect(screen.queryByLabelText(/over\/under/i)).not.toBeInTheDocument()
    })
  })

  it('shows create bet button and cancel button', () => {
    const Wrapper = createWrapper()
    render(<AddBet />, { wrapper: Wrapper })

    expect(screen.getByRole('button', { name: /create bet/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })
})