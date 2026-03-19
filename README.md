# 🐝 Pollen

A full stack social polling app where users can create polls, vote, and discuss results. Built as a portfolio project to demonstrate full stack development with Python, FastAPI, PostgreSQL, and React.

**[Live Demo](https://pollen-flame.vercel.app/)** · **[GitHub](https://github.com/Ausdel/pollen)**

---

![Pollen Landing Page](screenshots/landing.png)
![Pollen Poll Feed](screenshots/feed.png)

---

## Features

- **User authentication** — register and log in with JWT-based auth, protected routes
- **Create polls** — ask any question with 2 or more options
- **Vote** — cast your vote and watch the results grow as animated flowers
- **Comments** — discuss results with other users under each poll
- **Timestamps** — see how long ago polls and comments were posted
- **Pagination** — feed loads 10 polls at a time
- **Delete your own polls** — full ownership control
- **Responsive design** — works on desktop and mobile

---

## Tech Stack

**Backend**
- [Python](https://www.python.org/) — core language
- [FastAPI](https://fastapi.tiangolo.com/) — REST API framework
- [SQLAlchemy](https://www.sqlalchemy.org/) — ORM for database interaction
- [PostgreSQL](https://www.postgresql.org/) — production database
- [python-jose](https://github.com/mpdavis/python-jose) — JWT authentication
- [passlib](https://passlib.readthedocs.io/) — password hashing

**Frontend**
- [React](https://react.dev/) — UI framework
- [React Router](https://reactrouter.com/) — client-side routing
- [Vite](https://vitejs.dev/) — build tool
- CSS Modules — scoped component styling

**Deployment**
- [Render](https://render.com/) — backend hosting + PostgreSQL
- [Vercel](https://vercel.com/) — frontend hosting

---

## Local Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- Git

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux
pip install -r requirements.txt
```

Create a `.env` file in the `backend` folder:
```
SECRET_KEY=your-secret-key-here
```

Start the server:
```bash
uvicorn main:app --reload
```

The API will be running at `http://localhost:8000`. Visit `http://localhost:8000/docs` for the interactive API documentation.

### Frontend

```bash
cd frontend
npm install
```

Create a `.env.local` file in the `frontend` folder:
```
VITE_API_URL=http://localhost:8000
```

Start the dev server:
```bash
npm run dev
```

The app will be running at `http://localhost:5173`.

---

## Project Structure

```
pollen/
├── backend/
│   ├── main.py          # FastAPI routes and app setup
│   ├── models.py        # SQLAlchemy database models
│   ├── database.py      # Database connection
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── components/  # React components
    │   └── styles/      # CSS modules
    └── index.html
```

---

## Screenshots

> Add screenshots to a `screenshots/` folder in the root of the repo and name them `landing.png` and `feed.png`.

---

*Made with 🐝 by [Ausdel](https://github.com/Ausdel)*