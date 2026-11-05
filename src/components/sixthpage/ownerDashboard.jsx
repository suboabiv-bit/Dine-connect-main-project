import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import "./ownerDashboard.css";
import { API_BASE_URL } from "../../config/api";

const NAV_ITEMS = [
  ["dashboard", "Dashboard", "▦"],
  ["sales", "Sales", "↗"],
  ["orders", "Orders", "≡"],
  ["food", "Food Items", "✣"],
  ["staff", "Staff", "♙"],
  ["profile", "Profile", "◉"],
];
const ORDER_STATUSES = ["Pending", "Preparing", "Ready", "Completed", "Cancelled"];
const STAFF_ROLES = ["Chef", "Kitchen Staff", "Waiter/Waitress", "Cashier", "Manager", "Other Staff"];
const FOOD_CATEGORIES = ["Burgers", "Pizza", "Sides", "Drinks", "Other"];
const CURRENCY = new Intl.NumberFormat("en-LK", {
  style: "currency",
  currency: "LKR",
  maximumFractionDigits: 0,
});
const currency = (amount = 0) => CURRENCY.format(Number(amount) || 0);
const dateTime = (value) => value ? new Date(value).toLocaleString() : "—";
const dateOnly = (value) => value ? new Date(value).toLocaleDateString() : "—";

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}/api/owner${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.message || "The request could not be completed.");
  return result;
}

function EmptyState({ children }) {
  return <div className="od-empty">{children}</div>;
}

function MetricCard({ label, value, caption, icon }) {
  return (
    <article className="od-metric-card">
      <div className="od-metric-top"><span>{label}</span><span className="od-metric-icon" aria-hidden="true">{icon}</span></div>
      <strong>{value}</strong>
      <small>{caption}</small>
    </article>
  );
}

function SalesChart({ title, data, dataKey, period }) {
  return (
    <section className="od-panel od-chart-panel">
      <div className="od-panel-heading">
        <div><p className="od-eyebrow">Revenue report</p><h2>{title}</h2></div>
        <span className="od-period">{period}</span>
      </div>
      {data?.length ? (
        <div className="od-chart">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 16, right: 12, left: 8, bottom: 2 }}>
              <CartesianGrid stroke="#edf0e9" vertical={false} />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#7e8980", fontSize: 11 }} />
              <YAxis
                axisLine={false}
                tickLine={false}
                width={72}
                tick={{ fill: "#7e8980", fontSize: 10 }}
                tickFormatter={(value) => `Rs ${Number(value).toLocaleString("en-LK")}`}
              />
              <Tooltip
                formatter={(value) => [currency(value), "Revenue"]}
                labelStyle={{ color: "#26352b" }}
                contentStyle={{ border: "1px solid #e8e9e3", borderRadius: 8 }}
              />
              <Line type="monotone" dataKey={dataKey} stroke="#0f633a" strokeWidth={3} activeDot={{ r: 6 }} dot={{ r: 3, fill: "#b8741a" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : <EmptyState>No sales data yet. Sales will appear when orders are placed.</EmptyState>}
    </section>
  );
}

function OrdersTable({ orders, onSelect, onStatusChange, busyOrder }) {
  if (!orders?.length) return <EmptyState>No orders to display yet.</EmptyState>;
  return (
    <div className="od-table-wrap">
      <table className="od-table">
        <thead><tr><th>Order</th><th>Table</th><th>Food items</th><th>Qty</th><th>Total</th><th>Date</th><th>Time</th><th>Status</th></tr></thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td><button className="od-link-button" type="button" onClick={() => onSelect(order)}>#{order.orderNumber}</button></td>
              <td>{order.tableNumber}</td>
              <td>{order.items.map((item) => item.name).join(", ")}</td>
              <td>{order.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
              <td className="od-order-total">{currency(order.totalAmount)}</td>
              <td>{dateOnly(order.orderDate)}</td>
              <td>{new Date(order.orderTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
              <td>
                <select
                  className={`od-status-select od-status-${order.status.toLowerCase()}`}
                  value={order.status}
                  disabled={busyOrder === order.id}
                  aria-label={`Update status for order ${order.orderNumber}`}
                  onChange={(event) => onStatusChange(order.id, event.target.value)}
                >
                  {ORDER_STATUSES.map((status) => <option key={status}>{status}</option>)}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="od-modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="od-modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="od-panel-heading"><h2>{title}</h2><button className="od-icon-button" type="button" onClick={onClose} aria-label="Close dialog">×</button></div>
        {children}
      </section>
    </div>
  );
}

function OwnerDashboard({ user, onLogout }) {
  const [activePage, setActivePage] = useState("dashboard");
  const [todayLabel] = useState(() => new Date().toLocaleDateString("en-LK", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }));
  const [dashboard, setDashboard] = useState(null);
  const [orders, setOrders] = useState([]);
  const [foodItems, setFoodItems] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyOrder, setBusyOrder] = useState("");
  const [salesPeriod, setSalesPeriod] = useState("daily");
  const [ordersView, setOrdersView] = useState("recent");
  const [foodCategory, setFoodCategory] = useState("All");
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      const result = await apiRequest("/dashboard");
      setDashboard(result);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadOrders = useCallback(async () => {
    const result = await apiRequest("/orders");
    setOrders(result.orders);
  }, []);

  const loadFoodItems = useCallback(async () => {
    const result = await apiRequest("/food-items");
    setFoodItems(result.items);
  }, []);

  const loadStaff = useCallback(async () => {
    const result = await apiRequest("/staff");
    setStaff(result.staff);
  }, []);

  useEffect(() => {
    let active = true;
    apiRequest("/dashboard")
      .then((result) => {
        if (!active) return;
        setDashboard(result);
        setError("");
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    let active = true;
    const loadSection = async () => {
      try {
        if (activePage === "orders") {
          const result = await apiRequest("/orders");
          if (active) setOrders(result.orders);
        }
        if (activePage === "food") {
          const result = await apiRequest("/food-items");
          if (active) setFoodItems(result.items);
        }
        if (activePage === "staff") {
          const result = await apiRequest("/staff");
          if (active) setStaff(result.staff);
        }
      } catch (requestError) {
        if (active) setError(requestError.message);
      }
    };
    loadSection();
    return () => { active = false; };
  }, [activePage]);

  useEffect(() => {
    if (!notice) return undefined;
    const timeout = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(timeout);
  }, [notice]);

  const refreshDashboard = async () => {
    await loadDashboard();
    if (activePage === "orders") await loadOrders();
    if (activePage === "food") await loadFoodItems();
    if (activePage === "staff") await loadStaff();
  };

  const perform = async (action, successMessage) => {
    setSaving(true);
    setError("");
    try {
      await action();
      await refreshDashboard();
      setNotice(successMessage);
      setModal(null);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    setBusyOrder(orderId);
    try {
      const result = await apiRequest(`/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setOrders((current) => current.map((order) => order.id === orderId ? result.order : order));
      setNotice(`Order #${result.order.orderNumber} updated to ${status}.`);
      loadDashboard();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyOrder("");
    }
  };

  const pageTitle = NAV_ITEMS.find(([key]) => key === activePage)?.[1] || "Dashboard";
  const restaurant = dashboard?.restaurant || {};
  const owner = dashboard?.owner || user || {};
  const allOrders = orders;
  const shownOrders = ordersView === "recent" ? allOrders.slice(0, 8) : allOrders;
  const filteredFood = useMemo(
    () => foodCategory === "All" ? foodItems : foodItems.filter((item) => item.category === foodCategory),
    [foodCategory, foodItems],
  );
  const metricValues = dashboard?.metrics || {};

  const openFoodForm = (item) => setModal({ type: "food", item });
  const openStaffForm = (member) => setModal({ type: "staff", member });
  const openProfileForm = () => setModal({ type: "profile" });
  const readImage = (event, onChange) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("Choose a PNG, JPEG, or WebP image.");
      return;
    }
    if (file.size > 2_500_000) {
      setError("Choose an image smaller than 2.5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result));
    reader.onerror = () => setError("Could not read the selected image.");
    reader.readAsDataURL(file);
  };

  const renderOrders = () => (
    <section className="od-panel">
      <div className="od-panel-heading">
        <div><p className="od-eyebrow">Order management</p><h2>{ordersView === "recent" ? "Recent orders" : "All orders"}</h2></div>
        <div className="od-inline-actions">
          <button type="button" className={`od-tab-button${ordersView === "recent" ? " is-active" : ""}`} onClick={() => setOrdersView("recent")}>Recent</button>
          <button type="button" className={`od-tab-button${ordersView === "all" ? " is-active" : ""}`} onClick={() => setOrdersView("all")}>All orders</button>
        </div>
      </div>
      <OrdersTable orders={shownOrders} onSelect={(order) => setModal({ type: "order", order })} onStatusChange={updateOrderStatus} busyOrder={busyOrder} />
    </section>
  );

  const renderFood = () => (
    <>
      <section className="od-panel">
        <div className="od-panel-heading">
          <div><p className="od-eyebrow">Menu management</p><h2>Food items</h2></div>
          <button type="button" className="od-primary-button" onClick={() => openFoodForm(null)}>+ Add food item</button>
        </div>
        <div className="od-filter-row">
          {["All", ...new Set([...FOOD_CATEGORIES, ...foodItems.map((item) => item.category)])].map((category) => (
            <button type="button" className={`od-tab-button${foodCategory === category ? " is-active" : ""}`} key={category} onClick={() => setFoodCategory(category)}>{category}</button>
          ))}
        </div>
        {filteredFood.length ? (
          <div className="od-table-wrap">
            <table className="od-table">
              <thead><tr><th>Food item</th><th>Category</th><th>Price</th><th>Qty sold</th><th>Revenue</th><th>Latest sale</th><th>Availability</th><th>Actions</th></tr></thead>
              <tbody>{filteredFood.map((item) => (
                <tr key={item._id}>
                  <td><div className="od-food-cell">{item.image ? <img src={item.image} alt="" /> : <span className="od-food-placeholder">✣</span>}<span>{item.name}</span></div></td>
                  <td>{item.category}</td><td>{currency(item.price)}</td><td>{item.quantitySold}</td><td>{currency(item.revenue)}</td><td>{dateTime(item.latestSale)}</td>
                  <td><button type="button" className={`od-availability ${item.available ? "is-available" : ""}`} onClick={() => perform(() => apiRequest(`/food-items/${item._id}`, { method: "PATCH", body: JSON.stringify({ available: !item.available }) }), "Availability updated.")}>{item.available ? "Available" : "Unavailable"}</button></td>
                  <td><div className="od-inline-actions"><button type="button" className="od-small-button" onClick={() => openFoodForm(item)}>Edit</button><button type="button" className="od-small-button danger" onClick={() => {
                    if (window.confirm(`Delete ${item.name}?`)) perform(() => apiRequest(`/food-items/${item._id}`, { method: "DELETE" }), "Food item deleted.");
                  }}>Delete</button></div></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <EmptyState>No food items in this category yet.</EmptyState>}
      </section>
      <section className="od-panel od-best-panel">
        <div className="od-panel-heading"><div><p className="od-eyebrow">Performance</p><h2>Best-selling foods</h2></div></div>
        <div className="od-best-list">
          {(dashboard?.bestSellers || []).length ? dashboard.bestSellers.map((item, index) => (
            <article className="od-best-item" key={`${item.name}-${index}`}>
              <span className="od-rank">{String(index + 1).padStart(2, "0")}</span>
              {item.image ? <img src={item.image} alt={item.name} /> : <span className="od-food-placeholder">✣</span>}
              <div className="od-best-details"><h3>{item.name}</h3><p>{item.category} · {item.quantity} sold · Latest: {dateTime(item.latestSale)}</p></div>
              <strong>{currency(item.revenue)}</strong>
            </article>
          )) : <EmptyState>Sales by food item will appear here.</EmptyState>}
        </div>
      </section>
    </>
  );

  const renderStaff = () => (
    <section className="od-panel">
      <div className="od-panel-heading">
        <div><p className="od-eyebrow">People &amp; roles</p><h2>Staff management</h2></div>
        <button type="button" className="od-primary-button" onClick={() => openStaffForm(null)}>+ Add staff</button>
      </div>
      {STAFF_ROLES.map((role) => {
        const standardRoles = STAFF_ROLES.slice(0, -1);
        const members = staff.filter((member) => role === "Other Staff"
          ? !standardRoles.includes(member.position)
          : member.position === role);
        if (!members.length) return null;
        return <div className="od-staff-group" key={role}>
          <h3>{role}<span>{members.length}</span></h3>
          <div className="od-table-wrap">
            <table className="od-table">
              <thead><tr><th>Staff ID</th><th>Name</th><th>Join date</th><th>Monthly salary</th><th>Contact</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>{members.map((member) => (
                <tr key={member._id}><td>{member.staffId}</td><td>{member.name}</td><td>{dateOnly(member.joinDate)}</td><td>{currency(member.monthlySalary)}</td><td>{member.contact || "—"}</td><td><span className="od-status">{member.status}</span></td>
                  <td><div className="od-inline-actions"><button type="button" className="od-small-button" onClick={() => openStaffForm(member)}>Edit</button><button type="button" className="od-small-button danger" onClick={() => {
                    if (window.confirm(`Delete ${member.name}?`)) perform(() => apiRequest(`/staff/${member._id}`, { method: "DELETE" }), "Staff member deleted.");
                  }}>Delete</button></div></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>;
      })}
      {!staff.length && <EmptyState>No staff details yet. Add your first team member.</EmptyState>}
    </section>
  );

  const renderProfile = () => (
    <>
      <section className="od-panel od-owner-profile">
        <div className="od-profile-identity">
          {owner.profilePicture ? <img className="od-profile-picture" src={owner.profilePicture} alt={owner.fullName} /> : <div className="od-profile-picture od-profile-initial">{(owner.fullName || "O").charAt(0).toUpperCase()}</div>}
          <div><p className="od-eyebrow">Owner profile</p><h2>{owner.fullName || "Restaurant owner"}</h2><span>{restaurant.name || "Restaurant"}</span></div>
          <button type="button" className="od-primary-button" onClick={openProfileForm}>Edit profile</button>
        </div>
        <dl className="od-profile-list">
          <div><dt>Owner ID</dt><dd>{owner.id || user?.id || "—"}</dd></div>
          <div><dt>Joined date</dt><dd>{dateOnly(owner.joinedAt)}</dd></div>
          <div><dt>Email address</dt><dd>{owner.email || "—"}</dd></div>
          <div><dt>Contact number</dt><dd>{owner.phone || restaurant.contactNumber || "—"}</dd></div>
          <div><dt>Restaurant address</dt><dd>{restaurant.address || "—"}</dd></div>
        </dl>
      </section>
      <section className="od-panel">
        <div className="od-panel-heading"><div><p className="od-eyebrow">Restaurant performance</p><h2>Revenue summary</h2></div></div>
        <div className="od-metric-grid od-revenue-cards">
          <MetricCard label="Monthly revenue" value={currency(dashboard?.revenueSummary?.currentMonth)} caption="Current month" icon="◷" />
          <MetricCard label="Previous month" value={currency(dashboard?.revenueSummary?.previousMonth)} caption="Previous calendar month" icon="↗" />
          <MetricCard label="Last 3 months" value={currency(dashboard?.revenueSummary?.lastThreeMonths)} caption="Rolling three-month period" icon="▤" />
          <MetricCard label="Total revenue" value={currency(dashboard?.revenueSummary?.total)} caption="All non-cancelled orders" icon="◇" />
        </div>
        <SalesChart title="Monthly revenue" period="Last 12 months" data={dashboard?.monthlySales || []} dataKey="amount" />
      </section>
    </>
  );

  const renderContent = () => {
    if (activePage === "sales") return (
      <section className="od-panel">
        <div className="od-panel-heading">
          <div><p className="od-eyebrow">Revenue analytics</p><h2>{salesPeriod === "daily" ? "Daily sales" : "Monthly sales"}</h2></div>
          <div className="od-inline-actions">
            <button type="button" className={`od-tab-button${salesPeriod === "daily" ? " is-active" : ""}`} onClick={() => setSalesPeriod("daily")}>Daily</button>
            <button type="button" className={`od-tab-button${salesPeriod === "monthly" ? " is-active" : ""}`} onClick={() => setSalesPeriod("monthly")}>Monthly</button>
          </div>
        </div>
        <SalesChart title={salesPeriod === "daily" ? "Daily sales" : "Monthly sales"} period={salesPeriod === "daily" ? "Last 14 days" : "Last 12 months"} data={salesPeriod === "daily" ? dashboard?.dailySales : dashboard?.monthlySales} dataKey="amount" />
      </section>
    );
    if (activePage === "orders") return renderOrders();
    if (activePage === "food") return renderFood();
    if (activePage === "staff") return renderStaff();
    if (activePage === "profile") return renderProfile();
    return (
      <>
        <section className="od-metric-grid" aria-label="Sales summary">
          <MetricCard label="Total sales" value={currency(metricValues.totalSales)} caption="All-time revenue" icon="↗" />
          <MetricCard label="Today's sales" value={currency(metricValues.todaySales)} caption="Revenue earned today" icon="◷" />
          <MetricCard label="Total orders" value={Number(metricValues.totalOrders || 0).toLocaleString()} caption="Orders received" icon="≡" />
          <MetricCard label="Food items sold" value={Number(metricValues.foodItemsSold || 0).toLocaleString()} caption="Total units sold" icon="✣" />
        </section>
        <div className="od-chart-grid">
          <SalesChart title="Daily sales" period="Last 14 days" data={dashboard?.dailySales || []} dataKey="amount" />
          <SalesChart title="Monthly sales" period="Last 12 months" data={dashboard?.monthlySales || []} dataKey="amount" />
        </div>
        <section className="od-panel od-best-panel">
          <div className="od-panel-heading"><div><p className="od-eyebrow">Customer favourites</p><h2>Best-selling food items</h2></div><button className="od-text-button" type="button" onClick={() => setActivePage("food")}>Manage foods →</button></div>
          <div className="od-best-list">
            {(dashboard?.bestSellers || []).length ? dashboard.bestSellers.map((item, index) => (
              <article className="od-best-item" key={`${item.name}-${index}`}><span className="od-rank">{String(index + 1).padStart(2, "0")}</span>{item.image ? <img src={item.image} alt={item.name} /> : <span className="od-food-placeholder">✣</span>}<div className="od-best-details"><h3>{item.name}</h3><p>{item.category} · {item.quantity} sold</p></div><strong>{currency(item.revenue)}</strong></article>
            )) : <EmptyState>Best sellers appear after your restaurant receives orders.</EmptyState>}
          </div>
        </section>
        <section className="od-panel">
          <div className="od-panel-heading"><div><p className="od-eyebrow">Latest activity</p><h2>Recent orders</h2></div><button className="od-text-button" type="button" onClick={() => { setActivePage("orders"); setOrdersView("recent"); }}>View all →</button></div>
          <OrdersTable orders={dashboard?.recentOrders || []} onSelect={(order) => setModal({ type: "order", order })} onStatusChange={updateOrderStatus} busyOrder={busyOrder} />
        </section>
      </>
    );
  };

  return (
    <div className="od-shell">
      <aside className="od-sidebar">
        <a className="od-brand" href="#dashboard" onClick={(event) => { event.preventDefault(); setActivePage("dashboard"); }}>
          <span className="od-brand-mark">D</span><span>Dine<span className="od-brand-accent">Connect</span><small>RESTAURANT PORTAL</small></span>
        </a>
        <div className="od-nav-label">Workspace</div>
        <nav className="od-nav" aria-label="Owner dashboard">
          {NAV_ITEMS.map(([key, label, icon]) => <button key={key} type="button" className={`od-nav-item${activePage === key ? " is-active" : ""}`} aria-current={activePage === key ? "page" : undefined} onClick={() => setActivePage(key)}><span className="od-nav-icon" aria-hidden="true">{icon}</span>{label}{key === "orders" && dashboard?.metrics?.totalOrders > 0 && <span className="od-nav-count">{dashboard.metrics.totalOrders}</span>}</button>)}
        </nav>
        <div className="od-sidebar-footer">
          {owner.profilePicture ? <img className="od-user-avatar" src={owner.profilePicture} alt="" /> : <div className="od-user-avatar">{(owner.fullName || "O").charAt(0).toUpperCase()}</div>}
          <div className="od-user-summary"><strong>{owner.fullName || "Restaurant Owner"}</strong><span>Owner account</span></div>
          <button type="button" className="od-logout" onClick={onLogout} aria-label="Log out" title="Log out">↪</button>
        </div>
      </aside>
      <main className="od-main">
        <header className="od-topbar"><div><span className="od-breadcrumb">{restaurant.name || "Restaurant"}</span><span className="od-breadcrumb-separator">/</span><span>{pageTitle}</span></div><div className="od-topbar-meta"><span className="od-live-dot" />Live restaurant data</div></header>
        <div className="od-page-content">
          <div className="od-page-heading"><div><p className="od-eyebrow">Restaurant workspace</p><h1>{pageTitle}</h1><p>Welcome back, {owner.fullName || "there"}.</p></div><span className="od-date-label">{todayLabel}</span></div>
          {error && <div className="od-alert" role="alert">{error}<button type="button" onClick={() => setError("")} aria-label="Dismiss error">×</button></div>}
          {notice && <div className="od-notice" role="status">{notice}</div>}
          {loading && !dashboard ? <div className="od-panel"><EmptyState>Loading your restaurant information…</EmptyState></div> : dashboard ? renderContent() : <div className="od-panel"><EmptyState>Dashboard information is unavailable. Use refresh to try again.<button type="button" className="od-text-button" onClick={loadDashboard}>Retry</button></EmptyState></div>}
        </div>
      </main>
      {modal?.type === "order" && <Modal title={`Order #${modal.order.orderNumber}`} onClose={() => setModal(null)}>
        <dl className="od-profile-list od-order-details"><div><dt>Table</dt><dd>{modal.order.tableNumber}</dd></div><div><dt>Status</dt><dd>{modal.order.status}</dd></div><div><dt>Order date</dt><dd>{dateOnly(modal.order.orderDate)}</dd></div><div><dt>Order time</dt><dd>{new Date(modal.order.orderTime).toLocaleTimeString()}</dd></div></dl>
        <div className="od-table-wrap"><table className="od-table"><thead><tr><th>Food item</th><th>Quantity</th><th>Unit price</th><th>Amount</th></tr></thead><tbody>{modal.order.items.map((item, index) => <tr key={`${item.name}-${index}`}><td>{item.name}</td><td>{item.quantity}</td><td>{currency(item.price)}</td><td>{currency(item.price * item.quantity)}</td></tr>)}</tbody></table></div>
        <p className="od-modal-total">Total: {currency(modal.order.totalAmount)}</p>
      </Modal>}
      {modal?.type === "food" && <FoodForm item={modal.item} saving={saving} onCancel={() => setModal(null)} onSave={(payload) => perform(() => apiRequest(modal.item ? `/food-items/${modal.item._id}` : "/food-items", { method: modal.item ? "PATCH" : "POST", body: JSON.stringify(payload) }), modal.item ? "Food item updated." : "Food item added.")} onReadImage={readImage} />}
      {modal?.type === "staff" && <StaffForm member={modal.member} saving={saving} onCancel={() => setModal(null)} onSave={(payload) => perform(() => apiRequest(modal.member ? `/staff/${modal.member._id}` : "/staff", { method: modal.member ? "PATCH" : "POST", body: JSON.stringify(payload) }), modal.member ? "Staff details updated." : "Staff member added.")} />}
      {modal?.type === "profile" && <ProfileForm owner={owner} restaurant={restaurant} saving={saving} onCancel={() => setModal(null)} onReadImage={readImage} onSave={(payload) => perform(async () => {
        const result = await apiRequest("/profile", { method: "PATCH", body: JSON.stringify(payload) });
        setDashboard((current) => ({ ...current, owner: { ...current.owner, ...result.owner }, restaurant: result.restaurant }));
      }, "Profile updated.")} />}
    </div>
  );
}

function FoodForm({ item, saving, onCancel, onSave, onReadImage }) {
  const [form, setForm] = useState({ name: item?.name || "", category: item?.category || "Other", description: item?.description || "", price: item?.price ?? "", image: item?.image || "", available: item?.available ?? true });
  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.type === "checkbox" ? event.target.checked : event.target.value }));
  return <Modal title={item ? "Edit food item" : "Add food item"} onClose={onCancel}>
    <form className="od-form" onSubmit={(event) => { event.preventDefault(); onSave(form); }}>
      <label>Food name<input name="name" value={form.name} onChange={update} required maxLength={120} /></label>
      <label>Category<select name="category" value={form.category} onChange={update}>{FOOD_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label>
      <label>Description<textarea name="description" value={form.description} onChange={update} rows="3" /></label>
      <label>Price (LKR)<input name="price" type="number" min="0" step="0.01" value={form.price} onChange={update} required /></label>
      <label>Food image<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => onReadImage(event, (image) => setForm((current) => ({ ...current, image })))} /></label>
      {form.image && <img className="od-image-preview" src={form.image} alt="Food preview" />}
      <label className="od-checkbox-label"><input name="available" type="checkbox" checked={form.available} onChange={update} />Available to order</label>
      <FormActions saving={saving} onCancel={onCancel} />
    </form>
  </Modal>;
}

function StaffForm({ member, saving, onCancel, onSave }) {
  const [today] = useState(() => new Date().toISOString().slice(0, 10));
  const [form, setForm] = useState({ name: member?.name || "", position: member?.position || STAFF_ROLES[0], joinDate: member?.joinDate ? new Date(member.joinDate).toISOString().slice(0, 10) : today, monthlySalary: member?.monthlySalary ?? "", contact: member?.contact || "", status: member?.status || "Active" });
  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  return <Modal title={member ? "Edit staff details" : "Add staff member"} onClose={onCancel}>
    <form className="od-form" onSubmit={(event) => { event.preventDefault(); onSave(form); }}>
      <label>Full name<input name="name" value={form.name} onChange={update} required /></label>
      <label>Job position<select name="position" value={form.position} onChange={update}>{!STAFF_ROLES.includes(form.position) && <option>{form.position}</option>}{STAFF_ROLES.map((role) => <option key={role}>{role}</option>)}</select></label>
      <label>Join date<input name="joinDate" type="date" value={form.joinDate} onChange={update} required /></label>
      <label>Monthly salary (LKR)<input name="monthlySalary" type="number" min="0" step="0.01" value={form.monthlySalary} onChange={update} /></label>
      <label>Contact information<input name="contact" value={form.contact} onChange={update} /></label>
      <label>Employment status<select name="status" value={form.status} onChange={update}><option>Active</option><option>On leave</option><option>Inactive</option></select></label>
      <FormActions saving={saving} onCancel={onCancel} />
    </form>
  </Modal>;
}

function ProfileForm({ owner, restaurant, saving, onCancel, onSave, onReadImage }) {
  const [form, setForm] = useState({ fullName: owner.fullName || "", email: owner.email || "", phone: owner.phone || "", restaurantName: restaurant.name || "", address: restaurant.address || "", profilePicture: owner.profilePicture || "" });
  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  return <Modal title="Edit restaurant profile" onClose={onCancel}>
    <form className="od-form" onSubmit={(event) => { event.preventDefault(); onSave(form); }}>
      <label>Owner full name<input name="fullName" value={form.fullName} onChange={update} required /></label>
      <label>Restaurant name<input name="restaurantName" value={form.restaurantName} onChange={update} required /></label>
      <label>Email address<input name="email" type="email" value={form.email} onChange={update} required /></label>
      <label>Contact number<input name="phone" type="tel" value={form.phone} onChange={update} /></label>
      <label>Restaurant address<textarea name="address" value={form.address} onChange={update} rows="2" /></label>
      <label>Profile picture<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => onReadImage(event, (profilePicture) => setForm((current) => ({ ...current, profilePicture })))} /></label>
      {form.profilePicture && <img className="od-image-preview od-profile-preview" src={form.profilePicture} alt="Profile preview" />}
      <FormActions saving={saving} onCancel={onCancel} />
    </form>
  </Modal>;
}

function FormActions({ saving, onCancel }) {
  return <div className="od-form-actions"><button type="button" className="od-secondary-button" onClick={onCancel}>Cancel</button><button type="submit" className="od-primary-button" disabled={saving}>{saving ? "Saving…" : "Save changes"}</button></div>;
}

export default OwnerDashboard;
