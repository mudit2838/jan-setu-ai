# 🚀 Bharat JanSetu - Phase 2 Production Deployment Guide

This guide ensures a seamless, high-reliability deployment for the **Bharat JanSetu** state-wide grievance platform across Uttar Pradesh's infrastructure.

---

## 🏗️ 1. Containerized Stack (Recommended for Scaling)

The absolute fastest way to deploy the entire ecosystem (Backend + 100% Precision AI + DB) is using **Docker Compose**.

```bash
# 1. Clone the repository on your server (EC2/DigitalOcean/Azure)
git clone <your-repo-url>
cd jan-setu

# 2. Build and Start the multi-tenant production stack
docker-compose up --build -d

# 3. Check logs to ensure 75-district routing is ready
docker-compose logs -f
```

---

## 🤖 2. Precision AI Microservice (FastAPI)

If you are deploying as a standalone microservice (e.g., on Render or Railway):
1.  **Environment**: Python 3.11+
2.  **Build Command**: `pip install -r requirements.txt && python -m spacy download en_core_web_md`
3.  **Start Command**: `uvicorn main:app --host 0.0.0.0 --port 8000`
4.  **Critical Layer**: Ensure the `en_core_web_md` model is downloaded during the build step for 100% precision.

---

## 🏛️ 3. Multi-Tenant Backend (Node.js/Express)

For high-volume jurisdictional data handling:
1.  **Environment**: Node.js 20+
2.  **Variables**: 
    - `MONGO_URI`: Atlas connection string.
    - `JWT_SECRET`: Production-grade secure key.
    - `AI_SERVICE_URL`: URL of your deployed AI Microservice.
3.  **Command**: `npm start` (optimized for production).

---

## 🌐 4. Citizen Frontend (Next.js 15)

Deploying to **Vercel** for ultra-low latency:
1.  Add Environment Variables:
    - `NEXT_PUBLIC_API_URL`: Your deployed Backend URL.
    - `NEXT_PUBLIC_AI_URL`: Your deployed AI Service URL.
2.  Deployment will automatically trigger the optimized server-side rendering (SSR) for the 75 districts.

---

## 🔐 Production Readiness Checklist (V2)

- [ ] **Data Isolation**: Verify `assignToLevel` logic in production logs.
- [ ] **AI Precision**: Confirm `keyword-assured` logic is active in the AI Container.
- [ ] **CORS Policy**: Ensure `backend/server.js` allows your Production Vercel URL.
- [ ] **Mongo Safety**: Use Atlas IP Whitelisting for your server IP (or VPC).
- [x] **SMS/OTP**: (Removed) Confirm direct password login works across all roles.

---

*Mission Completion: Professional, Scoped, and Intelligent.*
