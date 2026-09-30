# FullStack Hub - NextGen Web Application

A complete, production-grade Full-Stack Application built with **Express / Node.js**, **React 19**, **Tailwind CSS**, and **TypeScript**.

## 🌟 Architecture & Features

- **Full-Stack Single Process & Dev Server**: Express backend seamlessly integrated with Vite middlewares on port 3000.
- **Robust Authentication & RBAC**:
  - Secure PBKDF2 password hashing with cryptographically unique salts.
  - Signed HMAC-SHA256 JSON Web Tokens (JWT) with bearer authorization.
  - Role-Based Access Control (`admin` vs `user`).
- **RESTful Resource Management (CRUD)**:
  - Create, view, update, and delete tasks/items.
  - Instant client-side & server-side search, filtering by category, status, and priority.
  - Preset seeds and one-click data reset.
- **Interactive REST API Playground**:
  - Live Swagger/Postman-like endpoint tester inside the UI.
  - Live execution of `/api/health`, `/api/stats`, `/api/auth/*`, and `/api/items/*` with formatted JSON inspection.
- **System Telemetry & Audit Logs**:
  - Track server uptime, active sessions, request counters, and memory metrics.
  - Audit trail of user logins, item modifications, and security actions.
- **User Profile & Session Controls**:
  - Profile customization, bio, avatar generation, and password change.
  - Token inspection and one-click copy.

## 🚀 Quick Start

### Development
```bash
npm run dev
```
Starts the full-stack server at `http://0.0.0.0:3000`.

### Production Build
```bash
npm run build
npm start
```

### Pre-Seeded Accounts
- **Admin**: `admin@example.com` / `admin123`
- **Demo User**: `demo@example.com` / `demo123`

## 📡 API Endpoints

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/health` | Service health status and uptime | No |
| `GET` | `/api/stats` | System metrics and database statistics | No |
| `GET` | `/api/spec` | OpenAPI schema for API explorer | No |
| `POST` | `/api/auth/register` | Register new user account | No |
| `POST` | `/api/auth/login` | Sign in & receive JWT token | No |
| `GET` | `/api/auth/me` | Fetch authenticated user | Yes |
| `PUT` | `/api/auth/profile` | Update user profile | Yes |
| `PUT` | `/api/auth/change-password` | Update account password | Yes |
| `GET` | `/api/items` | List & filter items/tasks | No |
| `POST` | `/api/items` | Create new item | Yes |
| `PUT` | `/api/items/:id` | Update item | Yes |
| `DELETE` | `/api/items/:id` | Delete item | Yes |
| `GET` | `/api/logs` | View server audit activity logs | No |
