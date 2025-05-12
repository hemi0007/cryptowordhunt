// @ts-check
import { createClient } from '@supabase/supabase-js';

// Supabase URL and API key from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_KEY environment variables.');
  process.exit(1);
}

// Create a Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function createHighScoresTable() {
  try {
    console.log('Creating high_scores table in Supabase...');
    
    // Execute SQL to create the table if it doesn't exist
    const { error } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS high_scores (
          id SERIAL PRIMARY KEY,
          player_name TEXT NOT NULL,
          score INTEGER NOT NULL,
          words_found INTEGER NOT NULL,
          total_words INTEGER NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Also create an index for faster sorting by score
        CREATE INDEX IF NOT EXISTS high_scores_score_idx ON high_scores(score DESC);
      `
    });
    
    if (error) {
      console.log('Using alternative approach since RPC method failed...');
      // This should fail if the table doesn't exist, but that's okay
      const { error: queryError } = await supabase
        .from('high_scores')
        .select('id')
        .limit(1);
      
      if (queryError && queryError.code === '42P01') {
        console.log('Table does not exist, creating it via SQL API...');
        // Try creating the table using POST request to the SQL endpoint
        const res = await fetch(`${supabaseUrl}/rest/v1/sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({
            query: `
              CREATE TABLE IF NOT EXISTS high_scores (
                id SERIAL PRIMARY KEY,
                player_name TEXT NOT NULL,
                score INTEGER NOT NULL,
                words_found INTEGER NOT NULL,
                total_words INTEGER NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
              );
              
              CREATE INDEX IF NOT EXISTS high_scores_score_idx ON high_scores(score DESC);
            `
          })
        });

        if (!res.ok) {
          console.error('SQL API failed:', await res.text());
        } else {
          console.log('Table created successfully via SQL API!');
        }
      }
    } else {
      console.log('Table created successfully!');
    }
    
    // Insert some sample data
    console.log('Inserting sample data...');
    const { error: insertError } = await supabase
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
    
    if (insertError) {
      console.error('Error inserting sample data:', insertError);
    } else {
      console.log('Sample data inserted successfully!');
    }
    
    // Check if data was inserted correctly
    const { data, error: selectError } = await supabase
      .from('high_scores')
      .select('*')
      .order('score', { ascending: false });
    
    if (selectError) {
      console.error('Error fetching data:', selectError);
    } else {
      console.log(`Retrieved ${data.length} records from high_scores table:`);
      console.log(data);
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

createHighScoresTable()
  .then(() => {
    console.log('Setup complete!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Setup failed:', err);
    process.exit(1);
  });