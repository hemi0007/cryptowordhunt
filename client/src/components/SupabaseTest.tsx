import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from './ui/button';

export function SupabaseTest() {
  const [message, setMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Test Supabase connection and setup
  const testSupabase = async () => {
    setIsLoading(true);
    setMessage('Testing Supabase connection...');
    
    try {
      // Step 1: Try to create a high_scores table if it doesn't exist
      setMessage('Attempting to create high_scores table...');
      
      // First, let's see if we can add a sample score
      const { data: insertData, error: insertError } = await supabase
        .from('high_scores')
        .insert([
          {
            player_name: 'TestUser',
            score: 1000,
            words_found: 10,
            total_words: 15,
            created_at: new Date().toISOString()
          }
        ])
        .select();
      
      if (insertError) {
        setMessage(`Error creating table: ${JSON.stringify(insertError)}`);
      } else {
        setMessage('Sample score added successfully!');
        
        // Now let's try to fetch scores
        const { data: scores, error: fetchError } = await supabase
          .from('high_scores')
          .select('*')
          .order('score', { ascending: false });
          
        if (fetchError) {
          setMessage(prev => `${prev}\nError fetching scores: ${JSON.stringify(fetchError)}`);
        } else {
          setMessage(prev => `${prev}\nScores retrieved: ${scores.length}`);
          setMessage(prev => `${prev}\nFirst score: ${JSON.stringify(scores[0])}`);
        }
      }
    } catch (err) {
      setMessage(`Error testing Supabase: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="p-4 bg-secondary rounded-lg">
      <h2 className="text-xl font-bold mb-4">Supabase Connection Test</h2>
      
      <Button 
        onClick={testSupabase} 
        disabled={isLoading}
        className="mb-4"
      >
        {isLoading ? 'Testing...' : 'Test Supabase Connection'}
      </Button>
      
      {message && (
        <div className="mt-4 p-3 bg-muted rounded-md">
          <pre className="whitespace-pre-wrap text-xs">{message}</pre>
        </div>
      )}
    </div>
  );
}