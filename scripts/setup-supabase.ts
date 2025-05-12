import { createClient } from '@supabase/supabase-js';

// Environment variable validation
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  console.error('Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_KEY.');
  process.exit(1);
}

// Create a Supabase client for setup
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function setupSupabase() {
  console.log('Setting up Supabase database for ChainWords...');
  
  try {
    // 1. Create the stored procedure
    console.log('Creating stored procedure...');
    const createProcedureSql = `
    CREATE OR REPLACE FUNCTION create_high_scores_table()
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      -- Create high_scores table if it doesn't exist
      CREATE TABLE IF NOT EXISTS high_scores (
        id SERIAL PRIMARY KEY,
        player_name TEXT NOT NULL,
        score INTEGER NOT NULL,
        words_found INTEGER NOT NULL,
        total_words INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );

      -- Create an index on the score column for faster sorting/querying
      CREATE INDEX IF NOT EXISTS high_scores_score_idx ON high_scores(score DESC);
    END;
    $$;
    `;
    
    const { error: procError } = await supabase.rpc('exec_sql', { sql: createProcedureSql });
    if (procError) {
      console.error('Error creating stored procedure:', procError);
    } else {
      console.log('Stored procedure created successfully.');
    }
    
    // 2. Execute the stored procedure to create the table
    console.log('Creating high_scores table...');
    const { error: tableError } = await supabase.rpc('create_high_scores_table');
    
    if (tableError) {
      console.error('Error creating high_scores table:', tableError);
    } else {
      console.log('High scores table created successfully.');
    }
    
    // 3. Add some sample data
    console.log('Adding sample high scores...');
    const { error: dataError } = await supabase
      .from('high_scores')
      .upsert([
        {
          player_name: 'CryptoBro',
          score: 1250,
          words_found: 12,
          total_words: 15
        },
        {
          player_name: 'DiamondHands',
          score: 980,
          words_found: 10,
          total_words: 15
        },
        {
          player_name: 'HODLer',
          score: 850,
          words_found: 9,
          total_words: 15
        }
      ]);
    
    if (dataError) {
      console.error('Error adding sample data:', dataError);
    } else {
      console.log('Sample data added successfully.');
    }
    
    console.log('Supabase setup completed successfully!');
  } catch (error) {
    console.error('Supabase setup failed:', error);
    process.exit(1);
  }
}

// Run the setup
setupSupabase().catch(error => {
  console.error('Setup failed with error:', error);
  process.exit(1);
});