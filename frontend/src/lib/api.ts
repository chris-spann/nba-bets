const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Unified Bet type matching the backend model
export interface Bet {
  id: number
  bet_type: string
  bet_placed_date: string
  game_date: string
  team: string
  opponent: string
  player_name?: string // Optional - only for player bets
  prop_type?: string // Optional - only for player bets
  description?: string // Calculated description based on bet type
  prop_line: string
  over_under?: string
  wager_amount: string
  odds: number
  result: string
  actual_value?: string
  payout?: string
  notes?: string
  created_at: string
  updated_at?: string
}

export interface BetSummary {
  total_bets: number
  total_wins: number
  total_losses: number
  win_rate: number
  player_bets: {
    total: number
    wins: number
    losses: number
    win_rate: number
  }
  non_player_bets: {
    total: number
    wins: number
    losses: number
    win_rate: number
  }
}

// Legacy types for backwards compatibility during migration
export type PlayerBet = Bet & { player_name: string; prop_type: string }
export type TeamBet = Bet & { description: string }

export class ApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = `${API_BASE_URL}/api/v1`
  }

  async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('API request error:', error)
      throw error
    }
  }

  // Unified bet endpoints
  async getBets(params?: {
    bet_type?: string
    player_name?: string
    team?: string
    result?: string
    limit?: number
    offset?: number
  }): Promise<Bet[]> {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    const query = searchParams.toString()
    return this.request<Bet[]>(`/bets${query ? `?${query}` : ''}`)
  }

  async getBet(id: number): Promise<Bet> {
    return this.request<Bet>(`/bets/${id}`)
  }

  async createBet(bet: Omit<Bet, 'id' | 'created_at' | 'updated_at'>): Promise<Bet> {
    return this.request<Bet>('/bets', {
      method: 'POST',
      body: JSON.stringify(bet),
    })
  }

  async updateBet(id: number, bet: Partial<Bet>): Promise<Bet> {
    return this.request<Bet>(`/bets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(bet),
    })
  }

  async deleteBet(id: number): Promise<void> {
    return this.request<void>(`/bets/${id}`, {
      method: 'DELETE',
    })
  }

  // Legacy methods for backwards compatibility
  async getPlayerBets(): Promise<PlayerBet[]> {
    const bets = await this.getBets({ bet_type: 'player_prop' })
    return bets.filter((bet): bet is PlayerBet => bet.player_name !== undefined && bet.prop_type !== undefined)
  }

  async getTeamBets(): Promise<TeamBet[]> {
    const bets = await this.getBets()
    return bets.filter((bet): bet is TeamBet =>
      bet.player_name === undefined && bet.description !== undefined,
    )
  }

  // Analytics endpoints
  async getBetSummary(): Promise<BetSummary> {
    return this.request<BetSummary>('/bets/analytics/summary')
  }
}

export const api = new ApiClient()
