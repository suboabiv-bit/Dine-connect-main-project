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

const filters = [
  "All Offers",
  "Combos",
  "Happy Hour",
  "Chef Specials",
];

const offers = [
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
const featuredCombo = {
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

function SecondPage({ table = "05", cartCount = 0, onAdd, onOrderNow, onBack, onNavigate }) {
  const [activeFilter, setActiveFilter] = useState("All Offers");

  const visibleOffers =
    activeFilter === "All Offers"
      ? offers
      : offers.filter((offer) => offer.category === activeFilter);

  
  const orderNow = onOrderNow || onAdd;

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

        <p>
          Exclusive Chef Creations; Limited Time Culinary
          Offers prepared fresh for <b>Table {table}</b>
        </p>
      </section>

      <section className="sp-featured">
        <div className="sp-featured-img">
          <Photo
            img={getImage("combo")} 
            emoji="🍔"
            alt="Special Burger Combo"
          />

          <span className="sp-badge save">Save Rs. 350</span>
          <span className="sp-badge green">★ Chef's Recommendation</span>
          <span className="sp-badge limited">
            Limited Daily Batches (Only 7 Left)
          </span>
        </div>

        <div className="sp-featured-info">
          <small>Signature Platter</small>

          <h2>Special Burger Combo</h2>

          <p>
            Handcrafted brioche bun with prime grilled patty,
            heirloom tomato, secret roasted garlic aioli.
            Served alongside double-fried hand-cut fries and
            chilled beverage of your choice.
          </p>

          <div className="sp-included">
            <b>Included in combo:</b>
            <span>🍔 Burger</span>
            <span>🍟 Fries</span>
            <span>🥤 Drink</span>
          </div>

          <div className="sp-price">
            <strong>Rs. 1,250</strong>
            <s>Rs. 1,600</s>
            <em>22% OFF</em>
          </div>

          <div className="sp-actions">
            <button
              className="sp-btn"
              onClick={() => orderNow(featuredCombo)}
            >
              ⚡ Order Now
            </button>

            <button className="sp-btn-light" onClick={() => onAdd(featuredCombo)}>
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
        {visibleOffers.map((offer) => (
          <article className="sp-offer" key={offer.id}>
            <div className="sp-offer-img">
              <Photo img={offer.img} emoji={offer.emoji} alt={offer.name} />
              <span className="sp-badge save">Save Rs. {offer.save}</span>
            </div>

            <small className="sp-tag">{offer.tag}</small>

            <h4>{offer.name}</h4>
            <p>{offer.desc}</p>

            <div className="sp-price small">
              <strong>{rs(offer.price)}</strong>
              <s>{rs(offer.old)}</s>
              <span>{offer.off}% Off</span>
            </div>

            <button
              className="sp-btn wide"
              onClick={() =>
                onAdd({ id: "offer-" + offer.id, name: offer.name, price: offer.price, emoji: offer.emoji })
              }
            >
              ⊕ Add Offer
            </button>
          </article>
        ))}
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
    </div>
  );
}

export default SecondPage;