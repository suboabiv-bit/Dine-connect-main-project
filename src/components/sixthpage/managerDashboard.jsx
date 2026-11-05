import { useEffect, useState } from "react";
import "./management.css";
import { API_BASE_URL } from "../../config/api";

const callApi = async (url, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    credentials: "include",
    headers: { ...(options.body ? { "Content-Type": "application/json" } : {}) },
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "Unable to complete the request.");
  return result;
};
const nextStatus = { received: "preparing", preparing: "ready", ready: "served" };

function ManagerDashboard({ user, onLogout }) {
  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState("orders");
  const [support, setSupport] = useState({ subject: "", description: "" });
  const [newItem, setNewItem] = useState({ name: "", category: "", description: "", price: "", image: "" });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadData = async () => {
    const [restaurantResult, menuResult, orderResult] = await Promise.all([
      callApi("/api/manager/restaurant"),
      callApi("/api/manager/menu"),
      callApi("/api/manager/orders"),
    ]);
    setRestaurant(restaurantResult.restaurant);
    setMenu(menuResult.items);
    setOrders(orderResult.orders);
  };

  useEffect(() => {
    const initialTimer = setTimeout(() => {
      loadData().catch((loadError) => setError(loadError.message));
    }, 0);
    const timer = setInterval(() => {
      loadData().catch((loadError) => setError(loadError.message));
    }, 10000);
    return () => {
      clearTimeout(initialTimer);
      clearInterval(timer);
    };
  }, []);

  const createMenuItem = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await callApi("/api/manager/menu", {
        method: "POST",
        body: JSON.stringify({ ...newItem, price: Number(newItem.price) }),
      });
      setNewItem({ name: "", category: "", description: "", price: "", image: "" });
      setNotice("Menu item added.");
      await loadData();
    } catch (createError) {
      setError(createError.message);
    }
  };

  const updateAvailability = async (item) => {
    setError("");
    try {
      await callApi(`/api/manager/menu/${item._id}`, {
        method: "PATCH",
        body: JSON.stringify({ available: !item.available }),
      });
      await loadData();
    } catch (updateError) {
      setError(updateError.message);
    }
  };

  const deleteMenuItem = async (id) => {
    setError("");
    try {
      await callApi(`/api/manager/menu/${id}`, { method: "DELETE" });
      setMenu((items) => items.filter((item) => item._id !== id));
      setNotice("Menu item deleted.");
    } catch (deleteError) {
      setError(deleteError.message);
    }
  };

  const updateMenuItem = async (item, changes) => {
    setError("");
    try {
      await callApi(`/api/manager/menu/${item._id}`, {
        method: "PATCH",
        body: JSON.stringify(changes),
      });
      setNotice("Menu item updated.");
      await loadData();
    } catch (updateError) {
      setError(updateError.message);
    }
  };

  const saveRestaurant = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    const formData = new FormData(event.currentTarget);
    try {
      const result = await callApi("/api/manager/restaurant", {
        method: "PATCH",
        body: JSON.stringify(Object.fromEntries(formData.entries())),
      });
      setRestaurant(result.restaurant);
      setNotice("Restaurant information updated.");
    } catch (saveError) {
      setError(saveError.message);
    }
  };

  const advanceOrder = async (order) => {
    setError("");
    try {
      await callApi(`/api/kitchen/orders/${order._id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus[order.status] }),
      });
      await loadData();
    } catch (updateError) {
      setError(updateError.message);
    }
  };

  const submitSupport = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await callApi("/api/support", { method: "POST", body: JSON.stringify(support) });
      setSupport({ subject: "", description: "" });
      setNotice("Support request sent to DineConnect.");
    } catch (supportError) {
      setError(supportError.message);
    }
  };

  const totalSales = orders.reduce((sum, order) => sum + order.total, 0);

  return (
    <div className="mg-page">
      <nav className="mg-navbar">
        <div className="mg-logo">🍴 {restaurant?.name ?? "Restaurant"} · Manager</div>
        <div className="mg-navbar-actions"><span>{user.fullName}</span><button className="mg-logout-button" onClick={onLogout}>Logout</button></div>
      </nav>
      <header className="mg-title-area"><p className="mg-small-title">Restaurant control panel</p><h1 className="mg-title">Manager Dashboard</h1></header>
      <div className="mg-tabs">
        {[["orders", "Orders"], ["menu", "Menu"], ["sales", "Sales"], ["restaurant", "Restaurant"], ["support", "Support"]].map(([value, label]) => (
          <button key={value} className={tab === value ? "active" : ""} onClick={() => { setTab(value); setError(""); setNotice(""); }}>{label}</button>
        ))}
      </div>
      <main className="mg-content">
        {error && <p className="mg-error" role="alert">{error}</p>}
        {notice && <p className="mg-account-success" role="status">{notice}</p>}
        {tab === "orders" && (
          orders.length ? orders.map((order) => (
            <div className="mg-order-card" key={order._id}>
              <div className="mg-order-info">
                <h4>Order #{order.orderNumber} · Table {order.tableNumber}</h4>
                <p>{order.items.map((item) => `${item.name} × ${item.quantity}${item.specialInstructions ? ` — ${item.specialInstructions}` : ""}`).join(" · ")}</p>
                {order.customerId && <p>Customer: {order.customerId.fullName} · {order.customerId.email}</p>}
              </div>
              <strong className="mg-order-price">Rs. {order.total.toLocaleString("en-US")}</strong>
              <span className="mg-pill step1">{order.status}</span>
              {nextStatus[order.status] && <button className="mg-green-button small" onClick={() => advanceOrder(order)}>Mark {nextStatus[order.status]}</button>}
            </div>
          )) : <div className="mg-empty-box">No orders yet.</div>
        )}
        {tab === "menu" && (
          <>
            <div className="mg-box">
              <h3>Add menu item</h3>
              <form className="mg-form-grid" onSubmit={createMenuItem}>
                <input placeholder="Food name" value={newItem.name} onChange={(event) => setNewItem({ ...newItem, name: event.target.value })} required />
                <input placeholder="Category" value={newItem.category} onChange={(event) => setNewItem({ ...newItem, category: event.target.value })} required />
                <input placeholder="Description" value={newItem.description} onChange={(event) => setNewItem({ ...newItem, description: event.target.value })} />
                <input type="number" min="0" step="0.01" placeholder="Price (Rs.)" value={newItem.price} onChange={(event) => setNewItem({ ...newItem, price: event.target.value })} required />
                <input className="wide" type="url" placeholder="Image URL (optional)" value={newItem.image} onChange={(event) => setNewItem({ ...newItem, image: event.target.value })} />
                <button className="mg-green-button" type="submit">Add item</button>
              </form>
            </div>
            <div className="mg-box"><h3>Menu ({menu.length})</h3>
              {menu.map((item) => (
                <div className={"mg-dish-row " + (item.available ? "" : "off")} key={item._id}>
                  {item.image && <img className="mg-dish-image" src={item.image} alt="" />}
                  <div className="mg-dish-info">
                    <h4>{item.name}</h4>
                    <p>{item.category} · {item.description}</p>
                  </div>
                  <label className="mg-price-edit">Rs.
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      defaultValue={item.price}
                      aria-label={`${item.name} price`}
                      onBlur={(event) => {
                        const price = Number(event.target.value);
                        if (Number.isFinite(price) && price >= 0 && price !== item.price) {
                          updateMenuItem(item, { price });
                        }
                      }}
                    />
                  </label>
                  <button className="mg-light-button small" onClick={() => updateAvailability(item)}>{item.available ? "Hide" : "Show"}</button>
                  <button className="mg-light-button small" onClick={() => {
                    const name = window.prompt("Update dish name", item.name);
                    if (name !== null && name.trim() && name.trim() !== item.name) {
                      updateMenuItem(item, { name: name.trim() });
                    }
                  }}>Edit name</button>
                  <button className="mg-light-button small" onClick={() => {
                    const description = window.prompt("Update description", item.description);
                    if (description !== null && description !== item.description) {
                      updateMenuItem(item, { description });
                    }
                  }}>Edit description</button>
                  <button className="mg-light-button small" onClick={() => {
                    const category = window.prompt("Update category", item.category);
                    if (category !== null && category.trim() && category !== item.category) {
                      updateMenuItem(item, { category: category.trim() });
                    }
                  }}>Edit category</button>
                  <button className="mg-light-button small" onClick={() => {
                    const image = window.prompt("Update image URL", item.image ?? "");
                    if (image !== null && image.trim() !== (item.image ?? "")) {
                      updateMenuItem(item, { image: image.trim() });
                    }
                  }}>Edit image</button>
                  <button className="mg-light-button small" onClick={() => deleteMenuItem(item._id)}>Delete</button>
                </div>
              ))}
            </div>
          </>
        )}
        {tab === "sales" && (
          <div className="mg-count-row">
            <div className="mg-count-box wide"><strong>Rs. {totalSales.toLocaleString("en-US")}</strong><span>Total sales</span></div>
            <div className="mg-count-box"><strong>{orders.length}</strong><span>Orders</span></div>
            <div className="mg-count-box"><strong>{orders.reduce((sum, order) => sum + order.items.reduce((qty, item) => qty + item.quantity, 0), 0)}</strong><span>Items sold</span></div>
          </div>
        )}
        {tab === "restaurant" && restaurant && (
          <div className="mg-box">
            <h3>Restaurant information</h3>
            <form className="mg-form-grid" onSubmit={saveRestaurant}>
              <input name="name" aria-label="Restaurant name" defaultValue={restaurant.name} required />
              <input name="contactEmail" aria-label="Contact email" type="email" defaultValue={restaurant.contactEmail} required />
              <input name="contactNumber" aria-label="Contact number" defaultValue={restaurant.contactNumber} required />
              <input name="address" aria-label="Restaurant address" defaultValue={restaurant.address} required />
              <button className="mg-green-button" type="submit">Save information</button>
            </form>
            <p className="mg-muted">Plan: {restaurant.subscriptionPlan} · Status: {restaurant.status}</p>
          </div>
        )}
        {tab === "support" && (
          <div className="mg-box">
            <h3>Contact DineConnect support</h3>
            <form className="mg-form-grid" onSubmit={submitSupport}>
              <input className="wide" placeholder="Subject" value={support.subject} onChange={(event) => setSupport({ ...support, subject: event.target.value })} maxLength={160} required />
              <textarea className="wide" placeholder="Describe the issue" value={support.description} onChange={(event) => setSupport({ ...support, description: event.target.value })} maxLength={3000} required />
              <button className="mg-green-button" type="submit">Send support request</button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

export default ManagerDashboard;
