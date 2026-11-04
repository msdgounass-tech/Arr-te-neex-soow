export interface PaymentContext {
  paymentId: string;
  orderId: string;
  orderNumber: string;
  accessToken: string;
  amount: number;
  customerName: string;
  email?: string | null;
}

export interface CheckoutResult {
  providerReference: string;
  redirectUrl: string | null;
  extra?: Record<string, unknown>;
}
