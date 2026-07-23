const fs = require('fs');
const path = require('path');

// Remove lock files from other package managers
try {
  fs.unlinkSync(path.join(__dirname, 'package-lock.json'));
} catch (err) {
  // Ignore if file doesn't exist
}

try {
  fs.unlinkSync(path.join(__dirname, 'yarn.lock'));
} catch (err) {
  // Ignore if file doesn't exist
}

// Enforce pnpm usage
// Temporarily disabled for Windows compatibility
// if (!process.env.npm_config_user_agent?.startsWith('pnpm/')) {
//   console.error('Use pnpm instead');
//   process.exit(1);
// }