declare global {
  interface Window {
    Razorpay: any;
  }
}

export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    // If the script is already loaded, resolve immediately
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

interface ProcessPaymentArgs {
  amount: number; // in paise
  orderId: string;
  name: string;
  description: string;
  notes: any; // e.g. { studentId, type, itemId }
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  onSuccess: (response: any) => void;
  onFailure: (error: any) => void;
}

export const processPayment = async ({
  amount,
  orderId,
  name,
  description,
  notes,
  prefill,
  onSuccess,
  onFailure,
}: ProcessPaymentArgs) => {
  const isLoaded = await loadRazorpayScript();

  if (!isLoaded) {
    onFailure(new Error('Razorpay SDK failed to load. Are you online?'));
    return;
  }

  const options = {
    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // Use NEXT_PUBLIC_ for client side
    amount: amount.toString(), // amount in paise
    currency: 'INR',
    name: name,
    description: description,
    order_id: orderId, // This is the orderId we generated on our backend
    handler: function (response: any) {
      // The payment succeeded on the client side.
      // Razorpay will also fire a webhook to your server.
      onSuccess(response);
    },
    prefill: prefill || {
      name: '',
      email: '',
      contact: '',
    },
    notes: notes,
    theme: {
      color: '#06b6d4', // cyan-500 from your tailwind config to match branding
    },
  };

  const paymentObject = new window.Razorpay(options);
  
  paymentObject.on('payment.failed', function (response: any) {
    onFailure(response.error);
  });

  paymentObject.open();
};
