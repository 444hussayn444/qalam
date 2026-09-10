import { configureStore } from '@reduxjs/toolkit';
import productsReducer from './slices/productsSlice';
import authReducer from './slices/authSlice';
import cartReducer from './slices/cartSlice';

export const store = configureStore({
  reducer: {
    products: productsReducer,
    auth: authReducer,
    cart: cartReducer,
  },
});
