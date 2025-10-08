import { describe, it, expect, beforeEach, vi, Mock } from 'vitest'
import { api, ApiClient, Bet, BetSummary, PlayerBet, TeamBet } from './api'

// Mock fetch globally
const mockFetch = vi.fn() as Mock
globalThis.fetch = mockFetch

// Mock environment variable
vi.mock('import.meta.env', () => ({
  VITE_API_URL: 'http://localhost:8000',
}))

describe('ApiClient', () => {
  let apiClient: ApiClient

  beforeEach(() => {
    vi.clearAllMocks()
    apiClient = new ApiClient()
  })

  describe('constructor', () => {
    it('should set baseUrl correctly with default environment', () => {
      expect(apiClient['baseUrl']).toBe('http://localhost:8000/api/v1')
    })

    it('should use VITE_API_URL when available', () => {
      // This is tested through the mock above
      expect(apiClient['baseUrl']).toBe('http://localhost:8000/api/v1')
    })
  })

  describe('request method', () => {
    it('should make a successful GET request', async () => {
      const mockData = { id: 1, name: 'test' }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockData),
      })

      const result = await apiClient.request<typeof mockData>('/test')

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/api/v1/test', {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      expect(result).toEqual(mockData)
    })

    it('should include custom headers', async () => {
      const mockData = { id: 1 }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockData),
      })

      await apiClient.request<typeof mockData>('/test', {
        headers: { 'Authorization': 'Bearer token' },
      })

expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/api/v1/test', {
        headers: {
          'Authorization': 'Bearer token',
        },
      })
    })

    it('should handle POST request with body', async () => {
      const mockData = { id: 1 }
      const requestBody = { name: 'test' }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockData),
      })

      await apiClient.request<typeof mockData>('/test', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/api/v1/test', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      })
    })

    it('should throw error on HTTP error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })

      await expect(apiClient.request('/test')).rejects.toThrow('API request failed: 404 Not Found')
    })

    it('should throw error on network failure', async () => {
      const networkError = new Error('Network error')
      mockFetch.mockRejectedValueOnce(networkError)

      await expect(apiClient.request('/test')).rejects.toThrow('Network error')
    })

    it('should log error on failure', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockFetch.mockRejectedValueOnce(new Error('Test error'))

      await expect(apiClient.request('/test')).rejects.toThrow()
      expect(consoleSpy).toHaveBeenCalledWith('API request error:', expect.any(Error))

      consoleSpy.mockRestore()
    })
  })

  describe('getBets', () => {
    const mockBets: Bet[] = [
      {
        id: 1,
        bet_type: 'player_prop',
        bet_placed_date: '2024-01-15',
        game_date: '2024-01-16',
        team: 'Lakers',
        opponent: 'Warriors',
        player_name: 'LeBron James',
        prop_type: 'points',
        prop_line: '25.5',
        over_under: 'over',
        wager_amount: '100',
        odds: -110,
        result: 'pending',
        created_at: '2024-01-15T10:00:00Z',
      },
    ]

    it('should fetch all bets without parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockBets),
      })

      const result = await apiClient.getBets()

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/api/v1/bets', {
        headers: { 'Content-Type': 'application/json' },
      })
      expect(result).toEqual(mockBets)
    })

    it('should fetch bets with query parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockBets),
      })

      const params = {
        bet_type: 'player_prop',
        player_name: 'LeBron James',
        team: 'Lakers',
        result: 'win',
        limit: 10,
        offset: 0,
      }

      await apiClient.getBets(params)

expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/bets?bet_type=player_prop&player_name=LeBron+James&team=Lakers&result=win&limit=10&offset=0',
        { headers: { 'Content-Type': 'application/json' } },
      )
    })

    it('should handle empty parameters object', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockBets),
      })

      await apiClient.getBets({})

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/api/v1/bets', {
        headers: { 'Content-Type': 'application/json' },
      })
    })

    it('should skip undefined parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockBets),
      })

      await apiClient.getBets({
        bet_type: 'player_prop',
        player_name: undefined,
        team: 'Lakers',
      })

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/bets?bet_type=player_prop&team=Lakers',
        { headers: { 'Content-Type': 'application/json' } },
      )
    })
  })

describe('getBet', () => {
    const mockBets: Bet[] = [
      {
        id: 1,
        bet_type: 'player_prop',
        bet_placed_date: '2024-01-15',
        game_date: '2024-01-16',
        team: 'Lakers',
        opponent: 'Warriors',
        player_name: 'LeBron James',
        prop_type: 'points',
        prop_line: '25.5',
        over_under: 'over',
        wager_amount: '100',
        odds: -110,
        result: 'pending',
        created_at: '2024-01-15T10:00:00Z',
      },
    ]

    it('should fetch a single bet by ID', async () => {
      const mockBet = mockBets[0]
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockBet),
      })

      const result = await apiClient.getBet(1)

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/api/v1/bets/1', {
        headers: { 'Content-Type': 'application/json' },
      })
      expect(result).toEqual(mockBet)
    })
  })

  describe('createBet', () => {
    it('should create a new bet', async () => {
      const newBet: Omit<Bet, 'id' | 'created_at' | 'updated_at'> = {
        bet_type: 'player_prop',
        bet_placed_date: '2024-01-15',
        game_date: '2024-01-16',
        team: 'Lakers',
        opponent: 'Warriors',
        player_name: 'LeBron James',
        prop_type: 'points',
        prop_line: '25.5',
        over_under: 'over',
        wager_amount: '100',
        odds: -110,
        result: 'pending',
      }

      const createdBet: Bet = {
        ...newBet,
        id: 1,
        created_at: '2024-01-15T10:00:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(createdBet),
      })

      const result = await apiClient.createBet(newBet)

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/api/v1/bets', {
        method: 'POST',
        body: JSON.stringify(newBet),
        headers: { 'Content-Type': 'application/json' },
      })
      expect(result).toEqual(createdBet)
    })
  })

  describe('updateBet', () => {
    it('should update an existing bet', async () => {
      const updateData: Partial<Bet> = {
        result: 'win',
        payout: '190.90',
        actual_value: '28',
      }

      const updatedBet: Bet = {
        id: 1,
        bet_type: 'player_prop',
        bet_placed_date: '2024-01-15',
        game_date: '2024-01-16',
        team: 'Lakers',
        opponent: 'Warriors',
        player_name: 'LeBron James',
        prop_type: 'points',
        prop_line: '25.5',
        over_under: 'over',
        wager_amount: '100',
        odds: -110,
        result: 'win',
        actual_value: '28',
        payout: '190.90',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-16T20:00:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(updatedBet),
      })

      const result = await apiClient.updateBet(1, updateData)

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/api/v1/bets/1', {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' },
      })
      expect(result).toEqual(updatedBet)
    })
  })

  describe('deleteBet', () => {
    it('should delete a bet by ID', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(undefined),
      })

      await apiClient.deleteBet(1)

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/api/v1/bets/1', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })
    })
  })

  describe('getPlayerBets', () => {
    it('should fetch and filter player bets', async () => {
      const allBets: Bet[] = [
        {
          id: 1,
          bet_type: 'player_prop',
          bet_placed_date: '2024-01-15',
          game_date: '2024-01-16',
          team: 'Lakers',
          opponent: 'Warriors',
          player_name: 'LeBron James',
          prop_type: 'points',
          prop_line: '25.5',
          over_under: 'over',
          wager_amount: '100',
          odds: -110,
          result: 'pending',
          created_at: '2024-01-15T10:00:00Z',
        },
        {
          id: 2,
          bet_type: 'spread',
          bet_placed_date: '2024-01-15',
          game_date: '2024-01-16',
          team: 'Lakers',
          opponent: 'Warriors',
          prop_description: 'Lakers -5.5',
          prop_line: '-5.5',
          wager_amount: '50',
          odds: -110,
          result: 'pending',
          created_at: '2024-01-15T11:00:00Z',
        },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(allBets.filter(bet => bet.bet_type === 'player_prop')),
      })

      const result = await apiClient.getPlayerBets()

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/bets?bet_type=player_prop',
        { headers: { 'Content-Type': 'application/json' } },
      )
      expect(result).toHaveLength(1)
      expect(result[0].player_name).toBeDefined()
      expect(result[0].prop_type).toBeDefined()
    })

    it('should return empty array when no player bets exist', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([]),
      })

      const result = await apiClient.getPlayerBets()
      expect(result).toEqual([])
    })
  })

  describe('getTeamBets', () => {
    it('should fetch and filter team bets', async () => {
      const allBets: Bet[] = [
        {
          id: 1,
          bet_type: 'player_prop',
          bet_placed_date: '2024-01-15',
          game_date: '2024-01-16',
          team: 'Lakers',
          opponent: 'Warriors',
          player_name: 'LeBron James',
          prop_type: 'points',
          prop_line: '25.5',
          over_under: 'over',
          wager_amount: '100',
          odds: -110,
          result: 'pending',
          created_at: '2024-01-15T10:00:00Z',
        },
        {
          id: 2,
          bet_type: 'spread',
          bet_placed_date: '2024-01-15',
          game_date: '2024-01-16',
          team: 'Lakers',
          opponent: 'Warriors',
          prop_description: 'Lakers -5.5',
          prop_line: '-5.5',
          wager_amount: '50',
          odds: -110,
          result: 'pending',
          created_at: '2024-01-15T11:00:00Z',
        },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(allBets),
      })

      const result = await apiClient.getTeamBets()

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/api/v1/bets', {
        headers: { 'Content-Type': 'application/json' },
      })
      expect(result).toHaveLength(1)
      expect(result[0].player_name).toBeUndefined()
      expect(result[0].prop_description).toBeDefined()
    })
  })

  describe('getBetSummary', () => {
    it('should fetch bet analytics summary', async () => {
      const mockSummary: BetSummary = {
        total_bets: 10,
        total_wins: 6,
        total_losses: 3,
        win_rate: 66.7,
        player_bets: {
          total: 7,
          wins: 4,
          losses: 2,
          win_rate: 66.7,
        },
        non_player_bets: {
          total: 3,
          wins: 2,
          losses: 1,
          win_rate: 66.7,
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockSummary),
      })

      const result = await apiClient.getBetSummary()

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/api/v1/bets/analytics/summary', {
        headers: { 'Content-Type': 'application/json' },
      })
      expect(result).toEqual(mockSummary)
    })
  })

  describe('error handling', () => {
    it('should handle JSON parsing errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
      })

      await expect(apiClient.getBets()).rejects.toThrow('Invalid JSON')
    })

    it('should handle 500 server errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      })

      await expect(apiClient.getBets()).rejects.toThrow('API request failed: 500 Internal Server Error')
    })

    it('should handle 401 unauthorized errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      })

      await expect(apiClient.createBet({} as any)).rejects.toThrow('API request failed: 401 Unauthorized')
    })
  })

  describe('singleton api instance', () => {
    it('should export a singleton instance', () => {
      expect(api).toBeInstanceOf(ApiClient)
    })

it('should maintain the same instance across imports', async () => {
      const apiModule = await import('./api')
      expect(api).toBe(apiModule.api)
    })
  })

  describe('type safety', () => {
    it('should enforce PlayerBet type correctly', async () => {
      const playerBets: Bet[] = [
        {
          id: 1,
          bet_type: 'player_prop',
          bet_placed_date: '2024-01-15',
          game_date: '2024-01-16',
          team: 'Lakers',
          opponent: 'Warriors',
          player_name: 'LeBron James',
          prop_type: 'points',
          prop_line: '25.5',
          over_under: 'over',
          wager_amount: '100',
          odds: -110,
          result: 'pending',
          created_at: '2024-01-15T10:00:00Z',
        },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(playerBets),
      })

      const result = await apiClient.getPlayerBets()

      // TypeScript should infer this correctly
      result.forEach((bet: PlayerBet) => {
        expect(bet.player_name).toBeDefined()
        expect(bet.prop_type).toBeDefined()
        expect(typeof bet.player_name).toBe('string')
        expect(typeof bet.prop_type).toBe('string')
      })
    })

    it('should enforce TeamBet type correctly', async () => {
      const teamBets: Bet[] = [
        {
          id: 2,
          bet_type: 'spread',
          bet_placed_date: '2024-01-15',
          game_date: '2024-01-16',
          team: 'Lakers',
          opponent: 'Warriors',
          prop_description: 'Lakers -5.5',
          prop_line: '-5.5',
          wager_amount: '50',
          odds: -110,
          result: 'pending',
          created_at: '2024-01-15T11:00:00Z',
        },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(teamBets),
      })

      const result = await apiClient.getTeamBets()

      result.forEach((bet: TeamBet) => {
        expect(bet.prop_description).toBeDefined()
        expect(typeof bet.prop_description).toBe('string')
        expect(bet.player_name).toBeUndefined()
      })
    })
  })
})
