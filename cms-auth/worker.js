function randomHex(bytes) {
  const buffer = new Uint8Array(bytes);
  crypto.getRandomValues(buffer);

  return Array.from(buffer)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function getOAuthUrl(url, env) {
  const provider = url.searchParams.get("provider");

  if (provider !== "github") {
    return null;
  }

  const callbackUrl =
    `https://${url.hostname}/callback?provider=github`;

  const scope = "public_repo,user";
  const state = randomHex(4);

  return (
    "https://github.com/login/oauth/authorize" +
    `?response_type=code` +
    `&client_id=${encodeURIComponent(env.GITHUB_OAUTH_ID)}` +
    `&redirect_uri=${encodeURIComponent(callbackUrl)}` +
    `&scope=${encodeURIComponent(scope)}` +
    `&state=${encodeURIComponent(state)}`
  );
}

async function exchangeCode(url, env) {
  const provider = url.searchParams.get("provider");

  if (provider !== "github") {
    return new Response("Invalid provider", { status: 400 });
  }

  const code = url.searchParams.get("code");

  if (!code) {
    return new Response("Missing code", { status: 400 });
  }

  const callbackUrl =
    `https://${url.hostname}/callback?provider=github`;

  const response = await fetch(
    "https://github.com/login/oauth/access_token",
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        client_id: env.GITHUB_OAUTH_ID,
        client_secret: env.GITHUB_OAUTH_SECRET,
        code: code,
        redirect_uri: callbackUrl,
        grant_type: "authorization_code"
      })
    }
  );

  const data = await response.json();

  if (!data.access_token) {
    return new Response(
      "GitHub token exchange failed.",
      { status: 500 }
    );
  }

  return new Response(
    `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>OmniFlo CMS Authorization</title>
</head>

<body>
  <p>Authorizing OmniFlo CMS...</p>

  <script>
    const receiveMessage = (message) => {
      window.opener.postMessage(
        "authorization:github:success:" +
        JSON.stringify({
          token: ${JSON.stringify(data.access_token)}
        }),
        "*"
      );

      window.removeEventListener(
        "message",
        receiveMessage,
        false
      );
    };

    window.addEventListener(
      "message",
      receiveMessage,
      false
    );

    window.opener.postMessage(
      "authorizing:github",
      "*"
    );
  </script>
</body>
</html>
`,
    {
      headers: {
        "Content-Type": "text/html"
      }
    }
  );
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/auth") {
      const authorizationUrl = getOAuthUrl(url, env);

      if (!authorizationUrl) {
        return new Response(
          "Invalid provider",
          { status: 400 }
        );
      }

      return Response.redirect(
        authorizationUrl,
        302
      );
    }

    if (url.pathname === "/callback") {
      return exchangeCode(url, env);
    }

    return new Response(
      "OmniFlo CMS Authentication Worker is running."
    );
  }
};
