import { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../../config/config";
import { assetUrl } from "../../utils/asset";
import { API, authFetch } from "../../utils/api";
import { FaPaypal } from "react-icons/fa";
import "./Checkout.css";

const Checkout = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { items, totalAmount } = useSelector((state) => state.cart);
  const user = useSelector((state) => state.auth.user);

  const handleCheckout = async () => {
    if (!user?.id) {
      navigate("/login");
      return;
    }

    if (items.length === 0) {
      setError("Your cart is empty");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await authFetch(API.createPayPalOrder(), {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok || !data.approvalUrl)
        throw new Error(data.message || "Unable to start PayPal checkout");
      window.location.assign(data.approvalUrl);
    } catch (err) {
      console.error("Checkout error:", err);
      setError(err.message);
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="checkout-container">
        <div className="checkout-message">
          <h2>Please login to continue</h2>
          <button onClick={() => navigate("/login")} className="btn-primary">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <div className="checkout-card">
        <h1>Checkout</h1>

        <div className="checkout-summary">
          <h2>Order Summary</h2>
          <div className="checkout-items">
            {items.map((item) => (
              <div key={item.product_id} className="checkout-item">
                <img
                  src={assetUrl(API_URL.replace(/\/api\/v1$/, ""), item)}
                  alt={item.title}
                  className="checkout-item-image"
                  loading="lazy"
                />
                <div className="checkout-item-details">
                  <h4>{item.title}</h4>
                  <p>Quantity: {item.quantity}</p>
                  <p className="checkout-item-price">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="checkout-total">
            <h3>Total Amount:</h3>
            <h3 className="total-price">${totalAmount.toFixed(2)}</h3>
          </div>

          {error && <div className="checkout-error">{error}</div>}

          <button
            onClick={handleCheckout}
            disabled={loading || items.length === 0}
            className="btn-checkout"
          >
            <FaPaypal aria-hidden="true" />
            {loading ? "Checking payment..." : "Pay securely with PayPal"}
          </button>

          <button
            onClick={() => navigate("/cart")}
            className="btn-secondary"
            disabled={loading}
          >
            Back to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
