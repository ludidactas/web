import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './fake-login';

test.describe('Test prueba', () => {
  
  test('landing luce bien', async ({ page }) => {
    await page.goto('/');
    
    await expect(page.getByText('Entrená con profes')).toBeVisible()
    
    await page.goto('/sala');
    
    await expect(page.getByText('Conectate con tu cuenta de Google')).toBeVisible()

  })

  test.only('loguearse como profe y acceder a la sala', async ({ page  }) => {
    await loginAsTestUser(page, { name: 'Eltes Tito', email: 'el.tes.tito@fake.com'})
    await page.goto('/sala')
    await expect(page.getByText(/Hola/)).toBeVisible()
  })
  
})