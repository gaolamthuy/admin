import { supabase } from '../services/supabaseClient';

export const runDiagnostics = async (): Promise<string[]> => {
  const issues: string[] = [];
  const logs: string[] = ['Starting diagnostics...'];

  try {
    // Check if we can connect to Supabase at all
    logs.push('Testing Supabase connection...');
    const { data: healthCheck, error: healthError } = await supabase.from('kiotviet_products').select('count', { count: 'exact', head: true });
    
    if (healthError) {
      logs.push(`❌ Error connecting to Supabase: ${healthError.message}`);
      issues.push('Cannot connect to Supabase. Check your credentials in .env file.');
    } else {
      logs.push('✅ Successfully connected to Supabase');
      
      // Check if required tables exist
      const tables = [
        'kiotviet_products',
        'kiotviet_customers',
        'kiotviet_branches',
        'kiotviet_staff',
        'system'
      ];
      
      logs.push('Checking required tables...');
      
      for (const table of tables) {
        try {
          const { data, error } = await supabase.from(table).select('count', { count: 'exact', head: true });
          
          if (error) {
            logs.push(`❌ Table '${table}' error: ${error.message}`);
            issues.push(`Table '${table}' may not exist or you don't have access.`);
          } else {
            logs.push(`✅ Table '${table}' exists`);
          }
        } catch (err) {
          logs.push(`❌ Error checking table '${table}': ${err}`);
          issues.push(`Error checking table '${table}'.`);
        }
      }
      
      // Check for KiotViet token
      try {
        const { data: tokenData, error: tokenError } = await supabase
          .from('system')
          .select('title, value')
          .eq('title', 'kiotviet')
          .single();
        
        if (tokenError || !tokenData) {
          logs.push('❌ KiotViet token not found in system table');
          issues.push('KiotViet token not found. Add a row to system table with title "kiotviet" and your token as value.');
        } else {
          logs.push('✅ Found KiotViet token in system table');
        }
      } catch (err) {
        logs.push(`❌ Error checking KiotViet token: ${err}`);
        issues.push('Error checking KiotViet token.');
      }
    }
  } catch (error) {
    logs.push(`❌ Unexpected error during diagnostics: ${error}`);
    issues.push('Unexpected error during diagnostics.');
  }
  
  console.log('--- Diagnostics Log ---');
  logs.forEach(log => console.log(log));
  console.log('----------------------');
  
  return issues.length > 0 ? issues : ['All systems operational!'];
};

export default {
  runDiagnostics
}; 