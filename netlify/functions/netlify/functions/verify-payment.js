
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Payment service is not configured" })
    };
  }

  try {
    const { reference } = JSON.parse(event.body || "{}");

    // Validate the reference before contacting Paystack.
    if (
      typeof reference !== "string" ||
      !/^[a-zA-Z0-9.-]{5,100}$/.test(reference)
    ) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid transaction reference" })
      };
    }

    // Verify directly with Paystack.
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${secretKey}`
        }
      }
    );

    const result = await response.json();

    if (!response.ok || !result.status || !result.data) {
      return {
        statusCode: 502,
        body: JSON.stringify({ error: "Unable to verify transaction" })
      };
    }

    const transaction = result.data;

    // Check the reference belongs to this verification request.
    if (transaction.reference !== reference) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Transaction reference mismatch" })
      };
    }

    // Only successful transactions can proceed.
    if (transaction.status !== "success") {
      return {
        statusCode: 200,
        body: JSON.stringify({
          verified: false,
          payment_status: transaction.status
        })
      };
    }

    // Match the payment against our server-side product catalogue.
    const products = {
      "resto-cashier": {
        name: "Resto Cashier",
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
        statusCode: 400,
        body: JSON.stringify({ error: "Unknown product" })
      };
    }

    const currency = transaction.currency;
    const expectedAmount = product.prices[currency];

    if (
      !expectedAmount ||
      transaction.amount !== expectedAmount * 100
    ) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Payment amount mismatch" })
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        verified: true,
        payment_status: "success",
        reference: transaction.reference,
        product: product.name,
        currency,
        amount: expectedAmount,
        paid_at: transaction.paid_at
      })
    };

  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid verification request" })
    };
  }
};
