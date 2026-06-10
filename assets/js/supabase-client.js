// ══════════════════════════════════════════════
// ABDA SOAPS — Supabase Client
// ══════════════════════════════════════════════
//
// Como configurar:
//   1. Acesse supabase.com > seu projeto > Settings > API
//   2. Copie a "Project URL" e a "anon public key"
//   3. Cole os valores abaixo e salve
//
// ⚠️  Este arquivo está no .gitignore.
//     Nunca suba com as chaves reais para o GitHub.
// ══════════════════════════════════════════════

const SUPABASE_URL      = 'https://wcnghavblauethvstayb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjbmdoYXZibGF1ZXRodnN0YXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExMjExNzcsImV4cCI6MjA5NjY5NzE3N30.OA39SGqWeX144jrideOhv50a7qmcGW7i0MT5QCRx9Zg';

const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
