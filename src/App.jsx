import { useState, useEffect, useRef } from "react";

import FirstPage from "./components/FirstPage/firstpage";
import SecondPage from "./components/SecondPage/secondpage";
import MenuPage from "./components/thirdpage/menu.jsx";
import { DEFAULT_ITEMS } from "./components/thirdpage/menu.js";
import OrderPage from "./components/fourthpage/order";
import StatusPage from "./components/fifthpage/status";
import LoginPage from "./components/sixthpage/login";
import RegistrationPage from "./components/sixthpage/register";
import ManagementPage from "./components/sixthpage/management";
import OwnerDashboard from "./components/sixthpage/ownerDashboard";
import ManagerDashboard from "./components/sixthpage/managerDashboard";
import KitchenDashboard from "./components/sixthpage/kitchenDashboard";
import TenantOrdering from "./components/ordering/ordering";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

const pageForRole = (role) => ({
  admin: "admin",
  owner: "owner",
  manager: "management",
  kitchen: "kitchen",
  customer: "first",
}[role] ?? "first");

function App() {
  const [page, setPage] = useState("first");
  const [registrationCustomerMode, setRegistrationCustomerMode] = useState(false);
  const [registrationOwnerMode, setRegistrationOwnerMode] = useState(false);
  const [sessionUser, setSessionUser] = useState(null);
  const [table, setTable] = useState("05");
  const [restaurants, setRestaurants] = useState([]);
  const [restaurantLoadError, setRestaurantLoadError] = useState("");
  const [selectedRestaurant, setSelectedRestaurant] = useState("");

  // dishes in My Order (not sent yet)
  const [cart, setCart] = useState([]);

  // dishes sent to the kitchen
  const [orders, setOrders] = useState([]);

  // small green message
  const [message, setMessage] = useState("");
  const nextOrderNumber = useRef(1001);

  // Static fallback menu for the demo flow; restaurant menus use the backend.
  const [menuItems, setMenuItems] = useState(DEFAULT_ITEMS);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/auth/me`, { credentials: "include" })
      .then(async (response) => {
        if (response.status === 401) return null;
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Unable to restore the session.");
        return result.user;
      })
      .then((user) => {
        if (!user) return;
        setSessionUser(user);
        setPage(pageForRole(user.role));
      })
      .catch(() => setMessage("Could not restore your previous sign-in. Please sign in again."));
  }, []);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/public/restaurants`, { credentials: "include" })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Unable to load restaurants.");
        return result.restaurants;
      })
      .then((list) => {
        setRestaurants(list);
        setRestaurantLoadError("");
      })
      .catch(() => setRestaurantLoadError(
        "Restaurant selection is unavailable. Check the API and MongoDB connection."
      ));
  }, []);

  const nowTime = () =>
    new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  // ADD BUTTONS: put the dish in My Order
  const addToCart = (item) => {
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

  // ORDER NOW BUTTON (Today's Specials): send this dish straight to Order Status
  const orderNow = (item) => {
    setOrders((old) => [
      {
        id: Date.now(),
        number: nextOrderNumber.current++,
        name: item.name,
        price: item.price,
        qty: 1,
        emoji: item.emoji,
        table: table,
        time: nowTime(),
        step: 0, // 0 = received, 1 = preparing, 2 = ready, 3 = served
      },
      ...old,
    ]);

    setMessage("✓ " + item.name + " sent to the kitchen!");
    setPage("status");
  };

  // + / - buttons
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

  const removeItem = (id) => {
    setCart((old) => old.filter((item) => item.id !== id));
    setMessage("Item removed from My Order");
  };

  // PLACE ORDER (My Order page): every dish becomes its own card in Order Status
  const placeOrder = () => {
    if (cart.length === 0) {
      setMessage("Please add items before placing your order");
      return;
    }

    const time = nowTime();

    const newOrders = cart.map((item, index) => ({
      id: Date.now() + index,
      number: nextOrderNumber.current++,
      name: item.name,
      price: item.price, // price of ONE dish
      qty: item.qty,
      emoji: item.emoji,
      table: table,
      time: time,
      step: 0,
    }));

    setOrders((old) => [...newOrders, ...old]);

    setCart([]);

    setMessage("✓ Your order has been sent to the kitchen!");

    setPage("status");
  };

  // hide the green message after 2 seconds
  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      setMessage("");
    }, 2000);

    return () => clearTimeout(timer);
  }, [message]);

  // every order moves one step forward every 10 seconds (demo).
  // Delete this whole block if you want ONLY the manager to move orders.
  useEffect(() => {
    const timer = setInterval(() => {
      setOrders((old) =>
        old.map((order) =>
          order.step < 3
            ? { ...order, step: order.step + 1 }
            : order
        )
      );
    }, 10000);

    return () => clearInterval(timer);
  }, []);

  // push ONE order to its next step (demo button + manager button)
  const nextStep = (id) => {
    setOrders((old) =>
      old.map((order) =>
        order.id === id && order.step < 3
          ? { ...order, step: order.step + 1 }
          : order
      )
    );
  };

  // remove finished (served) orders
  const clearServed = () => {
    setOrders((old) =>
      old.filter((order) => order.step < 3)
    );
  };

  const updateMenuItem = (id, changes) => {
    setMenuItems((old) =>
      old.map((item) => item.id === id ? { ...item, ...changes } : item)
    );
  };

  const deleteMenuItem = (id) => {
    setMenuItems((old) => old.filter((item) => item.id !== id));
  };

  const addMenuItem = (item) => {
    setMenuItems((old) => [...old, item]);
  };

  const handleStart = (tableNumber, restaurantSlug) => {
    setTable(tableNumber);
    if (restaurantSlug) {
      setSelectedRestaurant(restaurantSlug);
      setPage("tenant-ordering");
      return;
    }
    setPage("second");
  };

  // The backend verifies the role and redirects each authenticated account to its own dashboard.
  const openAdmin = () => {
    setPage(sessionUser && sessionUser.role !== "customer" ? pageForRole(sessionUser.role) : "login");
  };

  const openCustomerAccount = () => {
    setPage("owner-login");
  };

  const logout = async () => {
    if (sessionUser?.role === "admin") {
      setSessionUser(null);
      setPage("first");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/logout`, { method: "POST", credentials: "include" });
      if (!response.ok) throw new Error("The server could not end the session.");
      setSessionUser(null);
      setPage("first");
    } catch (error) {
      setMessage(error.message || "Unable to sign out. Please try again.");
    }
  };

  const cartCount = cart.reduce(
    (sum, item) => sum + item.qty,
    0
  );

  let screen;

  if (page === "register") {
    screen = (
      <RegistrationPage
        ownerMode={registrationOwnerMode}
        onSuccess={(user) => {
          setSessionUser(user);
          setPage(pageForRole(user.role));
        }}
        onBack={() => setPage(registrationCustomerMode ? "customer-login" : registrationOwnerMode ? "owner-login" : "login")}
      />
    );
  }

  else if (page === "login" || page === "customer-login" || page === "owner-login" || page === "admin" || page === "owner" || page === "management" || page === "kitchen") {
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
    } else if (sessionUser?.role === "owner") {
      screen = <OwnerDashboard user={sessionUser} onLogout={logout} />;
    } else if (sessionUser?.role === "manager") {
      screen = <ManagerDashboard user={sessionUser} onLogout={logout} />;
    } else if (sessionUser?.role === "kitchen") {
      screen = <KitchenDashboard user={sessionUser} onLogout={logout} />;
    } else {
      screen = (
        <LoginPage
          onSuccess={(user) => {
            setSessionUser(user);
            setPage(pageForRole(user.role));
          }}
          onBack={() => setPage("first")}
          onCreateAccount={() => {
            setRegistrationCustomerMode(page === "customer-login");
            setRegistrationOwnerMode(page === "owner-login");
            setPage("register");
          }}
          ownerMode={page === "owner-login"}
          customerMode={page === "customer-login"}
        />
      );
    }
  }

  else if (page === "tenant-ordering") {
    screen = (
      <TenantOrdering
        restaurantSlug={selectedRestaurant}
        table={table}
        onBack={() => setPage("first")}
      />
    );
  }

  else if (page === "status") {
    screen = (
      <StatusPage
        table={table}
        orders={orders}
        cartCount={cartCount}
        onNextStep={nextStep}
        onClearServed={clearServed}
        onNavigate={setPage}
        onBack={() => setPage("first")}
      />
    );
  }

  else if (page === "order") {
    screen = (
      <OrderPage
        table={table}
        cart={cart}
        onChangeQty={changeQty}
        onRemove={removeItem}
        onPlaceOrder={placeOrder}
        cartCount={cartCount}
        onNavigate={setPage}
        onBack={() => setPage("first")}
      />
    );
  }

  else if (page === "menu") {
    screen = (
      <MenuPage
        table={table}
        cartCount={cartCount}
        items={menuItems}
        onAdd={addToCart}
        onNavigate={setPage}
        onBack={() => setPage("first")}
      />
    );
  }

  else if (page === "second") {
    screen = (
      <SecondPage
        table={table}
        cartCount={cartCount}
        onAdd={addToCart}
        onOrderNow={orderNow}
        onBack={() => setPage("first")}
        onNavigate={setPage}
      />
    );
  }

  else {
    screen = (
      <FirstPage
        onStart={handleStart}
        onAdmin={openAdmin}
        onCustomerLogin={openCustomerAccount}
        restaurants={restaurants}
        restaurantLoadError={restaurantLoadError}
        selectedRestaurant={selectedRestaurant}
        onSelectRestaurant={setSelectedRestaurant}
      />
    );
  }

  return (
    <>
      {screen}

      {/* SMALL GREEN MESSAGE AT THE BOTTOM */}
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