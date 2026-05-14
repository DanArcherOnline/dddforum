.PHONY: dev backend-dev frontend-dev db-seed db-reset

dev:
	@$(MAKE) -j2 backend-dev frontend-dev

backend-dev:
	cd backend && npm run start:dev

frontend-dev:
	cd frontend && npm run dev

db-seed:
	cd backend && npm run db:seed

db-reset:
	cd backend && npm run db:reset
