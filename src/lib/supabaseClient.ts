import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://pzurlyuagajvqfjcbtmw.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6dXJseXVhZ2FqdnFmamNidG13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyNTgwODQsImV4cCI6MjEwMTgzNDA4NH0.25kxLmXdrM_bBJuU2GggQvVXvOTgxUgX2VHksi1FRms";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);