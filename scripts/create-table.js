const { createClient } = require('@supabase/supabase-js');

// Supabase URL and key from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

console.log('Supabase credentials:', { 
  url: supabaseUrl, 
  key: supabaseKey ? supabaseKey.substring(0, 5) + '...' + supabaseKey.substring(supabaseKey.length - 5) : 'missing'
});

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

// Create a Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function createTable() {
  try {
    console.log('Trying to insert a test record...');
    
    // Try to insert a record - this will fail if the table doesn't exist
    const { data, error } = await supabase
      .from('high_scores')
      .insert([{
        player_name: 'TestUser',
        score: 1000,
        words_found: 10,
        total_words: 15
      }])
      .select();
    
    if (error) {
      console.log('Insert failed, error:', error);
      
      // If the table doesn't exist, create it via the Supabase API
      if (error.code === '42P01') {
        console.log('Table does not exist, attempting to create it...');
        
        // Create a new table via the REST API
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({
            query: `
              CREATE TABLE high_scores (
                id SERIAL PRIMARY KEY,
                player_name TEXT NOT NULL,
                score INTEGER NOT NULL,
                words_found INTEGER NOT NULL,
                total_words INTEGER NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
              );
            `
          })
        });
        
        if (!response.ok) {
          console.error('Failed to create table:', await response.text());
        } else {
          console.log('Table created successfully!');
          
          // Try the insert again
          const { error: insertError } = await supabase
            .from('high_scores')
            .insert([{
              player_name: 'TestUser',
              score: 1000,
              words_found: 10,
              total_words: 15
            }]);
            
          if (insertError) {
            console.error('Insert still failed after table creation:', insertError);
          } else {
            console.log('Record inserted successfully!');
          }
        }
      }
    } else {
      console.log('Record inserted successfully!', data);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the function
createTable()
  .then(() => {
    console.log('Script completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });