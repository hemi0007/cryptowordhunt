import { useState, useEffect } from 'react';
import { supabase, initializeSupabase } from '../lib/supabase';
import { Button } from './ui/button';

export function SupabaseTest() {
  const [message, setMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<{supabaseUrl: string, supabaseKey: string}>({
    supabaseUrl: '',
    supabaseKey: ''
  });
  
  // Fetch Supabase config when component mounts
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/config/supabase');
        const data = await response.json();
        setConfig(data);
        
        // Show the config (with key partially hidden for security)
        const maskedKey = data.supabaseKey ? 
          `${data.supabaseKey.substring(0, 5)}...${data.supabaseKey.substring(data.supabaseKey.length - 5)}` : 
          'Not available';
          
        setMessage(`Supabase Config:\nURL: ${data.supabaseUrl || 'Not available'}\nKey: ${maskedKey}`);
      } catch (err) {
        setMessage(`Error fetching Supabase config: ${err}`);
      }
    };
    
    fetchConfig();
  }, []);
  
  // Re-initialize Supabase client
  const reinitializeSupabase = async () => {
    setMessage(prev => `${prev}\n\nReinitializing Supabase client...`);
    await initializeSupabase();
    setMessage(prev => `${prev}\nClient reinitialized!`);
  };
  
  // Test Supabase connection and setup
  const testSupabase = async () => {
    setIsLoading(true);
    setMessage(prev => `${prev}\n\nTesting Supabase connection...`);
    
    try {
      // First make sure we're using the latest credentials
      await reinitializeSupabase();
      
      // Try to add a sample score
      setMessage(prev => `${prev}\nAttempting to add a test score...`);
      
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
        setMessage(prev => `${prev}\nError adding test score: ${JSON.stringify(insertError, null, 2)}`);
      } else {
        setMessage(prev => `${prev}\nSample score added successfully!`);
        
        // Now try to fetch scores
        const { data: scores, error: fetchError } = await supabase
          .from('high_scores')
          .select('*')
          .order('score', { ascending: false });
          
        if (fetchError) {
          setMessage(prev => `${prev}\nError fetching scores: ${JSON.stringify(fetchError, null, 2)}`);
        } else {
          setMessage(prev => `${prev}\nScores retrieved: ${scores.length}`);
          if (scores.length > 0) {
            setMessage(prev => `${prev}\nFirst score: ${JSON.stringify(scores[0], null, 2)}`);
          }
        }
      }
    } catch (err) {
      setMessage(prev => `${prev}\nError testing Supabase: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="p-4 bg-secondary rounded-lg">
      <h2 className="text-xl font-bold mb-4">Supabase Connection Test</h2>
      
      <div className="flex flex-wrap gap-2 mb-4">
        <Button 
          onClick={reinitializeSupabase} 
          variant="outline"
          size="sm"
        >
          Reinitialize Client
        </Button>
        
        <Button 
          onClick={testSupabase} 
          disabled={isLoading}
          className="bg-primary"
        >
          {isLoading ? 'Testing...' : 'Test Supabase Connection'}
        </Button>
      </div>
      
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">URL:</span>
          <code className="text-xs bg-muted px-2 py-1 rounded">{config.supabaseUrl || 'Not available'}</code>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Key:</span>
          <code className="text-xs bg-muted px-2 py-1 rounded">
            {config.supabaseKey ? `${config.supabaseKey.substring(0, 5)}...${config.supabaseKey.substring(config.supabaseKey.length - 5)}` : 'Not available'}
          </code>
        </div>
      </div>
      
      {message && (
        <div className="mt-4 p-3 bg-muted rounded-md max-h-80 overflow-auto">
          <pre className="whitespace-pre-wrap text-xs">{message}</pre>
        </div>
      )}
    </div>
  );
}