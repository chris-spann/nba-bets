import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { Dashboard } from './Dashboard'
import { api, type Bet, type BetSummary } from '../lib/api'

// Mock the API
vi.mock('../lib/api', () => ({
  api: {
    getBetSummary: vi.fn(),
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

const mockSummary: BetSummary = {
  total_bets: 15,
  total_wins: 8,
  total_losses: 5,
  win_rate: 53.3,
  player_bets: {
    total: 10,
    wins: 5,
    losses: 3,
    win_rate: 50.0,
  },
  non_player_bets: {
    total: 5,
    wins: 3,
    losses: 2,
    win_rate: 60.0,
  },
}

const mockBets: Bet[] = [
  {
    id: 1,
    bet_type: 'player_prop',
    bet_placed_date: '2025-01-15T18:00:00',
    game_date: '2025-01-15T20:00:00',
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
    created_at: '2025-01-15T18:00:00',
    updated_at: '2025-01-15T18:00:00',
  },
  {
    id: 2,
    bet_type: 'spread',
    bet_placed_date: '2025-01-14T18:00:00',
    game_date: '2025-01-14T20:00:00',
    team: 'BOS',
    opponent: 'MIA',
    prop_description: 'BOS -5.5',
    prop_line: '5.5',
    over_under: 'under',
    wager_amount: '30.00',
    odds: -110,
    result: 'loss',
    created_at: '2025-01-14T18:00:00',
  },
  {
    id: 3,
    bet_type: 'player_prop',
    bet_placed_date: '2025-01-13T18:00:00',
    game_date: '2025-01-13T20:00:00',
    team: 'PHX',
    opponent: 'LAC',
    player_name: 'Kevin Durant',
    prop_type: 'rebounds',
    prop_line: '7.5',
    over_under: 'over',
    wager_amount: '25.00',
    odds: +105,
    result: 'pending',
    created_at: '2025-01-13T18:00:00',
  },
  {
    id: 4,
    bet_type: 'moneyline',
    bet_placed_date: '2025-01-12T18:00:00',
    game_date: '2025-01-12T20:00:00',
    team: 'DEN',
    opponent: 'MIN',
    prop_description: 'DEN ML',
    prop_line: '0',
    wager_amount: '40.00',
    odds: +150,
    result: 'push',
    payout: '40.00',
    created_at: '2025-01-12T18:00:00',
  },
  {
    id: 5,
    bet_type: 'player_prop',
    bet_placed_date: '2025-01-11T18:00:00',
    game_date: '2025-01-11T20:00:00',
    team: 'CHI',
    opponent: 'NYK',
    player_name: 'DeMar DeRozan',
    prop_type: 'assists',
    prop_line: '5.5',
    over_under: 'under',
    wager_amount: '35.00',
    odds: -120,
    result: 'win',
    payout: '64.17',
    created_at: '2025-01-11T18:00:00',
  },
]

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state correctly', async () => {
    // Make API calls hang to show loading state
    mockApi.getBetSummary.mockImplementation(() => new Promise(() => {}))
    mockApi.getBets.mockImplementation(() => new Promise(() => {}))

    const Wrapper = createWrapper()
    render(<Dashboard />, { wrapper: Wrapper })

    // Should show loading skeleton with animate-pulse class
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()

    // Should show skeleton elements
    const skeletonElements = document.querySelectorAll('.animate-pulse div')
    expect(skeletonElements.length).toBeGreaterThan(0)
  })

  it('renders page header correctly', async () => {
    mockApi.getBetSummary.mockResolvedValue(mockSummary)
    mockApi.getBets.mockResolvedValue(mockBets)

    const Wrapper = createWrapper()
    render(<Dashboard />, { wrapper: Wrapper })

    expect(await screen.findByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Overview of your NBA betting performance')).toBeInTheDocument()
  })

  it('displays summary statistics correctly', async () => {
    mockApi.getBetSummary.mockResolvedValue(mockSummary)
    mockApi.getBets.mockResolvedValue(mockBets)

    const Wrapper = createWrapper()
    render(<Dashboard />, { wrapper: Wrapper })

    // Wait for summary data to load
    expect(await screen.findByText('Total Bets')).toBeInTheDocument()
    expect(screen.getByText('15')).toBeInTheDocument()

    expect(screen.getByText('Win Rate')).toBeInTheDocument()
    expect(screen.getByText('53.3%')).toBeInTheDocument()

    expect(screen.getByText('Net P&L')).toBeInTheDocument()
    expect(screen.getByText('Pending Bets')).toBeInTheDocument()
  })

  it('calculates and displays net P&L correctly for positive winnings', async () => {
    const profitableBets: Bet[] = [
      {
        ...mockBets[0],
        result: 'win',
        wager_amount: '50.00',
        payout: '95.45',
      },
      {
        ...mockBets[4],
        result: 'win',
        wager_amount: '35.00',
        payout: '64.17',
      },
    ]

    mockApi.getBetSummary.mockResolvedValue(mockSummary)
    mockApi.getBets.mockResolvedValue(profitableBets)

    const Wrapper = createWrapper()
    render(<Dashboard />, { wrapper: Wrapper })

    // Net P&L should be positive: (95.45 - 50) + (64.17 - 35) = 45.45 + 29.17 = 74.62
    await waitFor(() => {
      expect(screen.getByText('+$74.62')).toBeInTheDocument()
    })

    // Should have green color for positive P&L
    const plElement = screen.getByText('+$74.62')
    expect(plElement).toHaveClass('text-green-600')
  })

  it('calculates and displays net P&L correctly for negative winnings', async () => {
    const losingBets: Bet[] = [
      {
        ...mockBets[1],
        result: 'loss',
        wager_amount: '50.00',
        payout: '0',
      },
      {
        ...mockBets[0],
        result: 'loss',
        wager_amount: '30.00',
        payout: '0',
      },
    ]

    mockApi.getBetSummary.mockResolvedValue(mockSummary)
    mockApi.getBets.mockResolvedValue(losingBets)

    const Wrapper = createWrapper()
    render(<Dashboard />, { wrapper: Wrapper })

    // Net P&L should be negative: (0 - 50) + (0 - 30) = -80
    await waitFor(() => {
      expect(screen.getByText((content, element) => {
        return element?.textContent === '$-80.00' || element?.textContent === '-$80.00'
      })).toBeInTheDocument()
    })

    // Should have red color for negative P&L
    const plElement = screen.getByText((content, element) => {
      return element?.textContent === '$-80.00' || element?.textContent === '-$80.00'
    })
    expect(plElement).toHaveClass('text-red-600')
  })

  it('counts pending bets correctly', async () => {
    const betsWithPending: Bet[] = [
      { ...mockBets[0], result: 'pending' },
      { ...mockBets[1], result: 'win' },
      { ...mockBets[2], result: 'pending' },
      { ...mockBets[3], result: 'loss' },
      { ...mockBets[4], result: 'pending' },
    ]

    mockApi.getBetSummary.mockResolvedValue(mockSummary)
    mockApi.getBets.mockResolvedValue(betsWithPending)

    const Wrapper = createWrapper()
    render(<Dashboard />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByText('Pending Bets')).toBeInTheDocument()
    })

    // Should show 3 pending bets
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('displays recent activity section with bet details', async () => {
    mockApi.getBetSummary.mockResolvedValue(mockSummary)
    mockApi.getBets.mockResolvedValue(mockBets)

    const Wrapper = createWrapper()
    render(<Dashboard />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByText('Recent Activity')).toBeInTheDocument()
    })

    // Check for recent bet details (should show most recent bets first)
    expect(screen.getByText('LeBron James points over 25.5')).toBeInTheDocument()
    expect(screen.getByText(/LAL.*vs.*GSW/)).toBeInTheDocument()
    expect(screen.getByText('BOS -5.5')).toBeInTheDocument()
    expect(screen.getByText('Kevin Durant rebounds over 7.5')).toBeInTheDocument()
  })

  it('displays bet result badges with correct styling', async () => {
    mockApi.getBetSummary.mockResolvedValue(mockSummary)
    mockApi.getBets.mockResolvedValue(mockBets)

    const Wrapper = createWrapper()
    render(<Dashboard />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getAllByText('WIN').length).toBeGreaterThan(0)
    })

    // Check for different result badges
    expect(screen.getAllByText('WIN').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('LOSS')).toBeInTheDocument()
    expect(screen.getByText('PENDING')).toBeInTheDocument()
    expect(screen.getByText('PUSH')).toBeInTheDocument()
  })

  it('displays wager amounts and odds correctly', async () => {
    mockApi.getBetSummary.mockResolvedValue(mockSummary)
    mockApi.getBets.mockResolvedValue(mockBets)

    const Wrapper = createWrapper()
    render(<Dashboard />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByText('$50.00 @ -110')).toBeInTheDocument()
    })

    // Check for different wager formats
    expect(screen.getByText('$30.00 @ -110')).toBeInTheDocument()
    expect(screen.getByText('$25.00 @ +105')).toBeInTheDocument()
    expect(screen.getByText('$40.00 @ +150')).toBeInTheDocument()
  })

  it('displays payout amounts with correct color coding', async () => {
    mockApi.getBetSummary.mockResolvedValue(mockSummary)
    mockApi.getBets.mockResolvedValue(mockBets)

    const Wrapper = createWrapper()
    render(<Dashboard />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByText('$95.45')).toBeInTheDocument()
    })

    // Profitable bet should be green
    const profitPayout = screen.getByText('$95.45')
    expect(profitPayout).toHaveClass('text-green-600')

    // Push payout (same as wager) should be gray
    const pushPayout = screen.getByText('$40.00')
    expect(pushPayout).toHaveClass('text-gray-600')
  })

  it('shows empty state when no bets exist', async () => {
    mockApi.getBetSummary.mockResolvedValue({
      ...mockSummary,
      total_bets: 0,
      total_wins: 0,
      total_losses: 0,
      win_rate: 0,
    })
    mockApi.getBets.mockResolvedValue([])

    const Wrapper = createWrapper()
    render(<Dashboard />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByText('No bets recorded yet.')).toBeInTheDocument()
    })

    expect(screen.getByText('Add your first bet')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Add your first bet' })).toHaveAttribute('href', '/add-bet')
  })

  it('limits recent activity to 5 bets', async () => {
    const manyBets = Array.from({ length: 10 }, (_, i) => ({
      ...mockBets[0],
      id: i + 1,
      bet_placed_date: `2025-01-${20 - i}T18:00:00`, // Different dates for sorting
      player_name: `Player ${i + 1}`,
    }))

    mockApi.getBetSummary.mockResolvedValue(mockSummary)
    mockApi.getBets.mockResolvedValue(manyBets)

    const Wrapper = createWrapper()
    render(<Dashboard />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByText('Recent Activity')).toBeInTheDocument()
    })

    // Should only show 5 bets (Player 1 through Player 5, sorted by most recent)
    expect(screen.getByText('Player 1 points over 25.5')).toBeInTheDocument()
    expect(screen.getByText('Player 5 points over 25.5')).toBeInTheDocument()
    expect(screen.queryByText('Player 6 points over 25.5')).not.toBeInTheDocument()
  })

  it('formats dates correctly', async () => {
    const betWithSpecificDate = {
      ...mockBets[0],
      game_date: '2025-12-25T20:00:00', // Christmas game
    }

    mockApi.getBetSummary.mockResolvedValue(mockSummary)
    mockApi.getBets.mockResolvedValue([betWithSpecificDate])

    const Wrapper = createWrapper()
    render(<Dashboard />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByText(/Dec 25/)).toBeInTheDocument()
    })
  })

  it('handles API errors gracefully', async () => {
    mockApi.getBetSummary.mockRejectedValue(new Error('API Error'))
    mockApi.getBets.mockRejectedValue(new Error('API Error'))

    const Wrapper = createWrapper()
    render(<Dashboard />, { wrapper: Wrapper })

    // Should eventually show some error handling or empty state
    // Since the component doesn't explicitly handle errors,
    // React Query will handle retries and eventual error state
    await waitFor(() => {
      // Component should still render but with no data
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })
  })

  it('handles missing payout data correctly', async () => {
    const betsWithoutPayout = [
      {
        ...mockBets[0],
        payout: undefined,
        result: 'pending',
      },
    ]

    mockApi.getBetSummary.mockResolvedValue(mockSummary)
    mockApi.getBets.mockResolvedValue(betsWithoutPayout)

    const Wrapper = createWrapper()
    render(<Dashboard />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByText('PENDING')).toBeInTheDocument()
    })

    // Should show wager but no payout for pending bets
    expect(screen.getByText('$50.00 @ -110')).toBeInTheDocument()
    expect(screen.queryByText('$95.45')).not.toBeInTheDocument()
  })
})