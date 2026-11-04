# DineConnect

DineConnect is a restaurant ordering and management web app. Customers can browse restaurant menus and place orders. Restaurant owners can sign in to a protected dashboard to review sales, manage orders and food items, maintain staff details, and update their restaurant profile.

**Built with:** React, Vite, Express, MongoDB, Mongoose, JWT, and Recharts.

## Requirements

- Node.js 18 or newer
- MongoDB locally or through MongoDB Atlas

## Run locally

1. Install frontend dependencies from the project root:

   ```sh
   npm install
   ```

2. Install backend dependencies:

   ```sh
   npm install --prefix backend
   ```

3. Create `backend/.env` with your own database URL and a strong secret:

   ```env
   MONGO_URI=mongodb://127.0.0.1:27017/dineconnect
   JWT_SECRET=replace-this-with-a-long-random-secret
   PORT=3001
   FRONTEND_ORIGIN=http://localhost:5173
   ```

   Keep this file private; `.env` files are ignored by Git.

4. Start the backend and frontend in separate terminals:

   ```sh
   npm run dev --prefix backend
   ```

   ```sh
   npm run dev
   ```

   Open the Vite URL (usually `http://localhost:5173`). The Vite development server proxies `/api` requests to the backend at `http://localhost:3001`.

5. Select **Restaurant Owner Sign In / Register** on the welcome page and register an owner account with its restaurant name. Registration signs the owner in and opens the dashboard.

For a deployed frontend on a different origin, set `FRONTEND_ORIGIN` to that exact origin and set `VITE_API_BASE_URL` to the backend base URL when building the frontend. The backend uses an HttpOnly JWT cookie; serve the production app over HTTPS.

## Owner dashboard features

- **Dashboard:** Live sales and order summary, daily and monthly charts, best-selling food, and recent orders.
- **Sales:** Switch between daily and monthly revenue. Hover over chart points to see exact LKR values.
- **Orders:** View recent or all orders, inspect order details, and change status.
- **Food items:** Add, edit, and delete menu items; update price, image, category, and availability; review item sales.
- **Staff:** Add, edit, and delete team members grouped by job role.
- **Profile:** Edit owner and restaurant information, upload a profile picture, and view revenue summaries.

Owner endpoints require a valid owner session. Each dashboard query and mutation is scoped to the restaurant assigned to the signed-in owner.

## API routes

- Authentication: `POST /api/auth/register-owner`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- Public restaurant ordering: `GET /api/public/restaurants`, `GET /api/public/restaurants/:slug/menu`, `POST /api/public/restaurants/:slug/orders`
- Owner dashboard: `GET /api/owner/dashboard`
- Owner orders: `GET /api/owner/orders`, `GET /api/owner/orders/:orderId`, `PATCH /api/owner/orders/:orderId/status`
- Owner menu: `GET|POST /api/owner/food-items`, `PATCH|DELETE /api/owner/food-items/:itemId`
- Owner staff: `GET|POST /api/owner/staff`, `PATCH|DELETE /api/owner/staff/:staffId`
- Owner profile: `PATCH /api/owner/profile`

## Security

- Keep `JWT_SECRET` and MongoDB credentials private.
- Use HTTPS in production; production cookies are marked `Secure`.
- Configure `FRONTEND_ORIGIN` to the frontend origin when frontend and backend are hosted separately.
