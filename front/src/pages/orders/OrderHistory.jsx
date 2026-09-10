import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../../config/config";
import { assetUrl } from "../../utils/asset";
import "./OrderHistory.css";

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState({});

  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.id) {
      navigate("/login");
      return;
    }

    const fetchOrders = async () => {
      try {
        const response = await fetch(
          `${API_URL}/payment/orders/user/${user.id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch orders");
        }

        setOrders(data.orders || []);
      } catch (err) {
        console.error("Error fetching orders:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, navigate]);

  const fetchOrderDetails = async (orderId) => {
    if (orderDetails[orderId]) {
      setExpandedOrder(expandedOrder === orderId ? null : orderId);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/payment/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch order details");
      }

      setOrderDetails((prev) => ({
        ...prev,
        [orderId]: data.items || [],
      }));
      setExpandedOrder(orderId);
    } catch (err) {
      console.error("Error fetching order details:", err);
    }
  };

  if (loading) {
    return (
      <div className="order-history-container">
        <div className="loading-spinner"></div>
        <p>Loading your orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="order-history-container">
        <div className="error-message">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate("/store")} className="btn-primary">
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="order-history-container">
        <div className="empty-orders">
          <h2>No Orders Yet</h2>
          <p>You haven't placed any orders yet.</p>
          <button onClick={() => navigate("/store")} className="btn-primary">
            Start Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="order-history-container">
      <h1>Order History</h1>

      <div className="orders-list">
        {orders.map((order) => (
          <div key={order.id} className="order-card">
            <div
              className="order-header"
              onClick={() => fetchOrderDetails(order.id)}
            >
              <div className="order-info">
                <h3>Order #{order.id.substring(0, 8)}</h3>
                <p className="order-date">
                  {new Date(order.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div className="order-summary">
                <p className="order-total">
                  ${parseFloat(order.total_amount).toFixed(2)}
                </p>
                <span className={`order-status status-${order.status}`}>
                  {order.status}
                </span>
              </div>
              <div className="expand-icon">
                {expandedOrder === order.id ? "▲" : "▼"}
              </div>
            </div>

            {expandedOrder === order.id && orderDetails[order.id] && (
              <div className="order-details">
                <h4>Order Items:</h4>
                <div className="order-items">
                  {orderDetails[order.id].map((item, index) => (
                    <div key={index} className="order-item">
                      <img
                        src={assetUrl(API_URL.replace(/\/api\/v1$/, ""), item)}
                        alt={item.title}
                        className="order-item-image"
                        loading="lazy"
                      />
                      <div className="order-item-details">
                        <h5>{item.title}</h5>
                        <p>Quantity: {item.quantity}</p>
                        <p className="item-price">
                          ${parseFloat(item.price).toFixed(2)} each
                        </p>
                        <p className="item-total">
                          Total: $
                          {(parseFloat(item.price) * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderHistory;
