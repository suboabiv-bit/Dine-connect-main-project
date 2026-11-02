
import { useState } from "react";
import "./management.css";
import { CATEGORIES } from "../thirdpage/menu.js";

const STEP_NAMES = ["Received", "Preparing", "Ready", "Served"];
const NEXT_BUTTON = ["Start preparing", "Mark ready", "Mark served"];
const FILTERS = ["All", ...STEP_NAMES];

const rs = (n) => "Rs. " + n.toLocaleString("en-US");


/* ---------------- TAB 1: ORDERS ---------------- */

function OrdersTab({ orders, onNextStep, onClearServed }) {
  const [filter, setFilter] = useState("All");

  const count = (step) => orders.filter((o) => o.step === step).length;

  const shown =
    filter === "All"
      ? orders
      : orders.filter((o) => STEP_NAMES[o.step] === filter);

  return (
    <>
      <div className="mg-count-row">
        {STEP_NAMES.map((name, i) => (
          <div className="mg-count-box" key={name}>
            <strong>{count(i)}</strong>
            <span>{name}</span>
          </div>
        ))}
      </div>

      <div className="mg-filter-row">
        {FILTERS.map((f) => (
          <span
            key={f}
            className={f === filter ? "active" : ""}
            onClick={() => setFilter(f)}
          >
            {f}
          </span>
        ))}
      </div>

      {shown.length === 0 && (
        <div className="mg-empty-box">📭 No orders here yet.</div>
      )}

      {shown.map((o) => (
        <div className="mg-order-card" key={o.id}>
          <div className="mg-order-emoji">{o.emoji}</div>

          <div className="mg-order-info">
            <h4>{o.name} × {o.qty}</h4>
            <p>
              Order #{o.number} · Table {o.table} · {o.time}
            </p>
          </div>

          <div className="mg-order-price">
            {rs(o.price * o.qty)}
          </div>

          <span className={"mg-pill step" + o.step}>
            {STEP_NAMES[o.step]}
          </span>

          {o.step < 3 ? (
            <button
              className="mg-green-button small"
              onClick={() => onNextStep(o.id)}
            >
              {NEXT_BUTTON[o.step]}
            </button>
          ) : (
            <span className="mg-done-mark">✓ Done</span>
          )}
        </div>
      ))}

      {orders.some((o) => o.step === 3) && (
        <button className="mg-light-button" onClick={onClearServed}>
          Clear served orders
        </button>
      )}
    </>
  );
}


/* ---------------- TAB 2: MENU ---------------- */

function MenuTab({ menuItems, onUpdateItem, onDeleteItem, onAddItem }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0] ?? "");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [emoji, setEmoji] = useState("");
  const [img, setImg] = useState("");
  const [error, setError] = useState("");
  const [failedImages, setFailedImages] = useState({});

  const addDish = () => {
    if (!name.trim() || !price || Number(price) <= 0) {
      setError("Please enter a dish name and a price");
      return;
    }

    onAddItem({
      id: Date.now(),
      emoji: emoji.trim() || "🍽️",
      img: img.trim(),
      category: category,
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      available: true,
    });

    setName("");
    setPrice("");
    setDescription("");
    setEmoji("");
    setImg("");
    setError("");
  };

  return (
    <>
      {/* ADD NEW DISH */}
      <div className="mg-box">
        <h3>Add a new dish</h3>

        <div className="mg-form-grid">
          <input
            placeholder="Dish name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Price (Rs.)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />

          <input
            placeholder="Emoji (example 🍝)"
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
          />

          <input
            className="wide"
            placeholder="Short description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <input
            className="wide"
            placeholder="Picture link (optional, https://...)"
            value={img}
            onChange={(e) => setImg(e.target.value)}
          />
        </div>

        {error && <p className="mg-error">{error}</p>}

        <button className="mg-green-button" onClick={addDish}>
          + Add dish
        </button>
      </div>

      {/* LIST OF DISHES */}
      <div className="mg-box">
        <h3>All dishes ({menuItems.length})</h3>

        {menuItems.map((item) => (
          <div
            className={"mg-dish-row " + (item.available ? "" : "off")}
            key={item.id}
          >
            <div className="mg-dish-thumb">
              {item.img && !failedImages[item.id] ? (
                <img
                  src={item.img}
                  alt={item.name}
                  onError={() =>
                    setFailedImages((failed) => ({
                      ...failed,
                      [item.id]: true,
                    }))
                  }
                />
              ) : (
                item.emoji
              )}
            </div>

            <div className="mg-dish-info">
              <h4>{item.name}</h4>
              <p>{item.category}</p>
            </div>

            <div className="mg-price-edit">
              <span>Rs.</span>
              <input
                type="number"
                value={item.price}
                onChange={(e) =>
                  onUpdateItem(item.id, {
                    price: Number(e.target.value) || 0,
                  })
                }
              />
            </div>

            <button
              className={"mg-switch " + (item.available ? "on" : "")}
              onClick={() =>
                onUpdateItem(item.id, {
                  available: !item.available,
                })
              }
              title="Show or hide this dish for customers"
            >
              <span></span>
            </button>

            <small className="mg-switch-label">
              {item.available ? "Visible" : "Hidden"}
            </small>

            <button
              className="mg-delete-button"
              onClick={() => onDeleteItem(item.id)}
            >
              🗑
            </button>
          </div>
        ))}
      </div>
    </>
  );
}


/* ---------------- TAB 3: SALES ---------------- */

function SalesTab({ orders }) {
  const totalSales = orders.reduce(
    (sum, o) => sum + o.price * o.qty,
    0
  );

  const totalItems = orders.reduce(
    (sum, o) => sum + o.qty,
    0
  );

  const average = orders.length
    ? Math.round(totalSales / orders.length)
    : 0;

  // Total for each dish
  const byDish = {};

  orders.forEach((o) => {
    if (!byDish[o.name]) {
      byDish[o.name] = {
        name: o.name,
        emoji: o.emoji,
        qty: 0,
        sales: 0,
      };
    }

    byDish[o.name].qty += o.qty;
    byDish[o.name].sales += o.price * o.qty;
  });

  const list = Object.values(byDish).sort(
    (a, b) => b.sales - a.sales
  );

  const biggest = list.length ? list[0].sales : 1;

  return (
    <>
      <div className="mg-count-row">
        <div className="mg-count-box wide">
          <strong>{rs(totalSales)}</strong>
          <span>Total sales</span>
        </div>

        <div className="mg-count-box">
          <strong>{orders.length}</strong>
          <span>Orders</span>
        </div>

        <div className="mg-count-box">
          <strong>{totalItems}</strong>
          <span>Items sold</span>
        </div>

        <div className="mg-count-box">
          <strong>{rs(average)}</strong>
          <span>Average order</span>
        </div>
      </div>

      <div className="mg-box">
        <h3>Best selling dishes</h3>

        {list.length === 0 && (
          <p className="mg-muted">No sales yet.</p>
        )}

        {list.map((d, index) => (
          <div className="mg-sales-row" key={d.name}>
            <span className="mg-sales-rank">
              {index + 1}
            </span>

            <span className="mg-sales-name">
              {d.emoji} {d.name}
            </span>

            <div className="mg-sales-bar">
              <div
                style={{
                  width: (d.sales / biggest) * 100 + "%",
                }}
              ></div>
            </div>

            <span className="mg-sales-qty">
              {d.qty} sold
            </span>

            <strong className="mg-sales-total">
              {rs(d.sales)}
            </strong>
          </div>
        ))}
      </div>
    </>
  );
}


/* ---------------- THE MANAGEMENT PAGE ---------------- */

function ManagementPage({
  orders,
  menuItems,
  onNextStep,
  onClearServed,
  onUpdateItem,
  onDeleteItem,
  onAddItem,
  onLogout,
}) {
  const [tab, setTab] = useState("orders");

  const activeOrders = orders.filter((o) => o.step < 3).length;

  return (
    <div className="mg-page">

      {/* TOP DARK BAR */}
      <nav className="mg-navbar">
        <div className="mg-logo">
          🍴 DineConnect · Admin
        </div>

        <button
          className="mg-logout-button"
          onClick={onLogout}
        >
          Logout
        </button>
      </nav>

      <header className="mg-title-area">
        <p className="mg-small-title">
          Restaurant administration
        </p>

        <h1 className="mg-title">
          Admin Dashboard
        </h1>
      </header>

      {/* MANAGEMENT TABS */}
      <div className="mg-tabs">

        <button
          className={tab === "orders" ? "active" : ""}
          onClick={() => setTab("orders")}
        >
          📋 Orders {activeOrders > 0 && <i>{activeOrders}</i>}
        </button>

        <button
          className={tab === "menu" ? "active" : ""}
          onClick={() => setTab("menu")}
        >
          🍽 Menu
        </button>

        <button
          className={tab === "sales" ? "active" : ""}
          onClick={() => setTab("sales")}
        >
          📊 Sales
        </button>

      </div>

      <div className="mg-content">

        {tab === "orders" && (
          <OrdersTab
            orders={orders}
            onNextStep={onNextStep}
            onClearServed={onClearServed}
          />
        )}

        {tab === "menu" && (
          <MenuTab
            menuItems={menuItems}
            onUpdateItem={onUpdateItem}
            onDeleteItem={onDeleteItem}
            onAddItem={onAddItem}
          />
        )}

        {tab === "sales" && (
          <SalesTab orders={orders} />
        )}

      </div>
    </div>
  );
}

export default ManagementPage;
