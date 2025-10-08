import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

function formatCurrency(amount: string | undefined): string {
  if (!amount) {return '$0.00'}
  return `$${parseFloat(amount).toFixed(2)}`
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
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

export function Dashboard() {
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['bet-summary'],
    queryFn: () => api.getBetSummary(),
  })

  const { data: bets, isLoading: betsLoading } = useQuery({
    queryKey: ['bets'],
    queryFn: () => api.getBets(),
  })

  // Sort recent bets by bet_placed_date (most recent first)
  const allBets = (bets || [])
    .sort((a, b) => new Date(b.bet_placed_date).getTime() - new Date(a.bet_placed_date).getTime())
    .slice(0, 5) // Show last 5 bets

  const pendingBets = allBets.filter(bet => bet.result === 'pending').length

  // Calculate total winnings (sum of payouts minus wagers for completed bets)
  const totalWinnings = allBets
    .filter(bet => bet.result !== 'pending')
    .reduce((sum, bet) => {
      const payout = parseFloat(bet.payout || '0')
      const wager = parseFloat(bet.wager_amount)
      return sum + (payout - wager)
    }, 0)

  if (summaryLoading || betsLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow px-4 py-5 sm:p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-gray-900">Dashboard</h1>
          <p className="mt-2 text-sm text-gray-700">
            Overview of your NBA betting performance
          </p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-lg shadow px-4 py-5 sm:p-6">
          <dt className="text-sm font-medium text-gray-500 truncate">Total Bets</dt>
          <dd className="mt-1 text-3xl font-semibold text-gray-900">{summary?.total_bets || 0}</dd>
        </div>

        <div className="bg-white rounded-lg shadow px-4 py-5 sm:p-6">
          <dt className="text-sm font-medium text-gray-500 truncate">Win Rate</dt>
          <dd className="mt-1 text-3xl font-semibold text-green-600">{summary?.win_rate || 0}%</dd>
        </div>

        <div className="bg-white rounded-lg shadow px-4 py-5 sm:p-6">
          <dt className="text-sm font-medium text-gray-500 truncate">Net P&L</dt>
          <dd className={`mt-1 text-3xl font-semibold ${
            totalWinnings >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {totalWinnings >= 0 ? '+' : ''}${totalWinnings.toFixed(2)}
          </dd>
        </div>

        <div className="bg-white rounded-lg shadow px-4 py-5 sm:p-6">
          <dt className="text-sm font-medium text-gray-500 truncate">Pending Bets</dt>
          <dd className="mt-1 text-3xl font-semibold text-blue-600">{pendingBets}</dd>
        </div>
      </div>

      <div className="mt-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-base font-semibold leading-6 text-gray-900">Recent Activity</h3>
            <div className="mt-5">
              {allBets.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm text-gray-500">No bets recorded yet.</p>
                  <p className="text-sm text-gray-500 mt-1">
                    <a href="/add-bet" className="text-primary-600 hover:text-primary-500">
                      Add your first bet
                    </a>
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {allBets.map((bet) => {
                    const isPlayerBet = bet.player_name && bet.prop_type
                    return (
                      <div key={`${bet.bet_type}-${bet.id}`} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <span className={getBetResultBadge(bet.result)}>
                                {bet.result.toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {isPlayerBet
                                  ? `${bet.player_name} ${bet.prop_type} ${bet.over_under} ${bet.prop_line}`
                                  : bet.prop_description || 'Unknown Prop'
                                }
                              </p>
                              <p className="text-sm text-gray-500">
                                {bet.team} vs {bet.opponent} • {formatDate(bet.game_date)}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {formatCurrency(bet.wager_amount)} @ {bet.odds > 0 ? '+' : ''}{bet.odds}
                          </p>
                          {bet.payout && (
                            <p className={`text-sm font-medium ${
                              parseFloat(bet.payout) > parseFloat(bet.wager_amount)
                                ? 'text-green-600'
                                : parseFloat(bet.payout) < parseFloat(bet.wager_amount)
                                ? 'text-red-600'
                                : 'text-gray-600'
                            }`}>
                              {formatCurrency(bet.payout)}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
