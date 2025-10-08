import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { PropBets } from './PropBets'
import { api } from '../lib/api'

// Mock the API
vi.mock('../lib/api', () => ({
  api: {
    getBets: vi.fn(),
    deleteBet: vi.fn(),
  },
}))

const mockApi = vi.mocked(api)

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

describe('PropBets', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the page header correctly', async () => {
    mockApi.getBets.mockResolvedValue([])
    const Wrapper = createWrapper()
    render(<PropBets />, { wrapper: Wrapper })

    // Wait for loading to complete and content to be rendered
    expect(await screen.findByText('History')).toBeInTheDocument()
    expect(screen.getByText(/Track all your NBA betting history/)).toBeInTheDocument()
  })

  it('handles empty state correctly when no bets are present', async () => {
    mockApi.getBets.mockResolvedValue([])
    const Wrapper = createWrapper()
    render(<PropBets />, { wrapper: Wrapper })

    // Should show empty state message when there are no bets
    expect(await screen.findByText('No bets found.')).toBeInTheDocument()
    expect(screen.getByText('Add your first bet')).toBeInTheDocument()

    // Table should not be rendered when there are no bets
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('shows table with headers when bets are present', async () => {
    const mockBets = [
      {
        id: 1,
        bet_type: 'player_prop',
        bet_placed_date: '2025-10-08T18:00:00',
        game_date: '2025-10-08T20:00:00',
        team: 'LAL',
        opponent: 'GSW',
        player_name: 'LeBron James',
        prop_type: 'points',
        prop_line: '25.5',
        over_under: 'over',
        wager_amount: '50.00',
        odds: -110,
        result: 'win',
        payout: '95.45',
        created_at: '2025-10-08T18:00:00',
        updated_at: '2025-10-08T18:00:00',
      },
      {
        id: 2,
        bet_type: 'team_prop',
        bet_placed_date: '2025-10-07T18:00:00',
        game_date: '2025-10-07T20:00:00',
        team: 'BOS',
        opponent: 'MIA',
        prop_description: 'Team Total Points',
        prop_line: '115.5',
        over_under: 'under',
        wager_amount: '30.00',
        odds: +105,
        result: 'loss',
        created_at: '2025-10-07T18:00:00',
      },
    ]

    mockApi.getBets.mockResolvedValue(mockBets)
    const Wrapper = createWrapper()
    render(<PropBets />, { wrapper: Wrapper })

    // Wait for table to appear
    expect(await screen.findByRole('table')).toBeInTheDocument()

    // Check table headers
    expect(screen.getByText('Bet Placed')).toBeInTheDocument()
    expect(screen.getByText('Type')).toBeInTheDocument()
    expect(screen.getByText('Details')).toBeInTheDocument()
    expect(screen.getByText('Game')).toBeInTheDocument()
    expect(screen.getByText('Wager')).toBeInTheDocument()
    expect(screen.getByText('Result')).toBeInTheDocument()
    expect(screen.getByText('P&L')).toBeInTheDocument()
    expect(screen.getByText('Actions')).toBeInTheDocument()
  })

  it('displays bet data correctly in table rows', async () => {
    const mockBets = [
      {
        id: 1,
        bet_type: 'player_prop',
        bet_placed_date: '2025-10-08T18:00:00',
        game_date: '2025-10-08T20:00:00',
        team: 'LAL',
        opponent: 'GSW',
        player_name: 'LeBron James',
        prop_type: 'points',
        prop_line: '25.5',
        over_under: 'over',
        wager_amount: '50.00',
        odds: -110,
        result: 'win',
        payout: '95.45',
        created_at: '2025-10-08T18:00:00',
      },
    ]

    mockApi.getBets.mockResolvedValue(mockBets)
    const Wrapper = createWrapper()
    render(<PropBets />, { wrapper: Wrapper })

    // Wait for table content
    expect(await screen.findByText('LeBron James Points')).toBeInTheDocument()
    expect(screen.getByText('LAL vs GSW')).toBeInTheDocument()
    expect(screen.getByText('$50.00')).toBeInTheDocument()
    expect(screen.getByText('WIN')).toBeInTheDocument()
    expect(screen.getByText('$95.45')).toBeInTheDocument()
  })

  it('shows summary statistics when bets are present', async () => {
    const mockBets = [
      {
        id: 1,
        bet_type: 'player_prop',
        bet_placed_date: '2025-10-08T18:00:00',
        game_date: '2025-10-08T20:00:00',
        team: 'LAL',
        opponent: 'GSW',
        player_name: 'LeBron James',
        prop_type: 'points',
        prop_line: '25.5',
        over_under: 'over',
        wager_amount: '50.00',
        odds: -110,
        result: 'win',
        payout: '95.45',
        created_at: '2025-10-08T18:00:00',
      },
      {
        id: 2,
        bet_type: 'spread',
        bet_placed_date: '2025-10-07T18:00:00',
        game_date: '2025-10-07T20:00:00',
        team: 'BOS',
        opponent: 'MIA',
        prop_description: 'BOS -5.5',
        prop_line: '5.5',
        wager_amount: '30.00',
        odds: -110,
        result: 'loss',
        created_at: '2025-10-07T18:00:00',
      },
    ]

    mockApi.getBets.mockResolvedValue(mockBets)
    const Wrapper = createWrapper()
    render(<PropBets />, { wrapper: Wrapper })

    // Wait for summary statistics to appear
    await waitFor(() => {
      expect(screen.getByText('Total Bets:')).toBeInTheDocument()
    })

    expect(screen.getByText('Win Rate:')).toBeInTheDocument()
    expect(screen.getByText('Net P&L:')).toBeInTheDocument()
    expect(screen.getByText('By Type:')).toBeInTheDocument()
  })

  it('handles sorting when table headers are clicked', async () => {
    const user = userEvent.setup()
    const mockBets = [
      {
        id: 1,
        bet_type: 'player_prop',
        bet_placed_date: '2025-10-08T18:00:00',
        game_date: '2025-10-08T20:00:00',
        team: 'LAL',
        opponent: 'GSW',
        player_name: 'LeBron James',
        prop_type: 'points',
        prop_line: '25.5',
        over_under: 'over',
        wager_amount: '50.00',
        odds: -110,
        result: 'win',
        created_at: '2025-10-08T18:00:00',
      },
      {
        id: 2,
        bet_type: 'team_prop',
        bet_placed_date: '2025-10-07T18:00:00',
        game_date: '2025-10-07T20:00:00',
        team: 'BOS',
        opponent: 'MIA',
        description: 'BOS',
        prop_line: '115.5',
        wager_amount: '30.00',
        odds: -110,
        result: 'loss',
        created_at: '2025-10-07T18:00:00',
      },
    ]

    mockApi.getBets.mockResolvedValue(mockBets)
    const Wrapper = createWrapper()
    render(<PropBets />, { wrapper: Wrapper })

    // Wait for table to load
    const typeHeader = await screen.findByText('Type')

    // Click to sort by type
    await user.click(typeHeader)

    // The component should still render (testing that sorting doesn't crash)
    expect(screen.getByRole('table')).toBeInTheDocument()
  })

  it('handles API error gracefully', async () => {
    mockApi.getBets.mockRejectedValue(new Error('API Error'))
    const Wrapper = createWrapper()
    render(<PropBets />, { wrapper: Wrapper })

    // Component should show error message
    expect(await screen.findByText(/Error loading bets/)).toBeInTheDocument()
    expect(screen.getByText('Try again')).toBeInTheDocument()
  })

  it('displays different bet categories correctly', async () => {
    const mockBets = [
      {
        id: 1,
        bet_type: 'player_prop',
        bet_placed_date: '2025-10-08T18:00:00',
        game_date: '2025-10-08T20:00:00',
        team: 'LAL',
        opponent: 'GSW',
        player_name: 'LeBron James',
        prop_type: 'points',
        prop_line: '25.5',
        wager_amount: '50.00',
        odds: -110,
        result: 'win',
        created_at: '2025-10-08T18:00:00',
      },
      {
        id: 2,
        bet_type: 'team_prop',
        bet_placed_date: '2025-10-07T18:00:00',
        game_date: '2025-10-07T20:00:00',
        team: 'BOS',
        opponent: 'MIA',
        description: 'BOS',
        prop_line: '215.5',
        wager_amount: '30.00',
        odds: -110,
        result: 'loss',
        created_at: '2025-10-07T18:00:00',
      },
    ]

    mockApi.getBets.mockResolvedValue(mockBets)
    const Wrapper = createWrapper()
    render(<PropBets />, { wrapper: Wrapper })

    // Wait for content and check bet type badges
    await waitFor(() => {
      // Player Prop bet type should be shown
      expect(screen.getByText('Player Prop')).toBeInTheDocument()
      // Team Prop bet type should be shown
      expect(screen.getByText('Team Prop')).toBeInTheDocument()
    })
    const gameElements = screen.getAllByText('Game')
    expect(gameElements.length).toBeGreaterThan(0)
  })

  it('opens add bet modal when add button is clicked', async () => {
    const user = userEvent.setup()
    mockApi.getBets.mockResolvedValue([])
    const Wrapper = createWrapper()
    render(<PropBets />, { wrapper: Wrapper })

    // Click the add bet button
    const addButton = await screen.findByRole('button', { name: 'Add new bet' })
    await user.click(addButton)

    // Modal should appear
    expect(screen.getByTestId('bet-modal')).toBeInTheDocument()
    expect(screen.getByText('Add New Bet')).toBeInTheDocument()
  })

  it('opens add bet modal from empty state link', async () => {
    const user = userEvent.setup()
    mockApi.getBets.mockResolvedValue([])
    const Wrapper = createWrapper()
    render(<PropBets />, { wrapper: Wrapper })

    // Click the "Add your first bet" link
    const addLink = await screen.findByText('Add your first bet')
    await user.click(addLink)

    // Modal should appear
    expect(screen.getByTestId('bet-modal')).toBeInTheDocument()
    expect(screen.getByText('Add New Bet')).toBeInTheDocument()
  })

  it('opens edit modal when edit button is clicked', async () => {
    const user = userEvent.setup()
    const mockBets = [
      {
        id: 1,
        bet_type: 'player_prop',
        bet_placed_date: '2025-10-08T18:00:00',
        game_date: '2025-10-08T20:00:00',
        team: 'LAL',
        opponent: 'GSW',
        player_name: 'LeBron James',
        prop_type: 'points',
        prop_line: '25.5',
        over_under: 'over',
        wager_amount: '50.00',
        odds: -110,
        result: 'win',
        payout: '95.45',
        created_at: '2025-10-08T18:00:00',
      },
    ]

    mockApi.getBets.mockResolvedValue(mockBets)
    const Wrapper = createWrapper()
    render(<PropBets />, { wrapper: Wrapper })

    // Wait for bet data to load and find edit button
    await waitFor(() => {
      expect(screen.getByText('LeBron James Points')).toBeInTheDocument()
    })

    const editButton = screen.getByTitle('Edit bet')
    await user.click(editButton)

    // Edit modal should appear
    expect(screen.getByTestId('bet-modal')).toBeInTheDocument()
    expect(screen.getByText('Edit Bet')).toBeInTheDocument()
  })

  it('opens delete confirmation modal when delete button is clicked', async () => {
    const user = userEvent.setup()
    const mockBets = [
      {
        id: 1,
        bet_type: 'player_prop',
        bet_placed_date: '2025-10-08T18:00:00',
        game_date: '2025-10-08T20:00:00',
        team: 'LAL',
        opponent: 'GSW',
        player_name: 'LeBron James',
        prop_type: 'points',
        prop_line: '25.5',
        over_under: 'over',
        wager_amount: '50.00',
        odds: -110,
        result: 'win',
        created_at: '2025-10-08T18:00:00',
      },
    ]

    mockApi.getBets.mockResolvedValue(mockBets)
    mockApi.deleteBet.mockResolvedValue(undefined)
    const Wrapper = createWrapper()
    render(<PropBets />, { wrapper: Wrapper })

    // Wait for bet data to load and find delete button
    await waitFor(() => {
      expect(screen.getByText('LeBron James Points')).toBeInTheDocument()
    })

    const deleteButton = screen.getByTitle('Delete bet')
    await user.click(deleteButton)

    // Delete confirmation modal should appear
    const deleteModal = screen.getByTestId('delete-modal')
    expect(deleteModal).toBeInTheDocument()
    // Look for the title inside the modal specifically
    expect(deleteModal.querySelector('h2')).toHaveTextContent('Delete Bet')
  })

  it('deletes bet when confirmed in delete modal', async () => {
    const user = userEvent.setup()
    const mockBets = [
      {
        id: 1,
        bet_type: 'player_prop',
        bet_placed_date: '2025-10-08T18:00:00',
        game_date: '2025-10-08T20:00:00',
        team: 'LAL',
        opponent: 'GSW',
        player_name: 'LeBron James',
        prop_type: 'points',
        prop_line: '25.5',
        over_under: 'over',
        wager_amount: '50.00',
        odds: -110,
        result: 'win',
        created_at: '2025-10-08T18:00:00',
      },
    ]

    mockApi.getBets.mockResolvedValue(mockBets)
    mockApi.deleteBet.mockResolvedValue(undefined)
    const Wrapper = createWrapper()
    render(<PropBets />, { wrapper: Wrapper })

    // Open delete modal
    await waitFor(() => {
      expect(screen.getByText('LeBron James Points')).toBeInTheDocument()
    })

    const deleteButton = screen.getByTitle('Delete bet')
    await user.click(deleteButton)

    // Confirm deletion - find the button specifically, not the title
    const confirmButton = await screen.findByRole('button', { name: 'Delete Bet' })
    await user.click(confirmButton)

    // API should be called
    expect(mockApi.deleteBet).toHaveBeenCalledWith(1)
  })

  it('closes modals when cancel/close buttons are clicked', async () => {
    const user = userEvent.setup()
    mockApi.getBets.mockResolvedValue([])
    const Wrapper = createWrapper()
    render(<PropBets />, { wrapper: Wrapper })

    // Open add modal
    const addButton = await screen.findByRole('button', { name: 'Add new bet' })
    await user.click(addButton)
    expect(screen.getByTestId('bet-modal')).toBeInTheDocument()

    // Close modal by clicking the X button instead of cancel (to avoid ambiguity)
    const closeButton = screen.getByRole('button', { name: '' }) // X button has no accessible name
    await user.click(closeButton)
    expect(screen.queryByTestId('bet-modal')).not.toBeInTheDocument()
  })
})
