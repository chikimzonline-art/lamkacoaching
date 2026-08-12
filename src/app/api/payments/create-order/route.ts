import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // We expect students to be logged in, or at least pass some studentId
    // If you allow anonymous checkouts, you can remove this check
    if (!session?.user) {
       // Just a warning log, we won't block it strictly here if your app allows guest checkout, 
       // but typically you'd want auth.
       console.warn('Creating order without active session');
    }

    const { amount, notes } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    const options = {
      amount: amount, // amount in the smallest currency unit (paise)
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
      notes: notes || {}, // Used to store studentId, courseId, cabinId, etc.
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({ orderId: order.id }, { status: 200 });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
