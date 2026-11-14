import { defineConfig, devices } from '@playwright/test'

// Stack aislado de e2e: redis, wss y Next propios en puertos distintos a los de desarrollo,
// para que los tests no toquen los datos ni la carga del entorno local.
const PUERTO_WEB = 4000
const PUERTO_WSS = 4005
const PUERTO_REDIS = 4379

const envStack = {
  ...process.env,
  NODE_ENV: 'development', // habilita el provider de credenciales de `loginFake` (ver src/app/auth.ts)
  REDIS_HOST: '127.0.0.1',
  REDIS_PORT: String(PUERTO_REDIS),
  PORT: String(PUERTO_WSS),
  NEXT_PUBLIC_ENCUESTA_HOST: `http://localhost:${PUERTO_WSS}`,
  NEXTAUTH_URL: `http://localhost:${PUERTO_WEB}`,
  AUTH_URL: `http://localhost:${PUERTO_WEB}`,
  NEXT_DIST_DIR: '.next-e2e',
  E2E_BUILD: '1',
  IDP_HOST: 'localhost',
  NEXT_TELEMETRY_DISABLED: '1',
}

export default defineConfig({
  testDir: './tests',
  // Cada test arma una sala y entra con uno o más estudiantes: con la máquina cargada, los timeouts por defecto (30s por test, 5s por assert) no alcanzan.
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: `http://localhost:${PUERTO_WEB}`,
    trace: 'on-first-retry',
  },

  webServer: [
    {
      command: `redis-server --port ${PUERTO_REDIS} --save "" --appendonly no`,
      port: PUERTO_REDIS,
      reuseExistingServer: false,
    },
    {
      command: 'bun run wss/server.ts',
      port: PUERTO_WSS,
      env: envStack as Record<string, string>,
      reuseExistingServer: false,
      stdout: 'ignore',
    },
    {
      command: `bunx next build --webpack && bunx next start -p ${PUERTO_WEB}`,
      url: `http://localhost:${PUERTO_WEB}/salas`,
      env: envStack as Record<string, string>,
      reuseExistingServer: false,
      stdout: 'ignore',
      timeout: 600_000,
    },
  ],

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
