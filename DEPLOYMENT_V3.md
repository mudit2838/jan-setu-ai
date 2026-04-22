# 🚀 Bharat JanSetu - Full Stack Deployment Guide (V3)

This guide provides a comprehensive, step-by-step walkthrough to deploy the **Bharat JanSetu** ecosystem. Follow these steps to connect the Frontend, Backend, and AI Service into a unified production-ready platform.

---

## 🏗️ 1. Architecture Overview
Bharat JanSetu consists of three core components:
1.  **Citizen Frontend**: Next.js 15 (deployed on Vercel/Netlify).
2.  **Multi-Tenant Backend**: Node.js/Express (deployed on VPS/Docker).
3.  **Precision AI Microservice**: FastAPI + NLP (deployed on VPS/Docker).

### 🔗 Connection Matrix
| Origin | Destination | protocol | Production URL Example |
| :--- | :--- | :--- | :--- |
| **Frontend** | **Backend** | HTTP/REST | `https://api.jansetu.in` |
| **Frontend** | **AI Service** | HTTP/REST | `https://ai.jansetu.in` |
| **Backend** | **AI Service** | HTTP/REST | `http://ai-service:8000` (Docker Internal) |

---

## 🔑 2. Phase 1: Prerequisites
Before starting, ensure you have the following external services configured:

- [ ] **MongoDB Atlas**: Create a cluster and get your `MONGO_URI`. Ensure your server IP is whitelisted.
- [ ] **Cloudinary**: Create an account to get `CLOUD_NAME`, `API_KEY`, and `API_SECRET` for grievance image storage.
- [ ] **Twilio**: (Optional for SMS) Get `SID`, `TOKEN`, and `PHONE_NUMBER`.
- [ ] **Docker & Docker Compose**: Installed on your production server.

---

## 🛠️ 3. Phase 2: Environment Configuration

### A. AI Service (`/ai-service/.env`)
Create a `.env` file in the `ai-service` directory:
```env
PORT=8000
```

### B. Backend Service (`/backend/.env`)
Create a `.env` file in the `backend` directory:
```env
# --- DATABASE & AUTH ---
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/jansetu
JWT_SECRET=your_ultra_secure_jwt_secret
ALLOWED_ORIGIN=https://your-frontend-domain.com

# --- CLOUDINARY ---
CLOUDINARY_CLOUD_NAME=your_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret

# --- AI CONNECTIVITY ---
AI_SERVICE_URL=http://jansetu_ai:8000
```

### C. Frontend (`/frontend/.env.local`)
Create a `.env.local` file in the `frontend` directory:
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_AI_SERVICE_URL=https://ai.yourdomain.com
```

---

## 🐳 4. Phase 3: Containerized Deployment (Production)

The most reliable way to run the backend and AI service is via Docker Compose. This ensures they are on the same virtual network (`jansetu_net`).

### Run via Docker Compose:
```bash
# From the project root
docker-compose up --build -d
```

> [!IMPORTANT]
> **Port Fix Alert**: If your `ai-service/Dockerfile` exposes `8080`, ensure your `docker-compose.yml` matches it. We recommend using `8000` for both to avoid confusion.

#### Verification Commands:
```bash
# Check if all containers are healthy
docker ps

# Check AI service logs for spaCy model loading
docker logs jansetu_ai

# Check Backend logs for MongoDB connection
docker logs jansetu_backend
```

---

## 🌐 5. Phase 4: Frontend Deployment (Vercel)

1.  Connect your GitHub repository to **Vercel**.
2.  Set the **Root Directory** to `frontend`.
3.  Add the `NEXT_PUBLIC` environment variables from Phase 2.
4.  Deploy!

---

## 🛡️ 6. Phase 5: Connection Verification Checklist

To ensure everything is working "properly," perform these checks:

1.  **AI Health**: Visit `http://your-server-ip:8000/health`. It should return `{"status": "online"}`.
2.  **CORS Test**: Attempt to submit a grievance from the frontend. If the browser blocks it, check `ALLOWED_ORIGIN` in the Backend `.env`.
3.  **AI Analysis**: Submit a test grievance like "Leaking water pipe in Sector 4".
    *   Check Backend logs: Should show "AI Analysis successful".
    *   The complaint should be automatically assigned to the **Water/Sewerage** department.

---

## 🧹 7. Maintenance & Scaling
- **Logs**: Use `docker-compose logs -f` to monitor traffic.
- **Updates**: Run `git pull && docker-compose up --build -d` to deploy changes.
- **Memory**: The AI service requires ~2GB RAM for high-precision NLP. Ensure your server has enough headless headroom.

---
*Status: Production Blueprint V3.0 Activated.*
