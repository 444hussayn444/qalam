import "./App.css";
import "./index.css";
import { Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import Navbar from "./Compoments/Navbar";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
// Lazy load all pages
const Home = lazy(() => import("./pages/home/Home"));
const Store = lazy(() => import("./pages/store/Store"));
const CollectionPage = lazy(() => import("./pages/store/CollectionPage"));
const Description = lazy(() => import("./pages/description/Description"));
const Signup = lazy(() => import("./pages/auth/Signup"));
const Login = lazy(() => import("./pages/auth/Login"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const Cart = lazy(() => import("./pages/cart/Cart"));
const Checkout = lazy(() => import("./pages/checkout/Checkout"));
const OrderSuccess = lazy(() => import("./pages/success/OrderSuccess"));
const OrderHistory = lazy(() => import("./pages/orders/OrderHistory"));
const ProductDetail = lazy(() => import("./pages/productDetail/ProductDetail"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));
const Profile = lazy(() => import("./pages/profile/Profile"));

// Loading component
const Loading = () => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      fontSize: "24px",
      color: "#333",
    }}
  >
    Loading...
  </div>
);

function App() {
  return (
    <>
      <div id="blur-overlay"></div>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route
            path="/"
            element={
              <>
                <Navbar />
                <Home />
              </>
            }
          />
          <Route
            path="/store"
            element={
              <>
                <Navbar />
                <Store />
              </>
            }
          />
          <Route
            path="/collections/:slug"
            element={
              <>
                <Navbar />
                <CollectionPage />
              </>
            }
          />
          <Route
            path="/product/:productId"
            element={
              <>
                <Navbar />
                <ProductDetail />
              </>
            }
          />
          <Route
            path="/description"
            element={
              <>
                <Navbar />
                <Description />
              </>
            }
          />
          <Route
            path="/cart"
            element={
              <>
                <Navbar />
                <Cart />
              </>
            }
          />
          <Route
            path="/checkout"
            element={
              <>
                <Navbar />
                <Checkout />
              </>
            }
          />
          <Route
            path="/order-success"
            element={
              <>
                <Navbar />
                <OrderSuccess />
              </>
            }
          />
          <Route
            path="/orders"
            element={
              <>
                <Navbar />
                <OrderHistory />
              </>
            }
          />
          <Route
            path="/profile"
            element={
              <>
                <Navbar />
                <Profile />
              </>
            }
          />
          <Route
            path="/signup"
            element={
              <>
                <Navbar />
                <Signup />
              </>
            }
          />
          <Route
            path="/login"
            element={
              <>
                <Navbar />
                <Login />
              </>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <>
                <Navbar />
                <ForgotPassword />
              </>
            }
          />
          <Route
            path="/reset-password"
            element={
              <>
                <Navbar />
                <ResetPassword />
              </>
            }
          />
          <Route
            path="/admin-46ab702136bc4b229f8b10e8c2997fa4"
            element={<AdminLogin />}
          />
          <Route
            path="/admin-dashboard-8d4e9c1a5b2f3g6h7j8k9l0m"
            element={<AdminDashboard />}
          />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
