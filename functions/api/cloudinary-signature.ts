/**
 * Cloudflare Pages Function để generate Cloudinary signature
 *
 * Endpoint: /api/cloudinary-signature
 * Method: POST
 *
 * Request body:
 * {
 *   "public_id": "gaolamthuy/15742017",
 *   "timestamp": "1762443278",
 *   "overwrite": true,
 *   "invalidate": true
 * }
 *
 * Response:
 * {
 *   "signature": "77151fac839f41a6e152011d0947d08bc4ef28fb",
 *   "api_key": "286752162955818",
 *   "timestamp": "1762443278"
 * }
 */

/**
 * Tạo SHA-1 hash từ string (dùng Web Crypto API - native trong Cloudflare Workers)
 */
async function sha1(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate Cloudinary signature
 */
async function generateCloudinarySignature(
  params: Record<string, string | boolean>,
  apiSecret: string
): Promise<string> {
  // Sắp xếp keys theo alphabet và build string_to_sign
  const sortedKeys = Object.keys(params)
    .filter(key => key !== 'file' && key !== 'api_key' && key !== 'signature')
    .sort();

  const stringToSign = sortedKeys.map(key => `${key}=${params[key]}`).join('&');

  // SHA1(string_to_sign + api_secret)
  return await sha1(stringToSign + apiSecret);
}

export async function onRequestPost(context: {
  request: Request;
  env: {
    CLOUDINARY_API_KEY: string;
    CLOUDINARY_API_SECRET: string;
  };
}): Promise<Response> {
  try {
    // Parse request body
    const body = await context.request.json();
    const { public_id, timestamp, overwrite = true, invalidate = true } = body;

    // Validate required fields
    if (!public_id || !timestamp) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: public_id, timestamp',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get API credentials from Cloudflare environment variables
    const apiKey = context.env.CLOUDINARY_API_KEY;
    const apiSecret = context.env.CLOUDINARY_API_SECRET;

    if (!apiKey || !apiSecret) {
      return new Response(
        JSON.stringify({ error: 'Cloudinary credentials not configured' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Build signature params
    const signatureParams: Record<string, string | boolean> = {
      invalidate: invalidate,
      overwrite: overwrite,
      public_id: public_id,
      timestamp: timestamp,
    };

    // Generate signature
    const signature = await generateCloudinarySignature(
      signatureParams,
      apiSecret
    );

    // Return signature and api_key
    return new Response(
      JSON.stringify({
        signature,
        api_key: apiKey,
        timestamp,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*', // Adjust CORS as needed
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  } catch (error) {
    console.error('Cloudinary signature error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Handle OPTIONS for CORS preflight
export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
