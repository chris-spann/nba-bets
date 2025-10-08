import { useQuery } from '@tanstack/react-query'
import { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { api, type Bet } from '../lib/api'

type EnhancedBet = Bet & {
  prop_category: 'Player' | 'Team' | 'Game'
  display_description: string
}

type SortField = 'bet_placed_date' | 'prop_category' | 'team' | 'wager_amount' | 'result' | 'payout'
type SortDirection = 'asc' | 'desc'

function formatCurrency(amount: string | undefined): string {
  if (!amount) {return '$0.00'}
  return `$${parseFloat(amount).toFixed(2)}`
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatShortDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
  })
}

function getBetResultBadge(result: string) {
  const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'

  switch (result.toLowerCase()) {
    case 'win':
      return `${baseClasses} bg-green-100 text-green-800`
    case 'loss':
      return `${baseClasses} bg-red-100 text-red-800`
    case 'push':
      return `${baseClasses} bg-gray-100 text-gray-800`
    case 'pending':
      return `${baseClasses} bg-blue-100 text-blue-800`
    default:
      return `${baseClasses} bg-gray-100 text-gray-800`
  }
}

function formatPropType(propType: string): string {
  return propType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
}


function getPropCategory(bet: Bet): 'Player' | 'Team' | 'Game' {
  if (bet.player_name && bet.prop_type) {
    return 'Player'
  }

  if (bet.bet_type === 'game_total') {
    return 'Game'
  }

  return 'Team'
}

function getDisplayDescription(bet: Bet): string {
  if (bet.player_name && bet.prop_type) {
    return `${bet.player_name} ${formatPropType(bet.prop_type)}`
  }

  return bet.prop_description || 'Unknown Prop'
}

function getDisplayLine(bet: Bet): string {
  if (bet.player_name && bet.prop_type) {
    return `${bet.over_under?.toUpperCase()} ${bet.prop_line}`
  }

  if (bet.over_under) {
    return `${bet.over_under.toUpperCase()} ${bet.prop_line}`
  }

  if (bet.bet_type === 'spread') {
    return `Line: ${bet.prop_line}`
  }

  return bet.prop_line
}

export function PropBets() {
  const [sortField, setSortField] = useState<SortField>('bet_placed_date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const { data: bets, isLoading, error } = useQuery({
    queryKey: ['bets'],
    queryFn: () => api.getBets(),
  })

  const enhancedBets = useMemo(() => {
    return (bets || []).map(bet => ({
      ...bet,
      prop_category: getPropCategory(bet),
      display_description: getDisplayDescription(bet),
    })) as EnhancedBet[]
  }, [bets])

  const sortedPropBets = useMemo(() => {
    if (!enhancedBets.length) {return []}

    return [...enhancedBets].sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

      switch (sortField) {
        case 'bet_placed_date':
          aValue = new Date(a.bet_placed_date).getTime()
          bValue = new Date(b.bet_placed_date).getTime()
          break
        case 'prop_category':
          aValue = a.prop_category.toLowerCase()
          bValue = b.prop_category.toLowerCase()
          break
        case 'team':
          aValue = a.team.toLowerCase()
          bValue = b.team.toLowerCase()
          break
        case 'wager_amount':
          aValue = parseFloat(a.wager_amount)
          bValue = parseFloat(b.wager_amount)
          break
        case 'result':
          aValue = a.result.toLowerCase()
          bValue = b.result.toLowerCase()
          break
        case 'payout':
          aValue = parseFloat(a.payout || '0')
          bValue = parseFloat(b.payout || '0')
          break
        default:
          return 0
      }

      if (aValue < bValue) {return sortDirection === 'asc' ? -1 : 1}
      if (aValue > bValue) {return sortDirection === 'asc' ? 1 : -1}
      return 0
    })
  }, [enhancedBets, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        <div className="flex flex-col">
          <ChevronUp
            className={`h-3 w-3 ${sortField === field && sortDirection === 'asc' ? 'text-gray-900' : 'text-gray-300'}`}
          />
          <ChevronDown
            className={`h-3 w-3 ${sortField === field && sortDirection === 'desc' ? 'text-gray-900' : 'text-gray-300'}`}
          />
        </div>
      </div>
    </th>
  )

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="border-b border-gray-200 py-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-red-600">Error loading prop bets: {(error as Error).message}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-sm text-primary-600 hover:text-primary-500"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-gray-900">NBA Prop Bets</h1>
          <p className="mt-2 text-sm text-gray-700">
            Track all your NBA prop betting history ({sortedPropBets?.length || 0} bets)
          </p>
        </div>
      </div>

      <div className="mt-8 bg-white shadow rounded-lg overflow-hidden">
        {!sortedPropBets || sortedPropBets.length === 0 ? (
          <div className="px-4 py-5 sm:p-6">
            <div className="text-center py-12">
              <p className="text-sm text-gray-500">No prop bets found.</p>
              <p className="text-sm text-gray-500 mt-1">
                <a href="/add-bet" className="text-primary-600 hover:text-primary-500">
                  Add your first prop bet
                </a>
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <SortableHeader field="bet_placed_date">Bet Placed</SortableHeader>
                  <SortableHeader field="prop_category">Type</SortableHeader>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prop Details
                  </th>
                  <SortableHeader field="team">Game</SortableHeader>
                  <SortableHeader field="wager_amount">Wager</SortableHeader>
                  <SortableHeader field="result">Result</SortableHeader>
                  <SortableHeader field="payout">P&L</SortableHeader>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedPropBets.map((bet) => {
                  const actualValue = 'actual_value' in bet ? bet.actual_value : bet.actual_value

                  return (
                    <tr key={`${bet.prop_category}-${bet.id}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatShortDate(bet.bet_placed_date)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          bet.prop_category === 'Player'
                            ? 'bg-blue-100 text-blue-800'
                            : bet.prop_category === 'Team'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {bet.prop_category}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {bet.display_description}
                          </div>
                          <div className="text-sm text-gray-500">
                            {getDisplayLine(bet)}
                            {actualValue && (
                              <span className="ml-2">→ {actualValue}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{bet.team} vs {bet.opponent}</div>
                          <div className="text-sm text-gray-500">{formatDate(bet.game_date)}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{formatCurrency(bet.wager_amount)}</div>
                          <div className="text-sm text-gray-500">
                            @ {bet.odds > 0 ? '+' : ''}{bet.odds}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          <span className={getBetResultBadge(bet.result)}>
                            {bet.result.toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          {bet.payout ? (
                            <div>
                              <div className="font-medium text-gray-900">
                                {formatCurrency(bet.payout)}
                              </div>
                              <div className={`text-xs font-medium ${
                                parseFloat(bet.payout) > parseFloat(bet.wager_amount)
                                  ? 'text-green-600'
                                  : parseFloat(bet.payout) < parseFloat(bet.wager_amount)
                                  ? 'text-red-600'
                                  : 'text-gray-600'
                              }`}>
                                {parseFloat(bet.payout) > parseFloat(bet.wager_amount)
                                  ? '+'
                                  : parseFloat(bet.payout) < parseFloat(bet.wager_amount)
                                  ? '-'
                                  : ''
                                }${Math.abs(parseFloat(bet.payout) - parseFloat(bet.wager_amount)).toFixed(2)}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">Pending</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {sortedPropBets && sortedPropBets.length > 0 && (
        <div className="mt-4 bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Total Bets:</span>
              <span className="ml-2 text-gray-900">{sortedPropBets.length}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Win Rate:</span>
              <span className="ml-2 text-gray-900">
                {Math.round((sortedPropBets.filter(b => b.result === 'win').length / sortedPropBets.filter(b => b.result !== 'pending').length * 100) || 0)}%
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Net P&L:</span>
              <span className={`ml-2 font-medium ${
                sortedPropBets.reduce((sum, bet) => {
                  if (!bet.payout) {return sum}
                  return sum + (parseFloat(bet.payout) - parseFloat(bet.wager_amount))
                }, 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                ${sortedPropBets.reduce((sum, bet) => {
                  if (!bet.payout) {return sum}
                  return sum + (parseFloat(bet.payout) - parseFloat(bet.wager_amount))
                }, 0).toFixed(2)}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">By Type:</span>
              <div className="text-xs mt-1">
                <span className="text-blue-600">Player: {sortedPropBets.filter(b => b.prop_category === 'Player').length}</span>
                <span className="text-purple-600 ml-2">Team: {sortedPropBets.filter(b => b.prop_category === 'Team').length}</span>
                <span className="text-orange-600 ml-2">Game: {sortedPropBets.filter(b => b.prop_category === 'Game').length}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
