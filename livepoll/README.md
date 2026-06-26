# LivePoll

LivePoll is a real-time polling application built with a React front end and an Express/Socket.io backend backed by PostgreSQL. It allows presenters to create live poll sessions, open questions, and broadcast updates instantly to viewers who join with a session code.

## Key Features

- Presenter authentication and session management
- Create poll sessions with a 6-character join code
- Add questions and answer options for a session
- Live voting via Socket.io
- Real-time vote result updates and leaderboard
- PostgreSQL database persistence

## Repository Structure

- `client/` - React app built with Vite
- `server/` - Express API and Socket.io server

## Prerequisites

- Node.js 20+ (or compatible)
- PostgreSQL
- npm or yarn

## Setup

### 1. Clone the repo

```bash
cd "c:/Users/User/Downloads/livepoll - sandbox 2"
```

### 2. Configure the database

Create a PostgreSQL database and note the connection string.

Then create a `.env` file inside `server/`:

```env
DATABASE_URL=postgres://user:password@localhost:5432/livepoll
JWT_SECRET=your_jwt_secret
PORT=5000
```

### 3. Initialize the database schema

From the `server/` folder, run the SQL script to create the tables:

```bash
psql "$DATABASE_URL" -f init.sql
```

Alternatively, if you prefer a client such as `pgAdmin`, run the SQL statements in `server/init.sql`.

## Running the App

### Server

```bash
cd server
npm install
node index.js
```

### Client

```bash
cd client
npm install
npm run dev
```

The client is configured to communicate with the backend at `http://localhost:5000` and the Socket.io server at `http://localhost:5175` by default.

## Available Scripts

### Client

- `npm run dev` - start the Vite development server
- `npm run build` - bundle the client for production
- `npm run preview` - preview the production build
- `npm run lint` - run ESLint on the client code

### Server

- `node index.js` - start the Express and Socket.io server

## How It Works

### Presenter flow

1. Register or log in
2. Create a session
3. Add questions and options
4. Open questions for live voting
5. End the session to show final results

### Voter flow

1. Open the app and join via session code
2. Vote on the active question
3. Watch results and leaderboard update in real time

## API Endpoints

### Auth

- `POST /api/auth/register` - register a new presenter
- `POST /api/auth/login` - log in and receive a JWT cookie
- `GET /api/auth/me` - retrieve current user info
- `POST /api/auth/logout` - clear login cookie

### Sessions

- `POST /api/sessions/` - create a new session
- `GET /api/sessions/` - list presenter sessions
- `GET /api/sessions/:sessionId` - get session details and active question
- `POST /api/sessions/:sessionId/questions` - create a question with options
- `GET /api/sessions/:sessionId/leaderboard` - get session leaderboard

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - secret used to sign JWT tokens
- `PORT` - server port (default: `5000`)

## Notes

- The server uses Socket.io to handle real-time polling events.
- The database schema is defined in `server/init.sql`.
- The client app uses React Router for navigation and a custom Socket context for live updates.

## Improvements

Potential enhancements:

- Add presenter-only authentication guard for session join
- Add session code validation on the client
- Display poll history and results archive
- Add better error handling for socket events

---

Enjoy building and customizing LivePoll!