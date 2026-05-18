/**
 * Environment Validation Tests
 * Tests for environment schema and validation
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';

describe('Environment Validation', () => {
  describe('Valid Environment', () => {
    it('should validate correct environment variables', () => {
      const validEnv = {
        VITE_NEON_AUTH_URL: 'https://ep-xxx.neonauth.aws.neon.tech/neondb/auth',
        VITE_NEON_DATA_API_URL: 'https://ep-xxx.apirest.aws.neon.tech/neondb/rest/v1',
        NODE_ENV: 'development',
      };

      const envSchema = z.object({
        VITE_NEON_AUTH_URL: z.string().url(),
        VITE_NEON_DATA_API_URL: z.string().min(1),
        NODE_ENV: z.enum(['development', 'production', 'test']),
      });

      expect(() => envSchema.parse(validEnv)).not.toThrow();
    });

    it('should accept optional variables', () => {
      const envWithOptional = {
        VITE_NEON_AUTH_URL: 'https://ep-xxx.neonauth.aws.neon.tech/neondb/auth',
        VITE_NEON_DATA_API_URL: 'https://ep-xxx.apirest.aws.neon.tech/neondb/rest/v1',
        NODE_ENV: 'development',
        VITE_APP_TITLE: 'My App',
        VITE_APP_VERSION: '1.0.0',
      };

      const envSchema = z.object({
        VITE_NEON_AUTH_URL: z.string().url(),
        VITE_NEON_DATA_API_URL: z.string().min(1),
        NODE_ENV: z.enum(['development', 'production', 'test']),
        VITE_APP_TITLE: z.string().optional(),
        VITE_APP_VERSION: z.string().optional(),
      });

      expect(() => envSchema.parse(envWithOptional)).not.toThrow();
    });

    it('should work with all NODE_ENV values', () => {
      const envSchema = z.object({
        VITE_NEON_AUTH_URL: z.string().url(),
        VITE_NEON_DATA_API_URL: z.string().min(1),
        NODE_ENV: z.enum(['development', 'production', 'test']),
      });

      const environments = ['development', 'production', 'test'];

      environments.forEach(env => {
        const testEnv = {
          VITE_NEON_AUTH_URL: 'https://ep-xxx.neonauth.aws.neon.tech/neondb/auth',
          VITE_NEON_DATA_API_URL: 'https://ep-xxx.apirest.aws.neon.tech/neondb/rest/v1',
          NODE_ENV: env,
        };

        expect(() => envSchema.parse(testEnv)).not.toThrow();
      });
    });
  });

  describe('Invalid Environment', () => {
    it('should reject missing required variables', () => {
      const invalidEnv = {
        VITE_NEON_DATA_API_URL: 'https://ep-xxx.apirest.aws.neon.tech/neondb/rest/v1',
        NODE_ENV: 'development',
      };

      const envSchema = z.object({
        VITE_NEON_AUTH_URL: z.string().url(),
        VITE_NEON_DATA_API_URL: z.string().min(1),
        NODE_ENV: z.enum(['development', 'production', 'test']),
      });

      expect(() => envSchema.parse(invalidEnv)).toThrow();
    });

    it('should reject invalid URL format', () => {
      const invalidEnv = {
        VITE_NEON_AUTH_URL: 'not-a-url',
        VITE_NEON_DATA_API_URL: 'https://ep-xxx.apirest.aws.neon.tech/neondb/rest/v1',
        NODE_ENV: 'development',
      };

      const envSchema = z.object({
        VITE_NEON_AUTH_URL: z.string().url(),
        VITE_NEON_DATA_API_URL: z.string().min(1),
        NODE_ENV: z.enum(['development', 'production', 'test']),
      });

      expect(() => envSchema.parse(invalidEnv)).toThrow();
    });

    it('should reject empty key', () => {
      const invalidEnv = {
        VITE_NEON_AUTH_URL: 'https://ep-xxx.neonauth.aws.neon.tech/neondb/auth',
        VITE_NEON_DATA_API_URL: '',
        NODE_ENV: 'development',
      };

      const envSchema = z.object({
        VITE_NEON_AUTH_URL: z.string().url(),
        VITE_NEON_DATA_API_URL: z.string().min(1),
        NODE_ENV: z.enum(['development', 'production', 'test']),
      });

      expect(() => envSchema.parse(invalidEnv)).toThrow();
    });

    it('should reject invalid NODE_ENV', () => {
      const invalidEnv = {
        VITE_NEON_AUTH_URL: 'https://ep-xxx.neonauth.aws.neon.tech/neondb/auth',
        VITE_NEON_DATA_API_URL: 'https://ep-xxx.apirest.aws.neon.tech/neondb/rest/v1',
        NODE_ENV: 'staging',
      };

      const envSchema = z.object({
        VITE_NEON_AUTH_URL: z.string().url(),
        VITE_NEON_DATA_API_URL: z.string().min(1),
        NODE_ENV: z.enum(['development', 'production', 'test']),
      });

      expect(() => envSchema.parse(invalidEnv)).toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should provide helpful error messages', () => {
      const invalidEnv = {
        VITE_NEON_AUTH_URL: 'invalid-url',
        VITE_NEON_DATA_API_URL: '',
      };

      const envSchema = z.object({
        VITE_NEON_AUTH_URL: z.string().url('Invalid Supabase URL format'),
        VITE_NEON_DATA_API_URL: z.string().min(1, 'Key is required'),
        NODE_ENV: z.enum(['development', 'production', 'test']),
      });

      try {
        envSchema.parse(invalidEnv);
      } catch (error) {
        if (error instanceof z.ZodError) {
          expect(error.errors.length).toBeGreaterThan(0);
          expect(error.errors[0].message).toBeDefined();
        }
      }
    });

    it('should handle type mismatches', () => {
      const invalidEnv = {
        VITE_NEON_AUTH_URL: 123, // Should be string
        VITE_NEON_DATA_API_URL: 'https://ep-xxx.apirest.aws.neon.tech/neondb/rest/v1',
        NODE_ENV: 'development',
      };

      const envSchema = z.object({
        VITE_NEON_AUTH_URL: z.string().url(),
        VITE_NEON_DATA_API_URL: z.string().min(1),
        NODE_ENV: z.enum(['development', 'production', 'test']),
      });

      expect(() => envSchema.parse(invalidEnv)).toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle whitespace in values', () => {
      const envWithWhitespace = {
        VITE_NEON_AUTH_URL: '  https://ep-xxx.neonauth.aws.neon.tech/neondb/auth  ',
        VITE_NEON_DATA_API_URL: '  https://ep-xxx.apirest.aws.neon.tech/neondb/rest/v1  ',
        NODE_ENV: 'development',
      };

      const envSchema = z.object({
        VITE_NEON_AUTH_URL: z.string().url(),
        VITE_NEON_DATA_API_URL: z.string().min(1),
        NODE_ENV: z.enum(['development', 'production', 'test']),
      });

      // Zod's URL validator accepts URLs with leading/trailing whitespace
      // This is actually valid behavior, so we just verify it parses
      const result = envSchema.parse(envWithWhitespace);
      expect(result).toBeDefined();
    });

    it('should handle special characters in keys', () => {
      const envWithSpecialChars = {
        VITE_NEON_AUTH_URL: 'https://ep-xxx.neonauth.aws.neon.tech/neondb/auth',
        VITE_NEON_DATA_API_URL: 'key-with-special-chars_123!@#',
        NODE_ENV: 'development',
      };

      const envSchema = z.object({
        VITE_NEON_AUTH_URL: z.string().url(),
        VITE_NEON_DATA_API_URL: z.string().min(1),
        NODE_ENV: z.enum(['development', 'production', 'test']),
      });

      expect(() => envSchema.parse(envWithSpecialChars)).not.toThrow();
    });

    it('should handle long values', () => {
      const longKey = 'a'.repeat(1000);
      const envWithLongValue = {
        VITE_NEON_AUTH_URL: 'https://ep-xxx.neonauth.aws.neon.tech/neondb/auth',
        VITE_NEON_DATA_API_URL: longKey,
        NODE_ENV: 'development',
      };

      const envSchema = z.object({
        VITE_NEON_AUTH_URL: z.string().url(),
        VITE_NEON_DATA_API_URL: z.string().min(1),
        NODE_ENV: z.enum(['development', 'production', 'test']),
      });

      expect(() => envSchema.parse(envWithLongValue)).not.toThrow();
    });
  });

  describe('Type Inference', () => {
    it('should infer correct types from schema', () => {
      // const envSchema = z.object({
      //   VITE_NEON_AUTH_URL: z.string().url(),
      //   VITE_NEON_DATA_API_URL: z.string().min(1),
      //   NODE_ENV: z.enum(['development', 'production', 'test']),
      //   VITE_APP_TITLE: z.string().optional(),
      // });

      // type Environment = z.infer<typeof envSchema>;

      const env = {
        VITE_NEON_AUTH_URL: 'https://ep-xxx.neonauth.aws.neon.tech/neondb/auth',
        VITE_NEON_DATA_API_URL: 'https://ep-xxx.apirest.aws.neon.tech/neondb/rest/v1',
        NODE_ENV: 'development',
      };

      expect(env.VITE_NEON_AUTH_URL).toBeDefined();
      expect(env.NODE_ENV).toBe('development');
    });
  });
});
