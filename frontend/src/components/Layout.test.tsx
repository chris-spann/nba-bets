import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { Layout } from './Layout'

const createWrapper = () => {
  return ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  )
}

describe('Layout', () => {
  it('renders the NBA Bets title', () => {
    const Wrapper = createWrapper()
    render(
      <Layout>
        <div>Test content</div>
      </Layout>,
      { wrapper: Wrapper },
    )

    expect(screen.getByText('NBA Bets')).toBeInTheDocument()
  })

  it('renders navigation links with proper icons', () => {
    const Wrapper = createWrapper()
    render(
      <Layout>
        <div>Test content</div>
      </Layout>,
      { wrapper: Wrapper },
    )

    // Check for navigation links
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Prop Bets')).toBeInTheDocument()
    expect(screen.getByText('Add Bet')).toBeInTheDocument()
  })

  it('renders children content', () => {
    const Wrapper = createWrapper()
    const testContent = 'This is test content'

    render(
      <Layout>
        <div>{testContent}</div>
      </Layout>,
      { wrapper: Wrapper },
    )

    expect(screen.getByText(testContent)).toBeInTheDocument()
  })

  it('has proper navigation structure', () => {
    const Wrapper = createWrapper()
    render(
      <Layout>
        <div>Test content</div>
      </Layout>,
      { wrapper: Wrapper },
    )

    // Check navigation structure exists
    expect(screen.getByRole('navigation')).toBeInTheDocument()
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('has proper link destinations', () => {
    const Wrapper = createWrapper()
    render(
      <Layout>
        <div>Test content</div>
      </Layout>,
      { wrapper: Wrapper },
    )

    // Check links have proper hrefs
    const dashboardLink = screen.getByRole('link', { name: /dashboard/i })
    const propBetsLink = screen.getByRole('link', { name: /prop bets/i })
    const addBetLink = screen.getByRole('link', { name: /add bet/i })

    expect(dashboardLink).toHaveAttribute('href', '/')
    expect(propBetsLink).toHaveAttribute('href', '/prop-bets')
    expect(addBetLink).toHaveAttribute('href', '/add-bet')
  })
})