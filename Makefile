.PHONY: dev backend-dev frontend-dev

dev:
	@$(MAKE) -j2 backend-dev frontend-dev

backend-dev:
	cd backend && npm run start:dev

frontend-dev:
	cd frontend && npm run dev
