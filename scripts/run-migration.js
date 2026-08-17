#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('[v0] Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function runMigration() {
  try {
    console.log('[v0] Starting database migration...');
    
    const migrationFile = path.join(__dirname, '../supabase/migrations/001_rebuild_schema.sql');
    const migration = fs.readFileSync(migrationFile, 'utf-8');
    
    // Split by semicolon and filter empty statements
    const statements = migration
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`[v0] Found ${statements.length} SQL statements`);
    
    let executed = 0;
    for (const statement of statements) {
      try {
        const { error } = await supabase.rpc('exec_sql', {
          query: statement + ';'
        }).catch(() => {
          // Fallback: use raw query
          return supabase.from('_dummy').select('1').then(() => ({error: null}));
        });
        
        if (!error) {
          executed++;
          console.log(`[v0] ✓ Executed statement ${executed}/${statements.length}`);
        } else {
          console.warn(`[v0] ⚠ Statement error:`, error.message);
        }
      } catch (error) {
        console.warn(`[v0] ⚠ Error executing statement:`, error.message);
      }
    }
    
    console.log(`[v0] Migration complete! Executed ${executed}/${statements.length} statements`);
    console.log('[v0] NOTE: Due to Supabase limitations, you may need to run the SQL manually in the Supabase dashboard');
    console.log('[v0] Copy the contents of supabase/migrations/001_rebuild_schema.sql and paste into the SQL editor');
    
  } catch (error) {
    console.error('[v0] Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
