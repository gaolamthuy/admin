/**
 * Environment validation with Zod
 * Validates and provides type-safe access to environment variables
 */

import { z } from 'zod';

/**
 * Environment schema definition
 * Validates all required and optional environment variables
 */
const envSchema = z.object({
  // Supabase configuration
  VITE_SUPABASE_URL: z
    .string()
    .url('Invalid Supabase URL format')
    .describe('Supabase project URL'),
  VITE_SUPABASE_ANON_KEY: z
    .string()
    .min(1, 'Supabase anonymous key is required')
    .describe('Supabase anonymous key'),

  // Node environment
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development')
    .describe('Node environment'),

  // Application metadata (optional)
  VITE_APP_TITLE: z.string().optional().describe('Application title'),
  VITE_APP_VERSION: z.string().optional().describe('Application version'),
});

/**
 * Type inference from schema
 */
export type Environment = z.infer<typeof envSchema>;

/**
 * Validate and parse environment variables
 */
let env: Environment;

try {
  env = envSchema.parse(import.meta.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('❌ Environment validation failed:');
    console.error('\n📋 Validation errors:');
    error.errors.forEach(err => {
      const path = err.path.join('.');
      console.error(`  • ${path}: ${err.message}`);
    });

    console.error('\n📝 Required environment variables:');
    console.error('  • VITE_SUPABASE_URL: https://your-project.supabase.co');
    console.error('  • VITE_SUPABASE_ANON_KEY: your-anon-key');

    console.error('\n💡 Setup instructions:');
    console.error('  1. Copy .env.example to .env.local');
    console.error('  2. Fill in your Supabase credentials');
    console.error('  3. Restart the development server');

    console.error('\n📚 Documentation:');
    console.error('  See docs/environment.md for more details');

    // Fail fast in production
    if (import.meta.env.PROD) {
      process.exit(1);
    }

    // Throw error to prevent app from running with invalid config
    throw new Error(
      'Environment validation failed. Check console for details.'
    );
  }

  throw error;
}

/**
 * Export validated environment
 */
export { env };

/**
 * Export schema for testing
 */
export { envSchema };
