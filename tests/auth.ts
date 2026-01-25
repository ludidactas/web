import { Page, expect } from '@playwright/test'

export async function loginFake(page: Page, user: {name: string, email: string}) {
  // NextAuth provee un CSRF token que requiere para el login
  const csrfResponse = await page.request.get('/api/auth/csrf')
  const { csrfToken } = await csrfResponse.json()

  // Login directo con el provider de test
  const response = await page.request.post('/api/auth/callback/credentials', {
    form: {
      csrfToken,
      redirect: 'false',
      callbackUrl: '/sala',
      ...user
    },
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })

  await expect(response.ok()).toBeTruthy()
}