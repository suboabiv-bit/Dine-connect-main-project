
import "../SecondPage/secondpage.css";
import "./order.css";
import CustomerNavigation from "../CustomerNavigation";

const rs = (n) => "Rs. " + n.toLocaleString("en-US");

function OrderPage({
  table,
  cart,
  onChangeQty,
  onRemove,
  onPlaceOrder,
  submitting = false,
  error = "",
  cartCount,
  onNavigate,
  onBack,
}) {
  const itemCount = cart.reduce((sum, i) => sum + i.qty, 0);
  const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const service = Math.round(subtotal * 0.1);
  const total = subtotal + service;

  return (
    <div className="sp-page order-page">

      
      <CustomerNavigation
        activePage="order"
        table={table}
        cartCount={cartCount ?? itemCount}
        onNavigate={onNavigate}
        onBack={onBack}
      />

  
      <header className="order-title-area">
        <p className="order-small-title">REVIEW BEFORE SENDING</p>
        <h1 className="order-title">My Order</h1>
        <p className="order-subtitle">
          Check your items and confirm your order.
        </p>
      </header>

      
      {cart.length === 0 && (
        <div className="order-done-box">
          <div className="order-done-icon">🛒</div>
          <h2>Your order is empty</h2>
          <p>Add something tasty from the menu.</p>

          <button
            className="order-place-button"
            onClick={() => onNavigate("menu")}
          >
            Go to Menu
          </button>
        </div>
      )}

     
      {cart.length > 0 && (
        <div className="order-layout">

          {error && <p role="alert">{error}</p>}
          
          <div className="order-list">
            {cart.map((item) => (
              <div className="order-item" key={item.id}>

                <div className="order-item-emoji">
                  {item.emoji}
                </div>

                <div className="order-item-info">
                  <h4 className="order-item-name">
                    {item.name}
                  </h4>

                  <p className="order-item-price">
                    {rs(item.price)} each
                  </p>
                </div>

                <div className="order-qty-box">
                  <button onClick={() => onChangeQty(item.id, -1)}>
                    −
                  </button>

                  <span>{item.qty}</span>

                  <button onClick={() => onChangeQty(item.id, 1)}>
                    +
                  </button>
                </div>

                <div className="order-item-total">
                  {rs(item.price * item.qty)}
                </div>

                <button
                  className="order-remove-button"
                  onClick={() => onRemove(item.id)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

        
          <div className="order-total-box">
            <h3>Order Summary</h3>

            <div className="order-total-row">
              <span>Items</span>
              <span>{itemCount}</span>
            </div>

            <div className="order-total-row">
              <span>Subtotal</span>
              <span>{rs(subtotal)}</span>
            </div>

            <div className="order-total-row">
              <span>Service charge (10%)</span>
              <span>{rs(service)}</span>
            </div>

            <div className="order-total-row big">
              <span>Total</span>
              <span>{rs(total)}</span>
            </div>

            <button
              className="order-place-button"
              onClick={onPlaceOrder}
              disabled={submitting}
            >
              {submitting ? "Sending order..." : "Place Order"}
            </button>

            <button
              className="order-add-more-button"
              onClick={() => onNavigate("menu")}
            >
              + Add more items
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderPage;
