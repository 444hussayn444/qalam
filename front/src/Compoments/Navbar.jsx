import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../redux/slices/authSlice";
import { fetchCart } from "../redux/slices/cartSlice";
import "./Navbar.css";
import { SiSinglestore } from "react-icons/si";
import { MdOutlineWbIncandescent } from "react-icons/md";
import { BsCart } from "react-icons/bs";
import { FaHome, FaHistory, FaUser, FaSignOutAlt } from "react-icons/fa";
// ... (imports remain the same)
import logo from "./logo.jpeg"

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const theme = 'dark';
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Selectors
    const cartQuantity = useSelector((state) => state.cart.totalQuantity);
    const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
    const user = useSelector((state) => state.auth.user);

    const handleLogout = () => {
        dispatch(logout());
        setIsOpen(false);
        navigate('/login');
    };

    useEffect(() => {
        document.body.setAttribute('data-theme', theme);
    }, [theme]);

    useEffect(() => {
        if (isAuthenticated && user?.id) {
            dispatch(fetchCart(user.id));
        }
    }, [isAuthenticated, user?.id, dispatch]);

    const getLinkClass = ({ isActive }) =>
        isActive ? "link active" : "link";

    return (
        <div style={{overflow:"hidden", position: "relative", display: "flex", padding: "15px", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            {/* Top Header Bar */}
            <div className="top-header">
                <button className="burger-btn" onClick={() => setIsOpen(true)}>
                    ☰
                </button>
            </div>
            <img style={{
                position: "absolute", right: 0, objectFit: "cover", width: "150px", 
            }} src={logo} alt="Logo" className="nav-logo" />

            {/* Sidebar Drawer */}
            <div
                className="Navbar"
                style={{
                    position: "fixed",
                    top: 0,
                    left: isOpen ? 0 : "-260px",
                    width: "260px",
                    height: "100%",
                    transition: "left 0.3s ease",
                    paddingTop: "60px",
                    zIndex: 999,
                }}
            >
                <button className="close-btn" onClick={() => setIsOpen(false)}>
                    ×
                </button>

                <nav style={{ padding: "20px", display: "flex", flexDirection: "column", height: "100%" }}>
                    <NavLink to="/" end className={getLinkClass} onClick={() => setIsOpen(false)}>
                        <FaHome className="fix-icon" /> Home
                    </NavLink>

                    <NavLink to="/store" className={getLinkClass} onClick={() => setIsOpen(false)}>
                        <SiSinglestore className="fix-icon" /> Store
                    </NavLink>

                    <NavLink to="/cart" className={getLinkClass} onClick={() => setIsOpen(false)} style={{ position: "relative" }}>
                        <BsCart className="fix-icon" /> Cart
                        {cartQuantity > 0 && (
                            <span className="cart-badge">
                                {cartQuantity}
                            </span>
                        )}
                    </NavLink>

                    <NavLink to="/description" className={getLinkClass} onClick={() => setIsOpen(false)}>
                        <MdOutlineWbIncandescent className="fix-icon" /> Description
                    </NavLink>

                    <hr className="bloodline" />

                    {!isAuthenticated ? (
                        <>
                            <NavLink to="/login" className={getLinkClass} onClick={() => setIsOpen(false)}>
                                Login
                            </NavLink>
                            <NavLink to="/signup" className={getLinkClass} onClick={() => setIsOpen(false)}>
                                Sign-up
                            </NavLink>
                        </>
                    ) : (
                        <>
                            <div className="user-panel">
                                <FaUser />
                                <span style={{ fontWeight: "600", fontSize: "14px" }}>{user?.username}</span>
                            </div>

                            <NavLink to="/profile" className={getLinkClass} onClick={() => setIsOpen(false)}>
                                <FaUser className="fix-icon" /> My Profile
                            </NavLink>

                            <NavLink to="/orders" className={getLinkClass} onClick={() => setIsOpen(false)}>
                                <FaHistory className="fix-icon" /> Order History
                            </NavLink>

                            <div style={{ marginTop: "auto", marginBottom: "20px" }}>
                                <button className="logout-btn" onClick={handleLogout}>
                                    <FaSignOutAlt style={{ marginRight: "10px" }} /> Logout
                                </button>
                            </div>
                        </>
                    )}
                </nav>
            </div>

            {/* Overlay */}
            {isOpen && (
                <div
                    className="overlay"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
}