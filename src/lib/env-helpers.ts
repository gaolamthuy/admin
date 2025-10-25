/**
 * Environment helper utilities
 * Provides environment detection and validation functions
 */

import { env, envSchema } from './env';

/**
 * Environment detection helpers
 */
export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

/**
 * Validate environment configuration
 * @returns Validation result with success status and error message if any
 */
export const validateEnvironment = () => {
  try {
    envSchema.parse(import.meta.env);
    return { success: true, error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown validation error';
    return { success: false, error: errorMessage };
  }
};

/**
 * Check if all required environment variables are present
 * @returns Array of missing variables
 */
export const checkRequiredVariables = (): string[] => {
  const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'NODE_ENV'];

  const missing: string[] = [];

  required.forEach(variable => {
    const envValue = import.meta.env[variable as keyof ImportMetaEnv];
    if (!envValue) {
      missing.push(variable);
    }
  });

  return missing;
};

/**
 * Validate Supabase configuration
 * @returns Validation result
 */
export const validateSupabaseConfig = () => {
  const errors: string[] = [];

  // Check URL format
  try {
    new URL(env.VITE_SUPABASE_URL);
  } catch {
    errors.push('Invalid Supabase URL format');
  }

  // Check URL contains supabase
  if (!env.VITE_SUPABASE_URL.includes('supabase')) {
    errors.push("Supabase URL should contain 'supabase'");
  }

  // Check key is not empty
  if (!env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY.length === 0) {
    errors.push('Supabase anonymous key is required');
  }

  // Production-specific checks
  if (isProduction) {
    if (!env.VITE_SUPABASE_URL.includes('supabase.co')) {
      errors.push('Production must use Supabase hosted URL (*.supabase.co)');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Log environment information (development only)
 */
export const logEnvironmentInfo = () => {
  if (!isDevelopment) return;

  console.log('🔧 Environment Configuration:');
  console.log(`  • Environment: ${env.NODE_ENV}`);
  console.log(`  • Supabase URL: ${env.VITE_SUPABASE_URL}`);
  console.log(`  • App Title: ${env.VITE_APP_TITLE || 'Not set'}`);
  console.log(`  • App Version: ${env.VITE_APP_VERSION || 'Not set'}`);
};

/**
 * Check if .env.local file exists (development only)
 * Note: This is a helper function - actual file check should be done at build time
 */
export const checkEnvironmentFile = () => {
  if (!isDevelopment) return true;

  const missing = checkRequiredVariables();
  if (missing.length > 0) {
    console.warn('⚠️  Missing environment variables:');
    missing.forEach(variable => {
      console.warn(`  • ${variable}`);
    });
    return false;
  }

  return true;
};

/**
 * Suggest environment setup steps
 */
export const suggestEnvironmentSetup = () => {
  const missing = checkRequiredVariables();

  if (missing.length === 0) {
    return null;
  }

  return {
    message: 'Environment setup required',
    steps: [
      '1. Copy .env.example to .env.local',
      '2. Fill in the following variables:',
      ...missing.map(v => `   - ${v}`),
      '3. Restart the development server',
    ],
  };
};

/**
 * Get environment information for debugging
 */
export const getEnvironmentInfo = () => ({
  environment: env.NODE_ENV,
  isDevelopment,
  isProduction,
  isTest,
  supabaseUrl: env.VITE_SUPABASE_URL,
  appTitle: env.VITE_APP_TITLE,
  appVersion: env.VITE_APP_VERSION,
  timestamp: new Date().toISOString(),
});

/**
 * Monitor environment health
 */
export const monitorEnvironment = () => {
  const validation = validateEnvironment();
  const supabaseConfig = validateSupabaseConfig();
  const requiredVars = checkRequiredVariables();

  return {
    valid:
      validation.success && supabaseConfig.valid && requiredVars.length === 0,
    validation,
    supabaseConfig,
    missingVariables: requiredVars,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Get environment setup documentation
 */
export const getEnvironmentDocumentation = () => ({
  required: ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'],
  optional: ['VITE_APP_TITLE', 'VITE_APP_VERSION'],
  format: {
    VITE_SUPABASE_URL: 'https://your-project.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'your-anon-key-here',
    VITE_APP_TITLE: 'My Application',
    VITE_APP_VERSION: '1.0.0',
  },
  examples: {
    development: '.env.local',
    production: '.env.production',
    test: '.env.test',
  },
  documentation: 'See docs/environment.md for more details',
});
