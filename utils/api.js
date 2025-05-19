import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is not set. Please check your .env file.');
}

export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

/**
 * Fetches data from a given URL with Basic Authentication.
 * @param {string} url - The URL to fetch data from.
 * @param {string} method - The HTTP method (e.g., 'GET', 'POST').
 * @param {object} [body] - The request body for POST/PUT requests.
 * @returns {Promise<any>} - The JSON response from the API.
 */
export const fetchWithBasicAuth = async (url, method = 'GET', body) => {
  const username = process.env.NEXT_PUBLIC_BACKEND_BASIC_USERNAME;
  const password = process.env.NEXT_PUBLIC_BACKEND_BASIC_PASSWORD;
  const backendApiUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  if (!backendApiUrl) {
    console.error('BACKEND_API_URL is not set. Please check your .env file.');
    throw new Error('BACKEND_API_URL is not configured.');
  }

  if (!username || !password) {
    console.warn('Backend Basic Auth username or password is not set. Request might fail if auth is required.');
  }

  const headers = new Headers();
  if (username && password) {
    headers.append('Authorization', 'Basic ' + btoa(username + ':' + password));
  }
  if (method !== 'GET' && method !== 'HEAD') {
    headers.append('Content-Type', 'application/json');
  }

  const config = {
    method,
    headers,
  };

  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${backendApiUrl}${url}`, config);
    if (!response.ok) {
      // Attempt to parse error message from backend if available
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        // Ignore if response is not JSON
      }
      console.error('API request failed:', response.status, response.statusText, errorData);
      throw new Error(`API request failed: ${response.status} ${response.statusText}${errorData ? ` - ${JSON.stringify(errorData)}` : ''}`);
    }
    // Handle cases where response might be empty (e.g., 204 No Content)
    if (response.status === 204) {
        return null;
    }
    return response.json();
  } catch (error) {
    console.error('Error in fetchWithBasicAuth:', error);
    throw error;
  }
};

// Example usage (you can remove this or keep for testing)
// async function testApi() {
//   if (supabase) {
//     try {
//       const { data, error } = await supabase.from('your_table_name').select('*');
//       if (error) throw error;
//       console.log('Supabase data:', data);
//     } catch (error) {
//       console.error('Error fetching from Supabase:', error.message);
//     }
//   } else {
//     console.log('Supabase client not initialized.');
//   }

//   try {
//     // Assuming your backend has an endpoint like /example
//     // const data = await fetchWithBasicAuth('/example');
//     // console.log('Basic Auth API data:', data);
//   } catch (error) {
//     // console.error('Error fetching with Basic Auth:', error.message);
//   }
// }
// testApi(); 