import { execSync } from 'child_process';

const isProd = process.argv[2] === 'prod';
const envMode = isProd ? 'production' : 'development';
const targetUrl = isProd
  ? process.env.CAPACITOR_SERVER_URL || 'https://lamkacoaching.in/login'
  : 'http://localhost:3000/login';

console.log(`\n========================================`);
console.log(`🚀 Capacitor Android Sync: [${envMode.toUpperCase()}]`);
console.log(`🌐 Active Target URL: ${targetUrl}`);
console.log(`========================================\n`);

try {
  // Use bunx or local cli binary for cross-platform reliability on Windows
  execSync('bunx cap sync android', {
    stdio: 'inherit',
    env: {
      ...process.env,
      CAP_ENV: envMode,
      CAPACITOR_SERVER_URL: targetUrl,
    },
  });
  console.log(`\n✅ Capacitor Android sync completed successfully for ${envMode}!\n`);
} catch (error) {
  console.error(`\n❌ Failed to sync Capacitor:`, error);
  process.exit(1);
}
