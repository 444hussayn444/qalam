import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { API, authFetch } from "../../utils/api";
import { clearCartLocal } from "../../redux/slices/cartSlice";
import "./OrderSuccess.css";

const OrderSuccess = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Confirming your PayPal payment...");

  useEffect(() => {
    const orderId = searchParams.get("orderId");
    if (!orderId) {
      setStatus(
        searchParams.get("payment") === "cancelled" ? "cancelled" : "error",
      );
      setMessage(
        searchParams.get("payment") === "cancelled"
          ? "The payment was cancelled."
          : "No payment order was provided.",
      );
      return;
    }
    authFetch(API.capturePayPalOrder(), {
      method: "POST",
      body: JSON.stringify({ orderId }),
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.success)
          throw new Error(
            data.paypalStatus
              ? `${data.message} (PayPal status: ${data.paypalStatus})`
              : data.message || "Payment could not be confirmed",
          );
        if (data.pendingWebhook) {
          setStatus("pending");
          setMessage("Payment captured. Waiting for PayPal confirmation.");
        } else {
          dispatch(clearCartLocal());
          setStatus("paid");
          setMessage("Your PayPal payment was completed successfully.");
        }
      })
      .catch((error) => {
        console.error("Payment confirmation error:", error);
        setStatus("error");
        setMessage(error.message);
      });
  }, [dispatch, searchParams]);

  return (
    <div className="success-container">
      <div className="success-card">
        <div className="success-icon">{status === "paid" ? "✓" : "!"}</div>
        <h1>{status === "paid" ? "Payment Complete" : "Payment Status"}</h1>
        <p className="success-message">{message}</p>
        <div className="order-info">
          {status === "loading" && (
            <p>Please wait while we confirm the transaction.</p>
          )}
          {status === "pending" && (
            <p>Your order will be marked paid after the webhook is received.</p>
          )}
          {status === "error" && (
            <p>Check your orders before trying to pay again.</p>
          )}
        </div>
        <div className="success-actions">
          <button onClick={() => navigate("/store")} className="btn-primary">
            Continue Shopping
          </button>
          <button onClick={() => navigate("/")} className="btn-secondary">
            Go to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
