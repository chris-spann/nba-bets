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
    expect(await screen.findByText('NBA Prop Bets')).toBeInTheDocument()
    expect(screen.getByText(/Track all your NBA prop betting history/)).toBeInTheDocument()
  })

  it('handles empty state correctly when no bets are present', async () => {
    mockApi.getBets.mockResolvedValue([])
    const Wrapper = createWrapper()
    render(<PropBets />, { wrapper: Wrapper })

    // Should show empty state message when there are no bets
    expect(await screen.findByText('No prop bets found.')).toBeInTheDocument()
    expect(screen.getByText('Add your first prop bet')).toBeInTheDocument()

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
    expect(screen.getByText('Prop Details')).toBeInTheDocument()
    expect(screen.getByText('Game')).toBeInTheDocument()
    expect(screen.getByText('Wager')).toBeInTheDocument()
    expect(screen.getByText('Result')).toBeInTheDocument()
    expect(screen.getByText('P&L')).toBeInTheDocument()
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
        prop_description: 'Team Total',
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
    expect(await screen.findByText(/Error loading prop bets/)).toBeInTheDocument()
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
        bet_type: 'game_total',
        bet_placed_date: '2025-10-07T18:00:00',
        game_date: '2025-10-07T20:00:00',
        team: 'BOS',
        opponent: 'MIA',
        prop_description: 'Game Total',
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

    // Wait for content and check category badges
    await waitFor(() => {
      // Player category should be shown
      expect(screen.getByText('Player')).toBeInTheDocument()
    })

    // Game category should be shown (there are multiple "Game" elements - header + badge)
    const gameElements = screen.getAllByText('Game')
    expect(gameElements.length).toBeGreaterThan(0)
  })
})
