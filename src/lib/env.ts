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
  // Neon configuration
  VITE_NEON_AUTH_URL: z
    .string()
    .url('Invalid Neon Auth URL format')
    .describe('Neon Auth URL'),
  VITE_NEON_DATA_API_URL: z
    .string()
    .url('Invalid Neon Data API URL format')
    .describe('Neon Data API URL'),

  // n8n webhook configuration
  VITE_N8N_WEBHOOK_URL: z
    .string()
    .url('Invalid n8n webhook URL format')
    .optional()
    .describe(
      'Base URL for n8n webhooks, e.g. https://n8n.example.com/webhook'
    ),
  VITE_N8N_WEBHOOK_BASIC_AUTH: z
    .string()
    .optional()
    .describe('Basic auth credential (username:password) for n8n webhooks'),
  VITE_N8N_WEBHOOK_HEADER_KEY: z
    .string()
    .optional()
    .describe('Custom header key required by n8n webhook'),
  VITE_N8N_WEBHOOK_HEADER_VALUE: z
    .string()
    .optional()
    .describe('Custom header value required by n8n webhook'),

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
    console.error('  • VITE_NEON_AUTH_URL: https://ep-xxx.neonauth.../neondb/auth');
    console.error('  • VITE_NEON_DATA_API_URL: https://ep-xxx.../neondb/rest/v1');

    console.error('\n💡 Setup instructions:');
    console.error('  1. Copy .env.example to .env.local');
    console.error('  2. Fill in your Neon credentials');
    console.error('  3. Restart the development server');

    console.error('\n📚 Documentation:');
    console.error('  See docs/environment.md for more details');

    // In test environment, provide safe fallbacks to allow component tests to run
    const isTest =
      import.meta.env.MODE === 'test' ||
      (typeof process !== 'undefined' && Boolean(process.env?.VITEST));

    if (isTest) {
      const fallback: Partial<Environment> = {
        VITE_NEON_AUTH_URL: 'https://example.neonauth.aws.neon.tech/neondb/auth',
        VITE_NEON_DATA_API_URL: 'https://example.aws.neon.tech/neondb/rest/v1',
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
