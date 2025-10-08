import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

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
