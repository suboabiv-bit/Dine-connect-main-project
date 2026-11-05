
import { useEffect, useState } from "react";
import "./ordering.css";
import { API_BASE_URL } from "../../config/api";

const ORDER_STORAGE_KEY = "dineconnect_customer_orders";

const readTrackedOrderId = (restaurantSlug) => {
  try {
    const orders = JSON.parse(localStorage.getItem(ORDER_STORAGE_KEY) || "[]");
    return Array.isArray(orders)
      ? orders.find((order) => order?.restaurantSlug === restaurantSlug)?.id || ""
      : "";
  } catch {
    return "";
  }
};

function TenantOrdering({ restaurantSlug, table, onBack }) {
  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [failedImages, setFailedImages] = useState({});
  const [loading, setLoading] = useState(true);
  const [trackedOrderId, setTrackedOrderId] = useState(() => readTrackedOrderId(restaurantSlug));
  const [statusError, setStatusError] = useState("");

  useEffect(() => {
    let active = true;

    fetch(`${API_BASE_URL}/api/public/restaurants/${encodeURIComponent(restaurantSlug)}/menu`)
      .then(async (response) => {
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Unable to load restaurant menu.");
        }

        return result;
      })
      .then((result) => {
        if (!active) return;
        setRestaurant(result.restaurant);
        setMenu(result.menu);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [restaurantSlug]);

  useEffect(() => {
    if (!trackedOrderId || !restaurantSlug) return undefined;
    let active = true;
    const refreshStatus = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/public/restaurants/${encodeURIComponent(restaurantSlug)}/orders/${encodeURIComponent(trackedOrderId)}`
        );
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Unable to load order status.");
        if (active) {
          setReceipt(result.order);
          setStatusError("");
        }
      } catch (error) {
        if (active) setStatusError(error.message || "Unable to refresh order status.");
      }
    };

    refreshStatus();
    const timer = setInterval(refreshStatus, 8000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [restaurantSlug, trackedOrderId]);

  const addItem = (menuItem) => {
    setCart((current) => {
      const existing = current.find(
        (item) => item.menuItemId === menuItem._id
      );

      if (existing) {
        return current.map((item) =>
          item.menuItemId === menuItem._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...current,
        {
          menuItemId: menuItem._id,
          name: menuItem.name,
          unitPrice: menuItem.price,
          quantity: 1,
        },
      ];
    });

    setReceipt(null);
  };

  const changeQuantity = (menuItemId, quantity) => {
    setCart((current) =>
      current
        .map((item) =>
          item.menuItemId === menuItemId
            ? { ...item, quantity }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const placeOrder = async () => {
    if (cart.length === 0) return;

    setError("");
    setSubmitting(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/public/restaurants/${encodeURIComponent(restaurantSlug)}/orders`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tableNumber: table,
            items: cart.map(({ menuItemId, quantity }) => ({
              menuItemId,
              quantity,
            })),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to place this order.");
      }

      setReceipt(result.order);
      setTrackedOrderId(String(result.order._id));
      try {
        const savedOrders = JSON.parse(localStorage.getItem(ORDER_STORAGE_KEY) || "[]");
        const currentOrders = Array.isArray(savedOrders) ? savedOrders : [];
        localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify([
          ...currentOrders.filter((order) => order?.id !== String(result.order._id)),
          { id: String(result.order._id), restaurantSlug },
        ]));
      } catch {
        setStatusError("Order was placed, but its status could not be saved in this browser.");
      }
      setCart([]);
    } catch (orderError) {
      setError(orderError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="tenant-ordering-page">
      <header className="tenant-ordering-header">
        <button type="button" onClick={onBack}>
          ← Back
        </button>

        <button type="button" onClick={onBack}>
          Change restaurant
        </button>

        <h1>{restaurant?.name ?? "Restaurant menu"}</h1>

        <p>Ordering for Table {table}</p>
      </header>

      {error && (
        <p className="tenant-order-error" role="alert">
          {error}
        </p>
      )}
      {statusError && <p className="tenant-order-error" role="alert">{statusError}</p>}
      {loading && <p role="status">Loading menu…</p>}

      {receipt && (
        <div className="tenant-order-success" role="status">
          Order #{receipt.orderNumber} received.
          Current status: {receipt.status}.
        </div>
      )}

      {!loading && !error && menu.length === 0 && (
        <div className="tenant-menu-item">
          <p>No menu items are available right now.</p>
        </div>
      )}

      {!loading && menu.map((item) => (
        <article className="tenant-menu-item" key={item._id}>
          {item.image && !failedImages[item._id] ? (
            <img
              className="tenant-menu-image"
              src={item.image}
              alt={item.name}
              onError={() =>
                setFailedImages((current) => ({
                  ...current,
                  [item._id]: true,
                }))
              }
            />
          ) : (
            <div className="tenant-menu-image tenant-menu-image-placeholder">
              🍽️
            </div>
          )}

          <div>
            <small>{item.category}</small>
            <h3>{item.name}</h3>
            <p>{item.description}</p>
            <strong>
              Rs. {item.price.toLocaleString("en-US")}
            </strong>
          </div>

          <button type="button" onClick={() => addItem(item)}>
            + Add to Order
          </button>
        </article>
      ))}

      {cart.length > 0 && (
        <section className="tenant-cart">
          <h2>My Order</h2>

          {cart.map((item) => (
            <div className="tenant-cart-row" key={item.menuItemId}>
              <span>
                {item.name} · Rs. {item.unitPrice.toLocaleString("en-US")}
              </span>

              <span>
                <button
                  type="button"
                  onClick={() =>
                    changeQuantity(item.menuItemId, item.quantity - 1)
                  }
                >
                  −
                </button>

                {" "}{item.quantity}{" "}

                <button
                  type="button"
                  onClick={() =>
                    changeQuantity(item.menuItemId, item.quantity + 1)
                  }
                >
                  +
                </button>
              </span>
            </div>
          ))}

          <p>
            Total: Rs.{" "}
            {cart
              .reduce(
                (sum, item) =>
                  sum + item.unitPrice * item.quantity,
                0
              )
              .toLocaleString("en-US")}
          </p>

          <button
            type="button"
            onClick={placeOrder}
            disabled={submitting}
          >
            {submitting ? "Sending order..." : "Place Order"}
          </button>
        </section>
      )}
    </main>
  );
}

export default TenantOrdering;
