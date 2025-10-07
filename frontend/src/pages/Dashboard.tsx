export function Dashboard() {
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
          <dd className="mt-1 text-3xl font-semibold text-gray-900">0</dd>
        </div>
        
        <div className="bg-white rounded-lg shadow px-4 py-5 sm:p-6">
          <dt className="text-sm font-medium text-gray-500 truncate">Win Rate</dt>
          <dd className="mt-1 text-3xl font-semibold text-green-600">0%</dd>
        </div>
        
        <div className="bg-white rounded-lg shadow px-4 py-5 sm:p-6">
          <dt className="text-sm font-medium text-gray-500 truncate">Total Winnings</dt>
          <dd className="mt-1 text-3xl font-semibold text-green-600">$0</dd>
        </div>
        
        <div className="bg-white rounded-lg shadow px-4 py-5 sm:p-6">
          <dt className="text-sm font-medium text-gray-500 truncate">Active Bets</dt>
          <dd className="mt-1 text-3xl font-semibold text-blue-600">0</dd>
        </div>
      </div>

      <div className="mt-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-base font-semibold leading-6 text-gray-900">Recent Activity</h3>
            <div className="mt-5">
              <div className="text-center py-12">
                <p className="text-sm text-gray-500">No bets recorded yet.</p>
                <p className="text-sm text-gray-500 mt-1">
                  <a href="/add-bet" className="text-primary-600 hover:text-primary-500">
                    Add your first bet
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}