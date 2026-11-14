
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  try {
    const { productId, customerEmail, customerName, currency } =
      JSON.parse(event.body || "{}");

    // Prices are controlled by the server, not the browser.
    const products = {
      "resto-cashier": {
        name: "Resto Cashier",
        prices: { KES: 2500, USD: 25 }
      }
    };

    const product = products[productId];

    if (!product || !["KES", "USD"].includes(currency)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid product or currency" })
      };
    }

    if (
      typeof customerEmail !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail) ||
      typeof customerName !== "string" ||
      customerName.trim().length < 2
    ) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Valid customer details required" })
      };
    }

    const amount = product.prices[currency];

    const reference = `OF-${Date.now()}-${Math.random()
      .toString(36).slice(2, 10)}`;

    const response = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: customerEmail.trim(),
          amount: amount * 100,
          currency,
          reference,
          metadata: {
            product_id: productId,
            product_name: product.name,
            customer_name: customerName.trim()
          },
          callback_url: "https://omniflo.solutions/payment/callback/"
        })
      }
    );

    const result = await response.json();

    if (!response.ok || !result.status) {
      return {
        statusCode: 502,
        body: JSON.stringify({ error: "Unable to initialize payment" })
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        authorization_url: result.data.authorization_url,
        reference: result.data.reference
      })
    };

  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid payment request" })
    };
  }
};
