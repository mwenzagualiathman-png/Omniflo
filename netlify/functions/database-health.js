
const { getSupabaseAdmin } = require("../lib/supabase");

exports.handler = async function (event) {
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  try {
    const supabase = getSupabaseAdmin();

    const { error } = await supabase
      .from("omniflo_orders")
      .select("id", { head: true })
      .limit(1);

    if (error) throw error;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        success: true,
        message: "OmniFlo database connected successfully."
      })
    };
  } catch (error) {
    console.error("Database health check failed:", error.message);

    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        success: false,
        message: "Database connection failed. Check server configuration."
      })
    };
  }
};
