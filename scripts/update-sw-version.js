#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const SW_PATH = path.join(__dirname, '..', 'public', 'sw.js');

function updateServiceWorkerVersion() {
  try {
    // Read the service worker file
    let swContent = fs.readFileSync(SW_PATH, 'utf8');

    // Find the current cache name
    const cacheNameRegex = /const CACHE_NAME = 'alamo-pwa-v(\d+)'/;
    const match = swContent.match(cacheNameRegex);

    if (!match) {
      console.error('Could not find CACHE_NAME in service worker file');
      process.exit(1);
    }

    const currentVersion = parseInt(match[1], 10);
    const newVersion = currentVersion + 1;

    // Replace the cache name with the new version
    swContent = swContent.replace(
      cacheNameRegex,
      `const CACHE_NAME = 'alamo-pwa-v${newVersion}'`
    );

    // Write the updated service worker file
    fs.writeFileSync(SW_PATH, swContent, 'utf8');

    console.log(
      `✅ Service worker cache version updated from v${currentVersion} to v${newVersion}`
    );
    console.log(`📝 Updated file: ${SW_PATH}`);
  } catch (error) {
    console.error('Error updating service worker version:', error);
    process.exit(1);
  }
}

// Run the update if this script is executed directly
if (require.main === module) {
  updateServiceWorkerVersion();
}

module.exports = updateServiceWorkerVersion;
