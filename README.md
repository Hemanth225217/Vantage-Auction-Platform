# 🔨 Vantage Auctions — Online Auction Platform

A full-stack, production-ready online auction platform with **live real-time bidding**.

**Stack:** React.js (Vite) · Node.js · Express.js · MongoDB · Socket.io · JWT Authentication · Tailwind CSS

---

## ✨ Features

- **JWT authentication** — secure register/login, password hashing (bcrypt), protected routes
- **Live bidding** — bids update instantly for every viewer via Socket.io, with race-condition-safe atomic bid processing on the server (no two users can "win" the same bid simultaneously)
- **Auto-closing auctions** — a background job automatically marks auctions as "ended" the moment their timer expires, and broadcasts the result live
- **Full auction lifecycle** — create, edit (before any bids), cancel/delete, browse, search, filter by category/price/status, sort, paginate
- **Dashboard** — "My Auctions" (as a seller) and "My Bids" (as a bidder) with live status (winning/outbid/won/lost)
- **Polished, premium UI** — dark "auction house" theme (ink + gold palette), Playfair Display + Inter typography, smooth Framer Motion animations, fully responsive
- **Seed script** — instantly populate the database with 5 demo users and 10 realistic auctions (with bid history) across every category, so the app looks alive from the first run

---

## 📁 Project Structure

```
auction-platform/
├── backend/                 # Node.js + Express + MongoDB API
│   ├── config/db.js
│   ├── controllers/         # auth, auction, bid logic
│   ├── middleware/          # JWT auth guard, error handler
│   ├── models/              # User, Auction, Bid (Mongoose schemas)
│   ├── routes/               # /api/auth, /api/auctions, /api/bids
│   ├── utils/generateToken.js
│   ├── seed.js               # demo data generator
│   ├── server.js             # entry point + Socket.io + cron-style job
│   ├── package.json
│   └── .env.example
└── frontend/                 # React + Vite + Tailwind
    ├── src/
    │   ├── api/axios.js       # pre-configured API client (auto-attaches JWT)
    │   ├── components/        # Navbar, Footer, AuctionCard, CountdownTimer, etc.
    │   ├── context/           # AuthContext, SocketContext
    │   ├── pages/              # Home, Auctions, AuctionDetail, Dashboard, etc.
    │   ├── App.jsx / main.jsx
    │   └── index.css
    ├── index.html
    ├── tailwind.config.js
    ├── package.json
    └── .env.example
```

---

## ✅ Prerequisites

Before you start, make sure you have these installed:

1. **Node.js** v18 or newer — [nodejs.org](https://nodejs.org)
2. **MongoDB** — pick ONE of these two options:
   - **Option A (easiest): MongoDB Atlas (free cloud database)** — sign up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas/register), create a free cluster, click "Connect" → "Drivers" and copy your connection string (looks like `mongodb+srv://user:password@cluster.mongodb.net/auction_platform`).
   - **Option B: Install MongoDB locally** — [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community), then make sure the `mongod` service is running (default local URI: `mongodb://127.0.0.1:27017`).

---

## 🚀 Setup & Launch — Step by Step

### 1. Unzip the project and open two terminals (one for backend, one for frontend)

### 2. Backend setup

```bash
cd auction-platform/backend
npm install
```

Create your `.env` file by copying the example:

```bash
cp .env.example .env
```

Open `.env` and fill in your values:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/auction_platform
JWT_SECRET=replace_this_with_a_long_random_string
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

- If you're using **MongoDB Atlas**, replace `MONGO_URI` with the connection string you copied (remember to add your database name at the end, e.g. `.../auction_platform?retryWrites=true...`).
- `JWT_SECRET` can be any long random string — e.g. run `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` to generate one.

**Seed the database with demo data** (5 users, 10 auctions, sample bids):

```bash
npm run seed
```

You should see output ending with a list of demo login credentials, e.g.:
```
demo@auction.com / password123
admin@auction.com / admin123 (role: admin)
```

**Start the backend server:**

```bash
npm run dev
```

You should see:
```
✅ MongoDB Connected: ...
🚀 Server running in development mode on port 5000
```

Leave this terminal running. Verify it's working by visiting `http://localhost:5000/api/health` in your browser — you should see a JSON success message.

### 3. Frontend setup (in your second terminal)

```bash
cd auction-platform/frontend
npm install
```

Create your `.env` file:

```bash
cp .env.example .env
```

The defaults already match the backend, so you shouldn't need to change anything:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

**Start the frontend:**

```bash
npm run dev
```

Vite will print a local URL, typically:
```
➜  Local:   http://localhost:5173/
```

Open that URL in your browser. 🎉

### 4. Log in and explore

Use any of the seeded demo accounts:

| Email | Password | Role |
|---|---|---|
| demo@auction.com | password123 | user |
| ava@auction.com | password123 | user |
| marcus@auction.com | password123 | user |
| isabella@auction.com | password123 | user |
| admin@auction.com | admin123 | admin |

Or just click **"Join Now"** to create your own account.

**To test live bidding in real time:** open the same auction in two different browser windows (or one normal + one incognito, logged in as two different users) and place bids from each — you'll see the price, bid history, and countdown update instantly on both screens without refreshing.

---

## 🔑 Environment Variables Reference

### Backend (`backend/.env`)
| Variable | Description |
|---|---|
| `PORT` | Port the API server runs on (default `5000`) |
| `MONGO_URI` | Your MongoDB connection string |
| `JWT_SECRET` | Secret key used to sign JWT tokens — keep this private |
| `JWT_EXPIRE` | How long login tokens stay valid (e.g. `7d`) |
| `CLIENT_URL` | The frontend's URL, used for CORS + Socket.io (default `http://localhost:5173`) |
| `NODE_ENV` | `development` or `production` |

### Frontend (`frontend/.env`)
| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the backend REST API |
| `VITE_SOCKET_URL` | Base URL of the backend Socket.io server (usually the same host, without `/api`) |

---

## 🧠 How the Live Bidding Works

1. When a user opens an auction page, the frontend joins a Socket.io "room" scoped to that auction (`auction:<id>`).
2. When any user places a bid, the backend:
   - Validates the bid amount against the current price + increment
   - Performs an **atomic** `findOneAndUpdate` that only succeeds if the price hasn't changed since it was read — this prevents two simultaneous bids from both being accepted as the "winning" bid (a common race-condition bug in naive auction implementations)
   - Saves the bid record and broadcasts the new price/bid to everyone in that auction's room
3. All connected clients receive the update instantly and re-render the price, bid history, and "leading bidder" — no polling, no refresh needed.
4. A background interval on the server checks every 15 seconds for auctions whose end time has passed, marks them `ended`, and notifies everyone watching.

---

## 🛠️ Useful Scripts

**Backend** (`cd backend`)
| Command | Description |
|---|---|
| `npm run dev` | Start the API with auto-reload (nodemon) |
| `npm start` | Start the API in production mode |
| `npm run seed` | Wipe and repopulate the database with demo data |

**Frontend** (`cd frontend`)
| Command | Description |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Build a production bundle into `frontend/dist` |
| `npm run preview` | Preview the production build locally |

---

## 🚢 Deploying to Production (optional)

- **Backend:** Deploy to any Node host (Render, Railway, Fly.io, a VPS, etc.). Set the environment variables from the table above in your host's dashboard, and point `MONGO_URI` at your production database (Atlas recommended).
- **Frontend:** Run `npm run build` and deploy the `dist/` folder to any static host (Vercel, Netlify, Cloudflare Pages). Set `VITE_API_URL` and `VITE_SOCKET_URL` to your deployed backend's public URL.
- Remember to update `CLIENT_URL` in the backend's `.env` to your deployed frontend URL, or CORS/Socket.io connections will be blocked.

---

## 🩹 Troubleshooting

- **"MongoDB Connection Error"** → Double check `MONGO_URI` in `backend/.env`. If using Atlas, make sure your current IP is whitelisted (Atlas → Network Access → Add IP Address, or allow `0.0.0.0/0` for local testing).
- **Frontend loads but no auctions appear** → Make sure you ran `npm run seed` in the backend, and that the backend server is running on the port matching `VITE_API_URL`.
- **Bids don't update live / no real-time updates** → Check the browser console for Socket.io connection errors, and confirm `VITE_SOCKET_URL` matches the backend's actual address and that `CLIENT_URL` in the backend `.env` matches the frontend's actual address (CORS must match exactly, including port).
- **"Not authorized, token failed"** → Your JWT may have expired or `JWT_SECRET` was changed after the token was issued — just log in again.

---

Enjoy the auctions! 🔨
