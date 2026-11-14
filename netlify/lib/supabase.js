
const { createClient } = require("@supabase/supabase-js");

let supabaseAdmin = null;

function getSupabaseAdmin() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseSecret =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseSecret) {
    throw new Error(
      "Missing Supabase environment variables."
    );
  }

  if (!supabaseAdmin) {
    supabaseAdmin = createClient(
      supabaseUrl,
      supabaseSecret,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false
        }
      }
    );
  }

  return supabaseAdmin;
}

module.exports = { getSupabaseAdmin };
