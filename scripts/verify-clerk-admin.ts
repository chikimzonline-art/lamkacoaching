import { createClerkClient } from '@clerk/backend';

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
  publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
});

async function verifyAdminEmail() {
  try {
    console.log("Fetching admin user...");
    const users = await clerkClient.users.getUserList({ query: 'admin@lamkacoaching.com' });
    const user = users.data[0];
    
    if (!user) {
      console.log("Admin user not found.");
      return;
    }

    const emailId = user.emailAddresses[0]?.id;
    if (emailId) {
       console.log("Verifying email...");
       // Clerk Backend API does not have a direct "verify email" method, 
       // but we can update the user's email address directly by recreating or updating the email.
       // The easiest way is to use clerkClient.emails.createEmailAddress
       // Wait, we can just update the user with the email address and verified: true?
       // Actually, there is a `clerkClient.emailAddresses.updateEmailAddress`? No.
       // Let's just create a new user or use the exact params:
    }
  } catch (error) {
    console.error("Error:", JSON.stringify(error, null, 2));
  }
}

verifyAdminEmail();
