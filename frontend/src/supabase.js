import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.REACT_APP_SUPABASE_URL ||
  "https://owdpdkxquhgavelryjcm.supabase.co";

const supabaseKey =
  process.env.REACT_APP_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93ZHBka3hxdWhnYXZlbHJ5amNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5MzkyNDMsImV4cCI6MjA5NzUxNTI0M30.ykD8LIYcFh2fzlDleq8lFY30GA95BAiiQ_1fDKOe5zc";

export const supabase = createClient(supabaseUrl, supabaseKey);