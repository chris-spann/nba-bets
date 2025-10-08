import { describe, it, expect, beforeAll, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { PropBets } from '../pages/PropBets'

// Integration tests that test the full workflow from UI to API
// These tests require the backend to be running on localhost:8000

const API_BASE_URL = 'http://localhost:8000'

// Skip integration tests if backend is not available
const isBackendAvailable = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`)
    return response.ok
  } catch {
    return false
  }
}

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

describe('Bet Workflow Integration Tests', () => {
  let backendAvailable = false

  beforeAll(async () => {
    backendAvailable = await isBackendAvailable()
    if (!backendAvailable) {
      console.warn('⚠️  Backend not available - skipping integration tests')
    }
  })

  it.skipIf(!backendAvailable)('should create a new player prop bet through UI', async () => {
    const user = userEvent.setup()
    const Wrapper = createWrapper()
    render(<PropBets />, { wrapper: Wrapper })

    // Wait for page to load
    await waitFor(() => {
      expect(screen.getByText('History')).toBeInTheDocument()
    })

    // Open add bet modal
    const addButton = screen.getByRole('button', { name: 'Add new bet' })
    await user.click(addButton)

    // Verify modal opens
    await waitFor(() => {
      expect(screen.getByText('Add New Bet')).toBeInTheDocument()
    })

    // Select player prop (should be default)
    expect(screen.getByText('Player Prop')).toBeInTheDocument()

    // Fill out the form
    await user.type(screen.getByLabelText(/player name/i), 'LeBron James')
    await user.selectOptions(screen.getByLabelText(/prop type/i), 'points')

    // Use sliders to set values
    const lineSlider = screen.getByLabelText(/line/i)
    await user.clear(lineSlider)
    await user.type(lineSlider, '25.5')

    const wagerSlider = screen.getByLabelText(/wager amount/i)
    await user.clear(wagerSlider)
    await user.type(wagerSlider, '50')

    // Fill in teams
    await user.type(screen.getByLabelText(/team/i), 'LAL')
    await user.type(screen.getByLabelText(/opponent/i), 'GSW')

    // Set over/under
    const overButton = screen.getByRole('button', { name: 'Over' })
    await user.click(overButton)

    // Submit the form
    const createButton = screen.getByRole('button', { name: /create bet/i })
    await user.click(createButton)

    // Verify modal closes and bet appears in list
    await waitFor(() => {
      expect(screen.queryByText('Add New Bet')).not.toBeInTheDocument()
    }, { timeout: 5000 })

    // Check that the bet appears in the table
    await waitFor(() => {
      expect(screen.getByText('LeBron James PTS')).toBeInTheDocument()
      expect(screen.getByText('LAL vs GSW')).toBeInTheDocument()
    }, { timeout: 5000 })
  }, 10000)

  it.skipIf(!backendAvailable)('should edit an existing bet', async () => {
    const user = userEvent.setup()
    const Wrapper = createWrapper()
    render(<PropBets />, { wrapper: Wrapper })

    // Wait for bets to load
    await waitFor(() => {
      expect(screen.getByText('History')).toBeInTheDocument()
    })

    // Find and click edit button (assuming there's at least one bet)
    const editButtons = screen.queryAllByTitle('Edit bet')
    if (editButtons.length > 0) {
      await user.click(editButtons[0])

      // Verify edit modal opens
      await waitFor(() => {
        expect(screen.getByText('Edit Bet')).toBeInTheDocument()
      })

      // Modify a field (e.g., notes)
      const notesField = screen.getByLabelText(/notes/i)
      await user.clear(notesField)
      await user.type(notesField, 'Updated via integration test')

      // Submit the form
      const updateButton = screen.getByRole('button', { name: /update bet/i })
      await user.click(updateButton)

      // Verify modal closes
      await waitFor(() => {
        expect(screen.queryByText('Edit Bet')).not.toBeInTheDocument()
      }, { timeout: 5000 })
    }
  }, 10000)

  it.skipIf(!backendAvailable)('should delete a bet', async () => {
    const user = userEvent.setup()
    const Wrapper = createWrapper()
    render(<PropBets />, { wrapper: Wrapper })

    // Wait for bets to load
    await waitFor(() => {
      expect(screen.getByText('History')).toBeInTheDocument()
    })

    // Get initial bet count
    const initialRows = screen.queryAllByRole('row')
    const initialCount = initialRows.length > 1 ? initialRows.length - 1 : 0 // Subtract header row

    if (initialCount > 0) {
      // Find and click delete button
      const deleteButtons = screen.queryAllByTitle('Delete bet')
      if (deleteButtons.length > 0) {
        await user.click(deleteButtons[0])

        // Verify delete confirmation modal opens
        await waitFor(() => {
          expect(screen.getByText('Delete Bet')).toBeInTheDocument()
        })

        // Confirm deletion
        const confirmButton = screen.getByRole('button', { name: /delete bet/i })
        await user.click(confirmButton)

        // Verify modal closes and bet count decreases
        await waitFor(() => {
          expect(screen.queryByText('Delete Bet')).not.toBeInTheDocument()
        }, { timeout: 5000 })

        await waitFor(() => {
          const newRows = screen.queryAllByRole('row')
          const newCount = newRows.length > 1 ? newRows.length - 1 : 0
          expect(newCount).toBeLessThan(initialCount)
        }, { timeout: 5000 })
      }
    }
  }, 10000)

  it.skipIf(!backendAvailable)('should handle API errors gracefully', async () => {
    const Wrapper = createWrapper()

    // Mock a network error by overriding fetch temporarily
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    render(<PropBets />, { wrapper: Wrapper })

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/error loading bets/i)).toBeInTheDocument()
      expect(screen.getByText('Try again')).toBeInTheDocument()
    }, { timeout: 5000 })

    // Restore original fetch
    global.fetch = originalFetch
  })
})

export {}
