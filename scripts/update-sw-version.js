#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SW_PATH = path.join(__dirname, '..', 'public', 'sw.js');
const PACKAGE_JSON_PATH = path.join(__dirname, '..', 'package.json');

function updateServiceWorkerVersion() {
  try {
    // Read package.json to get the current version
    const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));
    const appVersion = packageJson.version;

    if (!appVersion) {
      console.error('Could not find version in package.json');
      process.exit(1);
    }

    // Read the service worker file
    const swContent = fs.readFileSync(SW_PATH, 'utf8');

    // Replace the version placeholder with the actual version
    const updatedContent = swContent.replace(/__APP_VERSION__/g, appVersion);

    // Only write if there was a change
    if (updatedContent !== swContent) {
      fs.writeFileSync(SW_PATH, updatedContent, 'utf8');
      console.log(`✅ Service worker version updated to v${appVersion}`);
    } else {
      console.log(`ℹ️  Service worker already up to date (v${appVersion})`);
    }
  } catch (error) {
    console.error('Error updating service worker version:', error);
    process.exit(1);
  }
}

// Run the update
updateServiceWorkerVersion();
