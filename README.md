# DineConnect

DineConnect is a restaurant ordering and management web application. Customers can browse a sample menu and build an order. Separate, role-protected dashboards let restaurant owners, managers, kitchen staff, and administrators manage restaurant operations.

## Features

- Customer-facing sample menu with categories, item details, a cart, and order review.
- Restaurant owner dashboard for sales, orders, menu items, staff, and restaurant profile.
- Separate management and kitchen interfaces with role-based access.
- Express API with MongoDB persistence for accounts, restaurants, menus, and orders.
- Responsive React interface for desktop and mobile layouts.

> **Demo menu:** The customer menu currently uses sample items bundled with the frontend. It does not identify a restaurant, so it cannot submit those sample items as a real backend order. Restaurant-scoped order creation requires a restaurant and menu items configured in the backend.

## Technology

- Frontend: React 19, Vite 5
- Backend: Node.js, Express 5
- Database: MongoDB with Mongoose
- Authentication: JWT in an HttpOnly cookie
- Charts: Recharts

## Requirements

- Node.js 18 or newer
- npm
- MongoDB locally or a MongoDB Atlas connection string

## Run locally

Run these commands from the repository root.

1. Install frontend dependencies:

   ```sh
   npm install
   ```

2. Install backend dependencies:

   ```sh
   npm install --prefix backend
   ```

3. Create `backend/.env`:

   ```env
   MONGO_URI=mongodb://127.0.0.1:27017/dineconnect
   JWT_SECRET=replace-with-a-long-random-secret
   PORT=5000
   FRONTEND_ORIGIN=http://localhost:5173
   ```

   The frontend uses `http://localhost:5000` as its default API URL. Set `PORT=5000` so the backend and frontend defaults match. Keep `.env` private; it is ignored by Git.

4. Optionally configure a bootstrap administrator in `backend/.env`:

   ```env
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=replace-with-a-strong-password
   ADMIN_EMAIL=admin@example.com
   ADMIN_NAME=DineConnect Administrator
   ```

   `ADMIN_USERNAME` and `ADMIN_PASSWORD` must both be set to create an administrator. The password must contain at least eight characters. Omit these variables to skip administrator provisioning.

5. Start the backend and frontend in separate terminals:

   ```sh
   npm run dev --prefix backend
   ```

   ```sh
   npm run dev
   ```

6. Open [http://localhost:5173](http://localhost:5173). The backend health endpoint is [http://localhost:5000](http://localhost:5000).

To use a different backend URL, set `VITE_API_URL` in the frontend environment, for example:

```env
VITE_API_URL=http://localhost:5000
```

For production, set `FRONTEND_ORIGIN` to the exact frontend origin and `VITE_API_URL` to the backend base URL before building:

```sh
npm run build
```

Serve the production frontend over HTTPS. Production authentication cookies are marked `Secure`.

## User roles

- **Customer:** Can explore the sample menu and prepare an order for review without an administrator or owner login. Real order submission requires a configured restaurant-specific menu.
- **Owner:** Registers through **Restaurant Owner Sign In / Register** and manages their assigned restaurant.
- **Manager:** Uses the manager dashboard and permissions for their restaurant.
- **Kitchen:** Uses the kitchen dashboard to view and update restaurant orders.
- **Administrator:** Uses the separate Admin Login. An account can be provisioned with the optional `ADMIN_*` environment variables above.

Owner, manager, and kitchen access is scoped to the restaurant assigned to the signed-in user. Do not share administrator or owner credentials with customers.

## API overview

All API routes are served by the backend.

| Area | Route examples |
| --- | --- |
| Authentication | `POST /api/auth/register-owner`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` |
| Public restaurants and orders | `GET /api/public/restaurants`, `GET /api/public/restaurants/:slug/menu`, `POST /api/public/restaurants/:slug/orders`, `GET /api/public/restaurants/:slug/orders/:orderId` |
| Owner dashboard | `GET /api/owner/dashboard` |
| Owner orders | `GET /api/owner/orders`, `GET /api/owner/orders/:orderId`, `PATCH /api/owner/orders/:orderId/status` |
| Owner menu | `GET|POST /api/owner/food-items`, `PATCH|DELETE /api/owner/food-items/:itemId` |
| Owner staff and profile | `/api/owner/staff`, `PATCH /api/owner/profile` |
| Kitchen, manager, and admin | `/api/kitchen`, `/api/manager`, `/api/orders` |

Protected routes require an authenticated user with the appropriate role. See `backend/routes/` for the complete route definitions.

## Project layout

```text
src/                  React application and customer/admin/owner interfaces
src/components/       Reusable pages and dashboard components
backend/config/       Database and administrator setup
backend/controllers/  Backend business logic
backend/models/       Mongoose data models
backend/routes/       Express API routes
```

## Available scripts

From the project root:

```sh
npm run dev       # Start the Vite development server
npm run build     # Build the frontend for production
npm run preview   # Preview the production build
npm run lint      # Run Oxlint
```

From `backend/`:

```sh
npm run dev       # Start/restart the API during development
npm start         # Start the API
```

## Security notes

- Never commit `.env` files, database credentials, or JWT secrets.
- Use a unique, long `JWT_SECRET` and a strong administrator password.
- Use HTTPS in production and configure CORS with the exact frontend origin.
- Protect administrator and owner accounts; their permissions can manage restaurant data.
