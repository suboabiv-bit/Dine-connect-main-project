
import { useState, useEffect } from "react";

import FirstPage from "./components/FirstPage/firstpage";
import SecondPage from "./components/SecondPage/secondpage";
import MenuPage from "./components/thirdpage/menu.jsx";
import OrderPage from "./components/fourthpage/order";
import StatusPage from "./components/fifthpage/status";
import LoginPage from "./components/sixthpage/login";
import RegistrationPage from "./components/sixthpage/register";
import ManagementPage from "./components/sixthpage/management";
import OwnerDashboard from "./components/sixthpage/ownerDashboard";
import ManagerDashboard from "./components/sixthpage/managerDashboard";
import KitchenDashboard from "./components/sixthpage/kitchenDashboard";
import TenantOrdering from "./components/ordering/ordering";
import { API_BASE_URL } from "./config/api";
import { DEFAULT_ITEMS } from "./components/thirdpage/menu.js";

const ORDER_STORAGE_KEY = "dineconnect_customer_orders";
const ORDER_STEP = {
  "order received": 0,
  pending: 0,
  received: 0,
  preparing: 1,
  ready: 2,
  completed: 3,
  served: 3,
  cancelled: 3,
};

const readStoredOrders = () => {
  try {
    const orders = JSON.parse(localStorage.getItem(ORDER_STORAGE_KEY) || "[]");
    return Array.isArray(orders)
      ? orders.filter((order) => order?.id && order?.restaurantSlug)
      : [];
  } catch {
    return [];
  }
};

const saveOrderReferences = (orders) => {
  const references = orders
    .filter((order) => order.orderId && order.restaurantSlug)
    .map(({ orderId, restaurantSlug }) => ({ id: orderId, restaurantSlug }));
  localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(references));
};

const createOrderPlaceholder = ({ id, restaurantSlug }) => ({
  id,
  orderId: id,
  restaurantSlug,
  number: "…",
  table: "",
  name: "Loading order…",
  items: [],
  qty: 0,
  price: 0,
  totalAmount: 0,
  emoji: "🍽️",
  time: "",
  step: 0,
  statusLabel: "Loading",
});

const normalizeOrder = (order, restaurantSlug, restaurantName = "") => {
  const statusLabel = ({
    Pending: "Order Received",
    Received: "Order Received",
    Preparing: "Preparing",
    Ready: "Ready",
    Completed: "Served",
    Cancelled: "Cancelled",
  })[order.status] || order.status || "Received";
  const items = (order.items || []).map((item) => ({
    name: item.name,
    quantity: item.quantity,
    price: item.price,
    addOns: item.addOns || [],
    removedIngredients: item.removedIngredients || [],
    drink: item.drink || "",
    specialInstructions: item.specialInstructions || "",
  }));
  return {
    id: String(order._id),
    orderId: String(order._id),
    restaurantSlug,
    restaurantName,
    number: order.orderNumber,
    table: order.tableNumber,
    tableNumber: order.tableNumber,
    name: items.map((item) => `${item.name} × ${item.quantity}`).join(", "),
    items,
    qty: items.reduce((sum, item) => sum + item.quantity, 0),
    price: order.totalAmount,
    totalAmount: order.totalAmount,
    emoji: "🍽️",
    time: new Date(order.createdAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    step: ORDER_STEP[statusLabel.toLowerCase()] ?? 0,
    statusLabel,
  };
};

const pageForRole = (role) => ({
  admin: "admin",
  owner: "owner",
  manager: "management",
  kitchen: "kitchen",
  customer: "first",
}[role] ?? "first");

function App() {
  const [page, setPage] = useState(() => readStoredOrders().length ? "status" : "first");

  const [registrationCustomerMode, setRegistrationCustomerMode] = useState(false);
  const [registrationOwnerMode, setRegistrationOwnerMode] = useState(false);

  const [sessionUser, setSessionUser] = useState(null);

  const [table, setTable] = useState("05");

  const [selectedRestaurant, setSelectedRestaurant] = useState("");

  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState(() => readStoredOrders().map(createOrderPlaceholder));
  const [ordersLoading, setOrdersLoading] = useState(() => readStoredOrders().length > 0);
  const [ordersError, setOrdersError] = useState("");
  const [orderError, setOrderError] = useState("");
  const [submittingOrder, setSubmittingOrder] = useState(false);

  const [message, setMessage] = useState("");

  const [menuItems, setMenuItems] = useState(DEFAULT_ITEMS);
  const [menuLoading, setMenuLoading] = useState(false);
  const [menuLoadError, setMenuLoadError] = useState("");
  const trackedOrderKey = JSON.stringify(orders
    .filter((order) => order.orderId && order.restaurantSlug)
    .map(({ orderId, restaurantSlug }) => ({ id: orderId, restaurantSlug })));

  // Restore previous login session
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/auth/me`, {
      credentials: "include"
    })
      .then(async (response) => {
        if (response.status === 401) return null;

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Unable to restore session.");
        }

        return result.user;
      })
      .then((user) => {
        if (!user) return;

        setSessionUser(user);
        if (user.role !== "customer" || !readStoredOrders().length) {
          setPage(pageForRole(user.role));
        }
      })
      .catch(() => {
        setMessage("Could not restore your previous sign-in.");
      });
  }, []);

  useEffect(() => {
    const savedOrders = JSON.parse(trackedOrderKey);
    if (!savedOrders.length) return undefined;
    let active = true;
    const loadOrders = async () => {
      try {
        const results = await Promise.allSettled(savedOrders.map(async (savedOrder) => {
          const response = await fetch(
            `${API_BASE_URL}/api/public/restaurants/${encodeURIComponent(savedOrder.restaurantSlug)}/orders/${encodeURIComponent(savedOrder.id)}`
          );
          const result = await response.json();
          if (!response.ok) throw new Error(result.message || `Unable to load order #${savedOrder.id}.`);
          return normalizeOrder(result.order, savedOrder.restaurantSlug, result.restaurantName || "");
        }));
        if (!active) return;
        const restored = results.map((result) => result.status === "fulfilled"
          ? result.value
          : null);
        const failures = results.filter((result) => result.status === "rejected");
        setOrders((current) => {
          const currentOrders = new Map(current.map((order) => [order.orderId, order]));
          return restored.map((order, index) => order || currentOrders.get(savedOrders[index].id)).filter(Boolean);
        });
        setOrdersError(failures.length
          ? failures[0].reason?.message || `${failures.length} saved order${failures.length === 1 ? "" : "s"} could not be refreshed.`
          : "");
      } catch (error) {
        if (active) setOrdersError(error.message || "Unable to refresh your order status.");
      } finally {
        if (active) {
          setOrdersLoading(false);
        }
      }
    };

    loadOrders();
    const timer = setInterval(loadOrders, 8000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [trackedOrderKey]);

  // Add food to cart
  const addToCart = (item) => {
    setOrderError("");
    setCart((old) => {
      const existingItem = old.find((i) => i.id === item.id);

      if (existingItem) {
        return old.map((i) =>
          i.id === item.id
            ? { ...i, qty: i.qty + 1 }
            : i
        );
      }

      return [...old, { ...item, qty: 1 }];
    });

    setMessage("✓ " + item.name + " added to My Order");
  };

  // Order directly from specials
  const submitOrder = async (items) => {
    setOrderError("");
    if (!items.length) {
      setOrderError("Select menu items before placing your order.");
      return;
    }
    if (!selectedRestaurant) {
      setOrderError("Restaurant ordering is temporarily unavailable. Please try again later.");
      return;
    }
    if (items.some((item) => !item.menuItemId)) {
      setOrderError("The selected menu items are unavailable. Please return to the menu and try again.");
      return;
    }

    setSubmittingOrder(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/public/restaurants/${encodeURIComponent(selectedRestaurant)}/orders`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tableNumber: table,
            items: items.map((item) => ({
              menuItemId: item.menuItemId,
              quantity: item.qty,
              addOns: (item.addOns || []).map((addOn) => (
                typeof addOn === "string" ? addOn : addOn.id
              )),
              removedIngredients: item.removedIngredients || [],
              drink: item.drink || "",
              specialInstructions: item.specialInstructions || "",
            })),
          }),
        }
      );
      if (!response.headers.get("content-type")?.includes("application/json")) {
        throw new Error("The ordering service returned an unexpected response. Please check that it is running and try again.");
      }
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to place your order.");

      const placedOrder = normalizeOrder(
        result.order,
        selectedRestaurant,
        result.restaurantName || ""
      );
      setOrdersError("");
      try {
        saveOrderReferences([...orders, placedOrder]);
      } catch {
        setOrdersError("Order was placed, but its status could not be saved in this browser.");
      }
      setOrders((current) => [placedOrder, ...current.filter((order) => order.orderId !== placedOrder.orderId)]);
      setCart([]);
      setMessage("✓ Your order has been sent to the kitchen!");
      setPage("status");
    } catch (error) {
      setOrderError(error.message || "Unable to connect to the ordering service.");
    } finally {
      setSubmittingOrder(false);
    }
  };

  const orderNow = (item) => {
    addToCart(item);
    setPage("order");
  };

  // Change quantity
  const changeQty = (id, amount) => {
    setCart((old) =>
      old
        .map((item) =>
          item.id === id
            ? { ...item, qty: item.qty + amount }
            : item
        )
        .filter((item) => item.qty > 0)
    );
  };

  // Remove item
  const removeItem = (id) => {
    setCart((old) => old.filter((item) => item.id !== id));
    setMessage("Item removed from My Order");
  };

  // Place order
  const placeOrder = () => {
    if (cart.length === 0) {
      setMessage("Please add items before placing your order");
      return;
    }
    return submitOrder(cart.map((item) => ({
      ...item,
    })));
  };

  // Hide messages after 2 seconds
  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      setMessage("");
    }, 2000);

    return () => clearTimeout(timer);
  }, [message]);

  // Move order status
  const nextStep = (id) => {
    setOrders((old) =>
      old.map((order) =>
        order.id === id && order.step < 3
          ? { ...order, step: order.step + 1 }
          : order
      )
    );
  };

  // Clear served orders
  const clearServed = () => {
    const remainingOrders = orders.filter((order) => order.step < 3 && order.statusLabel !== "Cancelled");
    setOrders(remainingOrders);
    try {
      saveOrderReferences(remainingOrders);
    } catch {
      setOrdersError("Order history could not be updated in this browser.");
    }
  };

  // Update menu
  const updateMenuItem = (id, changes) => {
    setMenuItems((old) =>
      old.map((item) =>
        item.id === id ? { ...item, ...changes } : item
      )
    );
  };

  const deleteMenuItem = (id) => {
    setMenuItems((old) =>
      old.filter((item) => item.id !== id)
    );
  };

  const addMenuItem = (item) => {
    setMenuItems((old) => [...old, item]);
  };

  // Start customer ordering
  const handleStart = (tableNumber) => {
    setTable(tableNumber);
    setOrderError("");
    setSelectedRestaurant("");
    setMenuItems(DEFAULT_ITEMS);
    setMenuLoading(false);
    setMenuLoadError("");
    setPage("menu");
  };

  // Admin access
  const openAdmin = () => {
    setPage(
      sessionUser && sessionUser.role !== "customer"
        ? pageForRole(sessionUser.role)
        : "login"
    );
  };

  // Restaurant Owner Login
  const openOwnerLogin = () => {
    setPage("owner-login");
  };

  // Logout
  const logout = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/auth/logout`,
        {
          method: "POST",
          credentials: "include"
        }
      );

      if (!response.ok) {
        throw new Error("The server could not end the session.");
      }

      setSessionUser(null);
      setPage("first");

    } catch (error) {
      setMessage(error.message || "Unable to sign out.");
    }
  };

  const cartCount = cart.reduce(
    (sum, item) => sum + item.qty,
    0
  );

  let screen;

  // Registration
  if (page === "register") {
    screen = (
      <RegistrationPage
        ownerMode={registrationOwnerMode}
        onSuccess={(user) => {
          setSessionUser(user);
          setPage(pageForRole(user.role));
        }}
        onBack={() =>
          setPage(
            registrationCustomerMode
              ? "customer-login"
              : registrationOwnerMode
              ? "owner-login"
              : "login"
          )
        }
      />
    );
  }

  // Login and dashboards
  else if (
    page === "login" ||
    page === "customer-login" ||
    page === "owner-login" ||
    page === "admin" ||
    page === "owner" ||
    page === "management" ||
    page === "kitchen"
  ) {
    if (sessionUser?.role === "admin") {
      screen = (
        <ManagementPage
          orders={orders}
          menuItems={menuItems}
          onNextStep={nextStep}
          onClearServed={clearServed}
          onUpdateItem={updateMenuItem}
          onDeleteItem={deleteMenuItem}
          onAddItem={addMenuItem}
          onLogout={logout}
        />
      );
    }

    else if (sessionUser?.role === "owner") {
      screen = (
        <OwnerDashboard
          user={sessionUser}
          onLogout={logout}
        />
      );
    }

    else if (sessionUser?.role === "manager") {
      screen = (
        <ManagerDashboard
          user={sessionUser}
          onLogout={logout}
        />
      );
    }

    else if (sessionUser?.role === "kitchen") {
      screen = (
        <KitchenDashboard
          user={sessionUser}
          onLogout={logout}
        />
      );
    }

    else {
      screen = (
        <LoginPage
          onSuccess={(user) => {
            setSessionUser(user);
            setPage(pageForRole(user.role));
          }}
          onBack={() => setPage("first")}
          onCreateAccount={() => {
            setRegistrationCustomerMode(
              page === "customer-login"
            );

            setRegistrationOwnerMode(
              page === "owner-login"
            );

            setPage("register");
          }}
          ownerMode={page === "owner-login"}
          customerMode={page === "customer-login"}
        />
      );
    }
  }

  // Restaurant customer ordering
  else if (page === "tenant-ordering") {
    screen = (
      <TenantOrdering
        restaurantSlug={selectedRestaurant}
        table={table}
        onBack={() => setPage("first")}
      />
    );
  }

  // Order status
  else if (page === "status") {
    screen = (
      <StatusPage
        table={table}
        orders={orders}
        loading={ordersLoading}
        error={ordersError}
        cartCount={cartCount}
        onClearServed={clearServed}
        onNavigate={setPage}
        onBack={() => setPage("second")}
      />
    );
  }

  // My order
  else if (page === "order") {
    screen = (
      <OrderPage
        table={table}
        cart={cart}
        onChangeQty={changeQty}
        onRemove={removeItem}
        onPlaceOrder={placeOrder}
        submitting={submittingOrder}
        error={orderError}
        cartCount={cartCount}
        onNavigate={setPage}
        onBack={() => setPage("second")}
      />
    );
  }

  // Menu
  else if (page === "menu") {
    screen = (
      <MenuPage
        table={table}
        cartCount={cartCount}
        items={menuItems}
        loading={menuLoading}
        error={menuLoadError}
        onAdd={addToCart}
        onNavigate={setPage}
        onBack={() => setPage("first")}
      />
    );
  }

  // Today's specials
  else if (page === "second") {
    screen = (
      <SecondPage
        table={table}
        cartCount={cartCount}
        items={menuItems}
        loading={menuLoading}
        error={menuLoadError}
        orderError={orderError}
        useFallback={!selectedRestaurant}
        onAdd={addToCart}
        onOrderNow={orderNow}
        onBack={() => setPage("first")}
        onNavigate={setPage}
      />
    );
  }

  // First page
  else {
    screen = (
      <FirstPage
        onStart={handleStart}
        onAdmin={openAdmin}
        onOwnerLogin={openOwnerLogin}
      />
    );
  }

  return (
    <>
      {screen}

      {message && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#0f4125",
            color: "white",
            padding: "12px 20px",
            borderRadius: 12,
            fontSize: 14,
            zIndex: 9999,
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
          }}
        >
          {message}
        </div>
      )}
    </>
  );
}

export default App;
