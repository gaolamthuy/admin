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

  // Cloudinary (client-side unsigned upload)
  VITE_CLOUDINARY_CLOUD_NAME: z
    .string()
    .optional()
    .describe('Cloudinary cloud name (public on client)'),
  VITE_CLOUDINARY_UPLOAD_PRESET: z
    .string()
    .optional()
    .describe('Cloudinary unsigned upload preset (public on client)'),
  VITE_CLOUDINARY_FOLDER: z
    .string()
    .optional()
    .describe('Cloudinary folder prefix, e.g. staging/products'),
  // Cloudinary signed upload (for overwrite capability)
  // ⚠️ WARNING: API_SECRET should NOT be exposed in production client-side code
  // For production, use Supabase Edge Function or backend API to generate signature
  VITE_CLOUDINARY_API_KEY: z
    .string()
    .optional()
    .describe('Cloudinary API key (for signed upload, DEV ONLY)'),
  VITE_CLOUDINARY_API_SECRET: z
    .string()
    .optional()
    .describe(
      'Cloudinary API secret (for signed upload, DEV ONLY - DO NOT COMMIT)'
    ),
});

/**
 * Type inference from schema
 */
export type Environment = z.infer<typeof envSchema>;

/**
 * Validate and parse environment variables
 */
let env: Environment | undefined;

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

    // In test environment, provide safe fallbacks to allow component tests to run
    const isTest =
      import.meta.env.MODE === 'test' ||
      (typeof process !== 'undefined' && Boolean(process.env?.VITEST));

    if (isTest) {
      const fallback: Partial<Environment> = {
        VITE_SUPABASE_URL: 'https://example.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'test-anon-key',
        NODE_ENV: 'test',
      };

      try {
        env = envSchema.parse({ ...fallback, ...import.meta.env });
        console.warn(
          '⚠️ Using test fallback environment values for validation in Vitest.'
        );
      } catch {
        // If even fallback fails, proceed to standard failure path below
      }
    }

    // If env has been set (e.g., via test fallback), skip failing
    if (env !== undefined) {
      // no-op: env is valid, carry on
    } else {
      // Fail fast in production
      if (import.meta.env.PROD) {
        process.exit(1);
      }

      // Throw error to prevent app from running with invalid config
      throw new Error(
        'Environment validation failed. Check console for details.'
      );
    }
  } else {
    throw error;
  }
}

// Type assertion: env is guaranteed to be defined at this point
if (env === undefined) {
  throw new Error('Environment validation failed: env is undefined');
}

const validatedEnv = env;

/**
 * Export validated environment
 */
export { validatedEnv as env };

/**
 * Export schema for testing
 */
export { envSchema };
