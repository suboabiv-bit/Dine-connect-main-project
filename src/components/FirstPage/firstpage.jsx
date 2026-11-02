
import { useState } from 'react';
import "./firstpage.css";

// FirstPage component
function FirstPage({
  onStart,
  onAdmin,
  onCustomerLogin
}) {
  // Store the table number. Default value is 01.
  const [tableNumber, setTableNumber] = useState('01');

  // Function runs when Start Ordering button is clicked
  const handleStart = () => {
    const number = Number(tableNumber);

    // Validate the table number
    if (
      tableNumber.trim() !== '' &&
      Number.isInteger(number) &&
      number >= 1
    ) {
      // Format the number and send it to App.jsx
      onStart(String(number).padStart(2, '0'));
    } else {
      alert('Please enter a valid table number.');
    }
  };

  return (
    <div className="welcome-page">
      <main className="welcome-card">

        {/* Brand Section */}
        <div className="brand">
          <div className="brand-icon">D</div>
          <div>
            <h3>DineConnect</h3>
            <span>RESTAURANT QR ORDERING</span>
          </div>
        </div>

        {/* Welcome Heading */}
        <div className="welcome-heading">
          <h1 className="welcome-heading h1">
            Welcome to DineConnect
          </h1>
          <p>SCAN · ORDER · TRACK · ENJOY</p>
        </div>

        {/* Features */}
        <div className="features">
          <span>Contactless QR</span>
          <span>Live Kitchen Updates</span>
          <span>Fast Service</span>
        </div>

        {/* Table Number Section */}
        <div className="table-section">
          <label htmlFor="tableNumber">
            Enter your table number
          </label>

          <div className="table-input">
            <div>
              <input
                id="tableNumber"
                type="number"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                min="1"
                step="1"
                placeholder="Enter table number"
              />
            </div>
          </div>

          <p className="table-note">
            Table No. {tableNumber || '--'} is ready to order
          </p>
        </div>

        {/* Start Ordering Button */}
        <button
          type="button"
          className="start-button"
          onClick={handleStart}
        >
          <span>Start Ordering</span>
          <span className="arrow">➜</span>
        </button>

        <br />

        {/* Admin Button */}
        <button
          type="button"
          onClick={onAdmin}
        >
          🔒 Admin
        </button>

        {/* Restaurant Owner Login Button */}
        <button
          type="button"
          onClick={onCustomerLogin}
        >
          Resturent owner Sign In / Register
        </button>

        {/* Footer */}
        <footer className="chef-message">
          <div className="chef-icon">👨‍🍳</div>
          <div>
            <p>
              “Crafted seasonal ingredients prepared fresh for your table.”
            </p>
            <strong>Executive Chef Abigail & Team</strong>
          </div>
        </footer>

      </main>
    </div>
  );
}

export default FirstPage;