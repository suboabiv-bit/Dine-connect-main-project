import { useState } from "react";
import "./firstpage.css";

// All images in this folder
const imageFiles = import.meta.glob("./*.{png,jpg,jpeg,webp,svg}", {
  eager: true,
  import: "default",
});
const allKeys = Object.keys(imageFiles);

// LOGO: put your logo in this folder with "logo" in the file name (example: logo.png)
const logoKey = allKeys.find((path) => path.toLowerCase().includes("logo"));
const logo = logoKey ? imageFiles[logoKey] : "";

// Picture on the right side.
// It uses an image whose file name contains "home".
// If there is none, it uses the first image that is NOT the logo.
const photoKey =
  allKeys.find((path) => path.toLowerCase().includes("home")) ||
  allKeys.find((path) => path !== logoKey);
const photo = photoKey ? imageFiles[photoKey] : "";

// makes a table number 2 digits (7 becomes 07), or "" if there are no digits
const twoDigits = (value) => {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 2);
  return digits ? digits.padStart(2, "0") : "";
};

function FirstPage({
  table = "01",
  onStart,
  onAdmin,
  onOwnerLogin,
  restaurants = [],
  restaurantsLoading = false,
  restaurantLoadError = "",
  selectedRestaurant = "",
  onSelectRestaurant,
}) {
  // table number from the QR code link (example: ?table=07)
  const urlTable = twoDigits(new URLSearchParams(window.location.search).get("table"));

  const [tableNo, setTableNo] = useState(urlTable || twoDigits(table) || "01");
  const [fromQr, setFromQr] = useState(Boolean(urlTable));
  const [editing, setEditing] = useState(false);
  const [warning, setWarning] = useState("");

  const cleanTable = () => twoDigits(tableNo) || "01";

  const finishEditing = () => {
    setTableNo(cleanTable());
    setEditing(false);
  };

  const startEditing = () => {
    setEditing(true);
    setFromQr(false);
  };

  // START ORDERING
  const handleStart = () => {
    const t = cleanTable();

    if (restaurantsLoading) {
      setWarning("Please wait while restaurants load");
      return;
    }

    if (restaurants.length > 0) {
      if (!selectedRestaurant) {
        setWarning("Please choose a restaurant first");
        return;
      }
      onStart(t, selectedRestaurant);
    } else {
      onStart(t);
    }
  };

  return (
    <div className="home-page">

      {/* ---------- TOP GREEN NAVBAR ---------- */}
      <nav className="home-nav">
        <div className="home-logo">
          {logo ? (
            // logo icon (gold D with fork & spoon) - the name is written next to it
            <img className="home-logo-img" src={logo} alt="DineConnect logo" />
          ) : (
            <span className="home-logo-icon">🍴</span>
          )}
          <b>Dine<span>Connect</span></b>
        </div>

        <div className="home-tagline">
          <span>Scan order and enjoy</span>
        </div>
      </nav>

      {/* ---------- MIDDLE: TEXT ON THE LEFT, PICTURE ON THE RIGHT ---------- */}
      <section className="home-hero">

        {/* LEFT SIDE */}
        <div className="home-left">
          <span className="home-leaf one">🌿</span>
          <span className="home-leaf two">🌿</span>

          <div className="home-chef-row">
            <i></i>
            <span>👨‍🍳</span>
            <i></i>
          </div>

          <h2 className="home-welcome">Welcome to</h2>
          <h1 className="home-brand">Dine<span>Connect</span></h1>

          <div className="home-slogan">
            <i></i>
            <span>Scan. Order. Track. Enjoy.</span>
            <i></i>
          </div>

          {/* TABLE DETECTED BOX */}
          <div className="home-table-box">
            <div className="home-table-check">✓</div>

            <div className="home-table-text">
              <h3>
                Table No.{" "}
                {editing ? (
                  <input
                    className="home-table-input"
                    value={tableNo}
                    maxLength={2}
                    autoFocus
                    onChange={(e) => setTableNo(e.target.value.replace(/\D/g, ""))}
                    onBlur={finishEditing}
                    onKeyDown={(e) => e.key === "Enter" && finishEditing()}
                  />
                ) : (
                  tableNo
                )}{" "}
                {fromQr ? "Detected!" : "Selected!"}
              </h3>
              <p>Welcome to DineConnect 🛎️</p>
            </div>

            <button className="home-table-change" onClick={startEditing}>
              Change
            </button>
          </div>

          {/* CHOOSE RESTAURANT (only shows when the API sends restaurants) */}
          {restaurants.length > 0 && (
            <div className="home-restaurant-box">
              <label>🏪 Choose your restaurant</label>
              <select
                value={selectedRestaurant}
                onChange={(e) => {
                  onSelectRestaurant(e.target.value);
                  setWarning("");
                }}
              >
                <option value="">Select a restaurant</option>
                {restaurants.map((r) => (
                  <option key={r.slug || r.id || r._id} value={r.slug}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {restaurantsLoading && <p className="home-note" role="status">Loading restaurants…</p>}
          {restaurantLoadError && <p className="home-note" role="alert">{restaurantLoadError}</p>}
          {warning && <p className="home-warning">{warning}</p>}

          {/* START ORDERING BUTTON */}
          <button className="home-start-button" onClick={handleStart}>
            🍴 Start Ordering →
          </button>

          {/* ADMIN LOGIN + OWNER SIGN IN */}
          <div className="home-login-row">
            <button className="home-outline-button" onClick={onAdmin}>
              <span>🛡️</span>
              Admin Login
            </button>

            <span className="home-or">or</span>

            <button className="home-outline-button" onClick={onOwnerLogin}>
              <span>🏪</span>
              <div>
                Restaurant Owner<br />
                Sign In / Register
              </div>
            </button>
          </div>
        </div>

        {/* RIGHT SIDE: FOOD PICTURE */}
        <div className="home-right">
          {photo ? (
            <img className="home-photo" src={photo} alt="Delicious food" />
          ) : (
            <div className="home-photo-fallback">🥩🍟🥗</div>
          )}
        </div>
      </section>

      {/* ---------- BOTTOM GREEN BAR ---------- */}
      <footer className="home-bottom">
        <i></i>
        <span>🍴</span>
        <i></i>
      </footer>
    </div>
  );
}

export default FirstPage;