import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { showSuccess, showError } from "../../utils/toast";
import { API_BASE_URL } from "../../config/config";
import { assetUrl } from "../../utils/asset";
import "./admin.css";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("designs");
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [collections, setCollections] = useState([]);
  const [designs, setDesigns] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const authFailureHandled = useRef(false);
  const errorToastShown = useRef(false);
  const [deletingId, setDeletingId] = useState(null);
  const [editingDesign, setEditingDesign] = useState(null);
  const [managedCollection, setManagedCollection] = useState(null);
  const [manageDesignIds, setManageDesignIds] = useState([]);
  const [managePrices, setManagePrices] = useState({});

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
  });
  const [collectionForm, setCollectionForm] = useState({
    name: "",
    description: "",
    image: null,
    designIds: [],
    designPrices: {},
  });
  const [designForm, setDesignForm] = useState({
    title: "",
    description: "",
    price: "",
    stock: 100,
    categoryId: "",
    collectionId: "",
    image: null,
  });

  useEffect(() => {
    if (!localStorage.getItem("adminToken")) {
      navigate("/admin-46ab702136bc4b229f8b10e8c2997fa4", { replace: true });
      return;
    }

    setAuthChecked(true);
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        await Promise.allSettled([
          fetchCategories(),
          fetchCollections(),
          fetchDesigns(),
          fetchCustomers(),
          fetchOrders(),
        ]);
      } catch (error) {
        showError("Could not load admin data.");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [navigate]);

  const authFetch = async (url, options = {}) => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      if (!authFailureHandled.current) {
        authFailureHandled.current = true;
        navigate("/admin-46ab702136bc4b229f8b10e8c2997fa4", { replace: true });
      }
      return null;
    }

    const headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    };

    try {
      const response = await fetch(url, { ...options, headers });
      if (!response.ok) {
        const data = await response
          .json()
          .catch(() => ({ message: response.statusText }));
        if (response.status === 401 || response.status === 403) {
          if (!authFailureHandled.current) {
            authFailureHandled.current = true;
            localStorage.removeItem("adminToken");
            localStorage.removeItem("adminUser");
            navigate("/admin-46ab702136bc4b229f8b10e8c2997fa4", {
              replace: true,
            });
          }
        } else {
          showError(data.message || "An unknown error occurred.");
        }
        return null;
      }
      return response;
    } catch (error) {
      if (!authFailureHandled.current) {
        showError("A network error occurred. Please check your connection.");
      }
      return null;
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await authFetch(
        `${API_BASE_URL}/api/v1/admin/categories`,
      );
      if (!response) return [];
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setCategories(data.data);
        return data.data;
      }
      return [];
    } catch (error) {
      console.error(error);
      return [];
    }
  };

  const fetchCollections = async () => {
    try {
      const response = await authFetch(
        `${API_BASE_URL}/api/v1/admin/collections`,
      );
      if (!response) return [];
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setCollections(data.data);
        return data.data;
      }
      return [];
    } catch (error) {
      console.error(error);
      return [];
    }
  };

  const fetchDesigns = async () => {
    try {
      const response = await authFetch(`${API_BASE_URL}/api/v1/admin/designs`);
      if (!response) return [];
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setDesigns(data.data);
        return data.data;
      }
      return [];
    } catch (error) {
      console.error(error);
      return [];
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await authFetch(
        `${API_BASE_URL}/api/v1/admin/customers`,
      );
      if (!response) return;
      const data = await response.json();
      if (data.success) setCustomers(data.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await authFetch(`${API_BASE_URL}/api/v1/admin/orders`);
      if (!response) return;
      const data = await response.json();
      if (data.success) setOrders(data.orders || []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchOrderDetails = async (orderId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/payment/orders/${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
        },
      );
      const data = await response.json();
      if (data.success) {
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId
              ? { ...order, items: data.items || [] }
              : order,
          ),
        );
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchCustomerOrders = async (userId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/payment/orders/user/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
        },
      );
      const data = await response.json();
      if (data.success) {
        setCustomers((prev) =>
          prev.map((customer) =>
            customer.id === userId
              ? { ...customer, orders: data.orders || [] }
              : customer,
          ),
        );
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    navigate("/admin-46ab702136bc4b229f8b10e8c2997fa4");
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleQuickAction = (tab) => {
    setActiveTab(tab);
    if (tab !== "designs") {
      setEditingDesign(null);
    }
    scrollToTop();
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await authFetch(
        `${API_BASE_URL}/api/v1/admin/categories`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(categoryForm),
        },
      );
      if (!response) return;
      const data = await response.json();
      if (data.success) {
        showSuccess("Category added successfully");
        setCategoryForm({ name: "", description: "" });
        fetchCategories();
      }
    } catch (error) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCollectionSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", collectionForm.name);
      formData.append("description", collectionForm.description);
      formData.append("designIds", JSON.stringify(collectionForm.designIds));
      formData.append(
        "designPrices",
        JSON.stringify(collectionForm.designPrices),
      );
      if (collectionForm.image) {
        formData.append("image", collectionForm.image);
      }
      const response = await authFetch(
        `${API_BASE_URL}/api/v1/admin/collections`,
        {
          method: "POST",
          body: formData,
        },
      );
      if (!response) return;
      const data = await response.json();
      if (data.success) {
        showSuccess("Collection created successfully");
        setCollectionForm({
          name: "",
          description: "",
          image: null,
          designIds: [],
          designPrices: {},
        });
        fetchCollections();
      }
    } catch (error) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDesignSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!designForm.categoryId && !designForm.collectionId) {
        throw new Error("Choose a category or collection");
      }
      const formData = new FormData();
      formData.append("title", designForm.title);
      formData.append("description", designForm.description);
      formData.append("price", designForm.price);
      formData.append("stock", designForm.stock);
      formData.append("categoryId", designForm.categoryId);
      formData.append("collectionId", designForm.collectionId);
      if (designForm.categoryId) {
        formData.append(
          "category",
          categories.find((cat) => cat.id === designForm.categoryId)?.name ||
            "default",
        );
      }
      const imageFile = designForm.image;
      if (!imageFile && !editingDesign) {
        throw new Error("Please upload a product image");
      }
      if (imageFile) {
        formData.append("image", imageFile);
      }

      const endpoint = editingDesign
        ? `${API_BASE_URL}/api/v1/admin/products/${editingDesign.id}`
        : `${API_BASE_URL}/api/v1/admin/products`;
      const method = editingDesign ? "PUT" : "POST";

      const response = await authFetch(endpoint, {
        method,
        body: formData,
      });
      if (!response) return;
      const data = await response.json();
      if (data.success) {
        showSuccess(
          editingDesign
            ? "Design updated successfully"
            : "Design created successfully",
        );
        setDesignForm({
          title: "",
          description: "",
          price: "",
          stock: 100,
          categoryId: "",
          collectionId: "",
          image: null,
        });
        setEditingDesign(null);
        fetchDesigns();
        fetchCollections();
      }
    } catch (error) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditDesign = (design) => {
    setEditingDesign(design);
    setDesignForm({
      title: design.title || "",
      description: design.description || "",
      price: design.price || "",
      stock: design.stock || 100,
      categoryId:
        design.category_id ||
        categories.find((cat) => cat.name === design.categoryName)?.id ||
        "",
      collectionId:
        design.collection_id ||
        collections.find((col) => col.name === design.collectionName)?.id ||
        "",
      image: null,
    });
    setActiveTab("designs");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteDesign = async (designId) => {
    if (!window.confirm("Delete this design?")) return;
    setDeletingId(designId);
    try {
      const response = await authFetch(
        `${API_BASE_URL}/api/v1/admin/products/${designId}`,
        {
          method: "DELETE",
        },
      );
      if (!response) return;
      const data = await response.json();
      if (data.success) {
        showSuccess("Design deleted successfully");
        fetchDesigns();
      }
    } catch (error) {
      showError(error.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleManageCollection = async (collection) => {
    const response = await authFetch(
      `${API_BASE_URL}/api/v1/admin/collections/${collection.id}`,
    );
    if (!response) return;
    const data = await response.json();
    if (data.success) {
      setManagedCollection(data.data);
      setManageDesignIds([]);
      setManagePrices(
        Object.fromEntries(
          (data.data.designs || []).map((design) => [
            design.id,
            design.price || "",
          ]),
        ),
      );
    }
  };

  const handleAddDesignsToCollection = async () => {
    if (!managedCollection || manageDesignIds.length === 0) return;
    const response = await authFetch(
      `${API_BASE_URL}/api/v1/admin/collections/${managedCollection.id}/designs`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          designIds: manageDesignIds,
          designPrices: Object.fromEntries(
            manageDesignIds.map((id) => [id, managePrices[id]]),
          ),
        }),
      },
    );
    if (!response) return;
    const data = await response.json();
    if (data.success) {
      showSuccess("Designs added to collection");
      setManageDesignIds([]);
      await Promise.all([fetchDesigns(), fetchCollections()]);
      handleManageCollection({ id: managedCollection.id });
    }
  };

  const handleRemoveDesignFromCollection = async (designId) => {
    if (!managedCollection) return;
    const response = await authFetch(
      `${API_BASE_URL}/api/v1/admin/collections/${managedCollection.id}/designs/${designId}`,
      { method: "DELETE" },
    );
    if (!response) return;
    const data = await response.json();
    if (data.success) {
      showSuccess("Design removed from collection");
      await Promise.all([fetchDesigns(), fetchCollections()]);
      handleManageCollection({ id: managedCollection.id });
    }
  };

  const handleDeleteCollection = async (collection) => {
    if (
      !window.confirm(
        `Delete collection "${collection.name}"? Designs will be kept.`,
      )
    )
      return;
    const response = await authFetch(
      `${API_BASE_URL}/api/v1/admin/collections/${collection.id}`,
      { method: "DELETE" },
    );
    if (!response) return;
    const data = await response.json();
    if (data.success) {
      showSuccess("Collection deleted successfully");
      if (managedCollection?.id === collection.id) setManagedCollection(null);
      await Promise.all([fetchCollections(), fetchDesigns()]);
    }
  };

  const handleCategoryChangeInDesign = (categoryId) => {
    setDesignForm((prev) => ({ ...prev, categoryId, collectionId: "" }));
  };

  const availableCollections = collections;

  if (!authChecked) return null;

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <button onClick={handleLogout} className="logout-btn">
          Sign Out
        </button>
      </div>

      <div className="admin-actions">
        <button
          type="button"
          className="quick-action-btn"
          onClick={() => handleQuickAction("categories")}
        >
          Create Category
        </button>
        <button
          type="button"
          className="quick-action-btn"
          onClick={() => handleQuickAction("collections")}
        >
          Create Collection
        </button>
        <button
          type="button"
          className="quick-action-btn"
          onClick={() => handleQuickAction("designs")}
        >
          Create Design
        </button>
      </div>

      <div className="admin-tabs">
        <button
          className={activeTab === "designs" ? "active" : ""}
          onClick={() => setActiveTab("designs")}
        >
          Designs
        </button>
        <button
          className={activeTab === "collections" ? "active" : ""}
          onClick={() => setActiveTab("collections")}
        >
          Collections
        </button>
        <button
          className={activeTab === "categories" ? "active" : ""}
          onClick={() => setActiveTab("categories")}
        >
          Categories
        </button>
        <button
          className={activeTab === "customers" ? "active" : ""}
          onClick={() => setActiveTab("customers")}
        >
          Customers
        </button>
        <button
          className={activeTab === "orders" ? "active" : ""}
          onClick={() => setActiveTab("orders")}
        >
          Orders
        </button>
      </div>

      <div className="admin-content">
        {activeTab === "designs" && (
          <div className="section-block">
            <div className="admin-panel-form">
              <h2>{editingDesign ? "Edit Design" : "Add New Design"}</h2>
              {editingDesign && (
                <div className="editing-banner">
                  Editing: <strong>{editingDesign.title}</strong>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingDesign(null);
                      setDesignForm({
                        title: "",
                        description: "",
                        price: "",
                        stock: 100,
                        categoryId: "",
                        collectionId: "",
                        image: null,
                      });
                    }}
                    className="cancel-edit-btn"
                  >
                    Cancel
                  </button>
                </div>
              )}
              <form onSubmit={handleDesignSubmit} className="admin-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Title</label>
                    <input
                      type="text"
                      value={designForm.title}
                      onChange={(e) =>
                        setDesignForm({ ...designForm, title: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={designForm.price}
                      onChange={(e) =>
                        setDesignForm({ ...designForm, price: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      value={designForm.categoryId}
                      onChange={(e) =>
                        handleCategoryChangeInDesign(e.target.value)
                      }
                      required={!designForm.collectionId}
                    >
                      <option value="">Choose Category</option>
                      {categories.map((cat) => (
                        <option
                          key={cat.id}
                          value={cat.id}
                          disabled={cat.filter_only}
                        >
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Collection</label>
                    <select
                      value={designForm.collectionId}
                      onChange={(e) =>
                        setDesignForm({
                          ...designForm,
                          categoryId: "",
                          collectionId: e.target.value,
                        })
                      }
                    >
                      <option value="">None</option>
                      {availableCollections.map((col) => (
                        <option key={col.id} value={col.id}>
                          {col.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Stock</label>
                    <input
                      type="number"
                      value={designForm.stock}
                      onChange={(e) =>
                        setDesignForm({ ...designForm, stock: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Image</label>
                    <label className="custom-file-input">
                      <span>
                        {designForm.image
                          ? designForm.image.name
                          : "Choose file"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setDesignForm({
                            ...designForm,
                            image: e.target.files[0],
                          })
                        }
                      />
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={designForm.description}
                    onChange={(e) =>
                      setDesignForm({
                        ...designForm,
                        description: e.target.value,
                      })
                    }
                    rows="4"
                  />
                </div>

                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading
                    ? "Saving..."
                    : editingDesign
                      ? "Update Design"
                      : "Create Design"}
                </button>
              </form>
            </div>

            <div className="admin-list">
              <h2>Design Catalog ({designs.length})</h2>
              <div className="cards-grid">
                {designs.map((design) => (
                  <div key={design.id} className="card-admin-item">
                    <img
                      src={assetUrl(API_BASE_URL, design)}
                      alt={design.title}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src =
                          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect fill='%23222' width='200' height='200'/%3E%3Ctext fill='%23666' font-family='sans-serif' font-size='14' dy='10.5' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3ENo Image%3C/text%3E%3C/svg%3E";
                      }}
                    />
                    <div className="card-content">
                      <h3>{design.title}</h3>
                      <p className="meta">
                        {design.categoryName || design.category} •{" "}
                        {design.collectionName ||
                          design.collection ||
                          "No collection"}
                      </p>
                      <p>${(Number(design.price) || 0).toFixed(2)}</p>
                      <div className="card-actions">
                        <button
                          onClick={() => handleEditDesign(design)}
                          className="edit-btn"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteDesign(design.id)}
                          className="delete-btn"
                          disabled={deletingId === design.id}
                        >
                          {deletingId === design.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "collections" && (
          <div className="section-block">
            <div className="admin-panel-form">
              <h2>Create New Collection</h2>
              <form onSubmit={handleCollectionSubmit} className="admin-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Name</label>
                    <input
                      type="text"
                      value={collectionForm.name}
                      onChange={(e) =>
                        setCollectionForm({
                          ...collectionForm,
                          name: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={collectionForm.description}
                    onChange={(e) =>
                      setCollectionForm({
                        ...collectionForm,
                        description: e.target.value,
                      })
                    }
                    rows="3"
                  />
                </div>
                <div className="form-group">
                  <label>Cover Image</label>
                  <label className="custom-file-input">
                    <span>
                      {collectionForm.image
                        ? collectionForm.image.name
                        : "Choose file"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setCollectionForm({
                          ...collectionForm,
                          image: e.target.files[0],
                        })
                      }
                    />
                  </label>
                </div>
                <div className="form-group collection-design-picker">
                  <div className="picker-heading">
                    <label>Select Designs</label>
                    <span>{collectionForm.designIds.length} selected</span>
                  </div>
                  <div className="design-picker-list">
                    {designs.length === 0 ? (
                      <p className="picker-empty">Create designs first.</p>
                    ) : (
                      designs.map((design) => {
                        const selected = collectionForm.designIds.includes(
                          design.id,
                        );
                        return (
                          <label
                            key={design.id}
                            className={`design-picker-item${selected ? " selected" : ""}`}
                          >
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() =>
                                setCollectionForm((prev) => ({
                                  ...prev,
                                  designIds: selected
                                    ? prev.designIds.filter(
                                        (id) => id !== design.id,
                                      )
                                    : [...prev.designIds, design.id],
                                  designPrices: selected
                                    ? Object.fromEntries(
                                        Object.entries(
                                          prev.designPrices,
                                        ).filter(([id]) => id !== design.id),
                                      )
                                    : {
                                        ...prev.designPrices,
                                        [design.id]: design.price || "",
                                      },
                                }))
                              }
                            />
                            <span className="design-picker-copy">
                              <strong>{design.title}</strong>
                              <small>Price</small>
                            </span>
                            {selected && (
                              <input
                                className="design-price-input"
                                type="number"
                                min="0"
                                step="0.01"
                                value={
                                  collectionForm.designPrices[design.id] ??
                                  design.price ??
                                  ""
                                }
                                onChange={(event) =>
                                  setCollectionForm((prev) => ({
                                    ...prev,
                                    designPrices: {
                                      ...prev.designPrices,
                                      [design.id]: event.target.value,
                                    },
                                  }))
                                }
                                onClick={(event) => event.stopPropagation()}
                              />
                            )}
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? "Saving..." : "Save Collection"}
                </button>
              </form>
            </div>

            <div className="admin-list">
              <h2>Collections ({collections.length})</h2>
              <div className="cards-grid">
                {collections.map((collection) => (
                  <div key={collection.id} className="card-admin-item">
                    {collection.image && (
                      <img
                        src={assetUrl(API_BASE_URL, collection)}
                        alt={collection.name}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src =
                            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect fill='%23222' width='200' height='200'/%3E%3Ctext fill='%23666' font-family='sans-serif' font-size='14' dy='10.5' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3ENo Image%3C/text%3E%3C/svg%3E";
                        }}
                      />
                    )}
                    <div className="card-content">
                      <h3>{collection.name}</h3>
                      <p className="meta">
                        {collection.designCount || 0} design
                        {collection.designCount === 1 ? "" : "s"}
                      </p>
                      <p>
                        {collection.description || "No description provided."}
                      </p>
                      <button
                        type="button"
                        className="edit-btn collection-manage-btn"
                        onClick={() => handleManageCollection(collection)}
                      >
                        Manage Designs
                      </button>
                      <button
                        type="button"
                        className="delete-btn collection-delete-btn"
                        onClick={() => handleDeleteCollection(collection)}
                      >
                        Delete Collection
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {managedCollection && (
                <div className="collection-manager">
                  <div className="collection-manager-heading">
                    <div>
                      <h3>{managedCollection.name}</h3>
                      <p>Current Designs</p>
                    </div>
                    <button
                      type="button"
                      className="cancel-edit-btn"
                      onClick={() => setManagedCollection(null)}
                    >
                      Close
                    </button>
                  </div>
                  <div className="current-design-list">
                    {(managedCollection.designs || []).length === 0 ? (
                      <p className="picker-empty">No Designs assigned yet.</p>
                    ) : (
                      managedCollection.designs.map((design) => (
                        <div className="current-design-row" key={design.id}>
                          <span>{design.title}</span>
                          <strong>
                            ${(Number(design.price) || 0).toFixed(2)}
                          </strong>
                          <button
                            type="button"
                            className="delete-btn"
                            onClick={() =>
                              handleRemoveDesignFromCollection(design.id)
                            }
                          >
                            Remove
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="collection-add-designs">
                    <div className="picker-heading">
                      <label>Add Designs</label>
                      <span>{manageDesignIds.length} selected</span>
                    </div>
                    <div className="design-picker-list">
                      {designs
                        .filter(
                          (design) =>
                            design.collection_id !== managedCollection.id,
                        )
                        .map((design) => {
                          const selected = manageDesignIds.includes(design.id);
                          return (
                            <label
                              key={design.id}
                              className={`design-picker-item${selected ? " selected" : ""}`}
                            >
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={() => {
                                  setManageDesignIds((prev) =>
                                    selected
                                      ? prev.filter((id) => id !== design.id)
                                      : [...prev, design.id],
                                  );
                                  setManagePrices((prev) => ({
                                    ...prev,
                                    [design.id]:
                                      prev[design.id] ?? design.price ?? "",
                                  }));
                                }}
                              />
                              <span className="design-picker-copy">
                                <strong>{design.title}</strong>
                                <small>
                                  $
                                  {(
                                    Number(
                                      managePrices[design.id] ?? design.price,
                                    ) || 0
                                  ).toFixed(2)}
                                </small>
                              </span>
                              {selected && (
                                <input
                                  className="design-price-input"
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={
                                    managePrices[design.id] ??
                                    design.price ??
                                    ""
                                  }
                                  onChange={(event) =>
                                    setManagePrices((prev) => ({
                                      ...prev,
                                      [design.id]: event.target.value,
                                    }))
                                  }
                                  onClick={(event) => event.stopPropagation()}
                                />
                              )}
                            </label>
                          );
                        })}
                    </div>
                    <button
                      type="button"
                      className="submit-btn"
                      disabled={!manageDesignIds.length || loading}
                      onClick={handleAddDesignsToCollection}
                    >
                      Add Selected Designs
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "categories" && (
          <div className="section-block">
            <div className="admin-panel-form">
              <h2>Add Category</h2>
              <form onSubmit={handleCategorySubmit} className="admin-form">
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={categoryForm.name}
                    onChange={(e) =>
                      setCategoryForm({ ...categoryForm, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={categoryForm.description}
                    onChange={(e) =>
                      setCategoryForm({
                        ...categoryForm,
                        description: e.target.value,
                      })
                    }
                    rows="3"
                  />
                </div>
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? "Saving..." : "Create Category"}
                </button>
              </form>
            </div>

            <div className="admin-list">
              <h2>Categories ({categories.length})</h2>
              <div
                className="cards-grid categories-grid"
                style={{
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                }}
              >
                {categories.map((cat) => (
                  <div key={cat.id} className="card-admin-item category-card">
                    <div className="card-content">
                      <h3>{cat.name}</h3>
                      <p>{cat.description || "No description."}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "customers" && (
          <div className="customers-section">
            <h2>Customers ({customers.length})</h2>
            <div className="customers-list-admin">
              {customers.map((customer) => (
                <div key={customer.id} className="customer-card-admin">
                  <div
                    className="customer-header-admin"
                    onClick={() => fetchCustomerOrders(customer.id)}
                  >
                    <div className="customer-info-main">
                      <h3>{customer.username}</h3>
                      <p className="customer-email">{customer.email}</p>
                    </div>
                    <span style={{ color: "#fff" }}>View Orders</span>
                  </div>
                  {customer.orders && (
                    <div className="customer-details-admin">
                      <p style={{ color: "#888", marginBottom: "10px" }}>
                        Joined:{" "}
                        {new Date(customer.created_at).toLocaleDateString()}
                      </p>
                      <h4
                        style={{
                          color: "#fff",
                          fontSize: "1rem",
                          margin: "10px 0",
                        }}
                      >
                        Orders
                      </h4>
                      {customer.orders.map((order) => (
                        <div
                          key={order.id}
                          style={{
                            padding: "10px",
                            border: "1px solid #333",
                            marginBottom: "5px",
                          }}
                        >
                          <span style={{ color: "#fff" }}>
                            #{order.id.slice(0, 8)}
                          </span>{" "}
                          -{" "}
                          <span style={{ color: "#888" }}>
                            ${order.total_amount}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "orders" && (
          <div className="orders-section">
            <h2>Orders ({orders.length})</h2>
            <div className="orders-list-admin">
              {orders.map((order) => (
                <div key={order.id} className="order-card-admin">
                  <div
                    className="order-header-admin"
                    onClick={() => fetchOrderDetails(order.id)}
                  >
                    <div className="order-info-admin">
                      <h3>Order #{order.id.substring(0, 8).toUpperCase()}</h3>
                      <p className="order-customer">{order.username}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p
                        style={{
                          color: "#fff",
                          fontSize: "1.2rem",
                          fontWeight: "bold",
                        }}
                      >
                        ${parseFloat(order.total_amount).toFixed(2)}
                      </p>
                      <span className={`status-badge status-${order.status}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                  {order.items && (
                    <div className="order-details-admin">
                      {order.items.map((item) => (
                        <div
                          key={item.id || `${item.product_id}-${item.quantity}`}
                          className="order-item-admin"
                        >
                          <img
                            src={`${API_BASE_URL}/assets/${item.category || "default"}/${item.image}`}
                            alt=""
                            className="order-item-image-admin"
                          />
                          <div>
                            <h5 style={{ color: "#fff", margin: 0 }}>
                              {item.title}
                            </h5>
                            <p style={{ color: "#666", fontSize: "0.9rem" }}>
                              Qty: {item.quantity} x ${item.price}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
