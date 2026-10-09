# Simple Store

Simple Store is a full-stack demo shop with a responsive, premium dark storefront built using HTML, CSS, and vanilla JavaScript. Its Express/Mongoose API serves the catalogue and handles bcrypt/JWT accounts and stock-checked demo orders. Checkout saves an order but does not accept or process payment.

## Features

- Dark responsive storefront with product imagery, database-driven category tiles, collection search, sorting, ratings, sale badges, favorites, toast feedback, and a sliding cart drawer.
- Product pages, a localStorage-backed shopping bag, registration, login/logout, authenticated demo checkout, confirmation, and private order history.
- Server-fetched product prices, atomic stock reservations, rollback if order creation fails, and idempotency keys to prevent duplicate order submissions on retries.
- Sixteen idempotently seeded products across home, clothing, footwear, accessories, stationery, wellness, and on-the-go categories. Re-running the seed refreshes catalogue details without resetting stock for existing products.
- Explicit API errors and database connection failures; the storefront never replaces the database catalogue with fake products.

## Requirements

- Node.js 18 or later and npm.
- MongoDB running locally, or a MongoDB Atlas connection URI.
- A static frontend server, such as VS Code Live Server.

## Install and run

1. Install the backend dependencies:

   ```powershell
   cd "C:\Users\LENOVO\Desktop\simple e commerce website\backend"
   npm install
   ```

2. Copy `backend/.env.example` to `backend/.env`. Configure `MONGODB_URI`, then set `JWT_SECRET` to a random value of at least 32 characters. Generate a secret with:

   ```powershell
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```

   Keep the generated value and `.env` private. Never commit real credentials.

3. Start MongoDB. For MongoDB Atlas, create a database user, permit your IP address in Network Access, and put the Atlas connection URI in `MONGODB_URI`. The local default is `mongodb://127.0.0.1:27017/simple_store`.

4. From the `backend` folder, seed products and start the API:

   ```powershell
   npm run seed
   npm start
   ```

   The API listens on port 5001 by default. Use `npm run dev` during development for automatic restarts.

5. Serve the `frontend` folder with VS Code Live Server and open its `index.html`. For example, if the server root is the repository folder, open `http://127.0.0.1:5500/frontend/`. The API's default allowed Live Server origins include `http://127.0.0.1:5500` and `http://localhost:5500`.

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | No | API port; defaults to `5001`. |
| `MONGODB_URI` | Yes | Local or Atlas MongoDB connection URI. |
| `JWT_SECRET` | Yes | Random secret of at least 32 characters for signing session tokens. |
| `FRONTEND_ORIGIN` | No | Comma-separated allowed frontend origins. |

The browser API base URL is defined once in `frontend/js/api.js` as `http://localhost:5001/api`. Change it there when hosting the API elsewhere. Port 5001 avoids the development tooling service that occupies port 5000 in the current environment.

## REST API

All routes are prefixed with `/api`; API errors are returned as `{ "message": "..." }`.

| Method | Endpoint | Authentication | Description |
| --- | --- | --- | --- |
| `GET` | `/health` | No | API health status. |
| `GET` | `/products` | No | List database products; optional `search`, `category`, and `sort` query parameters. Supported sorting: `newest`, `popular`, `price-asc`, `price-desc`, `name-asc`, and `rating`. |
| `GET` | `/products/categories` | No | Database product categories. |
| `GET` | `/products/:id` | No | Product details. |
| `POST` | `/auth/register` | No | Register using `name`, `email`, and `password`; responds with a JWT. |
| `POST` | `/auth/login` | No | Sign in using `email` and `password`; responds with a JWT. |
| `GET` | `/auth/me` | Bearer JWT | Current signed-in user. |
| `POST` | `/orders` | Bearer JWT | Place a demo order using `items: [{ productId, quantity }]` and `shippingAddress`. Include a unique `Idempotency-Key` header; retry with the same key to avoid creating a duplicate. The server fetches prices and verifies stock. |
| `GET` | `/orders` | Bearer JWT | List only the current user's orders. |

The order total covers product prices only. No payment, shipping charge, or payment-provider request is processed.
