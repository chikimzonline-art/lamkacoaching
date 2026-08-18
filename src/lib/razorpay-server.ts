import Razorpay from 'razorpay';
import crypto from 'crypto';
import { env } from "@/env";

export const createRazorpayOrder = async (amount: number, receipt: string, notes: any = {}) => {
  const razorpay = new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
  });

  const options = {
    amount, // amount in the smallest currency unit (paise)
    currency: 'INR',
    receipt,
    notes,
  };

  return razorpay.orders.create(options);
};

export const verifyRazorpaySignature = (bodyText: string, signature: string, secret: string) => {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(bodyText)
    .digest('hex');

  return expectedSignature === signature;
};
