require('dotenv').config();

module.exports = {
  token: process.env.DISCORD_BOT_TOKEN,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_ANON_KEY
}; 