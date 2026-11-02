# DineConnect

DineConnect is a React + Vite restaurant ordering frontend with an Express and MongoDB API for customer accounts, restaurant tenants, staff authentication, restaurant menus, and orders.

## Requirements

- Node.js 18 or newer
- MongoDB (local or hosted)

## Local setup

1. Install frontend packages from the project root:

   ```sh
   npm install
   ```

2. Configure the backend environment:

   ```sh
   cp src/backend/.env.example src/backend/.env
   ```

   Set `MONGODB_URI` to your MongoDB connection string and replace `JWT_SECRET` with a random value of at least 32 characters. Set a unique `OWNER_PASSWORD` with at least 12 characters. The Owner credentials are used only by the setup script; they are not checked into source control.

3. Install backend packages:

   ```sh
   npm install --prefix src/backend
   ```

4. Create the first Owner account once:

   ```sh
   npm --prefix src/backend run seed:owner
   ```

   The seed script refuses to create another Owner if one already exists.

5. Start the API and frontend in separate terminals:

   ```sh
   npm --prefix src/backend run dev
   npm run dev
   ```

   Vite proxies `/api` requests to `http://localhost:3001`.

## Accounts and access

- Public `/api/auth/register` creates **customer** accounts only. It never accepts a role or restaurant ID from the client.
- Only a signed-in Owner can create restaurants or Manager/Kitchen accounts.
- Creating a restaurant also creates its first Manager account from the username and temporary password entered in the Owner Dashboard.
- Manager and Kitchen API scope is taken from the authenticated account's database `restaurantId`, never from request parameters or request bodies.
- Managers can add and edit menu image URLs; available menu images are displayed in that restaurant's customer ordering page.
- Owner API responses contain platform restaurant metadata and staff account metadata. They do not return restaurant orders, customer details, sales, or reports.
- Login sessions are signed JWTs stored in an HttpOnly, SameSite=Strict cookie. The browser does not store bearer tokens in localStorage.
- Restaurant menus and orders are stored with a restaurant ID. Public menu lookup and customer order placement use an active restaurant's public slug. Kitchen order responses omit customer details and sales fields.

The existing customer ordering pages remain available as the original demo flow. When active restaurants exist, a customer may choose one on the welcome page; this enters the tenant-scoped MongoDB menu and order flow. Demo ordering pages remain available when no restaurant is selected.

## API outline

- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- Owner: `/api/owner/overview`, `/api/owner/restaurants`, `/api/owner/restaurants/:restaurantId/staff`
- Owner support and platform settings: `/api/owner/support`, `/api/owner/settings`
- Manager: `/api/manager/restaurant`, `/api/manager/menu`, `/api/manager/orders`
- Kitchen: `/api/kitchen/orders`, `/api/kitchen/orders/:orderId/status`
- Manager/Kitchen support tickets: `POST /api/support`
- Public tenant ordering: `/api/public/restaurants`, `/api/public/restaurants/:slug/menu`, `/api/public/restaurants/:slug/orders`

## Security notes

Use HTTPS in production and set `NODE_ENV=production` so session cookies are marked Secure. Keep `.env` files private. Public registration is customer-only; there is no public Owner, Manager, Kitchen, or restaurant-registration endpoint.
