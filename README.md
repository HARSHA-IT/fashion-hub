# FASHION HUB

A responsive full-stack starter for a clothing store.

## Stack
- Frontend: React + Vite + React Router + Axios
- Backend: FastAPI + SQLAlchemy + MySQL
- Authentication: JWT
- Wishlist/cart: browser localStorage in this starter

## Run the frontend
```bash
cd frontend
npm install
npm run dev
```

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:8000
```

## Run the backend
Create a MySQL database named `fashion_hub`, then:
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
```

Create `backend/.env`:
```env
DATABASE_URL=mysql+pymysql://root:YOUR_PASSWORD@localhost:3306/fashion_hub
SECRET_KEY=replace-this-with-a-long-random-secret
```

Start the API:
```bash
python seed_products.py
uvicorn main:app --reload
```
API docs: http://localhost:8000/docs

## Important before going live
This is a development starter, not a production-ready store. Before accepting real customers:
- use HTTPS and a strong secret key
- add email verification, password reset, rate limiting and secure deployment settings
- implement server-side cart, wishlist and order persistence
- integrate a payment provider in its approved test/live mode; never store card details
- add admin role authorization, inventory checks, shipping/tax rules and privacy/return policies
- use a managed image host and validate uploaded files
