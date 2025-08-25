import { useProductStore } from '../productStore'
import { act, renderHook } from '@testing-library/react'
import { Product } from '@prisma/client'

// Mock fetch
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

// Mock product data
const mockProduct: Product = {
  id: 'clh1',
  name: 'Test Laptop',
  description: 'A test laptop',
  price: 999.99,
  category: 'laptops',
  brand: 'TestBrand',
  imageUrl: 'test.jpg',
  rating: 4.5,
  reviewCount: 100,
  inStock: true,
  ram_gb: 16,
  storage_gb: 512,
  cpu: 'Intel i7',
  gpu: 'NVIDIA RTX',
  screenSize: 15.6,
  weight: 2.1,
  batteryLife: 8,
  operatingSystem: 'Windows 11',
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('productStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useProductStore.setState({
      products: [],
      currentProduct: null,
      filters: {},
      searchQuery: '',
      currentPage: 1,
      totalPages: 1,
      totalCount: 0,
      isLoading: false,
      error: null,
      favoriteProductIds: [],
      comparisonList: [],
      comparisonSummary: null,
      isComparingLoading: false,
    })
    mockFetch.mockClear()
  })

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useProductStore())
      
      expect(result.current.products).toEqual([])
      expect(result.current.currentProduct).toBeNull()
      expect(result.current.filters).toEqual({})
      expect(result.current.searchQuery).toBe('')
      expect(result.current.currentPage).toBe(1)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.favoriteProductIds).toEqual([])
      expect(result.current.comparisonList).toEqual([])
    })
  })

  describe('setters', () => {
    it('should set products correctly', () => {
      const { result } = renderHook(() => useProductStore())
      const products = [mockProduct]
      const pagination = { totalPages: 5, totalCount: 100, page: 2 }

      act(() => {
        result.current.setProducts(products, pagination)
      })

      expect(result.current.products).toEqual(products)
      expect(result.current.totalPages).toBe(5)
      expect(result.current.totalCount).toBe(100)
      expect(result.current.currentPage).toBe(2)
    })

    it('should set filters and reset page', () => {
      const { result } = renderHook(() => useProductStore())
      
      // Set initial page
      act(() => {
        result.current.setCurrentPage(3)
      })

      act(() => {
        result.current.setFilters({ category: 'laptops', minPrice: 500 })
      })

      expect(result.current.filters).toEqual({ category: 'laptops', minPrice: 500 })
      expect(result.current.currentPage).toBe(1) // Should reset to page 1
    })

    it('should toggle favorite correctly', () => {
      const { result } = renderHook(() => useProductStore())

      // Add to favorites
      act(() => {
        result.current.toggleFavorite('product1')
      })

      expect(result.current.favoriteProductIds).toContain('product1')

      // Remove from favorites
      act(() => {
        result.current.toggleFavorite('product1')
      })

      expect(result.current.favoriteProductIds).not.toContain('product1')
    })
  })

  describe('comparison functionality', () => {
    it('should add product to comparison', () => {
      const { result } = renderHook(() => useProductStore())

      act(() => {
        result.current.addToComparison(mockProduct)
      })

      expect(result.current.comparisonList).toContain(mockProduct)
    })

    it('should not add duplicate products to comparison', () => {
      const { result } = renderHook(() => useProductStore())

      act(() => {
        result.current.addToComparison(mockProduct)
        result.current.addToComparison(mockProduct) // Try to add same product again
      })

      expect(result.current.comparisonList).toHaveLength(1)
    })

    it('should not add more than 4 products to comparison', () => {
      const { result } = renderHook(() => useProductStore())
      const products = Array.from({ length: 5 }, (_, i) => ({
        ...mockProduct,
        id: `product${i}`,
      }))

      act(() => {
        products.forEach(product => {
          result.current.addToComparison(product)
        })
      })

      expect(result.current.comparisonList).toHaveLength(4)
    })

    it('should remove product from comparison', () => {
      const { result } = renderHook(() => useProductStore())

      act(() => {
        result.current.addToComparison(mockProduct)
        result.current.removeFromComparison(mockProduct.id)
      })

      expect(result.current.comparisonList).not.toContain(mockProduct)
    })

    it('should clear comparison', () => {
      const { result } = renderHook(() => useProductStore())

      act(() => {
        result.current.addToComparison(mockProduct)
        result.current.setComparisonSummary('Test summary')
        result.current.clearComparison()
      })

      expect(result.current.comparisonList).toEqual([])
      expect(result.current.comparisonSummary).toBeNull()
    })
  })

  describe('fetchProducts', () => {
    it('should fetch products successfully', async () => {
      const { result } = renderHook(() => useProductStore())
      const mockResponse = {
        products: [mockProduct],
        pagination: { totalPages: 1, totalCount: 1, page: 1 }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      await act(async () => {
        await result.current.fetchProducts()
      })

      expect(result.current.products).toEqual([mockProduct])
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should handle fetch error', async () => {
      const { result } = renderHook(() => useProductStore())

      mockFetch.mockResolvedValueOnce({
        ok: false,
      } as Response)

      await act(async () => {
        await result.current.fetchProducts()
      })

      expect(result.current.error).toBe('Failed to fetch products')
      expect(result.current.isLoading).toBe(false)
    })

    it('should include filters in fetch request', async () => {
      const { result } = renderHook(() => useProductStore())

      // Set filters and search query
      act(() => {
        result.current.setFilters({ 
          category: 'laptops', 
          minPrice: 500, 
          sortBy: 'price',
          sortDirection: 'asc'
        })
        result.current.setSearchQuery('gaming')
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ products: [], pagination: { totalPages: 1, totalCount: 0, page: 1 } }),
      } as Response)

      await act(async () => {
        await result.current.fetchProducts()
      })

      const fetchCall = mockFetch.mock.calls[0]
      const url = fetchCall[0] as string
      const urlParams = new URLSearchParams(url.split('?')[1])

      expect(urlParams.get('search')).toBe('gaming')
      expect(urlParams.get('category')).toBe('laptops')
      expect(urlParams.get('minPrice')).toBe('500')
      expect(urlParams.get('sortBy')).toBe('price')
      expect(urlParams.get('sortDirection')).toBe('asc')
    })
  })

  describe('resetSearchAndFilters', () => {
    it('should reset search and filters', () => {
      const { result } = renderHook(() => useProductStore())

      // Set some state
      act(() => {
        result.current.setSearchQuery('test')
        result.current.setFilters({ category: 'laptops' })
        result.current.setCurrentPage(3)
        result.current.setError('Some error')
      })

      // Mock fetchProducts to avoid actual API call
      const originalFetchProducts = result.current.fetchProducts
      const mockFetchProducts = jest.fn()
      
      act(() => {
        useProductStore.setState({ fetchProducts: mockFetchProducts })
      })

      act(() => {
        result.current.resetSearchAndFilters()
      })

      expect(result.current.searchQuery).toBe('')
      expect(result.current.filters).toEqual({})
      expect(result.current.currentPage).toBe(1)
      expect(result.current.error).toBeNull()

      // Restore original function
      act(() => {
        useProductStore.setState({ fetchProducts: originalFetchProducts })
      })
    })
  })
})