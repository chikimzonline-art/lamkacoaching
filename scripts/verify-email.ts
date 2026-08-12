import { createClerkClient } from '@clerk/backend';

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
  publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
});

async function verifyEmail() {
  try {
    const users = await clerkClient.users.getUserList({ query: 'admin' });
    const user = users.data[0];
    
    if (user) {
      console.log("Found user:", user.id);
      const emailId = user.emailAddresses[0]?.id;
      if (emailId) {
        await clerkClient.emailAddresses.updateEmailAddress(emailId, {
          verified: true
        });
        console.log("Email verified!");
      }
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

verifyEmail();
