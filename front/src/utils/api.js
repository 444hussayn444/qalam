import { API_URL } from "../config/config";

// Helper function to get auth headers
export const getAuthHeaders = (isAdmin = false) => {
  const token = isAdmin
    ? localStorage.getItem("adminToken")
    : localStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Helper function for fetch with auth
export const authFetch = async (url, options = {}, isAdmin = false) => {
  const headers = {
    ...getAuthHeaders(isAdmin),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle token expiration
  if (response.status === 401) {
    if (isAdmin) {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUser");
      window.location.href = "/admin-46ab702136bc4b229f8b10e8c2997fa4";
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
  }

  return response;
};

// API endpoints
export const API = {
  // Products
  getProducts: () => `${API_URL}/products`,

  // Admin
  adminLogin: () => `${API_URL}/admin/login`,
  getCategories: () => `${API_URL}/admin/categories`,
  addProduct: () => `${API_URL}/admin/products`,
  updateProduct: (id) => `${API_URL}/admin/products/${id}`,
  deleteProduct: (id) => `${API_URL}/admin/products/${id}`,
  getCustomers: () => `${API_URL}/admin/customers`,
  getOrders: () => `${API_URL}/admin/orders`,

  // Cart
  getCart: (userId) => `${API_URL}/cart/${userId}`,
  addToCart: () => `${API_URL}/cart/add`,

  // Payment
  createPayPalOrder: () => `${API_URL}/payment/paypal/orders`,
  capturePayPalOrder: () => `${API_URL}/payment/paypal/capture`,
  getOrderDetails: (orderId) => `${API_URL}/payment/orders/${orderId}`,
  getUserOrders: (userId) => `${API_URL}/payment/orders/user/${userId}`,

  // Auth
  login: () => `${API_URL}/login`,
  register: () => `${API_URL}/register`,
  sendOTP: () => `${API_URL}/send-otp`,
};
