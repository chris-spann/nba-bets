import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Polyfill for URL and URLSearchParams if not available
if (typeof globalThis.URL === 'undefined') {
  // Basic URL polyfill for tests
  globalThis.URL = class URL {
    href: string
    origin: string
    protocol: string
    host: string
    hostname: string
    port: string
    pathname: string
    search: string
    hash: string

    constructor(url: string, _base?: string) {
      this.href = url
      this.origin = 'http://localhost:3000'
      this.protocol = 'http:'
      this.host = 'localhost:3000'
      this.hostname = 'localhost'
      this.port = '3000'
      this.pathname = '/'
      this.search = ''
      this.hash = ''
    }

    toString() {
      return this.href
    }
  } as unknown as typeof URL
}

if (typeof globalThis.URLSearchParams === 'undefined') {
  globalThis.URLSearchParams = class URLSearchParams {
    private params = new Map<string, string>()

    constructor(init?: string | URLSearchParams | Record<string, string>) {
      if (typeof init === 'string') {
        // Simple parsing
        if (init.startsWith('?')) {
          init = init.slice(1)
        }
        init.split('&').forEach(pair => {
          const [key, value] = pair.split('=')
          if (key) {
            this.params.set(decodeURIComponent(key), decodeURIComponent(value || ''))
          }
        })
      }
    }

    get(name: string) {
      return this.params.get(name) || null
    }

    set(name: string, value: string) {
      this.params.set(name, value)
    }

    append(name: string, value: string) {
      this.params.set(name, value)
    }

    delete(name: string) {
      this.params.delete(name)
    }

    has(name: string) {
      return this.params.has(name)
    }

    toString() {
      return Array.from(this.params.entries())
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&')
    }
  } as unknown as typeof URLSearchParams
}

// Polyfill for webidl-conversions and whatwg-url compatibility
if (typeof globalThis.WeakRef === 'undefined') {
  // @ts-expect-error - Polyfill for missing WeakRef
  globalThis.WeakRef = class WeakRef<T = unknown> {
    private target: T

    constructor(target: T) {
      this.target = target
    }

    deref(): T | undefined {
      return this.target
    }
  }
}

if (typeof globalThis.FinalizationRegistry === 'undefined') {
  // @ts-expect-error - Polyfill for missing FinalizationRegistry
  globalThis.FinalizationRegistry = class FinalizationRegistry<T = unknown, K = unknown> {
    // @ts-expect-error - Unused parameter required for interface compatibility
    private callback: (heldValue: T) => void

    constructor(callback: (heldValue: T) => void) {
      this.callback = callback
    }

    register(_target: object, _heldValue: T, _unregisterToken?: K): void {
      // No-op for polyfill
    }

    unregister(_unregisterToken: K): boolean {
      // No-op for polyfill
      return false
    }
  }
}
