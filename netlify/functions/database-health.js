
exports.handler = async function (event) {
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  const url = process.env.SUPABASE_URL;
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      supabaseUrlConfigured: Boolean(url),
      supabaseSecretConfigured: Boolean(secret),
      urlLooksValid: Boolean(
        url && /^https:\/\/[^/]+\.supabase\.co\/?$/.test(url)
      ),
      message: "Environment configuration check completed."
    })
  };
};
