/**
 * Environment Variable Setup Utility for Gao Lam Thuy POS
 * 
 * This script helps to set up environment variables for development or production.
 * It checks if the required environment variables are set and helps create
 * a development environment file if needed.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require("child_process");
const readline = require('readline');

// Define the required environment variables
const REQUIRED_ENV_VARS = [
  'REACT_APP_SUPABASE_URL',
  'REACT_APP_SUPABASE_SERVICE_KEY',
  'REACT_APP_BACKEND_URL',
  'REACT_APP_API_USERNAME',
  'REACT_APP_API_PASSWORD',
  'REACT_APP_PRINT_AGENT_ID'
];

// Create a readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to check if .env file exists
function checkEnvFile() {
  const envPath = path.join(__dirname, '.env');
  
  try {
    fs.accessSync(envPath, fs.constants.F_OK);
    console.log('✅ .env file exists');
    return true;
  } catch (err) {
    console.log('❌ .env file not found');
    return false;
  }
}

// Function to check if .env.example exists
function checkEnvExampleFile() {
  const envExamplePath = path.join(__dirname, '.env.example');
  
  try {
    fs.accessSync(envExamplePath, fs.constants.F_OK);
    console.log('✅ .env.example file exists');
    return true;
  } catch (err) {
    console.log('❌ .env.example file not found');
    return false;
  }
}

// Function to create .env file from .env.example
function createEnvFromExample() {
  const envExamplePath = path.join(__dirname, '.env.example');
  const envPath = path.join(__dirname, '.env');
  
  try {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ Created .env file from .env.example');
    return true;
  } catch (err) {
    console.error('❌ Failed to create .env file:', err.message);
    return false;
  }
}

// Function to check if all required env vars are in the file
function checkEnvVars() {
  const envPath = path.join(__dirname, '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  const missingVars = [];
  
  REQUIRED_ENV_VARS.forEach(varName => {
    const regex = new RegExp(`^${varName}=.+`, 'm');
    if (!regex.test(envContent)) {
      missingVars.push(varName);
    } else {
      // Check if it's just a placeholder
      const placeholderRegex = new RegExp(`^${varName}=.*placeholder.*|^${varName}=your_|^${varName}=replace_with_`, 'im');
      if (placeholderRegex.test(envContent)) {
        missingVars.push(varName);
      }
    }
  });
  
  if (missingVars.length === 0) {
    console.log('✅ All required environment variables are set');
    return true;
  } else {
    console.log('❌ The following required environment variables are missing or using placeholder values:');
    missingVars.forEach(varName => {
      console.log(`   - ${varName}`);
    });
    return false;
  }
}

// Interactive setup function
function setupEnvironment() {
  console.log('🚀 Welcome to the Gao Lam Thuy POS Environment Setup! 🚀\n');
  
  const hasEnvFile = checkEnvFile();
  const hasEnvExampleFile = checkEnvExampleFile();
  
  if (!hasEnvFile && hasEnvExampleFile) {
    console.log('\nCreating .env file from .env.example...');
    createEnvFromExample();
    console.log('\n⚠️ Please edit the .env file with your actual credentials.');
    console.log('  The current values are just placeholders and will not work.\n');
  } else if (!hasEnvFile && !hasEnvExampleFile) {
    console.error('\n❌ Error: Both .env and .env.example files are missing.');
    console.log('  Please check the project documentation for setup instructions.\n');
    process.exit(1);
  }
  
  if (hasEnvFile) {
    const allVarsSet = checkEnvVars();
    if (!allVarsSet) {
      console.log('\n⚠️ Please update your .env file with the missing environment variables.');
      console.log('  The application will not function correctly without them.\n');
} else {
      console.log('\n🎉 Everything is set up correctly! You can now run the application.\n');
    }
  }
  
  rl.close();
}

// Run the setup
setupEnvironment();

// Create Preload script for Electron
const preloadPath = path.join(__dirname, "preload.js");
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
console.log("Created preload.js file");

// Create some default tables for testing if they don't exist in Supabase
console.log("\nImportant Note:");
console.log("Make sure your Supabase database has the following tables:");
console.log("1. kiotviet_products - for product listings");
console.log("2. kiotviet_customers - for customer information");
console.log("3. kiotviet_branches - for store branches");
console.log("4. kiotviet_staff - for staff members");
console.log("5. system - for storing settings like the KiotViet API token");
console.log("\nA SQL script to create these tables has been included:");
console.log(
  "create-tables.sql - Run this in your Supabase SQL Editor to create the required tables"
);

// Try to install dependencies
try {
  console.log("\nInstalling dependencies...");
  execSync("npm install", { stdio: "inherit" });
  console.log("Dependencies installed successfully");
} catch (error) {
  console.error("Failed to install dependencies:", error.message);
  console.log('Please run "npm install" manually');
}

console.log("\nSetup complete!");
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
