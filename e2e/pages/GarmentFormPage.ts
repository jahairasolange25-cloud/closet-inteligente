import { type Locator, type Page } from '@playwright/test';

export class GarmentFormPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly nameInput: Locator;
  readonly categorySelect: Locator;
  readonly colorInput: Locator;
  readonly brandInput: Locator;
  readonly sizeInput: Locator;
  readonly notesTextarea: Locator;
  readonly submitButton: Locator;
  readonly backButton: Locator;
  readonly imageUploader: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: /Añadir Prenda/ });
    this.nameInput = page.getByLabel('Nombre');
    this.categorySelect = page.getByLabel('Categoría');
    this.colorInput = page.getByLabel('Color');
    this.brandInput = page.getByLabel('Marca');
    this.sizeInput = page.getByLabel('Talla');
    this.notesTextarea = page.getByLabel('Notas');
    this.submitButton = page.getByRole('button', { name: /Guardar prenda|Guardar/ });
    this.backButton = page.getByRole('button', { name: 'Volver' });
    this.imageUploader = page.getByLabel('Subir imagen de prenda');
  }

  async goto() {
    await this.page.goto('/garments/new');
    await this.page.waitForLoadState('networkidle');
  }

  async fillForm(data: {
    name: string;
    category: string;
    color?: string;
    brand?: string;
    size?: string;
    notes?: string;
  }) {
    await this.nameInput.fill(data.name);
    await this.categorySelect.selectOption(data.category);
    if (data.color) await this.colorInput.fill(data.color);
    if (data.brand) await this.brandInput.fill(data.brand);
    if (data.size) await this.sizeInput.fill(data.size);
    if (data.notes) await this.notesTextarea.fill(data.notes);
  }

  async submit() {
    await this.submitButton.click();
  }

  async uploadImage(filePath: string) {
    const fileChooser = await this.page.waitForEvent('filechooser');
    await this.imageUploader.click();
    await fileChooser.setFiles(filePath);
  }

  async waitForRedirectToDetail() {
    await this.page.waitForURL(/\/garments\/[0-9a-f-]+/, { timeout: 15_000 });
  }
}
