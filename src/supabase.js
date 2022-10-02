import { createClient } from '@supabase/supabase-js'
const supabaseUrl = "https://tqvqsgobggitvvwffmdo.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxdnFzZ29iZ2dpdHZ2d2ZmbWRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NjQ2Mzg2MDEsImV4cCI6MTk4MDIxNDYwMX0.wnPABh4A9xJUA4jxjcg3dalR68VMOALNqOYWHkjclK4";

export const supabase = createClient(supabaseUrl, supabaseAnonKey)