import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_URL } from '../../config/config';

const API_BASE_URL = API_URL;

export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (page = 1) => {
    const response = await fetch(`${API_BASE_URL}/products?page=${page}&limit=20`);
    const data = await response.json();
    return data;
  }
);

export const loadMoreProducts = createAsyncThunk(
  'products/loadMoreProducts',
  async (page) => {
    const response = await fetch(`${API_BASE_URL}/products?page=${page}&limit=20`);
    const data = await response.json();
    return data;
  }
);

const productsSlice = createSlice({
  name: 'products',
  initialState: {
    items: [],
    status: 'idle',
    error: null,
    searchQuery: '',
    selectedCategory: 'all',
    currentPage: 1,
    totalPages: 1,
    hasMore: false,
    loading: false,
  },
  reducers: {
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    setSelectedCategory: (state, action) => {
      state.selectedCategory = action.payload;
    },
    clearFilters: (state) => {
      state.searchQuery = '';
      state.selectedCategory = 'all';
    },
    resetProducts: (state) => {
      state.items = [];
      state.currentPage = 1;
      state.totalPages = 1;
      state.hasMore = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.status = 'loading';
        state.loading = true;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.loading = false;
        state.items = action.payload.data || [];
        state.currentPage = action.payload.pagination?.currentPage || 1;
        state.totalPages = action.payload.pagination?.totalPages || 1;
        state.hasMore = action.payload.pagination?.hasMore || false;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.status = 'failed';
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(loadMoreProducts.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadMoreProducts.fulfilled, (state, action) => {
        state.loading = false;
        // Append new products
        state.items = [...state.items, ...(action.payload.data || [])];
        state.currentPage = action.payload.pagination?.currentPage || state.currentPage;
        state.totalPages = action.payload.pagination?.totalPages || state.totalPages;
        state.hasMore = action.payload.pagination?.hasMore || false;
      })
      .addCase(loadMoreProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { setSearchQuery, setSelectedCategory, clearFilters, resetProducts } = productsSlice.actions;

export const selectFilteredProducts = (state) => {
  const { items, searchQuery, selectedCategory } = state.products;

  let filtered = items;

  if (selectedCategory !== 'all') {
    filtered = filtered.filter(
      (product) => product.category?.toLowerCase() === selectedCategory.toLowerCase()
    );
  }

  if (searchQuery) {
    filtered = filtered.filter(
      (product) =>
        product.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  return filtered;
};

export default productsSlice.reducer;
