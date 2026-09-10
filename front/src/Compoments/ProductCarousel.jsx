import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config/config';
import './ProductCarousel.css';

const ProductCarousel = ({ products = [], itemsPerSlide = 50 }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  // Calculate total slides
  const totalSlides = Math.ceil(products.length / itemsPerSlide);

  // Auto-slide every 5 seconds
  useEffect(() => {
    if (products.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalSlides);
    }, 5000);

    return () => clearInterval(interval);
  }, [products.length, totalSlides]);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const handleProductClick = (product) => {
    navigate('/description', { state: { product } });
  };

  if (products.length === 0) {
    return <div className="carousel-empty">No products available</div>;
  }

  // Get products for current slide
  const startIdx = currentIndex * itemsPerSlide;
  const currentProducts = products.slice(startIdx, startIdx + itemsPerSlide);

  return (
    <div className="product-carousel">
      <h2 className="carousel-title">Top Sellers</h2>

      <div className="carousel-container">
        <button className="carousel-btn prev" onClick={goToPrev}>
          ‹
        </button>

        <div className="carousel-content">
          <div className="carousel-grid">
            {currentProducts.map((product) => (
              <div
                key={product.id}
                className="carousel-product-card"
                onClick={() => handleProductClick(product)}
              >
                <div className="carousel-product-image">
                  <img
                    src={`${API_URL.replace(/\/api\/v1$/, '')}/assets/${product.category}/${product.image}`}
                    alt={product.title}
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = '/placeholder.png';
                    }}
                  />
                </div>
                <div className="carousel-product-info">
                  <h4>{product.title}</h4>
                  <p className="carousel-product-price">${product.price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button className="carousel-btn next" onClick={goToNext}>
          ›
        </button>
      </div>

      <div className="carousel-dots">
        {Array.from({ length: totalSlides }).map((_, idx) => (
          <span
            key={idx}
            className={`dot ${idx === currentIndex ? 'active' : ''}`}
            onClick={() => setCurrentIndex(idx)}
          />
        ))}
      </div>
    </div>
  );
};

export default ProductCarousel;
