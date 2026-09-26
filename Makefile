.PHONY: up down build logs test migrate lint verify

up:
	docker compose up -d

build:
	docker compose up --build -d

down:
	docker compose down -v

logs:
	docker compose logs -f

migrate:
	docker compose exec api alembic upgrade head

test:
	docker compose exec api pytest

lint:
	docker compose exec api ruff check .
	cd frontend && npm run lint

verify: test lint
