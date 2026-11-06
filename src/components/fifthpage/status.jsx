
import "../SecondPage/secondpage.css";
import "./status.css";
import CustomerNavigation from "../CustomerNavigation";

const rs = (n) => "Rs. " + n.toLocaleString("en-US");

const STEP_NAMES = ["Order Received", "Preparing", "Ready", "Served"];

const STEP_MESSAGES = [
  "Your order has been received by the kitchen",
  "The chef is cooking your food",
  "Ready! A waiter is bringing it to your table",
  "Served. Enjoy your meal!",
];

function StatusPage({
  table,
  orders,
  loading = false,
  error = "",
  cartCount,
  onNextStep,
  onClearServed,
  onNavigate,
  onBack,
}) {
  const totalAmount = orders.reduce((sum, o) => sum + (o.totalAmount ?? o.price * o.qty), 0);
  const inKitchen = orders.filter((o) => o.step < 3).length;
  const servedCount = orders.filter((order) => order.step === 3 && order.statusLabel !== "Cancelled").length;

  return (
    <div className="sp-page status-page">

      
      <CustomerNavigation
        activePage="status"
        table={table}
        cartCount={cartCount}
        onNavigate={onNavigate}
        onBack={onBack}
      />

    
      <header className="status-title-area">
        <p className="status-small-title">LIVE KITCHEN UPDATES</p>
        <h1 className="status-title">Order Status</h1>
        <p className="status-subtitle">
          Track your food from the kitchen to your table.
        </p>
      </header>

      {loading && <p role="status">Loading your order status…</p>}
      {error && <p role="alert">{error}</p>}

      {!loading && orders.length === 0 && (
        <div className="status-empty-box">
          <div className="status-empty-icon">🧾</div>
          <h2>No orders yet</h2>
          <p>
            Press an order button on the Menu or Today's Specials page
            and it will appear here.
          </p>
          <button className="status-green-button" onClick={() => onNavigate("menu")}>
            Go to Menu
          </button>
        </div>
      )}

      
      {!loading && orders.length > 0 && (
        <div className="status-content">

          {/* SUMMARY */}
          <div className="status-summary-box">
            <div className="status-summary-item">
              <strong>{orders.length}</strong>
              <span>Orders</span>
            </div>

            <div className="status-summary-item">
              <strong>{inKitchen}</strong>
              <span>In kitchen</span>
            </div>

            <div className="status-summary-item">
              <strong>{servedCount}</strong>
              <span>Served</span>
            </div>

            <div className="status-summary-item">
              <strong>{rs(totalAmount)}</strong>
              <span>Total</span>
            </div>
          </div>

          
          {orders.map((o) => (
            <div className="status-order-card" key={o.id}>

              <div className="status-order-top">
                <div className="status-order-emoji">{o.emoji}</div>

                <div className="status-order-info">
                  <h4 className="status-order-name">{o.name}</h4>
                  <p className="status-order-small">
                    Order #{o.number} · Table {o.table} · Placed at {o.time}
                  </p>
                  {o.restaurantName && (
                    <p className="status-order-small">{o.restaurantName}</p>
                  )}
                </div>

                <div className="status-order-right">
                  <div className="status-order-price">{rs(o.totalAmount ?? o.price * o.qty)}</div>

                  <span className={"status-pill " + (o.statusLabel === "Served" ? "served" : "")}>
                    {o.statusLabel || STEP_NAMES[o.step]}
                  </span>
                </div>
              </div>

              {o.items.length > 0 && (
                <ul className="status-order-items">
                  {o.items.map((item, index) => {
                    const addOnTotal = (item.addOns || []).reduce((sum, addOn) => sum + addOn.price, 0);
                    const customizations = [
                      ...(item.addOns || []).map((addOn) => `+ ${addOn.name}`),
                      ...(item.removedIngredients || []).map((ingredient) => `No ${ingredient}`),
                      item.drink && `Drink: ${item.drink}`,
                      item.specialInstructions && `Note: ${item.specialInstructions}`,
                    ].filter(Boolean);
                    return (
                      <li key={`${o.id}-${item.name}-${index}`}>
                        <div className="status-order-item-line">
                          <span>{item.name} × {item.quantity}</span>
                          <strong>{rs((item.price + addOnTotal) * item.quantity)}</strong>
                        </div>
                        {customizations.length > 0 && (
                          <p>{customizations.join(" · ")}</p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}

              
              <div className="status-segments">
                {STEP_NAMES.map((name, i) => (
                  <div
                    key={name}
                    className={
                      "status-segment " +
                      (o.statusLabel !== "Cancelled" && (o.step === 3 || i < o.step)
                        ? "done"
                        : o.statusLabel !== "Cancelled" && i === o.step
                        ? "current"
                        : "")
                    }
                  >
                    <div className="status-segment-bar"></div>
                    <p>{name}</p>
                  </div>
                ))}
              </div>

              
              <div className="status-order-bottom">
                <span className="status-order-message">
                  {o.statusLabel === "Cancelled" ? "This order was cancelled." : STEP_MESSAGES[o.step]}
                </span>

                {o.step < 3 && onNextStep && (
                  <button
                    className="status-demo-button"
                    onClick={() => onNextStep(o.id)}
                  >
                    Skip to next step (demo)
                  </button>
                )}
              </div>
            </div>
          ))}

          <div className="status-buttons-row">
            <button className="status-light-button" onClick={() => onNavigate("menu")}>
              + Order more
            </button>

            {servedCount > 0 && (
              <button
                className="status-green-button"
                onClick={onClearServed}
              >
                Clear served orders
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default StatusPage;
