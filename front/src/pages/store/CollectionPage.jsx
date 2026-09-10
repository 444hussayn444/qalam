import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { addToCartAsync } from "../../redux/slices/cartSlice";
import { showError, showInfo } from "../../utils/toast";
import { API_URL } from "../../config/config";
import { assetUrl } from "../../utils/asset";
import "./store.css";

export default function CollectionPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState(null);

  useEffect(() => {
    const loadCollection = async () => {
      try {
        const response = await fetch(`${API_URL}/collections/${slug}`);
        const result = await response.json();
        if (!response.ok || !result.success)
          throw new Error(result.message || "Collection not found");
        setCollection(result.data);
      } catch (error) {
        showError(error.message);
      } finally {
        setLoading(false);
      }
    };
    loadCollection();
  }, [slug]);

  const addToCart = async (design) => {
    if (!user) {
      showInfo("Please login to add items to cart");
      navigate("/login");
      return;
    }
    setAddingId(design.id);
    try {
      await dispatch(
        addToCartAsync({ userId: user.id, productId: design.id, quantity: 1 }),
      ).unwrap();
    } catch (error) {
      showError(`Failed to add to cart: ${error}`);
    } finally {
      setAddingId(null);
    }
  };

  if (loading)
    return (
      <div className="page-store loading-state">
        <h2 className="loading-text">LOADING COLLECTION...</h2>
      </div>
    );
  if (!collection)
    return (
      <div className="page-store loading-state">
        <h2 className="loading-text">COLLECTION NOT FOUND</h2>
      </div>
    );

  return (
    <main className="page-store collection-page">
      <div className="the-container">
        <button
          className="filter-toggle-btn collection-back"
          onClick={() => navigate("/store")}
        >
          BACK TO STORE
        </button>
        <header className="collection-hero">
          {collection.coverImage && (
            <img
              src={assetUrl(API_URL.replace(/\/api\/v1$/, ""), {
                ...collection,
                image: collection.coverImage,
              })}
              alt=""
            />
          )}
          <div>
            <p className="collection-kicker">COLLECTION</p>
            <h1>{collection.name}</h1>
            <p>{collection.description || "Digital designs"}</p>
            <span>
              {collection.designCount} design
              {collection.designCount === 1 ? "" : "s"}
            </span>
          </div>
        </header>
        <div className="store-grid collection-design-grid">
          {collection.designs.length === 0 ? (
            <div className="empty-state">NO DESIGNS IN THIS COLLECTION</div>
          ) : (
            collection.designs.map((design) => (
              <article className="card" key={design.id}>
                <div
                  className="image-container"
                  onClick={() => navigate(`/product/${design.id}`)}
                >
                  <img
                    src={assetUrl(API_URL.replace(/\/api\/v1$/, ""), design)}
                    alt={design.title}
                    className="image"
                  />
                  <div className="overlay">VIEW</div>
                </div>
                <div className="content">
                  <div className="header-row">
                    <div className="category">DIGITAL DESIGN</div>
                    <span className="price">
                      ${(Number(design.price) || 0).toFixed(2)}
                    </span>
                  </div>
                  <h3
                    className="title"
                    onClick={() => navigate(`/product/${design.id}`)}
                  >
                    {design.title}
                  </h3>
                  <p className="desc">
                    {design.description || "Digital design"}
                  </p>
                  <button
                    className="btn"
                    onClick={() => addToCart(design)}
                    disabled={addingId === design.id}
                  >
                    {addingId === design.id ? "ADDING..." : "ADD TO CART"}
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
