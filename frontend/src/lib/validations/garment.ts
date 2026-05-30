import { z } from 'zod';

const GARMENT_CATEGORIES = [
  'shirts', 'blouses', 'tshirts', 'sweaters', 'hoodies',
  'jackets', 'coats', 'sportswear', 'formalwear',
  'pants', 'jeans', 'shorts', 'skirts',
  'dresses', 'jumpsuits', 'suits',
  'sneakers', 'boots', 'heels', 'sandals', 'flats',
  'hats', 'scarves', 'belts', 'bags', 'jewelry', 'sunglasses',
  'underwear', 'socks', 'swimwear', 'other',
] as const;

export const createGarmentSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(100, 'Máximo 100 caracteres'),
  category: z.enum(GARMENT_CATEGORIES, { errorMap: () => ({ message: 'Categoría inválida' }) }),
  color: z.string().max(50).optional(),
  brand: z.string().max(100).optional(),
  size: z.string().max(20).optional(),
  material: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().max(500).optional(),
});

export type CreateGarmentFormData = z.infer<typeof createGarmentSchema>;
