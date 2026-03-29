# FoodBridge - Surplus Food Redistribution Platform

This is the project skeleton for FoodBridge, built for the Vashisht Hackathon 3.0 (EcoTech track).

## Tech Stack
* **Client**: React + Vite + Tailwind CSS + Zustand
* **Server**: Node.js + Express + Socket.io + Mongoose
* **ML Service**: Python FastAPI

## Getting Started

### Prerequisites
* Node.js (v18+)
* Python 3.9+
* MongoDB (or use a cloud instance / Docker)

### Running Locally (Without Docker)

1. **Start the ML Service**
   ```bash
   cd ml
   pip install -r requirements.txt
   uvicorn main:app --reload --port 8000
   ```

2. **Start the Server**
   ```bash
   cd server
   npm install
   npm run dev
   ```

3. **Start the Client**
   ```bash
   cd client
   npm install
   npm run dev
   ```

### Running with Docker Compose

You can boot up the entire stack using Docker:

```bash
docker-compose up --build
```

**Note:** The skeleton requires Dockerfiles in each sub-directory to fully work with docker-compose. We have included a `docker-compose.yml` for future extension.
