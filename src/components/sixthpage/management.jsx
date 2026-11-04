import { useState } from "react";
import "./managementAdmin.css";
import { CATEGORIES, DEFAULT_ITEMS } from "../thirdpage/menu.js";

const ORDER_STATUSES = ["New", "Preparing", "Ready", "Served", "Cancelled"];
const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: "overview" },
  { id: "orders", label: "Live Orders", icon: "orders" },
  { id: "menu", label: "Menu Management", icon: "menu" },
  { id: "specials", label: "Today's Specials", icon: "specials" },
  { id: "tables", label: "Table Management", icon: "tables" },
  { id: "history", label: "Order History", icon: "history" },
];

const SAMPLE_ORDERS = [
  { id: "demo-1048", number: "1048", table: "04", name: "Classic Cheeseburger", qty: 2, time: "12:42 PM", step: 0 },
  { id: "demo-1047", number: "1047", table: "08", name: "Margherita Pizza", qty: 1, time: "12:38 PM", step: 1 },
  { id: "demo-1046", number: "1046", table: "02", name: "Crispy Chicken Burger", qty: 2, time: "12:31 PM", step: 2 },
  { id: "demo-1045", number: "1045", table: "06", name: "French Fries", qty: 1, time: "12:26 PM", step: 3 },
  { id: "demo-1044", number: "1044", table: "03", name: "BBQ Chicken Pizza", qty: 1, time: "12:18 PM", step: 4 },
  { id: "demo-1043", number: "1043", table: "01", name: "Fresh Garden Salad", qty: 1, time: "12:05 PM", step: 3 },
];

const INITIAL_TABLES = Array.from({ length: 12 }, (_, index) => ({
  number: String(index + 1).padStart(2, "0"),
  status: [1, 4, 7, 10].includes(index) ? "Occupied" : "Available",
}));

const getStatus = (order, override) => {
  if (override) return override;
  if (typeof order.status === "string") {
    const status = order.status.toLowerCase();
    if (status === "received" || status === "new") return "New";
    return ORDER_STATUSES.find((item) => item.toLowerCase() === status) ?? "New";
  }
  return ORDER_STATUSES[Math.max(0, Math.min(order.step ?? 0, ORDER_STATUSES.length - 1))];
};

const normalizeOrder = (order, overrides = {}) => {
  const items = Array.isArray(order.items)
    ? order.items.map((item) => `${item.name} × ${item.quantity}`)
    : [`${order.name ?? "Restaurant order"} × ${order.qty ?? 1}`];
  return {
    id: order.id ?? order._id ?? order.orderNumber,
    number: order.number ?? order.orderNumber ?? order._id?.slice(-5) ?? "—",
    table: order.table ?? order.tableNumber ?? "—",
    items,
    quantity: Array.isArray(order.items)
      ? order.items.reduce((total, item) => total + (item.quantity ?? 1), 0)
      : order.qty ?? 1,
    time: order.time ?? (order.createdAt
      ? new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "Today"),
    status: getStatus(order, overrides[order.id ?? order._id ?? order.orderNumber]),
  };
};

function Icon({ name, size = 20 }) {
  const paths = {
    overview: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
    orders: <><path d="M8 6h13M8 12h13M8 18h13" /><path d="M3 6h.01M3 12h.01M3 18h.01" /></>,
    menu: <><path d="M4 5h16M4 12h16M4 19h16" /><path d="M7 5v14" /></>,
    specials: <><path d="m12 3 2.4 5.2 5.7.7-4.2 4 .9 5.7-4.8-2.8-5.1 2.8 1.1-5.7-4.2-4 5.7-.7L12 3Z" /></>,
    tables: <><rect x="3" y="4" width="18" height="8" rx="2" /><path d="M5 12v8m14-8v8M3 16h18" /></>,
    history: <><path d="M3 12a9 9 0 1 0 2.6-6.4L3 8" /><path d="M3 3v5h5m4-1v5l3 2" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    arrow: <><path d="M5 12h14m-6-6 6 6-6 6" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    plate: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><path d="M2 12h2m16 0h2" /></>,
    check: <><path d="m5 12 4 4L19 6" /></>,
    plus: <><path d="M12 5v14m-7-7h14" /></>,
    trash: <><path d="M4 7h16m-10 4v6m4-6v6M5 7l1 14h12l1-14M9 7V4h6v3" /></>,
    eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" /><circle cx="12" cy="12" r="2.5" /></>,
  };

  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {paths[name] ?? paths.overview}
    </svg>
  );
}

function StatusBadge({ status }) {
  return <span className={`admin-status admin-status--${status.toLowerCase()}`}>{status}</span>;
}

function FoodEditor({ item, onClose, onSave }) {
  const [draft, setDraft] = useState(item ?? {
    name: "",
    category: CATEGORIES[0] ?? "",
    price: "",
    description: "",
    img: "",
    emoji: "🍽️",
    available: true,
  });
  const [error, setError] = useState("");

  const update = (key, value) => setDraft((current) => ({ ...current, [key]: value }));

  const submit = (event) => {
    event.preventDefault();
    if (!draft.name.trim() || Number(draft.price) <= 0) {
      setError("Enter a food name and a price greater than zero.");
      return;
    }
    onSave({ ...draft, name: draft.name.trim(), price: Number(draft.price) });
  };

  return (
    <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="food-editor-title">
        <div className="admin-modal-heading">
          <div>
            <p className="admin-eyebrow">{item ? "MENU ITEM" : "NEW MENU ITEM"}</p>
            <h2 id="food-editor-title">{item ? "Edit food" : "Add food"}</h2>
          </div>
          <button className="admin-icon-button" type="button" aria-label="Close dialog" onClick={onClose}><Icon name="close" /></button>
        </div>
        <form className="admin-food-form" onSubmit={submit}>
          <label>Food name<input value={draft.name} onChange={(event) => update("name", event.target.value)} required /></label>
          <label>Category<select value={draft.category} onChange={(event) => update("category", event.target.value)}>{CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label>
          <label>Price (Rs.)<input type="number" min="1" value={draft.price} onChange={(event) => update("price", event.target.value)} required /></label>
          <label>Image URL<input value={draft.img ?? ""} onChange={(event) => update("img", event.target.value)} placeholder="Optional" /></label>
          <label className="admin-form-wide">Description<textarea rows="3" value={draft.description ?? ""} onChange={(event) => update("description", event.target.value)} /></label>
          {error && <p className="admin-form-error" role="alert">{error}</p>}
          <div className="admin-modal-actions">
            <button type="button" className="admin-button admin-button--light" onClick={onClose}>Cancel</button>
            <button type="submit" className="admin-button">{item ? "Save changes" : "Add food"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

function ManagementPage({
  orders = [],
  menuItems = [],
  onNextStep,
  onClearServed,
  onUpdateItem,
  onDeleteItem,
  onAddItem,
  onLogout,
}) {
  const [page, setPage] = useState("overview");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editingFood, setEditingFood] = useState(undefined);
  const [demoOrders, setDemoOrders] = useState(SAMPLE_ORDERS);
  const [statusOverrides, setStatusOverrides] = useState({});
  const [demoMenu, setDemoMenu] = useState(DEFAULT_ITEMS);
  const [tables, setTables] = useState(INITIAL_TABLES);
  const [specialIds, setSpecialIds] = useState([1, 3, 5]);

  const orderSource = orders.length ? orders : demoOrders;
  const normalizedOrders = orderSource.map((order) => normalizeOrder(order, statusOverrides));
  const foods = menuItems.length ? menuItems : demoMenu;
  const allMenuItems = foods.length ? foods : DEFAULT_ITEMS;
  const liveOrders = normalizedOrders.filter((order) => !["Served", "Cancelled"].includes(order.status));
  const historyOrders = normalizedOrders.filter((order) => ["Served", "Cancelled"].includes(order.status));
  const summary = [
    { label: "New Orders", count: normalizedOrders.filter((order) => order.status === "New").length, icon: "orders" },
    { label: "Preparing", count: normalizedOrders.filter((order) => order.status === "Preparing").length, icon: "clock" },
    { label: "Ready to Serve", count: normalizedOrders.filter((order) => order.status === "Ready").length, icon: "plate" },
    { label: "Completed Today", count: normalizedOrders.filter((order) => order.status === "Served").length, icon: "check" },
  ];

  const selectPage = (nextPage) => {
    setPage(nextPage);
    setMobileNavOpen(false);
  };

  const updateOrderStatus = (id, status) => {
    const sourceOrder = orderSource.find((order) => (order.id ?? order._id ?? order.orderNumber) === id);
    if (!orders.length) {
      setDemoOrders((current) => current.map((order) => order.id === id
        ? { ...order, step: ORDER_STATUSES.indexOf(status) }
        : order));
    } else if (sourceOrder && onNextStep && status !== "Cancelled") {
      const currentStatus = getStatus(sourceOrder, statusOverrides[id]);
      const currentIndex = ORDER_STATUSES.indexOf(currentStatus);
      if (ORDER_STATUSES.indexOf(status) === currentIndex + 1) onNextStep(id);
    }
    setStatusOverrides((current) => ({ ...current, [id]: status }));
  };

  const saveFood = (food) => {
    if (editingFood) {
      if (menuItems.length && onUpdateItem) onUpdateItem(editingFood.id, food);
      else setDemoMenu((current) => current.map((item) => item.id === editingFood.id ? { ...item, ...food } : item));
    } else {
      const newFood = { ...food, id: Date.now(), available: true };
      if (menuItems.length && onAddItem) onAddItem(newFood);
      else setDemoMenu((current) => [...current, newFood]);
    }
    setEditingFood(undefined);
  };

  const deleteFood = (food) => {
    if (menuItems.length && onDeleteItem) onDeleteItem(food.id);
    else setDemoMenu((current) => current.filter((item) => item.id !== food.id));
    setSpecialIds((current) => current.filter((id) => id !== food.id));
  };

  const updateFoodAvailability = (food) => {
    if (menuItems.length && onUpdateItem) onUpdateItem(food.id, { available: !food.available });
    else setDemoMenu((current) => current.map((item) => item.id === food.id ? { ...item, available: !item.available } : item));
  };

  const toggleTable = (number) => setTables((current) => current.map((table) => table.number === number
    ? { ...table, status: table.status === "Available" ? "Occupied" : "Available" }
    : table));

  const clearServedHistory = () => {
    if (orders.length && onClearServed) onClearServed();
    else setDemoOrders((current) => current.filter((order) => getStatus(order) !== "Served"));
    setStatusOverrides((current) => Object.fromEntries(
      Object.entries(current).filter(([, status]) => status !== "Served"),
    ));
  };

  const specialFoods = allMenuItems.filter((item) => specialIds.includes(item.id));

  return (
    <div className="admin-dashboard">
      <header className="admin-topbar">
        <button className="admin-mobile-menu" type="button" aria-label="Open navigation" onClick={() => setMobileNavOpen((open) => !open)}>
          <span /><span /><span />
        </button>
        <a className="admin-brand" href="#overview" onClick={(event) => { event.preventDefault(); selectPage("overview"); }}>
          <span className="admin-brand-mark"><Icon name="plate" size={23} /></span>
          <span className="admin-brand-name">Dine<span>Connect</span></span>
        </a>
        <span className="admin-topbar-label">Restaurant Admin</span>
        <div className="admin-topbar-actions">
          <div className="admin-notification-wrap">
            <button className={`admin-icon-button admin-notification-button ${notificationsOpen ? "is-active" : ""}`} type="button" aria-label="Notifications" onClick={() => setNotificationsOpen((open) => !open)}>
              <Icon name="bell" />
              {liveOrders.length > 0 && <span className="admin-notification-dot" />}
            </button>
            {notificationsOpen && (
              <div className="admin-notification-popover">
                <strong>Notifications</strong>
                <p>{liveOrders.length ? `${liveOrders.length} order${liveOrders.length === 1 ? "" : "s"} need attention.` : "You're all caught up."}</p>
                <button type="button" onClick={() => { selectPage("orders"); setNotificationsOpen(false); }}>View live orders <Icon name="arrow" size={15} /></button>
              </div>
            )}
          </div>
          <div className="admin-profile">
            <span className="admin-avatar">A</span>
            <span className="admin-profile-copy"><strong>Admin</strong><small>Restaurant team</small></span>
          </div>
          <button className="admin-logout" type="button" onClick={onLogout}>Log out</button>
        </div>
      </header>

      <div className="admin-layout">
        {mobileNavOpen && <button className="admin-nav-backdrop" type="button" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} />}
        <aside className={`admin-sidebar ${mobileNavOpen ? "is-open" : ""}`}>
          <div className="admin-sidebar-heading"><span>WORKSPACE</span><span className="admin-live-indicator">OPEN</span></div>
          <nav className="admin-sidebar-nav" aria-label="Admin navigation">
            {NAV_ITEMS.map((item) => (
              <button key={item.id} type="button" className={`admin-nav-link ${page === item.id ? "is-active" : ""}`} onClick={() => selectPage(item.id)}>
                <Icon name={item.icon} size={19} />
                <span>{item.label}</span>
                {item.id === "orders" && liveOrders.length > 0 && <span className="admin-nav-count">{liveOrders.length}</span>}
              </button>
            ))}
          </nav>
          <div className="admin-sidebar-footer">
            <span className="admin-sidebar-footer-icon"><Icon name="plate" size={18} /></span>
            <div><strong>Good service starts here.</strong><span>Stay on top of every order.</span></div>
          </div>
        </aside>

        <main className="admin-main">
          <div className="admin-content">
            <div className="admin-page-heading">
              <div>
                <p className="admin-eyebrow">RESTAURANT OPERATIONS</p>
                <h1>{NAV_ITEMS.find((item) => item.id === page)?.label}</h1>
                <p className="admin-page-subtitle">
                  {page === "overview" && "A clear view of what's happening in your restaurant today."}
                  {page === "orders" && "Keep every order moving smoothly from kitchen to table."}
                  {page === "menu" && "Manage dishes, prices and availability for your menu."}
                  {page === "specials" && "Keep today's featured dishes ready for your guests."}
                  {page === "tables" && "Check table availability across your dining room."}
                  {page === "history" && "Review orders completed or cancelled today."}
                </p>
              </div>
              <div className="admin-date-chip"><span className="admin-date-dot" />Service in progress</div>
            </div>

            {page === "overview" && (
              <section className="admin-page-section">
                <div className="admin-summary-grid">
                  {summary.map((card, index) => (
                    <article className="admin-summary-card" key={card.label}>
                      <div className={`admin-summary-icon admin-summary-icon--${index}`}><Icon name={card.icon} size={21} /></div>
                      <span className="admin-summary-label">{card.label}</span>
                      <strong className="admin-summary-count">{card.count}</strong>
                    </article>
                  ))}
                </div>
                <section className="admin-panel admin-overview-orders">
                  <div className="admin-panel-heading">
                    <div><p className="admin-eyebrow">SERVICE FLOOR</p><h2>Recent live orders</h2></div>
                    <button className="admin-text-button" type="button" onClick={() => selectPage("orders")}>All live orders <Icon name="arrow" size={16} /></button>
                  </div>
                  <OrdersTable orders={liveOrders.slice(0, 4)} onStatusChange={updateOrderStatus} onView={setSelectedOrder} compact />
                </section>
                <section className="admin-welcome-banner">
                  <span className="admin-welcome-icon"><Icon name="specials" size={23} /></span>
                  <div><strong>A thoughtful service makes a lasting impression.</strong><p>Keep your team aligned and every table cared for.</p></div>
                  <button type="button" onClick={() => selectPage("tables")}>Check tables <Icon name="arrow" size={16} /></button>
                </section>
              </section>
            )}

            {page === "orders" && (
              <section className="admin-panel">
                <div className="admin-panel-heading">
                  <div><p className="admin-eyebrow">IN PROGRESS</p><h2>Live orders <span className="admin-heading-count">{liveOrders.length}</span></h2></div>
                  <span className="admin-sync-label"><span className="admin-date-dot" />Updated just now</span>
                </div>
                <OrdersTable orders={liveOrders} onStatusChange={updateOrderStatus} onView={setSelectedOrder} />
                {!orders.length && <p className="admin-demo-note">Sample orders are shown for this frontend demonstration.</p>}
              </section>
            )}

            {page === "menu" && (
              <section className="admin-panel">
                <div className="admin-panel-heading">
                  <div><p className="admin-eyebrow">YOUR KITCHEN, YOUR MENU</p><h2>Menu items <span className="admin-heading-count">{allMenuItems.length}</span></h2></div>
                  <button className="admin-button" type="button" onClick={() => setEditingFood(null)}><Icon name="plus" size={17} /> Add food</button>
                </div>
                <div className="admin-menu-grid">
                  {allMenuItems.map((food) => (
                    <article className={`admin-food-card ${food.available ? "" : "is-unavailable"}`} key={food.id}>
                      <div className="admin-food-image-wrap">
                        {food.img ? <img src={food.img} alt={food.name} className="admin-food-image" /> : <span className="admin-food-placeholder">{food.emoji ?? "🍽️"}</span>}
                        <span className={`admin-availability ${food.available ? "is-available" : ""}`}><span />{food.available ? "Available" : "Unavailable"}</span>
                      </div>
                      <div className="admin-food-details">
                        <div className="admin-food-title-row"><span className="admin-food-category">{food.category}</span><strong>Rs. {Number(food.price).toLocaleString("en-US")}</strong></div>
                        <h3>{food.name}</h3>
                        <p>{food.description || "A guest favourite, prepared fresh to order."}</p>
                        <div className="admin-food-actions">
                          <button className="admin-button admin-button--light admin-button--compact" type="button" onClick={() => setEditingFood(food)}>Edit food</button>
                          <button className="admin-food-icon-action" type="button" aria-label={`Delete ${food.name}`} onClick={() => deleteFood(food)}><Icon name="trash" size={17} /></button>
                          <button className={`admin-availability-toggle ${food.available ? "is-on" : ""}`} type="button" role="switch" aria-checked={Boolean(food.available)} aria-label={`${food.available ? "Mark unavailable" : "Mark available"}: ${food.name}`} onClick={() => updateFoodAvailability(food)}><span /></button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
                {!menuItems.length && <p className="admin-demo-note">Sample dishes are shown for this frontend demonstration.</p>}
              </section>
            )}

            {page === "specials" && (
              <section className="admin-panel">
                <div className="admin-panel-heading">
                  <div><p className="admin-eyebrow">FEATURED FOR YOUR GUESTS</p><h2>Today's specials</h2></div>
                  <span className="admin-specials-count">{specialFoods.length} featured</span>
                </div>
                {specialFoods.length > 0 ? (
                  <div className="admin-specials-grid">
                    {specialFoods.map((food) => (
                      <article className="admin-special-card" key={food.id}>
                        <div className="admin-special-image-wrap">
                          {food.img ? <img src={food.img} alt={food.name} /> : <span>{food.emoji ?? "🍽️"}</span>}
                          <span className="admin-special-ribbon">TODAY'S PICK</span>
                        </div>
                        <div className="admin-special-details">
                          <div className="admin-special-title"><h3>{food.name}</h3><strong>Rs. {Number(food.price).toLocaleString("en-US")}</strong></div>
                          <p>{food.description || "A delicious choice made fresh in our kitchen."}</p>
                          <span className={`admin-special-availability ${food.available ? "" : "is-unavailable"}`}><span />{food.available ? "Available to order" : "Currently unavailable"}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : <div className="admin-empty-state">No specials are featured right now. Add a dish to your menu to feature it here.</div>}
                <div className="admin-special-hint"><Icon name="specials" size={18} /><span>Today's picks are selected from your current menu.</span><button type="button" onClick={() => selectPage("menu")}>Manage menu <Icon name="arrow" size={15} /></button></div>
              </section>
            )}

            {page === "tables" && (
              <section className="admin-panel">
                <div className="admin-panel-heading">
                  <div><p className="admin-eyebrow">DINING ROOM</p><h2>Table status</h2></div>
                  <div className="admin-table-legend"><span><i className="is-available" />Available</span><span><i />Occupied</span></div>
                </div>
                <div className="admin-tables-grid">
                  {tables.map((table) => (
                    <button key={table.number} className={`admin-table-card ${table.status === "Occupied" ? "is-occupied" : ""}`} type="button" onClick={() => toggleTable(table.number)} aria-label={`Table ${table.number}, ${table.status}. Click to change status`}>
                      <span className="admin-table-number">TABLE</span>
                      <strong>{table.number}</strong>
                      <span className="admin-table-status"><i />{table.status}</span>
                    </button>
                  ))}
                </div>
                <p className="admin-demo-note">Tap a table to change its availability in this demonstration.</p>
              </section>
            )}

            {page === "history" && (
              <section className="admin-panel">
                <div className="admin-panel-heading">
                  <div><p className="admin-eyebrow">COMPLETED SERVICE</p><h2>Order history <span className="admin-heading-count">{historyOrders.length}</span></h2></div>
                  {historyOrders.some((order) => order.status === "Served") && (
                    <button className="admin-clear-history" type="button" onClick={clearServedHistory}>Clear served orders</button>
                  )}
                </div>
                <OrdersTable orders={historyOrders} onStatusChange={updateOrderStatus} onView={setSelectedOrder} history />
                {!historyOrders.length && <div className="admin-empty-state">Completed orders will appear here.</div>}
              </section>
            )}
          </div>
        </main>
      </div>

      {selectedOrder && <OrderDetails order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
      {editingFood !== undefined && <FoodEditor key={editingFood?.id ?? "new-food"} item={editingFood || undefined} onClose={() => setEditingFood(undefined)} onSave={saveFood} />}
    </div>
  );
}

function OrdersTable({ orders, onStatusChange, onView, compact = false, history = false }) {
  if (!orders.length) return <div className="admin-empty-state">No {history ? "previous" : "live"} orders to show.</div>;

  return (
    <div className={`admin-table-scroll ${compact ? "is-compact" : ""}`}>
      <table className="admin-orders-table">
        <thead><tr><th>Order</th><th>Table</th><th>Food items</th><th>Qty</th><th>Order time</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td><strong className="admin-order-number">#{order.number}</strong></td>
              <td><span className="admin-table-cell">Table {order.table}</span></td>
              <td><div className="admin-order-items">{order.items.map((item) => <span key={item}>{item}</span>)}</div></td>
              <td>{order.quantity}</td>
              <td><span className="admin-time-cell"><Icon name="clock" size={15} />{order.time}</span></td>
              <td><StatusBadge status={order.status} /></td>
              <td>
                <div className="admin-order-actions">
                  <button className="admin-view-button" type="button" onClick={() => onView(order)}><Icon name="eye" size={15} /><span>View</span></button>
                  {!history && <select className="admin-status-select" value={order.status} aria-label={`Update status for order ${order.number}`} onChange={(event) => onStatusChange(order.id, event.target.value)}>
                    {ORDER_STATUSES.map((status) => <option key={status}>{status}</option>)}
                  </select>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OrderDetails({ order, onClose }) {
  return (
    <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="admin-modal admin-order-modal" role="dialog" aria-modal="true" aria-labelledby="order-details-title">
        <div className="admin-modal-heading">
          <div><p className="admin-eyebrow">ORDER DETAILS</p><h2 id="order-details-title">Order #{order.number}</h2></div>
          <button className="admin-icon-button" type="button" aria-label="Close dialog" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="admin-order-detail-meta"><span>Table {order.table}</span><span>{order.time}</span><StatusBadge status={order.status} /></div>
        <div className="admin-order-detail-items"><strong>Items ({order.quantity})</strong>{order.items.map((item) => <p key={item}>{item}</p>)}</div>
        <button className="admin-button admin-order-modal-close" type="button" onClick={onClose}>Close</button>
      </section>
    </div>
  );
}

export default ManagementPage;
