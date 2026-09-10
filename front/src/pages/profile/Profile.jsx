import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setUser } from '../../redux/slices/authSlice';
import { showSuccess, showError } from '../../utils/toast';
import { API_URL } from '../../config/config';
import './profile.css';

export default function Profile() {
    const user = useSelector((state) => state.auth.user);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [orders, setOrders] = useState([]);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        phone: '',
        address: ''
    });

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        // Initialize form data
        setFormData({
            username: user.username || '',
            email: user.email || '',
            phone: user.phone || '',
            address: user.address || ''
        });

        // Fetch user's order history
        fetchOrders();
    }, [user, navigate]);

    const fetchOrders = async () => {
        try {
            const response = await fetch(`${API_URL}/payment/orders/user/${user.id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            if (data.success) {
                setOrders(data.orders || []);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/user/update`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    userId: user.id,
                    ...formData
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Update Redux store with new user data
                dispatch(setUser({ ...user, ...formData }));

                // Update localStorage
                const storedUser = JSON.parse(localStorage.getItem('user'));
                localStorage.setItem('user', JSON.stringify({ ...storedUser, ...formData }));

                showSuccess('Profile updated successfully!');
                setIsEditing(false);
            } else {
                showError(data.message || 'Failed to update profile');
            }
        } catch (error) {
            showError('Failed to update profile');
            console.error('Error updating profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (!user) {
        return null;
    }

    return (
        <div className="profile-page">
            <div className="profile-container">
                <div className="profile-header">
                    <h1>My Profile</h1>
                </div>

                <div className="profile-content">
                    {/* Profile Information Card */}
                    <div className="profile-card">
                        <div className="card-header">
                            <h2>Personal Information</h2>
                            {!isEditing && (
                                <button
                                    className="edit-btn"
                                    onClick={() => setIsEditing(true)}
                                >
                                    Edit Profile
                                </button>
                            )}
                        </div>

                        {isEditing ? (
                            <form onSubmit={handleSubmit} className="profile-form">
                                <div className="form-group">
                                    <label>Username</label>
                                    <input
                                        type="text"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="Your phone number"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Delivery Address</label>
                                    <textarea
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        rows="3"
                                        placeholder="Your delivery address"
                                    />
                                </div>

                                <div className="form-actions">
                                    <button
                                        type="submit"
                                        className="save-btn"
                                        disabled={loading}
                                    >
                                        {loading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                    <button
                                        type="button"
                                        className="cancel-btn"
                                        onClick={() => {
                                            setIsEditing(false);
                                            setFormData({
                                                username: user.username || '',
                                                email: user.email || '',
                                                phone: user.phone || '',
                                                address: user.address || ''
                                            });
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="profile-info">
                                <div className="info-row">
                                    <span className="info-label">Username:</span>
                                    <span className="info-value">{user.username}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Email:</span>
                                    <span className="info-value">{user.email}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Phone:</span>
                                    <span className="info-value">{user.phone || 'Not provided'}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Address:</span>
                                    <span className="info-value">{user.address || 'Not provided'}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Order History Card */}
                    <div className="profile-card">
                        <div className="card-header">
                            <h2>Order History</h2>
                        </div>

                        {!orders || orders.length === 0 ? (
                            <div className="no-orders">
                                <p>No orders yet</p>
                                <button onClick={() => navigate('/store')}>Start Shopping</button>
                            </div>
                        ) : (
                            <div className="orders-list">
                                {orders.map((order) => (
                                    <div key={order.id} className="order-item">
                                        <div className="order-header">
                                            <div>
                                                <span className="order-id">Order #{order.id.slice(0, 8)}</span>
                                                <span className="order-date">{formatDate(order.created_at)}</span>
                                            </div>
                                            <span className="order-total">${parseFloat(order.total_amount).toFixed(2)}</span>
                                        </div>
                                        <div className="order-status">
                                            Status: <span className={`status-badge ${order.payment_status}`}>
                                                {order.payment_status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
