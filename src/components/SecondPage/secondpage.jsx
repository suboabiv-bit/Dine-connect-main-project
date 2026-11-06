import { useState } from "react";
import "./secondpage.css";
import CustomerNavigation from "../CustomerNavigation";


const imageFiles = import.meta.glob("./*.{png,jpg,jpeg,webp}", {
  eager: true,
  import: "default",
});


const getImage = (keyword) => {
  const key = Object.keys(imageFiles).find((path) =>
    path.toLowerCase().includes(keyword)
  );
  return key ? imageFiles[key] : "";
};

const fallbackFilters = [
  "All Offers",
  "Combos",
  "Happy Hour",
  "Chef Specials",
];

const fallbackOffers = [
  {
    id: 1,
    category: "Combos",
    emoji: "🍔",
    img: getImage("sub"), 
    save: 250,
    tag: "Feast for 2",
    name: "Submarine Double Feast",
    desc: "Two artisan grilled chicken submarines with two iced teas.",
    price: 1650,
    old: 1900,
    off: 13,
  },
  {
    id: 2,
    category: "Chef Specials",
    emoji: "🍕",
    img: getImage("pizza"), 
    save: 350,
    tag: "Family favorite",
    name: "Mega Pizza Party Box",
    desc: "Large BBQ Chicken Pizza with garlic bread and a beverage.",
    price: 2100,
    old: 2450,
    off: 14,
  },
  {
    id: 3,
    category: "Happy Hour",
    emoji: "🍟",
    img: getImage("fries"), 
    save: 170,
    tag: "Chef signature snack",
    name: "Loaded Fries Supreme & Sliders",
    desc: "Loaded fries served with two mini sliders.",
    price: 980,
    old: 1150,
    off: 15,
  },
];

const rs = (n) => "Rs. " + n.toLocaleString("en-US");

// ---------- CUSTOMIZE OPTIONS (change these lists to whatever you want) ----------
const removeOptions = ["Onion", "Tomato", "Lettuce", "Pickles"];

const extraOptions = [
  { id: "cheese", name: "Extra Cheese", price: 100 },
  { id: "patty", name: "Extra Patty", price: 250 },
  { id: "bacon", name: "Bacon Strips", price: 150 },
];

const drinkOptions = ["CocaCola", "Lemonade", "Iced Tea", "Water"];
const fallbackFeaturedCombo = {
  id: "combo",
  name: "Special Burger Combo",
  price: 1250,
  emoji: "🍔",
};

function Photo({ img, emoji, alt }) {
  const [imageError, setImageError] = useState(false);

  if (!img || imageError) {
    return (
      <div className="sp-photo sp-placeholder">
        {emoji || ""}
      </div>
    );
  }

  return (
    <img
      src={img}
      alt={alt}
      className="sp-photo"
      onError={() => setImageError(true)}
    />
  );
}

function SecondPage({
  table = "05",
  cartCount = 0,
  items = [],
  loading = false,
  error = "",
  orderError = "",
  useFallback = false,
  onAdd,
  onOrderNow,
  onBack,
  onNavigate,
}) {
  const [activeFilter, setActiveFilter] = useState("All Offers");

  // customize popup
  const [showCustomize, setShowCustomize] = useState(false);
  const [removed, setRemoved] = useState([]); // ingredients to remove
  const [extras, setExtras] = useState([]); // ids of extras
  const [drink, setDrink] = useState(drinkOptions[0]);
  const [note, setNote] = useState("");

  const offers = useFallback
    ? fallbackOffers
    : items.map((item) => ({
        id: item.id || item._id,
        menuItemId: item.menuItemId || item._id,
        category: item.category || "Menu",
        emoji: item.emoji || "🍽️",
        img: item.img || item.image || "",
        save: 0,
        tag: item.category || "Menu item",
        name: item.name,
        desc: item.description || "",
        price: item.price,
      }));
  const filters = useFallback
    ? fallbackFilters
    : ["All Offers", ...new Set(offers.map((offer) => offer.category))];
  const featuredSource = useFallback ? fallbackFeaturedCombo : items[0];
  const featuredCombo = featuredSource
    ? {
        id: featuredSource.id || featuredSource._id,
        menuItemId: featuredSource.menuItemId || featuredSource._id,
        name: featuredSource.name,
        price: featuredSource.price,
        emoji: featuredSource.emoji || "🍽️",
        img: featuredSource.img || featuredSource.image || "",
        category: featuredSource.category || "",
        description: featuredSource.description || "",
      }
    : null;
  const visibleOffers = activeFilter === "All Offers"
    ? offers
    : offers.filter((offer) => offer.category === activeFilter);

  
  const orderNow = onOrderNow || onAdd;

  // add a name to a list if it is not there, remove it if it is (for checkboxes)
  const toggleIn = (list, setList, value) =>
    setList(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);

  // price = combo price + selected extras
  const customTotal =
    (featuredCombo?.price || 0) +
    extras.reduce(
      (sum, id) => sum + (extraOptions.find((e) => e.id === id)?.price || 0),
      0
    );

  const closeCustomize = () => setShowCustomize(false);

  const addCustomized = () => {
    const extraNames = extraOptions
      .filter((e) => extras.includes(e.id))
      .map((e) => "+ " + e.name);
    const parts = [drink, ...extraNames, ...removed.map((r) => "No " + r)];
    if (note.trim()) parts.push("Note: " + note.trim());

    // the choices are written in the name, so they show in your cart / order page
    onAdd({
      id: "combo-custom-" + parts.join("|"),
      menuItemId: featuredCombo?.menuItemId,
      name: (featuredCombo?.name || "Special Burger Combo") + " (" + parts.join(", ") + ")",
      price: customTotal,
      emoji: featuredCombo?.emoji || "🍽️",
    });

    // reset the popup for next time and close it
    setRemoved([]);
    setExtras([]);
    setDrink(drinkOptions[0]);
    setNote("");
    closeCustomize();
  };

  return (
    <div className="sp-page">
      <CustomerNavigation
        activePage="second"
        table={table}
        cartCount={cartCount}
        onNavigate={onNavigate}
        onBack={onBack}
      />

      <section className="sp-hero-title">
        <h1>Today's Specials</h1>

      </section>

      <section className="sp-featured">
        {orderError && <p role="alert">{orderError}</p>}
        <div className="sp-featured-img">
          {loading ? (
            <p role="status">Loading menu…</p>
          ) : featuredCombo ? (
            <>
              <Photo
                img={featuredCombo.img || (useFallback ? getImage("combo") : "")}
                emoji={featuredCombo.emoji}
                alt={featuredCombo.name}
              />
              {useFallback && <span className="sp-badge save">Save Rs. 350</span>}
              <span className="sp-badge green">★ Chef's Recommendation</span>
              {useFallback && <span className="sp-badge limited">Limited Daily Batches (Only 7 Left)</span>}
            </>
          ) : (
            <p>No menu items are available right now.</p>
          )}
        </div>

        <div className="sp-featured-info">
          <small>{featuredCombo?.category || (useFallback ? "Signature Platter" : "Featured menu item")}</small>

          <h2>{featuredCombo?.name || "Menu unavailable"}</h2>

          <p>{featuredCombo?.description || (useFallback
            ? "Handcrafted brioche bun with prime grilled patty, heirloom tomato, secret roasted garlic aioli. Served alongside double-fried hand-cut fries and chilled beverage of your choice."
            : "Discover a freshly prepared item from this restaurant's menu.")}</p>

          {useFallback ? (
            <div className="sp-included">
              <b>Included in combo:</b>
              <span>🍔 Burger</span>
              <span>🍟 Fries</span>
              <span>🥤 Drink</span>
            </div>
          ) : (
            <div className="sp-included">
              <b>Menu item:</b>
              <span>{featuredCombo?.category || "Restaurant menu"}</span>
            </div>
          )}

          <div className="sp-price">
            <strong>{featuredCombo ? rs(featuredCombo.price) : "—"}</strong>
            {useFallback && <s>Rs. 1,600</s>}
            {useFallback && <em>22% OFF</em>}
          </div>

          <div className="sp-actions">
            <button
              className="sp-btn"
              disabled={!featuredCombo || loading}
              onClick={() => featuredCombo && orderNow(featuredCombo)}
            >
              ⚡ Order Now
            </button>

            <button className="sp-btn-light" disabled={!featuredCombo || loading || !useFallback} onClick={() => setShowCustomize(true)}>
              Customize
            </button>
          </div>
        </div>
      </section>

      <section className="sp-offers-head">
        <div>
          <h3>Special Offers →</h3>
          <small>Exclusive curated bundles designed for sharing</small>
        </div>

        <div className="sp-filters">
          {filters.map((filter) => (
            <button
              key={filter}
              className={filter === activeFilter ? "active" : ""}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
      </section>

      <section className="sp-grid">
        {loading ? (
          <p role="status">Loading menu…</p>
        ) : visibleOffers.map((offer) => (
          <article className="sp-offer" key={offer.id}>
            <div className="sp-offer-img">
              <Photo img={offer.img} emoji={offer.emoji} alt={offer.name} />
              {offer.save > 0 && <span className="sp-badge save">Save Rs. {offer.save}</span>}
            </div>

            <small className="sp-tag">{offer.tag}</small>

            <h4>{offer.name}</h4>
            <p>{offer.desc}</p>

            <div className="sp-price small">
              <strong>{rs(offer.price)}</strong>
              {offer.old && <s>{rs(offer.old)}</s>}
              {offer.off && <span>{offer.off}% Off</span>}
            </div>

            <button
              className="sp-btn wide"
              onClick={() =>
                onAdd({ id: offer.id, menuItemId: offer.menuItemId, name: offer.name, price: offer.price, emoji: offer.emoji })
              }
            >
              ⊕ Add Offer
            </button>
          </article>
        ))}
        {!loading && error && <p role="alert">{error}</p>}
        {!loading && !error && !visibleOffers.length && <p>No menu items are available right now.</p>}
      </section>

      <footer className="sp-dispatch">
        <div>
          <small> Live Kitchen Dispatch</small>

          <p>
            Ordering for <b>Table {table}</b>. Your specials
            will be prioritized with an estimated preparation
            time of <b>12-15 mins.</b>
          </p>
        </div>

        <button className="sp-btn" onClick={() => onNavigate("order")}>
          Review Order ({cartCount} Items)
        </button>
      </footer>

      {/* ---------- CUSTOMIZE POPUP ---------- */}
      {showCustomize && (
        <div className="cz-back" onClick={closeCustomize}>
          <div
            className="cz-box"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cz-head">
              <h3>Customize your Burger Combo</h3>
              <button className="cz-close" onClick={closeCustomize} aria-label="Close">
                ✕
              </button>
            </div>

            <div className="cz-section">
              <h4>Remove ingredients</h4>
              <div className="cz-options">
                {removeOptions.map((item) => (
                  <label key={item}>
                    <input
                      type="checkbox"
                      checked={removed.includes(item)}
                      onChange={() => toggleIn(removed, setRemoved, item)}
                    />
                    No {item}
                  </label>
                ))}
              </div>
            </div>

            <div className="cz-section">
              <h4>Add extras</h4>
              <div className="cz-options">
                {extraOptions.map((item) => (
                  <label key={item.id}>
                    <input
                      type="checkbox"
                      checked={extras.includes(item.id)}
                      onChange={() => toggleIn(extras, setExtras, item.id)}
                    />
                    {item.name} <em>+{rs(item.price)}</em>
                  </label>
                ))}
              </div>
            </div>

            <div className="cz-section">
              <h4>Choose your drink</h4>
              <div className="cz-options">
                {drinkOptions.map((item) => (
                  <label key={item}>
                    <input
                      type="radio"
                      name="combo-drink"
                      checked={drink === item}
                      onChange={() => setDrink(item)}
                    />
                    {item}
                  </label>
                ))}
              </div>
            </div>

            <div className="cz-section">
              <h4>Special note</h4>
              <textarea
                placeholder="Example: less spicy, sauce on the side"
                maxLength={120}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <div className="cz-footer">
              <div className="cz-total">
                <small>Total</small>
                <strong>{rs(customTotal)}</strong>
              </div>
              <button className="sp-btn" onClick={addCustomized}>
                Add to Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SecondPage;