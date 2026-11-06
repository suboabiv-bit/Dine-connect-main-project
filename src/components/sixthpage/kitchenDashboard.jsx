import { useEffect, useState } from "react";
import "./management.css";
import { API_BASE_URL } from "../../config/api";

const steps = ["received", "preparing", "ready", "served"];
const nextLabel = { received: "Start preparing", preparing: "Mark ready", ready: "Mark served" };

function KitchenDashboard({ user, onLogout }) {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [support, setSupport] = useState({ subject: "", description: "" });
  const [notice, setNotice] = useState("");

  const loadOrders = async () => {
    const response = await fetch(`${API_BASE_URL}/api/kitchen/orders`, { credentials: "include" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Unable to load restaurant orders.");
    setOrders(result.orders);
  };

  useEffect(() => {
    const initialTimer = setTimeout(() => {
      loadOrders().catch((loadError) => setError(loadError.message));
    }, 0);
    const timer = setInterval(() => {
      loadOrders().catch((loadError) => setError(loadError.message));
    }, 10000);
    return () => {
      clearTimeout(initialTimer);
      clearInterval(timer);
    };
  }, []);

  const advance = async (order) => {
    setError("");
    const response = await fetch(`${API_BASE_URL}/api/kitchen/orders/${order._id}/status`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: steps[steps.indexOf(order.status) + 1] }),
    });
    const result = await response.json();
    if (!response.ok) {
      setError(result.message || "Unable to update order status.");
      return;
    }
    await loadOrders();
  };

  const submitSupport = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/support`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(support),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to send support request.");
      setSupport({ subject: "", description: "" });
      setNotice("Support request sent to DineConnect.");
    } catch (supportError) {
      setError(supportError.message || "Unable to connect to DineConnect support.");
    }
  };

  return (
    <div className="mg-page">
      <nav className="mg-navbar">
        <div className="mg-logo">DineConnect · Kitchen</div>
        <div className="mg-navbar-actions"><span>{user.fullName}</span><button className="mg-logout-button" onClick={onLogout}>Logout</button></div>
      </nav>
      <header className="mg-title-area"><p className="mg-small-title">Restaurant kitchen</p><h1 className="mg-title">Kitchen Dashboard</h1></header>
      <main className="mg-content">
        {error && <p className="mg-error" role="alert">{error}</p>}
        {notice && <p className="mg-account-success" role="status">{notice}</p>}
        {orders.length === 0 && <div className="mg-empty-box">No orders received.</div>}
        {orders.map((order) => (
          <div className="mg-order-card" key={order._id}>
            <div className="mg-order-info">
              <h4>Order #{order.orderNumber} · Table {order.tableNumber}</h4>
              {order.items.map((item) => (
                <p key={`${order._id}-${item.menuItemId}`}>
                  {item.name} × {item.quantity}
                  {item.customization && ` · ${item.customization}`}
                  {item.specialInstructions && ` · Note: ${item.specialInstructions}`}
                </p>
              ))}
            </div>
            <span className="mg-pill step1">{order.status}</span>
            {nextLabel[order.status] && <button className="mg-green-button small" onClick={() => advance(order)}>{nextLabel[order.status]}</button>}
          </div>
        ))}
        <div className="mg-box">
          <h3>Contact DineConnect support</h3>
          <form className="mg-form-grid" onSubmit={submitSupport}>
            <input className="wide" placeholder="Subject" value={support.subject} onChange={(event) => setSupport({ ...support, subject: event.target.value })} maxLength={160} required />
            <textarea className="wide" placeholder="Describe the issue" value={support.description} onChange={(event) => setSupport({ ...support, description: event.target.value })} maxLength={3000} required />
            <button className="mg-green-button" type="submit">Send support request</button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default KitchenDashboard;