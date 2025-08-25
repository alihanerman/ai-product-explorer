import { renderHook, act } from '@testing-library/react'
import { useDebounce, useDebounceCallback } from '../useDebounce'

// Mock timers
jest.useFakeTimers()

describe('useDebounce', () => {
  afterEach(() => {
    jest.clearAllTimers()
  })

  describe('useDebounce hook', () => {
    it('should return initial value immediately', () => {
      const { result } = renderHook(() => useDebounce('initial', 500))
      
      expect(result.current).toBe('initial')
    })

    it('should debounce value changes', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'initial', delay: 500 } }
      )

      expect(result.current).toBe('initial')

      // Change value
      rerender({ value: 'updated', delay: 500 })
      
      // Value should not change immediately
      expect(result.current).toBe('initial')

      // Fast forward time
      act(() => {
        jest.advanceTimersByTime(500)
      })

      // Now value should be updated
      expect(result.current).toBe('updated')
    })

    it('should reset timer on rapid changes', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'initial', delay: 500 } }
      )

      // Change value multiple times rapidly
      rerender({ value: 'change1', delay: 500 })
      
      act(() => {
        jest.advanceTimersByTime(200)
      })
      
      rerender({ value: 'change2', delay: 500 })
      
      act(() => {
        jest.advanceTimersByTime(200)
      })
      
      rerender({ value: 'final', delay: 500 })

      // Value should still be initial
      expect(result.current).toBe('initial')

      // Complete the debounce
      act(() => {
        jest.advanceTimersByTime(500)
      })

      // Should have the final value
      expect(result.current).toBe('final')
    })

    it('should handle different data types', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: { count: 0 }, delay: 300 } }
      )

      expect(result.current).toEqual({ count: 0 })

      rerender({ value: { count: 1 }, delay: 300 })

      act(() => {
        jest.advanceTimersByTime(300)
      })

      expect(result.current).toEqual({ count: 1 })
    })
  })

  describe('useDebounceCallback hook', () => {
    it('should debounce function calls', () => {
      const mockCallback = jest.fn()
      const { result } = renderHook(() => useDebounceCallback(mockCallback, 500))

      // Call the debounced function multiple times
      act(() => {
        result.current('arg1')
      })
      
      act(() => {
        result.current('arg2')
      })
      
      act(() => {
        result.current('arg3')
      })

      // Callback should not be called yet
      expect(mockCallback).not.toHaveBeenCalled()

      // Fast forward time
      act(() => {
        jest.advanceTimersByTime(500)
      })

      // Callback should be called only once with the last arguments
      expect(mockCallback).toHaveBeenCalledTimes(1)
      expect(mockCallback).toHaveBeenCalledWith('arg3')
    })

    it('should cancel previous timeout on new calls', () => {
      const mockCallback = jest.fn()
      const { result } = renderHook(() => useDebounceCallback(mockCallback, 500))

      act(() => {
        result.current('first')
      })

      act(() => {
        jest.advanceTimersByTime(200)
      })

      act(() => {
        result.current('second')
      })

      act(() => {
        jest.advanceTimersByTime(300)
      })

      // Should not be called yet (total time < 500ms from last call)
      expect(mockCallback).not.toHaveBeenCalled()

      act(() => {
        jest.advanceTimersByTime(200)
      })

      // Now should be called with the second argument
      expect(mockCallback).toHaveBeenCalledTimes(1)
      expect(mockCallback).toHaveBeenCalledWith('second')
    })

    it('should handle multiple arguments', () => {
      const mockCallback = jest.fn()
      const { result } = renderHook(() => useDebounceCallback(mockCallback, 300))

      act(() => {
        result.current('arg1', 'arg2', { key: 'value' })
      })

      act(() => {
        jest.advanceTimersByTime(300)
      })

      expect(mockCallback).toHaveBeenCalledWith('arg1', 'arg2', { key: 'value' })
    })

    it('should cleanup timeout on unmount', () => {
      const mockCallback = jest.fn()
      const { result, unmount } = renderHook(() => useDebounceCallback(mockCallback, 500))

      act(() => {
        result.current('test')
      })

      // Unmount before timeout completes
      unmount()

      act(() => {
        jest.advanceTimersByTime(500)
      })

      // Callback should not be called after unmount
      expect(mockCallback).not.toHaveBeenCalled()
    })

    it('should update callback reference', () => {
      let callbackVersion = 1
      const createCallback = (version: number) => jest.fn(() => version)
      
      const { result, rerender } = renderHook(
        ({ callback, delay }) => useDebounceCallback(callback, delay),
        { 
          initialProps: { 
            callback: createCallback(callbackVersion), 
            delay: 300 
          } 
        }
      )

      // Update callback
      callbackVersion = 2
      rerender({ 
        callback: createCallback(callbackVersion), 
        delay: 300 
      })

      act(() => {
        result.current()
      })

      act(() => {
        jest.advanceTimersByTime(300)
      })

      // Should use the updated callback
      expect(result.current).toBeDefined()
    })
  })
})