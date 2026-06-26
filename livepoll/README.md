# 📊 LivePoll | High-Performance Real-Time Engagement

LivePoll is a full-stack, real-time audience engagement platform built to handle high-concurrency polling with sub-second visual updates. Unlike standard WebSocket implementations that broadcast raw events, LivePoll utilizes an **Aggregated Fan-out Pattern** to ensure scalability and data consistency.

---

## 🏗 System Architecture

LivePoll is built on a **Layered Monolith** architecture with a focus on a "Single Source of Truth."

### The "Aggregated Fan-out" Pattern
To prevent "Broadcast Storms" (where 1,000 votes create 1,000,000 socket messages), LivePoll follows a strict **Validate ➔ Persist ➔ Aggregate ➔ Broadcast** pipeline:
1. **Validate:** Server verifies the question is open and the voter is unique.
2. **Persist:** The vote is committed to PostgreSQL with a unique constraint.
3. **Aggregate:** The server re-calculates totals using SQL `GROUP BY` counts.
4. **Broadcast:** Only the final totals are emitted via Socket.io, ensuring all clients stay perfectly synced.

## 🚀 Key Features

- **⚡ Zero-Latency Visualization:** Real-time bar charts powered by **Recharts** that animate instantly as votes arrive.
- **🛡️ Anonymous Integrity:** Uses browser-based UUID tokens and DB-level unique constraints to prevent double-voting without requiring user registration.
- **🔄 State Re-hydration:** A "self-healing" frontend that recovers the active poll state and results automatically upon page refresh.
- **🚦 Server-Side State Machine:** The poll lifecycle (`Inactive` ➔ `Open` ➔ `Closed`) is enforced on the backend, making it impossible to vote on closed polls via terminal scripts.
- **🔑 Secure Presenter Dashboard:** Protected by **JWT HttpOnly Cookies** to mitigate XSS and CSRF attacks.

## 🛠 Tech Stack

- **Frontend:** React, Vite, Recharts, Socket.io-client, Axios
- **Backend:** Node.js, Express, Socket.io, PostgreSQL
- **Database:** Relational schema with Foreign Key constraints and ACID-compliant Transactions.
- **Security:** Bcrypt (Salting/Hashing), JSON Web Tokens (JWT).

## 📊 Database Schema

```text
  [Users] 1 --- n [Sessions] 1 --- n [Questions] 1 --- n [Options]
                                           1              |
                                           |              |
                                           n --- [Votes]--n