import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  fetchCart,
  removeFromCartAsync,
  updateCartQuantityAsync,
  resetCartAsync,
  optimisticUpdateQuantity,
  optimisticRemoveItem
} from '../../redux/slices/cartSlice';
import { API_URL } from '../../config/config';
import { assetUrl } from '../../utils/asset';
import './Cart.css';

// Simple Icons Components to avoid external dependencies
const TrashIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
);
const MinusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);
const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);
const ArrowLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
);
const BagIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
);

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, totalAmount, loading } = useSelector((state) => state.cart);
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchCart(user.id));
    }
  }, [dispatch, user]);

  // Helper to format currency
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const handleRemove = (productId) => {
    if (user?.id) {
      dispatch(optimisticRemoveItem(productId));
      dispatch(removeFromCartAsync({ userId: user.id, productId }));
    }
  };

  const handleUpdateQuantity = (productId, quantity) => {
    if (user?.id && quantity > 0) {
      dispatch(optimisticUpdateQuantity({ productId, quantity }));
      dispatch(updateCartQuantityAsync({ userId: user.id, productId, quantity }));
    } else if (quantity === 0) {
      handleRemove(productId);
    }
  };

  const handleResetCart = () => {
    if (user?.id && window.confirm('Are you sure you want to clear the cart?')) {
      dispatch(resetCartAsync(user.id));
    }
  };

  const handleCheckout = () => {
    if (items.length > 0) navigate('/checkout');
  };

  if (!user) {
    return (
      <div className="cart-container">
        <div className="cart-empty fade-in">
          <div className="icon-wrapper"><BagIcon /></div>
          <h2>Please login to view your cart</h2>
          <button onClick={() => navigate('/login')} className="btn-primary">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (loading && items.length === 0) {
    return (
      <div className="cart-container">
        <div className="cart-loading">
          <div className="spinner"></div>
          <p>Loading your cart...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="cart-container">
        <div className="cart-empty fade-in">
          <div className="icon-wrapper"><BagIcon /></div>
          <h2>Your cart is empty</h2>
          <p className="sub-text">Looks like you haven't added anything yet.</p>
          <button onClick={() => navigate('/store')} className="btn-primary">
            Start Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-container fade-in">
      <div className="cart-header">
        <button onClick={() => navigate(-1)} className="btn-back">
          <ArrowLeftIcon /> Continue Shopping
        </button>
        <h1>My Cart <span className="item-count">({items.length} items)</span></h1>
      </div>

      <div className="cart-layout">
        <div className="cart-items-section">
          <div className="cart-items-header">
            <span>Product</span>
            <span>Quantity</span>
            <span>Total</span>
          </div>
          <div className="cart-items-list">
            {items.map((item) => (
              <div key={item.product_id} className="cart-item">
                <div className="cart-item-main">
                  <img
                    src={assetUrl(API_URL.replace(/\/api\/v1$/, ''), item)}
                    alt={item.title}
                    className="cart-item-image"
                    loading="lazy"
                  />
                  <div className="cart-item-info">
                    <h3>{item.title}</h3>
                    <p className="cart-item-unit-price">{formatPrice(item.price)}</p>
                  </div>
                </div>

                <div className="cart-item-actions">
                  <div className="quantity-controls">
                    <button
                      onClick={() => handleUpdateQuantity(item.product_id, item.quantity - 1)}
                      className="qty-btn"
                    >
                      <MinusIcon />
                    </button>
                    <span className="qty-value">{item.quantity}</span>
                    <button
                      onClick={() => handleUpdateQuantity(item.product_id, item.quantity + 1)}
                      className="qty-btn"
                    >
                      <PlusIcon />
                    </button>
                  </div>
                </div>

                <div className="cart-item-end">
                  <p className="cart-item-total-price">{formatPrice(item.price * item.quantity)}</p>
                  <button
                    onClick={() => handleRemove(item.product_id)}
                    className="btn-icon-remove"
                    title="Remove Item"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button onClick={handleResetCart} className="btn-text-danger">
            Clear Shopping Cart
          </button>
        </div>

        <div className="cart-summary-section">
          <div className="cart-summary-card">
            <h2>Order Summary</h2>

            <div className="summary-row">
              <span>Subtotal</span>
              <span>{formatPrice(totalAmount)}</span>
            </div>
            <div className="summary-row">
              <span>Shipping Estimate</span>
              <span>Calculated at checkout</span>
            </div>

            <div className="divider"></div>

            <div className="summary-row total">
              <span>Total</span>
              <span>{formatPrice(totalAmount)}</span>
            </div>

            <button onClick={handleCheckout} className="btn-checkout">
              Checkout
            </button>

            <div className="secure-badge">
              <span>🔒 Secure Checkout</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;