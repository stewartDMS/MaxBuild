import { z } from 'zod';

/**
 * Schema for a single BOQ (Bill of Quantities) item
 */
export const BOQItemSchema = z.object({
  itemNumber: z.string().describe('Item number or reference code'),
  description: z.string().describe('Detailed description of the work item'),
  quantity: z.number().positive().describe('Quantity of the item'),
  unit: z.string().describe('Unit of measurement (e.g., m², m³, kg, nos)'),
  unitRate: z.number().min(0).optional().describe('Rate per unit (optional)'),
  amount: z.number().min(0).optional().describe('Total amount (quantity × unit rate)'),
  category: z.string().optional().describe('Category or trade (e.g., Civil, Electrical, Plumbing)'),
});

/**
 * Schema for the complete BOQ extraction result
 */
export const BOQExtractionSchema = z.object({
  projectName: z.string().optional().describe('Name of the project if mentioned'),
  projectLocation: z.string().optional().describe('Location of the project if mentioned'),
  items: z.array(BOQItemSchema).describe('Array of BOQ items extracted from the tender document'),
  totalEstimatedCost: z.number().positive().optional().describe('Total estimated cost if calculable'),
  currency: z.string().default('USD').describe('Currency of the amounts'),
  extractionDate: z.string().describe('Date of extraction (ISO format)'),
  notes: z.string().optional().describe('Any additional notes or observations'),
});

export type BOQItem = z.infer<typeof BOQItemSchema>;
export type BOQExtraction = z.infer<typeof BOQExtractionSchema>;
