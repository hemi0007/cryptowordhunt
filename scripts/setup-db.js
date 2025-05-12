import fetch from 'node-fetch';

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

async function setupDatabase() {
  try {
    // Use the SQL API endpoint to execute SQL directly
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'params=single-object'
      },
      body: JSON.stringify({
        query: `
          CREATE TABLE IF NOT EXISTS high_scores (
            id SERIAL PRIMARY KEY,
            player_name TEXT NOT NULL,
            score INTEGER NOT NULL,
            words_found INTEGER NOT NULL,
            total_words INTEGER NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
          );

          INSERT INTO high_scores (player_name, score, words_found, total_words)
          VALUES 
            ('CryptoBro', 1250, 12, 15),
            ('DiamondHands', 980, 10, 15),
            ('HODLer', 850, 9, 15)
          ON CONFLICT DO NOTHING;
        `
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to set up database:', error);
    } else {
      const result = await response.json();
      console.log('Database setup successful:', result);
    }
  } catch (error) {
    console.error('Error setting up database:', error);
  }
}

// Run the setup function
setupDatabase()
  .then(() => {
    console.log('Setup completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Setup failed:', err);
    process.exit(1);
  });