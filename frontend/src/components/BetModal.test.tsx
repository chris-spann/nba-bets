import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BetModal } from './BetModal'
import type { Bet } from '../lib/api'

// Mock the API
vi.mock('../lib/api', () => ({
  api: {
    createBet: vi.fn(),
    updateBet: vi.fn(),
  },
}))

const mockBet: Bet = {
  id: 1,
  bet_type: 'player_prop',
  bet_placed_date: '2023-10-08T20:00:00',
  game_date: '2023-10-10T20:00:00',
  team: 'LAL',
  opponent: 'GSW',
  player_name: 'LeBron James',
  prop_type: 'points',
  prop_description: '',
  prop_line: '25.5',
  over_under: 'over',
  wager_amount: '50.00',
  odds: -110,
  result: 'pending',
  actual_value: '',
  payout: '',
  notes: 'Test bet',
  created_at: '2023-10-08T20:00:00',
  updated_at: '2023-10-08T20:00:00',
}

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
      {children}
    </QueryClientProvider>
  )
}

describe('BetModal', () => {
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockOnClose.mockClear()
  })

  it('does not render when isOpen is false', () => {
    const Wrapper = createWrapper()
    const { container } = render(
      <BetModal isOpen={false} onClose={mockOnClose} />,
      { wrapper: Wrapper },
    )

    expect(container.firstChild).toBeNull()
  })

  it('renders modal when isOpen is true', () => {
    const Wrapper = createWrapper()
    render(
      <BetModal isOpen={true} onClose={mockOnClose} />,
      { wrapper: Wrapper },
    )

    expect(screen.getByText('Add New Bet')).toBeInTheDocument()
    expect(screen.getByText('Bet Type')).toBeInTheDocument()
    expect(screen.getByText('Choose the type of bet you\'re placing')).toBeInTheDocument()
  })

  it('renders edit mode when editBet is provided', () => {
    const Wrapper = createWrapper()
    render(
      <BetModal isOpen={true} onClose={mockOnClose} editBet={mockBet} />,
      { wrapper: Wrapper },
    )

    expect(screen.getByText('Edit Bet')).toBeInTheDocument()
    expect(screen.getByDisplayValue('LeBron James')).toBeInTheDocument()
    // Check the number input for prop_line value (no more range input)
    expect(screen.getByDisplayValue('25.5')).toBeInTheDocument()
    expect(screen.getByDisplayValue('50.00')).toBeInTheDocument()
  })

  it('shows default values for new bet', () => {
    const Wrapper = createWrapper()
    render(
      <BetModal isOpen={true} onClose={mockOnClose} />,
      { wrapper: Wrapper },
    )

    // Should show default wager amount
    expect(screen.getByDisplayValue('25')).toBeInTheDocument()
    // Should show default prop line (single number input)
    expect(screen.getByDisplayValue('-3')).toBeInTheDocument()
    // Should show default odds
    expect(screen.getByDisplayValue('-110')).toBeInTheDocument()
  })

  it('displays correct prop types', async () => {
    const user = userEvent.setup()
    const Wrapper = createWrapper()
    render(
      <BetModal isOpen={true} onClose={mockOnClose} />,
      { wrapper: Wrapper },
    )

    // Since default is now spread, need to switch to player prop first
    const playerPropButton = screen.getByText('Player Prop')
    await user.click(playerPropButton)

    await waitFor(() => {
      const propTypeSelect = screen.getByDisplayValue('PTS')
      expect(propTypeSelect).toBeInTheDocument()

      // Check if all expected prop types are available
      fireEvent.click(propTypeSelect)
      expect(screen.getByRole('option', { name: 'PTS' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'REB' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'AST' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: '3PM' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'PRA' })).toBeInTheDocument()
    })
  })

  it('shows player fields when player_prop is selected', async () => {
    const user = userEvent.setup()
    const Wrapper = createWrapper()
    render(
      <BetModal isOpen={true} onClose={mockOnClose} />,
      { wrapper: Wrapper },
    )

    // Default is spread, so player name shouldn't be visible initially
    expect(screen.queryByLabelText(/player name/i)).not.toBeInTheDocument()

    // Click on player prop
    const playerPropButton = screen.getByText('Player Prop')
    await user.click(playerPropButton)

    // Now player fields should be visible
    await waitFor(() => {
      expect(screen.getByLabelText(/player name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/prop type/i)).toBeInTheDocument()
    })
  })

  it('shows spread line when spread is selected', async () => {
    const _user = userEvent.setup()
    const Wrapper = createWrapper()
    render(
      <BetModal isOpen={true} onClose={mockOnClose} />,
      { wrapper: Wrapper },
    )

    // Spread is now the default, so it should be already selected
    expect(screen.getByText('Spread Line')).toBeInTheDocument()
    expect(screen.queryByLabelText(/player name/i)).not.toBeInTheDocument()
  })

  it('shows over/under for applicable bet types', async () => {
    const user = userEvent.setup()
    const Wrapper = createWrapper()
    render(
      <BetModal isOpen={true} onClose={mockOnClose} />,
      { wrapper: Wrapper },
    )

    // Spread is default and should not show over/under
    expect(screen.queryByText('Over/Under')).not.toBeInTheDocument()

    // Switch to player prop - should show over/under
    const playerPropButton = screen.getByText('Player Prop')
    await user.click(playerPropButton)

    await waitFor(() => {
      expect(screen.getByText('Over/Under')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Over' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Under' })).toBeInTheDocument()
    })
  })

  it('closes modal when cancel button is clicked', async () => {
    const user = userEvent.setup()
    const Wrapper = createWrapper()
    render(
      <BetModal isOpen={true} onClose={mockOnClose} />,
      { wrapper: Wrapper },
    )

    // Use the specific cancel button at the bottom of the form
    const cancelButton = screen.getByRole('button', { name: 'Cancel' })
    await user.click(cancelButton)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('closes modal when X button is clicked', async () => {
    const user = userEvent.setup()
    const Wrapper = createWrapper()
    render(
      <BetModal isOpen={true} onClose={mockOnClose} />,
      { wrapper: Wrapper },
    )

    const closeButton = screen.getByRole('button', { name: '' }) // X button has no text
    await user.click(closeButton)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })



  it('allows team selection from dropdown', async () => {
    const user = userEvent.setup()
    const Wrapper = createWrapper()
    render(
      <BetModal isOpen={true} onClose={mockOnClose} />,
      { wrapper: Wrapper },
    )

    const teamSelect = screen.getByLabelText(/team/i)
    await user.selectOptions(teamSelect, 'LAL')

    expect(teamSelect).toHaveValue('LAL')

    const opponentSelect = screen.getByLabelText(/opponent/i)
    await user.selectOptions(opponentSelect, 'GSW')

    expect(opponentSelect).toHaveValue('GSW')
  })

  it('prevents team from playing itself', async () => {
    const user = userEvent.setup()
    const Wrapper = createWrapper()
    render(
      <BetModal isOpen={true} onClose={mockOnClose} />,
      { wrapper: Wrapper },
    )

    // Select LAL as team
    const teamSelect = screen.getByLabelText(/team/i)
    await user.selectOptions(teamSelect, 'LAL')
    expect(teamSelect).toHaveValue('LAL')

    // Try to select LAL as opponent - it should not be available
    const opponentSelect = screen.getByLabelText(/opponent/i)
    const opponentOptions = opponentSelect.querySelectorAll('option')
    const lalOption = Array.from(opponentOptions).find(option => option.value === 'LAL')
    expect(lalOption).toBeUndefined()

    // Select a different opponent (should work)
    await user.selectOptions(opponentSelect, 'GSW')
    expect(opponentSelect).toHaveValue('GSW')

    // Now verify that GSW is not available in team options
    const teamOptions = teamSelect.querySelectorAll('option')
    const gswTeamOption = Array.from(teamOptions).find(option => option.value === 'GSW')
    expect(gswTeamOption).toBeUndefined()

    // Change opponent to something else to see if GSW becomes available in team again
    await user.selectOptions(opponentSelect, 'BOS')
    expect(opponentSelect).toHaveValue('BOS')

    // Now GSW should be available in team options again
    const updatedTeamOptions = teamSelect.querySelectorAll('option')
    const gswAvailableOption = Array.from(updatedTeamOptions).find(option => option.value === 'GSW')
    expect(gswAvailableOption).toBeDefined()
  })

  it('has correct default dates', () => {
    const Wrapper = createWrapper()
    render(
      <BetModal isOpen={true} onClose={mockOnClose} />,
      { wrapper: Wrapper },
    )

    const today = new Date().toISOString().slice(0, 10)

    const betPlacedDateInput = screen.getByLabelText(/bet placed date/i)
    const gameDateInput = screen.getByLabelText(/game date/i)

    expect(betPlacedDateInput).toHaveValue(today)
    expect(gameDateInput).toHaveValue(today)
  })

  it('removes asterisks from labels', () => {
    const Wrapper = createWrapper()
    render(
      <BetModal isOpen={true} onClose={mockOnClose} />,
      { wrapper: Wrapper },
    )

    // Check that visible labels don't contain asterisks (Player Name not visible in spread default)
    expect(screen.getByText('Bet Placed Date')).toBeInTheDocument()
    expect(screen.getByText('Game Date')).toBeInTheDocument()
    expect(screen.getByText('Team')).toBeInTheDocument()
    expect(screen.getByText('Opponent')).toBeInTheDocument()
    expect(screen.getByText('Wager Amount')).toBeInTheDocument()
    expect(screen.getByText('Odds')).toBeInTheDocument()

    // Player Name should not be visible since default is spread
    expect(screen.queryByText('Player Name')).not.toBeInTheDocument()

    // Ensure no asterisks are present
    expect(screen.queryByText(/\*/)).not.toBeInTheDocument()
  })
})
