/**
 * Interface representing parsed order data extracted from emails
 */
export interface ParsedOrderData {
  orderNumber: string | null;
  supplier: string | null;
  status: string;
  estimatedArrival?: string | null;
  deliveredAt?: string | null;
  productList?: Array<{
    name: string;
    quantity: number;
    price?: number | null;
  }> | null;
  totalPrice?: number | null;
  currency?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  additionalNotes?: string | null;
} 