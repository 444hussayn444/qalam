import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToCartAsync } from '../../redux/slices/cartSlice';
import { showError, showInfo } from '../../utils/toast';
import { API_URL } from '../../config/config';
import { assetUrl } from '../../utils/asset';
import './ProductDetail.css';

export default function ProductDetail() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`${API_URL}/products/${productId}`);
      const data = await response.json();

      if (data.success && data.data) {
        setProduct(data.data);
      } else {
        showError('Product not found');
        navigate('/store');
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      showError('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      showInfo("Please login to add items to cart");
      navigate('/login');
      return;
    }

    setAdding(true);
    try {
      await dispatch(addToCartAsync({
        userId: user.id,
        productId: product.id,
        quantity: quantity
      })).unwrap();

      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (error) {
      showError("Failed to add to cart: " + error);
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="product-detail-page">
        <div className="loading">Loading product...</div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div className="product-detail-page">
      <button onClick={() => navigate('/store')} className="back-btn">
        ← Back to Store
      </button>

      <div className="product-detail-container">
        <div className="product-image-section">
          <img
            src={assetUrl(API_URL.replace(/\/api\/v1$/, ''), product)}
            alt={product.title}
            className="product-main-image"
            loading="lazy"
          />
        </div>

        <div className="product-info-section">
          <div className="product-category">{product.category}</div>
          <h1 className="product-title">{product.title}</h1>
          <div className="product-price">${parseFloat(product.price).toFixed(2)}</div>

          <div className="product-description">
            <h3>Description</h3>
            <p>{product.description || 'No description available'}</p>
          </div>

          <div className="product-actions-section">
            <div className="quantity-selector">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="quantity-btn"
              >
                -
              </button>
              <span className="quantity-display">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="quantity-btn"
              >
                +
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={adding}
              className={`add-to-cart-btn ${added ? 'added' : ''}`}
            >
              {adding ? 'Adding...' : added ? '✓ Added to Cart' : 'Add to Cart'}
            </button>
          </div>

          <div className="product-details">
            <h3>Product Details</h3>
            <ul>
              <li><strong>Category:</strong> {product.category}</li>
              <li><strong>Price:</strong> ${parseFloat(product.price).toFixed(2)}</li>
              <li><strong>Availability:</strong> In Stock</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
