import { useState } from "react";
import "./menu.css";
import "../SecondPage/secondpage.css";
import { DEFAULT_ITEMS } from "./menu.js";
import CustomerNavigation from "../CustomerNavigation";

function FoodPhoto({ img, emoji, alt }) {
  const [imageError, setImageError] = useState(false);

  if (!img || imageError) {
    return (
      <div className="menu-food-image">
        {emoji}
      </div>
    );
  }

  return (
    <img
      src={img}
      alt={alt}
      className="menu-food-photo"
      onError={() => setImageError(true)}
    />
  );
}

function MenuPage({
  table = "05",
  cartCount = 0,
  items = DEFAULT_ITEMS,
  loading = false,
  error = "",
  onAdd,
  onNavigate,
  onBack,
}) {
  const [category, setCategory] = useState("All");
  const menuFilters = ["All", ...new Set(items.map((item) => item.category).filter(Boolean))];

  const shown =
    category === "All"
      ? items.filter((item) => item.available !== false)
      : items.filter(
          (item) => item.available !== false && item.category === category
        );

  return (
    <div className="sp-page menu-page">

      <CustomerNavigation
        activePage="menu"
        table={table}
        cartCount={cartCount}
        onNavigate={onNavigate}
        onBack={onBack}
      />

    
      <section className="menu-title-area">

        <small className="menu-small-title">
          OUR KITCHEN
        </small>

        <h1 className="menu-title">
          Explore Our Menu
        </h1>

        <p className="menu-subtitle">
          Discover delicious meals prepared fresh for you.
          Enjoy your meal at Table {table}.
        </p>

      </section>

     
      <section className="menu-filter-section">

        <div className="menu-filter-buttons">

          {menuFilters.map((item) => (

            <button
              key={item}
              className={
                item === category ? "active" : ""
              }
              onClick={() => setCategory(item)}
            >
              {item}
            </button>

          ))}

        </div>

      </section>

      <section className="menu-cards-row">

        {loading ? (
          <p role="status">Loading menu…</p>
        ) : (
          shown.map((item) => (

          <article
            className="menu-food-card"
            key={item.id}
          >

            <div className="menu-image-wrapper">

              <FoodPhoto
                img={item.img}
                emoji={item.emoji}
                alt={item.name}
              />

            </div>

            <div className="menu-food-details">

              <small className="menu-food-label">
                {item.category.toUpperCase()}
              </small>

              <h3 className="menu-food-name">
                {item.name}
              </h3>

              <p className="menu-food-description">
                {item.description}
              </p>

              <div className="menu-food-bottom">

                <strong className="menu-food-price">
                  Rs. {item.price.toLocaleString("en-US")}
                </strong>

                <button
                  className="menu-add-button"
                  onClick={() =>
                    onAdd({
                      id: item.id,
                      menuItemId: item.menuItemId || item._id,
                      name: item.name,
                      price: item.price,
                      emoji: item.emoji,
                    })
                  }
                >
                  + Add to Order
                </button>

              </div>

            </div>

          </article>

          ))
        )}

        {error && <p role="alert">{error}</p>}
        {!loading && !error && shown.length === 0 && <p>No menu items are available right now.</p>}

      </section>

      {/* FOOTER */}
      <footer className="menu-footer">

        <div>
          <small>● FRESHLY PREPARED</small>

          <p>
            Delicious food, prepared with care
            for Table {table}.
          </p>
        </div>

        <button
          className="sp-btn"
          onClick={() => onNavigate("order")}
        >
          Review Order ({cartCount} Items)
        </button>

      </footer>

    </div>
  );
}

export default MenuPage;