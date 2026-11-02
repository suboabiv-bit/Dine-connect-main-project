
import { useState } from "react";
import "./management.css";

function OwnerDashboard({ user, onLogout }) {
  const [tab, setTab] = useState("restaurants");

  const [restaurants, setRestaurants] = useState([
    {
      id: 1,
      name: "DineConnect Restaurant",
      address: "Kandy, Sri Lanka",
      contactEmail: "restaurant@gmail.com",
      contactNumber: "0771234567",
      plan: "Starter",
      status: "Active",
    },
    {
      id: 2,
      name: "Food Corner",
      address: "Colombo, Sri Lanka",
      contactEmail: "foodcorner@gmail.com",
      contactNumber: "0711234567",
      plan: "Growth",
      status: "Active",
    },
  ]);

  const [staff] = useState([
    {
      id: 1,
      name: "Demo Manager",
      username: "manager01",
      role: "Manager",
    },
    {
      id: 2,
      name: "Demo Kitchen",
      username: "kitchen01",
      role: "Kitchen",
    },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState("");

  const [form, setForm] = useState({
    name: "",
    address: "",
    contactEmail: "",
    contactNumber: "",
  });

  const addRestaurant = (event) => {
    event.preventDefault();

    const newRestaurant = {
      id: Date.now(),
      ...form,
      plan: "Starter",
      status: "Active",
    };

    setRestaurants((old) => [...old, newRestaurant]);

    setForm({
      name: "",
      address: "",
      contactEmail: "",
      contactNumber: "",
    });

    setShowForm(false);
    setNotice("Restaurant added successfully!");
  };

  const changeStatus = (id) => {
    setRestaurants((old) =>
      old.map((restaurant) =>
        restaurant.id === id
          ? {
              ...restaurant,
              status:
                restaurant.status === "Active"
                  ? "Inactive"
                  : "Active",
            }
          : restaurant
      )
    );
  };

  const activeCount = restaurants.filter(
    (item) => item.status === "Active"
  ).length;

  const inactiveCount = restaurants.length - activeCount;

  return (
    <div className="mg-page">

      <nav className="mg-navbar">
        <div className="mg-logo">
          🍴 DineConnect · Platform Owner
        </div>

        <div className="mg-navbar-actions">
          <span>{user?.fullName || "Demo Admin"}</span>

          <button
            className="mg-logout-button"
            onClick={onLogout}
          >
            Logout
          </button>
        </div>
      </nav>

      <header className="mg-title-area">
        <p className="mg-small-title">
          Platform administration
        </p>

        <h1 className="mg-title">
          Owner Dashboard
        </h1>

        <p>Welcome to DineConnect Platform Management.</p>
      </header>

      <div className="mg-tabs">
        {[
          ["restaurants", "Restaurant Management"],
          ["staff", "Staff Accounts"],
          ["subscriptions", "Subscriptions"],
          ["settings", "Platform Settings"],
          ["support", "Support Management"],
        ].map(([value, label]) => (
          <button
            key={value}
            className={tab === value ? "active" : ""}
            onClick={() => {
              setTab(value);
              setNotice("");
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <main className="mg-content">

        {notice && (
          <p className="mg-account-success">
            {notice}
          </p>
        )}

        {tab === "restaurants" && (
          <>
            <div className="mg-count-row">

              <div className="mg-count-box">
                <strong>{restaurants.length}</strong>
                <span>Total Restaurants</span>
              </div>

              <div className="mg-count-box">
                <strong>{activeCount}</strong>
                <span>Active Restaurants</span>
              </div>

              <div className="mg-count-box">
                <strong>{inactiveCount}</strong>
                <span>Inactive Restaurants</span>
              </div>

              <div className="mg-count-box">
                <strong>0</strong>
                <span>Suspended</span>
              </div>

            </div>

            <button
              className="mg-green-button"
              onClick={() => setShowForm(!showForm)}
            >
              + Add New Restaurant
            </button>

            {showForm && (
              <div className="mg-box">
                <h3>Add a New Restaurant</h3>

                <form
                  className="mg-form-grid"
                  onSubmit={addRestaurant}
                >
                  <input
                    placeholder="Restaurant name"
                    value={form.name}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        name: e.target.value,
                      })
                    }
                    required
                  />

                  <input
                    placeholder="Restaurant address"
                    value={form.address}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        address: e.target.value,
                      })
                    }
                    required
                  />

                  <input
                    type="email"
                    placeholder="Contact email"
                    value={form.contactEmail}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        contactEmail: e.target.value,
                      })
                    }
                    required
                  />

                  <input
                    placeholder="Contact number"
                    value={form.contactNumber}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        contactNumber: e.target.value,
                      })
                    }
                    required
                  />

                  <button
                    className="mg-green-button"
                    type="submit"
                  >
                    Save Restaurant
                  </button>

                  <button
                    className="mg-light-button"
                    type="button"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </button>
                </form>
              </div>
            )}

            <div className="mg-box">
              <h3>Restaurant Accounts</h3>

              <div className="mg-table-scroll">
                <table className="mg-table">
                  <thead>
                    <tr>
                      <th>Restaurant</th>
                      <th>Address</th>
                      <th>Email</th>
                      <th>Contact</th>
                      <th>Plan</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {restaurants.map((restaurant) => (
                      <tr key={restaurant.id}>
                        <td>{restaurant.name}</td>
                        <td>{restaurant.address}</td>
                        <td>{restaurant.contactEmail}</td>
                        <td>{restaurant.contactNumber}</td>
                        <td>{restaurant.plan}</td>
                        <td>{restaurant.status}</td>

                        <td>
                          <button
                            className="mg-light-button small"
                            onClick={() =>
                              changeStatus(restaurant.id)
                            }
                          >
                            {restaurant.status === "Active"
                              ? "Deactivate"
                              : "Activate"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {tab === "staff" && (
          <div className="mg-box">
            <h3>Staff Accounts</h3>

            {staff.map((member) => (
              <div
                className="mg-order-card"
                key={member.id}
              >
                <div className="mg-order-info">
                  <h4>{member.name}</h4>
                  <p>@{member.username}</p>
                </div>

                <span className="mg-pill step2">
                  {member.role}
                </span>
              </div>
            ))}
          </div>
        )}

        {tab === "subscriptions" && (
          <div className="mg-box">
            <h3>Subscription Plans</h3>

            <div className="mg-count-row">
              <div className="mg-count-box">
                <strong>Starter</strong>
                <span>Basic restaurant features</span>
              </div>

              <div className="mg-count-box">
                <strong>Growth</strong>
                <span>Advanced restaurant features</span>
              </div>

              <div className="mg-count-box">
                <strong>Enterprise</strong>
                <span>Complete platform features</span>
              </div>
            </div>

            <p className="mg-muted">
              Manage restaurant subscription plans.
            </p>
          </div>
        )}

        {tab === "settings" && (
          <div className="mg-box">
            <h3>Platform Settings</h3>

            <p>Platform Name: DineConnect</p>
            <p>Platform Status: Active</p>
            <p>Customer Registration: Enabled</p>
            <p>Support: Available</p>
          </div>
        )}

        {tab === "support" && (
          <div className="mg-box">
            <h3>Support Management</h3>

            <p>
              Welcome to DineConnect Support Management.
            </p>

            <p className="mg-muted">
              There are currently no support requests.
            </p>
          </div>
        )}

      </main>
    </div>
  );
}

export default OwnerDashboard;
