import { useEffect, useState } from "react";
import { FaSearch } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { addToCartAsync } from "../../redux/slices/cartSlice";
import { showError, showInfo } from "../../utils/toast";
import { API_URL } from "../../config/config";
import { assetUrl } from "../../utils/asset";
import "./store.css";
import { IoLogoCodepen } from "react-icons/io";
import { GiTShirt } from "react-icons/gi";
import { TbClothesRack } from "react-icons/tb";
import { IoManSharp } from "react-icons/io5";
import { SiBandsintown } from "react-icons/si";
import { ImSpinner2 } from "react-icons/im";

function Products({
  products,
  onAddToCart,
  addingProductId,
  addedProductId,
  search,
  selectedCategory,
  selectedCollectionId,
  priceRange,
  sortBy,
  navigate,
}) {
  let filteredProducts = products?.data?.filter((p) => {
    const isDigital = p.product_type === "digital" || p.collection_id;
    if (selectedCollectionId)
      return isDigital && p.collection_id === selectedCollectionId;
    if (isDigital) return false;
    const matchesSearch =
      !search ||
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase());

    const catTarget = String(selectedCategory || "").toLowerCase();
    const pCat = String(p.category || "").toLowerCase();
    const matchesCategory =
      !selectedCategory ||
      selectedCategory === "__collections" ||
      pCat === catTarget ||
      pCat.includes(catTarget) ||
      catTarget.includes(pCat);

    const price = parseFloat(p.price) || 0;
    const matchesPrice = price >= priceRange[0] && price <= priceRange[1];

    return matchesSearch && matchesCategory && matchesPrice;
  });

  if (filteredProducts && sortBy) {
    filteredProducts = [...filteredProducts].sort((a, b) => {
      const priceA = parseFloat(a.price) || 0;
      const priceB = parseFloat(b.price) || 0;

      switch (sortBy) {
        case "price-low":
          return priceA - priceB;
        case "price-high":
          return priceB - priceA;
        case "name-asc":
          return (a.title || "").localeCompare(b.title || "");
        case "name-desc":
          return (b.title || "").localeCompare(a.title || "");
        default:
          return 0;
      }
    });
  }

  if (!filteredProducts || filteredProducts.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "50px",
          color: "#666",
          fontSize: "1.2rem",
        }}
      >
        NO PRODUCTS FOUND
      </div>
    );
  }

  return filteredProducts.map((p) => {
    const isAdding = addingProductId === p.id;
    const justAdded = addedProductId === p.id;
    return (
      <div className="card" id={p.id} key={p.id}>
        <div
          className="image-container"
          onClick={() => navigate(`/product/${p.id}`)}
        >
          <img
            src={assetUrl(API_URL.replace(/\/api\/v1$/, ""), p)}
            alt={p.title}
            className="image"
            loading="lazy"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src =
                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect fill='%23222' width='200' height='200'/%3E%3Ctext fill='%23666' font-family='sans-serif' font-size='14' dy='10.5' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3ENo Image%3C/text%3E%3C/svg%3E";
            }}
          />
          <div className="overlay">VIEW</div>
        </div>

        <div className="content">
          <div className="header-row">
            <div className="category">{p.category}</div>
            <span className="price">${(Number(p.price) || 0).toFixed(2)}</span>
          </div>

          <h3 className="title" onClick={() => navigate(`/product/${p.id}`)}>
            {p.title}
          </h3>

          {/* Simplified description for cleaner look */}
          <p className="desc">
            {p.description
              ? p.description.substring(0, 60) + "..."
              : "No description available"}
          </p>

          <button
            className={`btn ${justAdded ? "added" : ""}`}
            onClick={() => onAddToCart(p)}
            disabled={isAdding || justAdded}
          >
            {isAdding ? (
              <ImSpinner2
                className="spinner-icon"
                style={{ animation: "spin 1s linear infinite" }}
              />
            ) : justAdded ? (
              "ADDED TO CART"
            ) : (
              "ADD TO CART"
            )}
          </button>
        </div>
      </div>
    );
  });
}

export default function Store() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const [products, setProducts] = useState();
  const [timeout, setTimeout_s] = useState(".");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedCollectionId, setSelectedCollectionId] = useState("");
  const [collections, setCollections] = useState([]);
  const [addingProductId, setAddingProductId] = useState(null);
  const [addedProductId, setAddedProductId] = useState(null);
  const [priceRange, setPriceRange] = useState([0, 200000]);
  const [sortBy, setSortBy] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const DEFAULT_STORE_CATEGORIES = [
    { name: "LOGOS", icon: IoLogoCodepen },
    { name: "MEN", icon: IoManSharp },
    { name: "T-SHIRTS", icon: GiTShirt },
    { name: "BANDS", icon: SiBandsintown },
    { name: "SPECIAL", icon: TbClothesRack },
  ];

  const [categories, setCategories] = useState(DEFAULT_STORE_CATEGORIES);

  const handleAddToCart = async (product) => {
    if (!user) {
      showInfo("Please login to add items to cart");
      navigate("/login");
      return;
    }

    if (addingProductId === product.id || addedProductId === product.id) return;

    setAddingProductId(product.id);

    try {
      await dispatch(
        addToCartAsync({
          userId: user.id,
          productId: product.id,
          quantity: 1,
        }),
      ).unwrap();

      setAddingProductId(null);
      setAddedProductId(product.id);

      setTimeout(() => {
        setAddedProductId((prev) => {
          if (prev === product.id) return null;
          return prev;
        });
      }, 2000);
    } catch (error) {
      setAddingProductId(null);
      showError("Failed to add to cart: " + error);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeout_s((prev) => (prev === "..." ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/categories`)
      .then((res) => res.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          const iconMap = {
            logos: IoLogoCodepen,
            svglogos: IoLogoCodepen,
            logo: IoLogoCodepen,
            men: IoManSharp,
            svgmen: IoManSharp,
            "t-shirts": GiTShirt,
            "svg-t-shirts": GiTShirt,
            bands: SiBandsintown,
            svgbands: SiBandsintown,
            special: TbClothesRack,
            svgspecial: TbClothesRack,
          };
          const mapped = res.data.map((cat) => {
            const key = cat.name.toLowerCase().replace(/\s+/g, "-");
            return {
              id: cat.id,
              name: cat.name,
              icon:
                iconMap[key] ||
                iconMap[cat.name.toLowerCase()] ||
                TbClothesRack,
              value: cat.name,
            };
          });
          setCategories(
            mapped.filter(
              (cat) => !cat.filter_only && cat.name.toUpperCase() !== "ALL",
            ),
          );
        }
      })
      .catch((err) => console.log(err));
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/collections`)
      .then((res) => res.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data)) setCollections(res.data);
      })
      .catch((err) => console.log(err));
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      const firstResponse = await fetch(`${API_URL}/products?page=1&limit=100`);
      const firstPage = await firstResponse.json();
      if (!firstResponse.ok || !firstPage.success)
        throw new Error("Failed to load products");

      const allProducts = [...(firstPage.data || [])];
      const totalPages = firstPage.pagination?.totalPages || 1;
      for (let page = 2; page <= totalPages; page += 1) {
        const response = await fetch(
          `${API_URL}/products?page=${page}&limit=100`,
        );
        const result = await response.json();
        if (!response.ok || !result.success)
          throw new Error("Failed to load products");
        allProducts.push(...(result.data || []));
      }
      setProducts({ ...firstPage, data: allProducts });
    };

    loadProducts().catch((err) => console.log(err));
  }, []);

  return products && categories ? (
    <div className="page-store">
      <div className="the-container">
        <div className="top-bar">
          <div className="categories">
            <div
              className={`cat-btn ${selectedCategory === "" ? "active" : ""}`}
              onClick={() => {
                setSelectedCategory("");
                setSelectedCollectionId("");
              }}
            >
              ALL
            </div>
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <div
                  key={cat.id || cat.value || cat.name}
                  className={`cat-btn ${selectedCategory === cat.name || selectedCategory === cat.value ? "active" : ""}`}
                  onClick={() => {
                    setSelectedCategory(cat.name);
                    setSelectedCollectionId("");
                  }}
                >
                  <Icon size={14} />
                  {cat.name.toUpperCase()}
                </div>
              );
            })}
            <div
              className={`cat-btn ${selectedCategory === "__collections" ? "active" : ""}`}
              onClick={() => {
                setSelectedCategory("__collections");
                setSelectedCollectionId("");
              }}
            >
              COLLECTIONS
            </div>
          </div>

          <div className="actions-wrapper">
            <div className="search-box">
              <input
                onChange={(e) => setSearch(e.target.value)}
                value={search}
                type="text"
                placeholder="SEARCH..."
              />
              <FaSearch className="search-icon" />
            </div>
            <button
              className={`filter-toggle-btn ${showFilters ? "active" : ""}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? "HIDE FILTERS" : "FILTERS"}
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="filters-section">
            <div className="filter-group">
              <label>PRICE RANGE</label>
              <div className="range-inputs">
                <input
                  type="number"
                  value={priceRange[0]}
                  onChange={(e) =>
                    setPriceRange([Number(e.target.value), priceRange[1]])
                  }
                  placeholder="0"
                />
                <span className="separator">-</span>
                <input
                  type="number"
                  value={priceRange[1]}
                  onChange={(e) =>
                    setPriceRange([priceRange[0], Number(e.target.value)])
                  }
                  placeholder="MAX"
                />
              </div>
            </div>

            <div className="filter-group">
              <label>SORT BY</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="">DEFAULT</option>
                <option value="price-low">PRICE: LOW TO HIGH</option>
                <option value="price-high">PRICE: HIGH TO LOW</option>
                <option value="name-asc">NAME: A TO Z</option>
                <option value="name-desc">NAME: Z TO A</option>
              </select>
            </div>
          </div>
        )}

        <div className="divider" />

        {selectedCategory === "__collections" && !selectedCollectionId ? (
          <div className="store-grid">
            {collections.length === 0 ? (
              <div className="empty-state">NO COLLECTIONS FOUND</div>
            ) : (
              collections.map((collection) => (
                <div
                  className="card"
                  key={collection.id}
                  onClick={() => navigate(`/collections/${collection.slug}`)}
                >
                  {collection.image && (
                    <img
                      src={assetUrl(
                        API_URL.replace(/\/api\/v1$/, ""),
                        collection,
                      )}
                      alt={collection.name}
                      className="image"
                    />
                  )}
                  <div className="content">
                    <h3 className="title">{collection.name}</h3>
                    <p className="desc">
                      {collection.designCount || 0} design
                      {collection.designCount === 1 ? "" : "s"}
                      {collection.description
                        ? ` · ${collection.description}`
                        : ""}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="store-grid">
            {selectedCollectionId && (
              <button
                className="filter-toggle-btn"
                onClick={() => setSelectedCollectionId("")}
              >
                BACK TO COLLECTIONS
              </button>
            )}
            <Products
              products={products}
              onAddToCart={handleAddToCart}
              addingProductId={addingProductId}
              addedProductId={addedProductId}
              search={search}
              selectedCategory={selectedCategory}
              selectedCollectionId={selectedCollectionId}
              priceRange={priceRange}
              sortBy={sortBy}
              navigate={navigate}
            />
          </div>
        )}
      </div>
    </div>
  ) : (
    <div className="page-store loading-state">
      <h2 className="loading-text">LOADING DATA{timeout}</h2>
    </div>
  );
}
