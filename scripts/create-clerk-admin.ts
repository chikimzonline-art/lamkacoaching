import { createClerkClient } from '@clerk/backend';

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
  publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
});

async function createAdmin() {
  try {
    console.log("Creating user in Clerk...");
    const user = await clerkClient.users.createUser({
      username: 'admin',
      emailAddress: ['admin@lamkacoaching.com'],
      password: 'admin123password',
      skipPasswordRequirement: true,
      skipPasswordChecks: true,
      publicMetadata: {
        role: 'admin',
      },
    });
    
    console.log("Successfully created user!");
    console.log("User ID:", user.id);
    console.log("Username:", user.username);
  } catch (error) {
    console.error("Error creating user:", JSON.stringify(error, null, 2));
  }
}

createAdmin();
