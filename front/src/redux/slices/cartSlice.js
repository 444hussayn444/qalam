import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "../../config/config";

const API_BASE_URL = API_URL;

// Async thunks for cart operations

export const fetchCart = createAsyncThunk(
  "cart/fetchCart",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cart/${userId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message);
      }

      return data.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const addToCartAsync = createAsyncThunk(
  "cart/addToCart",
  async ({ userId, productId, quantity = 1 }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cart/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ userId, productId, quantity }),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message);
      }

      return data.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const removeFromCartAsync = createAsyncThunk(
  "cart/removeFromCart",
  async ({ userId, productId }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cart/remove`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ userId, productId }),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message);
      }

      return data.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const updateCartQuantityAsync = createAsyncThunk(
  "cart/updateQuantity",
  async ({ userId, productId, quantity }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cart/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ userId, productId, quantity }),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message);
      }

      return data.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const resetCartAsync = createAsyncThunk(
  "cart/resetCart",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cart/reset`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message);
      }

      return [];
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    items: [],
    totalAmount: 0,
    totalQuantity: 0,
    loading: false,
    error: null,
  },
  reducers: {
    clearCartLocal: (state) => {
      state.items = [];
      state.totalAmount = 0;
      state.totalQuantity = 0;
      state.error = null;
    },
    calculateTotals: (state) => {
      let totalQuantity = 0;
      let totalAmount = 0;

      state.items.forEach((item) => {
        totalQuantity += item.quantity;
        totalAmount += item.price * item.quantity;
      });

      state.totalQuantity = totalQuantity;
      state.totalAmount = totalAmount;
    },
    // Optimistic updates
    optimisticUpdateQuantity: (state, action) => {
      const { productId, quantity } = action.payload;
      const item = state.items.find((i) => i.product_id === productId);
      if (item) {
        item.quantity = quantity;
        cartSlice.caseReducers.calculateTotals(state);
      }
    },
    optimisticRemoveItem: (state, action) => {
      const productId = action.payload;
      state.items = state.items.filter((i) => i.product_id !== productId);
      cartSlice.caseReducers.calculateTotals(state);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Cart
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        cartSlice.caseReducers.calculateTotals(state);
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Add to Cart
      .addCase(addToCartAsync.pending, (state) => {
        state.error = null;
      })
      .addCase(addToCartAsync.fulfilled, (state, action) => {
        state.items = action.payload;
        cartSlice.caseReducers.calculateTotals(state);
      })
      .addCase(addToCartAsync.rejected, (state, action) => {
        state.error = action.payload;
      })

      // Remove from Cart
      .addCase(removeFromCartAsync.pending, (state) => {
        state.error = null;
      })
      .addCase(removeFromCartAsync.fulfilled, (state, action) => {
        state.items = action.payload;
        cartSlice.caseReducers.calculateTotals(state);
      })
      .addCase(removeFromCartAsync.rejected, (state, action) => {
        state.error = action.payload;
        // Revert optimistic update on error - refetch cart
      })

      // Update Quantity
      .addCase(updateCartQuantityAsync.pending, (state) => {
        state.error = null;
      })
      .addCase(updateCartQuantityAsync.fulfilled, (state, action) => {
        state.items = action.payload;
        cartSlice.caseReducers.calculateTotals(state);
      })
      .addCase(updateCartQuantityAsync.rejected, (state, action) => {
        state.error = action.payload;
        // Revert optimistic update on error - refetch cart
      })

      // Reset Cart
      .addCase(resetCartAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resetCartAsync.fulfilled, (state) => {
        state.loading = false;
        state.items = [];
        state.totalAmount = 0;
        state.totalQuantity = 0;
      })
      .addCase(resetCartAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearCartLocal,
  calculateTotals,
  optimisticUpdateQuantity,
  optimisticRemoveItem,
} = cartSlice.actions;

export default cartSlice.reducer;
