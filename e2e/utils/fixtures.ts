let counter = Date.now();

/** Generate a unique email for test isolation */
export function uniqueEmail(prefix = 'e2e'): string {
  counter++;
  return `${prefix}.${counter}@test-closet.local`;
}

/** Generate a unique name */
export function uniqueName(prefix = 'E2E User'): string {
  counter++;
  return `${prefix} ${counter}`;
}

export const TEST_PASSWORD = 'Test1234!';

export const VALID_GARMENT = {
  name: 'Vestido Azul Verano',
  category: 'dresses',
  color: 'azul marino',
  brand: 'Zara',
  size: 'M',
  notes: 'Mi vestido favorito para el verano',
};

export const VALID_OUTFIT = {
  name: 'Look Playero',
  type: 'casual',
  occasion: 'vacaciones',
  season: 'verano',
};

export const GARMENT_CATEGORIES = [
  'shirts', 'blouses', 'tshirts', 'sweaters', 'hoodies',
  'jackets', 'coats', 'sportswear', 'formalwear', 'pants',
  'jeans', 'shorts', 'skirts', 'dresses', 'jumpsuits', 'suits',
  'sneakers', 'boots', 'heels', 'sandals', 'flats',
  'bags', 'hats', 'other',
] as const;

export const OUTFIT_TYPES = [
  'casual', 'formal', 'sport', 'evening', 'beach', 'work', 'special',
] as const;
