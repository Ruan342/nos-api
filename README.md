# Nós API

Backend em FastAPI + PostgreSQL com autenticação (cadastro/login com bcrypt e JWT) e frontend estático de login.

## Stack
- Python 3 · FastAPI · SQLAlchemy · Pydantic
- PostgreSQL 16
- Docker Compose
- HTML/CSS/JS (frontend)

## Como rodar
```bash
cp .env.example .env   # ajuste os valores
docker compose up --build
```
- API: http://localhost:8000 · Docs: http://localhost:8000/docs · Health: `/health`
- Frontend: abra `frontend/login.html`

## Estrutura
```
backend/app/
  main.py        app FastAPI, CORS e rotas
  database.py    conexão com o Postgres
  models.py      modelos SQLAlchemy
  schemas.py     schemas Pydantic
  security.py    hash de senha e JWT
  routers/auth.py  endpoints de autenticação
frontend/        página de login
```
