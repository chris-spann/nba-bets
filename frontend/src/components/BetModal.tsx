import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, Calendar, DollarSign, Target, TrendingUp, User, X, Activity, Users, Zap, BarChart3, Trophy, Crosshair } from 'lucide-react'
import { api, type Bet } from '../lib/api'

type BetFormData = Omit<Bet, 'id' | 'created_at' | 'updated_at'>

const BET_TYPES = [
  { value: 'spread', label: 'Spread', icon: TrendingUp },
  { value: 'moneyline', label: 'Moneyline', icon: Target },
  { value: 'player_prop', label: 'Player Prop', icon: User },
  { value: 'team_prop', label: 'Team Prop', icon: Users },
]

const PROP_TYPES = [
  { value: 'points', label: 'PTS', icon: Zap, color: 'text-red-600', bgColor: 'bg-red-100' },
  { value: 'rebounds', label: 'REB', icon: Activity, color: 'text-green-600', bgColor: 'bg-green-100' },
  { value: 'assists', label: 'AST', icon: Users, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  { value: 'threes', label: '3PM', icon: Crosshair, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  { value: 'steals', label: 'STL', icon: Target, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  { value: 'blocks', label: 'BLK', icon: BarChart3, color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
  { value: 'turnovers', label: 'TOV', icon: AlertCircle, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  { value: 'pra', label: 'PRA', icon: Trophy, color: 'text-pink-600', bgColor: 'bg-pink-100' },
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
  { value: 'cancelled', label: 'Cancelled' },
]

const NBA_TEAMS = [
  'ATL', 'BOS', 'BKN', 'CHA', 'CHI', 'CLE', 'DAL', 'DEN', 'DET', 'GSW',
  'HOU', 'IND', 'LAC', 'LAL', 'MEM', 'MIA', 'MIL', 'MIN', 'NOP', 'NYK',
  'OKC', 'ORL', 'PHI', 'PHX', 'POR', 'SAC', 'SAS', 'TOR', 'UTA', 'WAS',
]

// Helper functions
function formatDateTimeForAPI(dateString: string): string {
  if (!dateString) {return ''}
  if (dateString.includes('T')) {return dateString}
  return `${dateString}T20:00:00`
}

function convertToNumber(value: string): number | undefined {
  const num = parseFloat(value)
  return isNaN(num) ? undefined : num
}

interface BetModalProps {
  isOpen: boolean
  onClose: () => void
  editBet?: Bet | null
}

export function BetModal({ isOpen, onClose, editBet }: BetModalProps) {
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState<BetFormData>({
    bet_type: 'spread',
    bet_placed_date: new Date().toISOString().slice(0, 10),
    game_date: new Date().toISOString().slice(0, 10),
    team: '',
    opponent: '',
    player_name: '',
    prop_type: 'points',
    description: '',
    prop_line: '-3',
    over_under: 'over',
    wager_amount: '25',
    odds: -110,
    result: 'pending',
    payout: '30',
    notes: '',
  })

  // Load edit data when editing
  useEffect(() => {
    if (editBet) {
      setFormData({
        bet_type: editBet.bet_type,
        bet_placed_date: editBet.bet_placed_date.split('T')[0],
        game_date: editBet.game_date.split('T')[0],
        team: editBet.team,
        opponent: editBet.opponent,
        player_name: editBet.player_name || '',
        prop_type: editBet.prop_type || 'points',
        description: editBet.description || '',
        prop_line: editBet.prop_line || '',
        over_under: editBet.over_under || 'over',
        wager_amount: editBet.wager_amount,
        odds: editBet.odds,
        result: editBet.result,
        payout: editBet.payout || '',
        notes: editBet.notes || '',
      })
    } else {
      // Reset form for new bet
      setFormData({
        bet_type: 'spread',
        bet_placed_date: new Date().toISOString().slice(0, 10),
        game_date: new Date().toISOString().slice(0, 10),
        team: '',
        opponent: '',
        player_name: '',
        prop_type: 'points',
        description: '',
        prop_line: '-3',
        over_under: 'over',
        wager_amount: '25',
        odds: -110,
        result: 'pending',
        payout: '30',
        notes: '',
      })
    }
    setError(null)
  }, [editBet, isOpen])

  const createBetMutation = useMutation({
    mutationFn: async (bet: BetFormData) => {
      setIsSubmitting(true)
      try {
        return await api.createBet(bet)
      } finally {
        setIsSubmitting(false)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bets'] })
      queryClient.invalidateQueries({ queryKey: ['bet-summary'] })
      onClose()
    },
    onError: (error: Error) => {
      setError(error.message || 'Failed to create bet')
      setIsSubmitting(false)
    },
  })

  const updateBetMutation = useMutation({
    mutationFn: async (bet: BetFormData) => {
      setIsSubmitting(true)
      try {
        return await api.updateBet(editBet!.id, bet)
      } finally {
        setIsSubmitting(false)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bets'] })
      queryClient.invalidateQueries({ queryKey: ['bet-summary'] })
      onClose()
    },
    onError: (error: Error) => {
      setError(error.message || 'Failed to update bet')
      setIsSubmitting(false)
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate required fields based on bet type
    if (formData.bet_type === 'player_prop') {
      if (!formData.player_name?.trim() || !formData.prop_type || !formData.prop_line) {
        setError('Player name, prop type, and line are required for player props')
        return
      }
    } else if (formData.bet_type === 'spread') {
      if (!formData.prop_line) {
        setError('Line is required for spread bets')
        return
      }
    } else if (formData.bet_type === 'team_prop') {
      if (!formData.prop_type || !formData.prop_line) {
        setError('Prop type and line are required for team props')
        return
      }
    }

    if (!formData.game_date || !formData.team?.trim() || !formData.opponent?.trim() || !formData.wager_amount) {
      setError('Please fill in all required fields')
      return
    }

    if (formData.bet_type !== 'moneyline' && !formData.prop_line) {
      setError('Line is required for this bet type')
      return
    }

    // Validate numeric fields
    if (formData.bet_type !== 'moneyline' && convertToNumber(formData.prop_line) === undefined) {
      setError('Prop line must be a valid number')
      return
    }

    if (convertToNumber(formData.wager_amount) === undefined) {
      setError('Wager amount must be a valid number')
      return
    }

    // Prepare data for API
    const apiData: Record<string, unknown> = {
      bet_type: formData.bet_type,
      bet_placed_date: formatDateTimeForAPI(formData.bet_placed_date),
      game_date: formatDateTimeForAPI(formData.game_date),
      team: formData.team.trim().toUpperCase(),
      opponent: formData.opponent.trim().toUpperCase(),
      wager_amount: convertToNumber(formData.wager_amount),
      odds: formData.odds,
      result: formData.result,
      notes: formData.notes?.trim() || null,
    }

    // Only add prop_line if it's not a moneyline bet
    if (formData.bet_type !== 'moneyline') {
      apiData.prop_line = convertToNumber(formData.prop_line)
    }

    // Add conditional fields based on bet type
    if (formData.bet_type === 'player_prop') {
      apiData.player_name = formData.player_name?.trim()
      apiData.prop_type = formData.prop_type
    } else if (formData.bet_type === 'team_prop') {
      apiData.prop_type = formData.prop_type
    }

    // Add over/under for applicable bet types (only player_prop, team_prop)
    if (['player_prop', 'team_prop'].includes(formData.bet_type)) {
      apiData.over_under = formData.over_under
    }

    // Add optional numeric fields if provided
    if (formData.payout && convertToNumber(formData.payout) !== undefined) {
      apiData.payout = convertToNumber(formData.payout)
    }

    if (editBet) {
      updateBetMutation.mutate(apiData)
    } else {
      createBetMutation.mutate(apiData)
    }
  }

  const handleChange = (field: keyof BetFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  const isPlayerProp = formData.bet_type === 'player_prop'
  const requiresOverUnder = ['player_prop', 'team_prop'].includes(formData.bet_type)

  if (!isOpen) {return null}

  return (
    <div className="fixed inset-0 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div
        className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        data-testid="bet-modal"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-primary-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-primary-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                {editBet ? 'Edit Bet' : 'Add New Bet'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 p-2"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Card 1: Bet Type Selection */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
                <Target className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Bet Type</h3>
                <p className="text-sm text-gray-500">Choose the type of bet you're placing</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {BET_TYPES.map((type) => {
                const Icon = type.icon
                const isSelected = formData.bet_type === type.value
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleChange('bet_type', type.value)}
                    className={`relative flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all duration-200 ${
                      isSelected
                        ? 'border-primary-500 bg-white shadow-md'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div className={`p-2 rounded-lg mb-2 ${
                      isSelected ? 'bg-primary-100' : 'bg-gray-100'
                    }`}>
                      <Icon className={`h-5 w-5 ${
                        isSelected ? 'text-primary-600' : 'text-gray-500'
                      }`} />
                    </div>
                    <span className={`text-sm font-medium text-center ${
                      isSelected ? 'text-primary-900' : 'text-gray-700'
                    }`}>
                      {type.label}
                    </span>
                    {isSelected && (
                      <div className="absolute -top-1 -right-1">
                        <div className="h-4 w-4 bg-primary-600 rounded-full flex items-center justify-center">
                          <div className="h-1.5 w-1.5 bg-white rounded-full"></div>
                        </div>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Card 2: All Bet Details */}
          {formData.bet_type && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              {(() => {
                // Get bet type info - ONLY use bet type for card styling
                const selectedBetType = BET_TYPES.find(t => t.value === formData.bet_type)

                // Always use bet type icon and colors (no prop type styling)
                const IconComponent = selectedBetType?.icon || Calendar
                const iconColor = 'text-blue-600'
                const bgColor = 'bg-blue-100'
                const title = `${selectedBetType?.label || 'Bet'} Details`
                const description = selectedBetType
                  ? `Complete information for your ${selectedBetType.label.toLowerCase()}`
                  : 'Complete information for your bet'

                return (
                  <div className="flex flex-col items-center text-center mb-6">
                    <div className={`h-8 w-8 ${bgColor} rounded-lg flex items-center justify-center mb-2`}>
                      <IconComponent className={`h-4 w-4 ${iconColor}`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                      <p className="text-sm text-gray-500">{description}</p>
                    </div>
                  </div>
                )
              })()}
              <div className="space-y-6">
                {/* Game Information Section */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label htmlFor="bet_placed_date" className="block text-sm font-medium text-gray-700 mb-2">
                      Bet Placed Date
                    </label>
                    <input
                      id="bet_placed_date"
                      type="date"
                      value={formData.bet_placed_date}
                      onChange={(e) => handleChange('bet_placed_date', e.target.value)}
                      className="block w-full pl-3 rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="game_date" className="block text-sm font-medium text-gray-700 mb-2">
                      Game Date
                    </label>
                    <input
                      id="game_date"
                      type="date"
                      value={formData.game_date}
                      onChange={(e) => handleChange('game_date', e.target.value)}
                      className="block w-full pl-3 rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="team" className="block text-sm font-medium text-gray-700 mb-2">
                      Team
                    </label>
                    <select
                      id="team"
                      value={formData.team}
                      onChange={(e) => {
                        const newTeam = e.target.value
                        // If opponent is same as new team, clear opponent
                        if (newTeam && formData.opponent === newTeam) {
                          handleChange('opponent', '')
                        }
                        handleChange('team', newTeam)
                      }}
                      className="block w-full pl-3 rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      required
                    >
                      <option value="" className="text-gray-400">Select a team</option>
                      {NBA_TEAMS.filter(team => team !== formData.opponent).map((team) => (
                        <option key={team} value={team}>{team}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="opponent" className="block text-sm font-medium text-gray-700 mb-2">
                      Opponent
                    </label>
                    <select
                      id="opponent"
                      value={formData.opponent}
                      onChange={(e) => {
                        const newOpponent = e.target.value
                        // If team is same as new opponent, clear team
                        if (newOpponent && formData.team === newOpponent) {
                          handleChange('team', '')
                        }
                        handleChange('opponent', newOpponent)
                      }}
                      className="block w-full pl-3 rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      required
                    >
                      <option value="" className="text-gray-400">Select a team</option>
                      {NBA_TEAMS.filter(team => team !== formData.team).map((team) => (
                        <option key={team} value={team}>{team}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Bet-Specific Fields */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {/* Player Name for Player Props */}
                  {isPlayerProp && (
                    <div>
                      <label htmlFor="player_name" className="block text-sm font-medium text-gray-700 mb-2 cursor-help" title="e.g., LeBron James">
                        Player Name
                      </label>
                      <input
                        id="player_name"
                        type="text"
                        value={formData.player_name || ''}
                        onChange={(e) => handleChange('player_name', e.target.value)}
                        className="block w-full pl-3 rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        required
                      />
                    </div>
                  )}

                  {/* Prop Type for Player and Team Props */}
                  {(formData.bet_type === 'player_prop' || formData.bet_type === 'team_prop') && (
                    <div>
                      <label htmlFor="prop_type" className="block text-sm font-medium text-gray-700 mb-2 cursor-help" title="Choose the type of stat to bet on">
                        Prop Type
                      </label>
                      <select
                        id="prop_type"
                        value={formData.prop_type || 'points'}
                        onChange={(e) => handleChange('prop_type', e.target.value)}
                        className="block w-full pl-3 rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        required
                      >
                        {PROP_TYPES.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Line for non-moneyline bets */}
                  {formData.bet_type !== 'moneyline' && (
                    <div>
                      <label htmlFor="prop_line" className="block text-sm font-medium text-gray-700 mb-2 cursor-help" title="The betting line or point total">
                        {formData.bet_type === 'spread' ? 'Spread Line' : 'Line'}
                      </label>
                      <div className="flex items-center justify-start space-x-2">
                        <button
                          type="button"
                          onClick={() => handleChange('prop_line', String(Math.max(-30, parseFloat(formData.prop_line) - 0.5)))}
                          className="flex items-center justify-center w-8 h-8 rounded border border-gray-300 bg-white hover:bg-gray-50 text-gray-600"
                        >
                          <span className="text-sm font-medium">−</span>
                        </button>
                        <input
                          type="number"
                          min="-30"
                          max="30"
                          step="0.5"
                          value={formData.prop_line}
                          onChange={(e) => handleChange('prop_line', e.target.value)}
                          className="w-20 px-2 py-1 text-center text-sm border border-gray-300 rounded focus:border-primary-500 focus:ring-primary-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleChange('prop_line', String(Math.min(30, parseFloat(formData.prop_line) + 0.5)))}
                          className="flex items-center justify-center w-8 h-8 rounded border border-gray-300 bg-white hover:bg-gray-50 text-gray-600"
                        >
                          <span className="text-sm font-medium">+</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Betting Fields - Consistent across all bet types */}
                <div className="border-t pt-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Over/Under for prop bets */}
                    {requiresOverUnder && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 cursor-help" title="Choose whether to bet over or under the line">
                          Over/Under
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {OVER_UNDER_OPTIONS.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => handleChange('over_under', option.value)}
                              className={`flex items-center justify-center px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                                formData.over_under === option.value
                                  ? 'border-primary-300 bg-primary-50 text-primary-900'
                                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Wager Amount */}
                    <div>
                      <label htmlFor="wager_amount" className="block text-sm font-medium text-gray-700 mb-2 cursor-help" title="Amount you're betting on this wager">
                        Wager Amount
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <input
                          id="wager_amount"
                          type="number"
                          min="1"
                          step="0.01"
                          value={formData.wager_amount}
                          onChange={(e) => handleChange('wager_amount', e.target.value)}
                          className="block w-full pl-7 pr-3 py-2 rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          required
                        />
                      </div>
                    </div>

                    {/* Payout */}
                    <div>
                      <label htmlFor="payout" className="block text-sm font-medium text-gray-700 mb-2 cursor-help" title="Total amount you'll receive if you win">
                        Payout
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <input
                          id="payout"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.payout}
                          onChange={(e) => handleChange('payout', e.target.value)}
                          className="block w-full pl-7 pr-3 py-2 rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    {/* Odds */}
                    <div>
                      <label htmlFor="odds" className="block text-sm font-medium text-gray-700 mb-2 cursor-help" title="American odds (e.g., -110, +150)">
                        Odds
                      </label>
                      <div className="flex items-center justify-start space-x-2">
                        <button
                          type="button"
                          onClick={() => handleChange('odds', Math.max(-500, formData.odds - 5))}
                          className="flex items-center justify-center w-8 h-8 rounded border border-gray-300 bg-white hover:bg-gray-50 text-gray-600"
                        >
                          <span className="text-sm font-medium">−</span>
                        </button>
                        <input
                          id="odds"
                          type="number"
                          min="-500"
                          max="500"
                          step="5"
                          value={formData.odds}
                          onChange={(e) => handleChange('odds', parseInt(e.target.value) || formData.odds)}
                          className="w-20 px-2 py-1 text-center text-sm border border-gray-300 rounded focus:border-primary-500 focus:ring-primary-500"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => handleChange('odds', Math.min(500, formData.odds + 5))}
                          className="flex items-center justify-center w-8 h-8 rounded border border-gray-300 bg-white hover:bg-gray-50 text-gray-600"
                        >
                          <span className="text-sm font-medium">+</span>
                        </button>
                      </div>
                    </div>

                    {/* Result */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 cursor-help" title="Current outcome of this bet">
                        Result
                      </label>
                      <div className="grid grid-cols-2 gap-1">
                        {RESULT_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => handleChange('result', option.value)}
                            className={`flex items-center justify-center px-2 py-1 rounded border text-xs font-medium transition-all ${
                              formData.result === option.value
                                ? option.value === 'win'
                                  ? 'border-green-300 bg-green-50 text-green-900'
                                  : option.value === 'loss'
                                  ? 'border-red-300 bg-red-50 text-red-900'
                                  : 'border-primary-300 bg-primary-50 text-primary-900'
                                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="border-t pt-6">
                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2 cursor-help" title="Any additional notes about this bet...">
                      Notes
                    </label>
                    <textarea
                      id="notes"
                      value={formData.notes || ''}
                      onChange={(e) => handleChange('notes', e.target.value)}
                      rows={3}
                      className="block w-full pl-3 pt-3 rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 -mx-6 -mb-6 rounded-b-lg">
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {editBet ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  editBet ? 'Update Bet' : 'Create Bet'
                )}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  )
}
