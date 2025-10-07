export function TeamBets() {
  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-gray-900">Team Prop Bets</h1>
          <p className="mt-2 text-sm text-gray-700">
            Track your NBA team prop betting history
          </p>
        </div>
      </div>

      <div className="mt-8 bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="text-center py-12">
            <p className="text-sm text-gray-500">No team bets found.</p>
            <p className="text-sm text-gray-500 mt-1">
              <a href="/add-bet" className="text-primary-600 hover:text-primary-500">
                Add a team prop bet
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}