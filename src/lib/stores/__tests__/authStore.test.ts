import { useAuthStore } from '../authStore'
import { act, renderHook } from '@testing-library/react'

// Mock fetch
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

describe('authStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAuthStore.setState({
      user: null,
      isLoading: false,
      error: null,
    })
    mockFetch.mockClear()
  })

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useAuthStore())
      
      expect(result.current.user).toBeNull()
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })
  })

  describe('setters', () => {
    it('should set user correctly', () => {
      const { result } = renderHook(() => useAuthStore())
      const testUser = { id: '1', email: 'test@example.com', name: 'Test User' }

      act(() => {
        result.current.setUser(testUser)
      })

      expect(result.current.user).toEqual(testUser)
    })

    it('should set loading state correctly', () => {
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.setLoading(true)
      })

      expect(result.current.isLoading).toBe(true)
    })

    it('should set error correctly', () => {
      const { result } = renderHook(() => useAuthStore())
      const errorMessage = 'Test error'

      act(() => {
        result.current.setError(errorMessage)
      })

      expect(result.current.error).toBe(errorMessage)
    })
  })

  describe('login', () => {
    it('should login successfully', async () => {
      const { result } = renderHook(() => useAuthStore())
      const mockUser = { id: '1', email: 'test@example.com', name: 'Test User' }
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockUser }),
      } as Response)

      let loginResult: boolean
      await act(async () => {
        loginResult = await result.current.login('test@example.com', 'password')
      })

      expect(loginResult!).toBe(true)
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'password' }),
      })
    })

    it('should handle login failure', async () => {
      const { result } = renderHook(() => useAuthStore())
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid credentials' }),
      } as Response)

      let loginResult: boolean
      await act(async () => {
        loginResult = await result.current.login('test@example.com', 'wrongpassword')
      })

      expect(loginResult!).toBe(false)
      expect(result.current.user).toBeNull()
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe('Invalid credentials')
    })

    it('should handle network error during login', async () => {
      const { result } = renderHook(() => useAuthStore())
      
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      let loginResult: boolean
      await act(async () => {
        loginResult = await result.current.login('test@example.com', 'password')
      })

      expect(loginResult!).toBe(false)
      expect(result.current.error).toBe('Network error')
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('logout', () => {
    it('should logout successfully', async () => {
      const { result } = renderHook(() => useAuthStore())
      const testUser = { id: '1', email: 'test@example.com', name: 'Test User' }
      
      // Set initial user
      act(() => {
        result.current.setUser(testUser)
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
      } as Response)

      await act(async () => {
        await result.current.logout()
      })

      expect(result.current.user).toBeNull()
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/logout', { method: 'POST' })
    })

    it('should handle logout failure', async () => {
      const { result } = renderHook(() => useAuthStore())
      
      mockFetch.mockRejectedValueOnce(new Error('Logout failed'))

      await act(async () => {
        await result.current.logout()
      })

      expect(result.current.error).toBe('Logout failed')
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('checkAuth', () => {
    it('should check auth successfully when user is authenticated', async () => {
      const { result } = renderHook(() => useAuthStore())
      const mockUser = { id: '1', email: 'test@example.com', name: 'Test User' }
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockUser }),
      } as Response)

      await act(async () => {
        await result.current.checkAuth()
      })

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.isLoading).toBe(false)
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/me')
    })

    it('should handle unauthenticated user', async () => {
      const { result } = renderHook(() => useAuthStore())
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
      } as Response)

      await act(async () => {
        await result.current.checkAuth()
      })

      expect(result.current.user).toBeNull()
      expect(result.current.isLoading).toBe(false)
    })

    it('should handle network error during auth check', async () => {
      const { result } = renderHook(() => useAuthStore())
      
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await act(async () => {
        await result.current.checkAuth()
      })

      expect(result.current.user).toBeNull()
      expect(result.current.isLoading).toBe(false)
    })
  })
})