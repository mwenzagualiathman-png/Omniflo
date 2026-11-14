
const crypto = require("crypto");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method not allowed"
    };
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  const signature =
    event.headers?.["x-paystack-signature"] ||
    event.headers?.["X-Paystack-Signature"];

  if (!secretKey || !signature) {
    return {
      statusCode: 401,
      body: "Unauthorized"
    };
  }

  try {
    // Preserve the original request body for signature verification.
    const rawBody = event.isBase64Encoded
      ? Buffer.from(event.body || "", "base64")
      : Buffer.from(event.body || "", "utf8");

    const expectedSignature = crypto
      .createHmac("sha512", secretKey)
      .update(rawBody)
      .digest("hex");

    const received = Buffer.from(signature, "utf8");
    const expected = Buffer.from(expectedSignature, "utf8");

    if (
      received.length !== expected.length ||
      !crypto.timingSafeEqual(received, expected)
    ) {
      return {
        statusCode: 401,
        body: "Invalid signature"
      };
    }

    const payload = JSON.parse(rawBody.toString("utf8"));

    // We only process successful transaction notifications.
    if (payload.event !== "charge.success") {
      return {
        statusCode: 200,
        body: "Event received"
      };
    }

    const reference = payload.data?.reference;

    if (typeof reference !== "string" || !reference) {
      return {
        statusCode: 400,
        body: "Missing transaction reference"
      };
    }

    // Confirm the transaction directly with Paystack.
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`
        }
      }
    );

    const result = await response.json();

    if (!response.ok || !result.status || !result.data) {
      return {
        statusCode: 502,
        body: "Transaction verification unavailable"
      };
    }

    const transaction = result.data;

    if (
      transaction.status !== "success" ||
      transaction.reference !== reference
    ) {
      return {
        statusCode: 200,
        body: "Transaction not successful"
      };
    }

    // Temporary server-side catalogue.
    const products = {
      "resto-cashier": {
        prices: {
          KES: 2500,
          USD: 25
        }
      }
    };

    let metadata = transaction.metadata || {};

    if (typeof metadata === "string") {
      try {
        metadata = JSON.parse(metadata);
      } catch {
        metadata = {};
      }
    }

    const product = products[metadata.product_id];

    if (!product) {
      return {
        statusCode: 200,
        body: "Payment received; product requires review"
      };
    }

    const expectedAmount = product.prices[transaction.currency];

    if (
      !expectedAmount ||
      transaction.amount !== expectedAmount * 100
    ) {
      return {
        statusCode: 200,
        body: "Payment received; amount requires review"
      };
    }

    // Payment is verified. Order storage and delivery
    // will be added in the next implementation stage.
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        received: true,
        verified: true,
        reference,
        message: "Payment notification verified"
      })
    };

  } catch (error) {
    return {
      statusCode: 400,
      body: "Invalid webhook request"
    };
  }
};
