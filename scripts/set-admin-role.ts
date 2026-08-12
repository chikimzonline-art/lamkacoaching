import { createClerkClient } from '@clerk/backend';

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
  publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
});

async function setAdminRole() {
  const identifier = process.argv[2] || 'admin@lamkacoaching.com';

  try {
    console.log(`Searching for user: ${identifier}...`);
    const users = await clerkClient.users.getUserList({ query: identifier });

    if (users.data.length === 0) {
      console.error(`No user found matching "${identifier}".`);
      console.error('Try passing a username or email as an argument.');
      return;
    }

    const user = users.data[0];
    console.log(`Found user: ${user.username || user.emailAddresses[0]?.emailAddress} (ID: ${user.id})`);
    console.log(`Current role: ${user.publicMetadata?.role || '(none)'}`);

    await clerkClient.users.updateUserMetadata(user.id, {
      publicMetadata: {
        role: 'admin',
      },
    });

    console.log('Successfully set role to "admin"!');
  } catch (error) {
    console.error('Error setting admin role:', JSON.stringify(error, null, 2));
  }
}

setAdminRole();
