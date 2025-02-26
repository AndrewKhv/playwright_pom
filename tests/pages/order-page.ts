import { Page } from '@playwright/test'
import { Input } from '../atoms/Input'
import { Button } from '../atoms/Button'

export class OrderPage {
  readonly page: Page
  readonly statusButton: Button
  readonly nameField: Input;
  readonly phoneField: Input;
  readonly commentField: Input;

  constructor(page: Page) {
    this.page = page
    this.statusButton = new Button(page, '[data-name="openStatusPopup-button"]')
    this.nameField = new Input(page, '#name')
    this.phoneField = new Input(page, '#phone')
    this.commentField = new Input(page, '#comment')
  }
}
