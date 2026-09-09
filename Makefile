.PHONY: salas inspeccionar simular idp-check svgo-reembed images

salas:
	bun run wss/scripts/listar-salas.ts

inspeccionar:
	bun run wss/scripts/inspeccionar-sala.ts

simular:
	bun run wss/scripts/simular-estudiantes.ts

idp-check:
	bun run scripts/check-idp-login.ts

svgo-reembed:
	bun run scripts/reembed-webp.ts

images:
	bun run scripts/optimize-images.ts
