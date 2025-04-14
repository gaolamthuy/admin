const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Ensure the .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  const envContent = `REACT_APP_SUPABASE_URL=https://supabase.gaolamthuy.vn
REACT_APP_SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogInNlcnZpY2Vfcm9sZSIsCiAgImlzcyI6ICJzdXBhYmFzZSIsCiAgImlhdCI6IDE3NDMzNTQwMDAsCiAgImV4cCI6IDE5MDExMjA0MDAKfQ.Ovdk9UIxb4FNfRDD8a_gCoXINuNs2gE64LhlJ-KXVe8
REACT_APP_KIOTVIET_BASE_URL=https://public.kiotapi.com
`;
  fs.writeFileSync(envPath, envContent);
  console.log('Created .env file');
} else {
  console.log('.env file already exists');
}

// Create Preload script for Electron
const preloadPath = path.join(__dirname, 'preload.js');
const preloadContent = `const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  "electron", {
    ipcRenderer: {
      send: (channel, data) => {
        // whitelist channels
        const validChannels = ["print-invoice"];
        if (validChannels.includes(channel)) {
          ipcRenderer.send(channel, data);
        }
      },
      receive: (channel, func) => {
        const validChannels = ["print-response"];
        if (validChannels.includes(channel)) {
          // Deliberately strip event as it includes \`sender\`
          ipcRenderer.on(channel, (event, ...args) => func(...args));
        }
      }
    }
  }
);`;

fs.writeFileSync(preloadPath, preloadContent);
console.log('Created preload.js file');

// Create some default tables for testing if they don't exist in Supabase
console.log('\nImportant Note:');
console.log('Make sure your Supabase database has the following tables:');
console.log('1. kiotviet_products - for product listings');
console.log('2. kiotviet_customers - for customer information');
console.log('3. kiotviet_branches - for store branches');
console.log('4. kiotviet_staff - for staff members');
console.log('5. system - for storing settings like the KiotViet API token');
console.log('\nA SQL script to create these tables has been included:');
console.log('create-tables.sql - Run this in your Supabase SQL Editor to create the required tables');

// Try to install dependencies
try {
  console.log('\nInstalling dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  console.log('Dependencies installed successfully');
} catch (error) {
  console.error('Failed to install dependencies:', error.message);
  console.log('Please run "npm install" manually');
}

console.log('\nSetup complete!');
console.log(`
Next steps:
1. If you don't have the required tables in your Supabase database:
   - Go to your Supabase project
   - Open SQL Editor
   - Run the queries in create-tables.sql
   - Update the KiotViet token in the system table
2. Run "npm run dev" to start the development server
3. The default login password is "admin123"
4. If you encounter connection issues, use the Diagnostics button in the app
`); 