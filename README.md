# DineConnect

DineConnect is a restaurant ordering web app. Customers pick a restaurant, look at the menu, place an order, and watch the order status. Restaurant staff use separate logins to manage the menu and the kitchen.

**Built with:** React + Vite (frontend), Express (backend), MongoDB (database)

## What you need first

- Node.js 18 or newer
- MongoDB (on your computer or online, for example MongoDB Atlas)

## How to run the project

1. Install the frontend packages (in the project root folder):

   ```sh
   npm install
   ```

2. Create your backend settings file:

   ```sh
   cp src/backend/.env.example src/backend/.env
   ```

   Then open `src/backend/.env` and change these values:
   - `MONGODB_URI`: your MongoDB connection link
   - `JWT_SECRET`: a long random text (at least 32 characters)
   - `OWNER_PASSWORD`: a strong password (at least 12 characters)

   Never upload the `.env` file to GitHub. It contains secrets.

3. Install the backend packages:

   ```sh
   npm install --prefix src/backend
   ```

4. Create the first Owner account (do this only once):

   ```sh
   npm --prefix src/backend run seed:owner
   ```

5. Start the backend and the frontend. Use two separate terminals:

   ```sh
   npm --prefix src/backend run dev
   ```

   ```sh
   npm run dev
   ```

   The frontend sends `/api` requests to the backend at `http://localhost:3001`.

## Who can do what

| Role | What they can do |
|------|------------------|
| Customer | Sign up, choose a restaurant, order food, see order status |
| Kitchen | See incoming orders and change their status |
| Manager | Edit the menu and menu images, see the restaurant's orders |
| Owner | Create restaurants and Manager/Kitchen accounts |

Important rules:
- Public sign-up creates **customer** accounts only.
- Only a signed-in Owner can create restaurants and staff accounts.
- Staff can only see data from their own restaurant.
- The Owner cannot see customer details, orders, or sales.
- Login uses a secure cookie (HttpOnly), not localStorage.

The original demo ordering pages still work when no restaurant is selected.

## API list

- Login: `POST /api/auth/register`, `/login`, `/logout`, `GET /api/auth/me`
- Owner: `/api/owner/overview`, `/api/owner/restaurants`, `/api/owner/restaurants/:restaurantId/staff`, `/api/owner/support`, `/api/owner/settings`
- Manager: `/api/manager/restaurant`, `/api/manager/menu`, `/api/manager/orders`
- Kitchen: `/api/kitchen/orders`, `/api/kitchen/orders/:orderId/status`
- Support tickets: `POST /api/support`
- Customers: `/api/public/restaurants`, `/api/public/restaurants/:slug/menu`, `/api/public/restaurants/:slug/orders`

## Security notes

- Use HTTPS when you put the app online.
- Set `NODE_ENV=production` so cookies are marked Secure.
- Keep all `.env` files private.

## Author

suboabiv-bit