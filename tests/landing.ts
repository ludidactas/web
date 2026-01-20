import { test, expect } from '@playwright/test';

test.describe('Test prueba', () => {
  
  test('Loguearse y crear una pregunta', async ({ page }) => {
    await page.goto('/');
    
    await expect(page.getByText('Entrená con profes')).toBeVisible()
    
    await page.goto('/sala');
    
    await expect(page.getByText('Conectate con tu cuenta de Google')).toBeVisible()

  })
  
})