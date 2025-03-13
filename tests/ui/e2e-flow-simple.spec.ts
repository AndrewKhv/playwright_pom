import { test, expect } from '@playwright/test'
import { LoginPage } from '../pages/login-page'
import { faker } from '@faker-js/faker/locale/ar'
import { PASSWORD, USERNAME } from '../../config/env-data'

test('signIn button disabled when incorrect data inserted', async ({ page }) => {
  const loginPage = new LoginPage(page)
  await loginPage.open()
  await loginPage.usernameField.fill(faker.lorem.word(2))
  await loginPage.passwordField.fill(faker.lorem.word(7))
  await loginPage.signInButton.checkVisible()
  await loginPage.signInButton.checkDisabled(true)
})

test('login with correct credentials and verify order creation page', async ({ page }) => {
  const loginPage = new LoginPage(page)
  await loginPage.open()
  const orderCreationPage = await loginPage.signIn(USERNAME, PASSWORD)
  await orderCreationPage.statusButton.checkDisabled(false);
  await orderCreationPage.nameField.checkVisible();
})

test('TL-22-1 Mocked auth', async ({ page }) => {
  const loginPage = new LoginPage(page)
  await loginPage.open()
  await page.route('**/login/student', async route => {
    const responseBody = 'test.test.test'
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: responseBody
    })
  })
  const orderCreationPage = await loginPage.signIn(USERNAME, PASSWORD)
  await orderCreationPage.statusButton.checkDisabled(false);
  await orderCreationPage.nameField.checkVisible();
})

test('TL-22-2 Mocked auth + order creation', async ({ page }) => {
  const name = 'qwertyyywefbfg';
  const phone = 'fwerfwergwergwe';
  const comment = 'fwfqefqwefq';
  const orderId = 79789879;
  const responseBody = {
    status: 'OPEN',
    courierId: null,
    customerName: name,
    customerPhone: phone,
    comment: comment,
    id: orderId
  };

  const loginPage = new LoginPage(page)
  await loginPage.open()
  await page.route('**/login/student', async route => {
    const responseBody = 'test.test.test'
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: responseBody
    })
  })
  const orderCreationPage = await loginPage.signIn(USERNAME, PASSWORD);
  await orderCreationPage.statusButton.checkDisabled(false);
  await orderCreationPage.nameField.checkVisible();
  await orderCreationPage.nameField.fill(name);
  await orderCreationPage.phoneField.fill(phone);
  await orderCreationPage.commentField.fill(comment);
  await orderCreationPage.createOrderButton.checkDisabled(false);
  await page.route('**/orders**', async route => {
    const method = route.request().method();
    switch (method) {
      case 'POST': {
        return await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(responseBody)
        })
      }
      case 'GET': {
        return await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(responseBody)
        })
      }
      default: {
        return await route.continue();
      }
    }
  })
  const createOrderResponse = page.waitForResponse(response => response.url().includes('orders') && response.request().method() === 'POST');
  await orderCreationPage.createOrderButton.click();
  await createOrderResponse;
  await orderCreationPage.checkCreatedOrderID(orderId);
  await orderCreationPage.notificationPopupClose.click();
  await orderCreationPage.statusButton.click();
  await orderCreationPage.searchOrderInput.fill(`${orderId}`);
  const searchOrderResponse = page.waitForResponse(response => response.url().includes('orders') && response.request().method() === 'GET')
  await orderCreationPage.trackingButton.click();
  await searchOrderResponse;
  expect(page.url().includes(`${orderId}`)).toBeTruthy();
})
