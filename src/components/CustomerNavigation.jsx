const NAV_ITEMS = [
  { label: "Menu", page: "menu" },
  { label: "Today's Specials", page: "second" },
  { label: "My Order", page: "order" },
  { label: "Order Status", page: "status" },
];

function CustomerNavigation({ activePage, table, cartCount, onNavigate, onBack }) {
  return (
    <header className="sp-header">
      <div className="sp-left">
        <button className="sp-back" onClick={onBack} aria-label="Back to home">
          ← Back
        </button>
        
        <span className="sp-chip"> Table {table}</span>
      </div>

      <nav className="sp-nav">
        {NAV_ITEMS.map(({ label, page }) => (
          <button
            key={page}
            className={page === activePage ? "active" : ""}
            onClick={() => onNavigate(page)}
          >
            {page === "order" ? `${label} (${cartCount})` : label}
          </button>
        ))}
      </nav>
    </header>
  );
}

export default CustomerNavigation;