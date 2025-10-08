import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api, type Bet } from '../lib/api'

type BetFormData = Omit<Bet, 'id' | 'created_at' | 'updated_at'>

const BET_TYPES = [
  { value: 'player_prop', label: 'Player Prop' },
  { value: 'spread', label: 'Spread' },
  { value: 'moneyline', label: 'Moneyline' },
  { value: 'game_total', label: 'Game Total' },
  { value: 'team_prop', label: 'Team Prop' },
]

const PROP_TYPES = [
  { value: 'points', label: 'Points' },
  { value: 'rebounds', label: 'Rebounds' },
  { value: 'assists', label: 'Assists' },
  { value: 'steals', label: 'Steals' },
  { value: 'blocks', label: 'Blocks' },
  { value: 'threes', label: 'Three Pointers' },
  { value: 'turnovers', label: 'Turnovers' },
  { value: 'pra', label: 'Points + Rebounds + Assists' },
  { value: 'pr', label: 'Points + Rebounds' },
  { value: 'pa', label: 'Points + Assists' },
  { value: 'ra', label: 'Rebounds + Assists' },
]

const OVER_UNDER_OPTIONS = [
  { value: 'over', label: 'Over' },
  { value: 'under', label: 'Under' },
]

const RESULT_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'win', label: 'Win' },
  { value: 'loss', label: 'Loss' },
  { value: 'push', label: 'Push' },
]

export function AddBet() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<BetFormData>({
    bet_type: 'player_prop',
    bet_placed_date: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
    game_date: '',
    team: '',
    opponent: '',
    player_name: '',
    prop_type: 'points',
    prop_description: '',
    prop_line: '',
    over_under: 'over',
    wager_amount: '',
    odds: -110,
    result: 'pending',
    actual_value: '',
    payout: '',
    notes: '',
  })

  const createBetMutation = useMutation({
    mutationFn: (bet: BetFormData) => api.createBet(bet),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bets'] })
      queryClient.invalidateQueries({ queryKey: ['bet-summary'] })
      navigate('/prop-bets')
    },
    onError: (error: Error) => {
      setError(error.message || 'Failed to create bet')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate required fields based on bet type
    if (formData.bet_type === 'player_prop') {
      if (!formData.player_name || !formData.prop_type) {
        setError('Player name and prop type are required for player props')
        return
      }
    } else {
      if (!formData.prop_description) {
        setError('Prop description is required for non-player bets')
        return
      }
    }

    if (!formData.game_date || !formData.team || !formData.opponent || !formData.prop_line || !formData.wager_amount) {
      setError('Please fill in all required fields')
      return
    }

    // Clean up form data based on bet type
    const cleanedData = { ...formData }
    if (formData.bet_type !== 'player_prop') {
      cleanedData.player_name = undefined
      cleanedData.prop_type = undefined
    } else {
      cleanedData.prop_description = undefined
    }

    // Handle over/under requirement
    if (['spread', 'moneyline'].includes(formData.bet_type)) {
      cleanedData.over_under = undefined
    }

    // Convert date strings to datetime strings (add default time)
    if (cleanedData.bet_placed_date && !cleanedData.bet_placed_date.includes('T')) {
      cleanedData.bet_placed_date = cleanedData.bet_placed_date + 'T18:00:00'
    }
    if (cleanedData.game_date && !cleanedData.game_date.includes('T')) {
      cleanedData.game_date = cleanedData.game_date + 'T20:00:00'
    }

    createBetMutation.mutate(cleanedData)
  }

  const handleChange = (field: keyof BetFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  const isPlayerProp = formData.bet_type === 'player_prop'
  const requiresOverUnder = !['spread', 'moneyline'].includes(formData.bet_type)

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-gray-900">Add New Bet</h1>
          <p className="mt-2 text-sm text-gray-700">
            Record a new NBA prop bet
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              {/* Bet Type */}
              <div>
                <label htmlFor="bet_type" className="block text-sm font-medium text-gray-700">
                  Bet Type *
                </label>
                <select
                  id="bet_type"
                  value={formData.bet_type}
                  onChange={(e) => handleChange('bet_type', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  required
                >
                  {BET_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              {/* Bet Placed Date */}
              <div>
                <label htmlFor="bet_placed_date" className="block text-sm font-medium text-gray-700">
                  Bet Placed Date *
                </label>
                <input
                  id="bet_placed_date"
                  type="date"
                  value={formData.bet_placed_date}
                  onChange={(e) => handleChange('bet_placed_date', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  required
                />
              </div>

              {/* Game Date */}
              <div>
                <label htmlFor="game_date" className="block text-sm font-medium text-gray-700">
                  Game Date *
                </label>
                <input
                  id="game_date"
                  type="date"
                  value={formData.game_date}
                  onChange={(e) => handleChange('game_date', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  required
                />
              </div>

              {/* Team */}
              <div>
                <label htmlFor="team" className="block text-sm font-medium text-gray-700">
                  Team *
                </label>
                <input
                  id="team"
                  type="text"
                  value={formData.team}
                  onChange={(e) => handleChange('team', e.target.value.toUpperCase())}
                  placeholder="e.g., LAL"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  required
                />
              </div>

              {/* Opponent */}
              <div>
                <label htmlFor="opponent" className="block text-sm font-medium text-gray-700">
                  Opponent *
                </label>
                <input
                  id="opponent"
                  type="text"
                  value={formData.opponent}
                  onChange={(e) => handleChange('opponent', e.target.value.toUpperCase())}
                  placeholder="e.g., GSW"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  required
                />
              </div>

              {/* Player Name - Only for player props */}
              {isPlayerProp && (
                <div>
                  <label htmlFor="player_name" className="block text-sm font-medium text-gray-700">
                    Player Name *
                  </label>
                  <input
                    id="player_name"
                    type="text"
                    value={formData.player_name || ''}
                    onChange={(e) => handleChange('player_name', e.target.value)}
                    placeholder="e.g., LeBron James"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    required
                  />
                </div>
              )}

              {/* Prop Type - Only for player props */}
              {isPlayerProp && (
                <div>
                  <label htmlFor="prop_type" className="block text-sm font-medium text-gray-700">
                    Prop Type *
                  </label>
                  <select
                    id="prop_type"
                    value={formData.prop_type || 'points'}
                    onChange={(e) => handleChange('prop_type', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    required
                  >
                    {PROP_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Prop Description - For non-player bets */}
              {!isPlayerProp && (
                <div className="sm:col-span-2">
                  <label htmlFor="prop_description" className="block text-sm font-medium text-gray-700">
                    Prop Description *
                  </label>
                  <input
                    id="prop_description"
                    type="text"
                    value={formData.prop_description || ''}
                    onChange={(e) => handleChange('prop_description', e.target.value)}
                    placeholder="e.g., LAL vs GSW Game Total Points"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    required
                  />
                </div>
              )}

              {/* Prop Line */}
              <div>
                <label htmlFor="prop_line" className="block text-sm font-medium text-gray-700">
                  Prop Line *
                </label>
                <input
                  id="prop_line"
                  type="number"
                  step="0.5"
                  value={formData.prop_line}
                  onChange={(e) => handleChange('prop_line', e.target.value)}
                  placeholder="e.g., 25.5"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  required
                />
              </div>

              {/* Over/Under - Only for applicable bet types */}
              {requiresOverUnder && (
                <div>
                  <label htmlFor="over_under" className="block text-sm font-medium text-gray-700">
                    Over/Under *
                  </label>
                  <select
                    id="over_under"
                    value={formData.over_under || 'over'}
                    onChange={(e) => handleChange('over_under', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    required
                  >
                    {OVER_UNDER_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Wager Amount */}
              <div>
                <label htmlFor="wager_amount" className="block text-sm font-medium text-gray-700">
                  Wager Amount *
                </label>
                <input
                  id="wager_amount"
                  type="number"
                  step="0.01"
                  value={formData.wager_amount}
                  onChange={(e) => handleChange('wager_amount', e.target.value)}
                  placeholder="e.g., 25.00"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  required
                />
              </div>

              {/* Odds */}
              <div>
                <label htmlFor="odds" className="block text-sm font-medium text-gray-700">
                  Odds *
                </label>
                <input
                  id="odds"
                  type="number"
                  value={formData.odds}
                  onChange={(e) => handleChange('odds', parseInt(e.target.value))}
                  placeholder="e.g., -110 or +150"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  required
                />
              </div>

              {/* Result */}
              <div>
                <label htmlFor="result" className="block text-sm font-medium text-gray-700">
                  Result
                </label>
                <select
                  id="result"
                  value={formData.result}
                  onChange={(e) => handleChange('result', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  {RESULT_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              {/* Actual Value - Only if not pending */}
              {formData.result !== 'pending' && (
                <div>
                  <label htmlFor="actual_value" className="block text-sm font-medium text-gray-700">
                    Actual Value
                  </label>
                  <input
                    id="actual_value"
                    type="number"
                    step="0.1"
                    value={formData.actual_value || ''}
                    onChange={(e) => handleChange('actual_value', e.target.value)}
                    placeholder="e.g., 28.0"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
              )}

              {/* Payout - Only if not pending */}
              {formData.result !== 'pending' && (
                <div>
                  <label htmlFor="payout" className="block text-sm font-medium text-gray-700">
                    Payout
                  </label>
                  <input
                    id="payout"
                    type="number"
                    step="0.01"
                    value={formData.payout || ''}
                    onChange={(e) => handleChange('payout', e.target.value)}
                    placeholder="e.g., 47.73"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
              )}

              {/* Notes */}
              <div className="sm:col-span-2">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  id="notes"
                  value={formData.notes || ''}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  rows={3}
                  placeholder="Any additional notes about this bet..."
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/prop-bets')}
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createBetMutation.isPending}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            {createBetMutation.isPending ? 'Creating...' : 'Create Bet'}
          </button>
        </div>
      </form>
    </div>
  )
}
