import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as crypto from 'crypto';

export interface CreatePaymentRequest {
  amount: number;
  transactionCode: string;
  description: string;
  returnUrl: string;
  cancelUrl: string;
}

export interface CreatePaymentResponse {
  paymentUrl: string;
  gatewayTransactionId: string;
}

@Injectable()
export class PaymentGatewayService {
  private readonly logger = new Logger(PaymentGatewayService.name);
  private readonly apiKey: string;
  private readonly secretKey: string;
  private readonly baseUrl: string;

  constructor() {
    this.apiKey = process.env.SEPAY_API_KEY || '';
    this.secretKey = process.env.SEPAY_SECRET_KEY || '';
    this.baseUrl = process.env.SEPAY_BASE_URL || 'https://api.sepay.vn';
  }

  async createPayment(request: CreatePaymentRequest): Promise<CreatePaymentResponse> {
    try {
      const payload = {
        amount: request.amount,
        orderId: request.transactionCode,
        description: request.description,
        returnUrl: request.returnUrl,
        cancelUrl: request.cancelUrl,
        timestamp: Date.now(),
      };

      const signature = this.generateSignature(payload);

      const response = await axios.post(`${this.baseUrl}/api/payment/create`, {
        ...payload,
        signature,
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      this.logger.log(`Payment created successfully for transaction: ${request.transactionCode}`);

      return {
        paymentUrl: response.data.paymentUrl,
        gatewayTransactionId: response.data.transactionId,
      };
    } catch (error) {
      this.logger.error(`Error creating payment: ${error.message}`);
      throw new Error('Failed to create payment');
    }
  }

  async verifyPayment(gatewayTransactionId: string, gatewayData: any): Promise<boolean> {
    try {
      const payload = {
        transactionId: gatewayTransactionId,
        timestamp: Date.now(),
      };

      const signature = this.generateSignature(payload);

      const response = await axios.post(`${this.baseUrl}/api/payment/verify`, {
        ...payload,
        signature,
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data.status === 'SUCCESS';
    } catch (error) {
      this.logger.error(`Error verifying payment: ${error.message}`);
      return false;
    }
  }

  verifyWebhookSignature(payload: any, signature: string): boolean {
    try {
      const expectedSignature = this.generateSignature(payload);
      return signature === expectedSignature;
    } catch (error) {
      this.logger.error(`Error verifying webhook signature: ${error.message}`);
      return false;
    }
  }

  private generateSignature(payload: any): string {
    if (!this.secretKey) {
      throw new Error('SEPAY_SECRET_KEY is not configured');
    }

    const sortedKeys = Object.keys(payload).sort();
    const queryString = sortedKeys
      .map(key => `${key}=${payload[key]}`)
      .join('&');

    return crypto
      .createHmac('sha256', this.secretKey)
      .update(queryString)
      .digest('hex');
  }
} 