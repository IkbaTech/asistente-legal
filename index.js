const express = require('express');
const cors = require('cors');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const paypal = require('@paypal/paypal-server-sdk');

const app = express();
app.use(cors());
app.use(express.json());

const paypalClient = new paypal.Client({
  clientCredentialsAuthCredentials: {
    oAuthClientId: process.env.PAYPAL_CLIENT_ID,
    oAuthClientSecret: process.env.PAYPAL_CLIENT_SECRET,
  },
  environment: paypal.Environment.Live,
});
const ordersController = new paypal.OrdersController(paypalClient);

app.post('/api/chat', async (req, res) => {
  const { message, conversationId, context } = req.body;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'Sos un asistente legal guatemalteco.' },
          ...(context?.previousMessages || []).map((m) => ({
            role: m.type === 'user' ? 'user' : 'assistant',
            content: m.content,
          })),
          { role: 'user', content: message },
        ],
      }),
    });

    const data = await response.json();

    res.json({
      response: data.choices?.[0]?.message?.content || 'Sin respuesta.',
      conversationId: conversationId || Date.now().toString(),
      actions: [],
      documentType: '',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Falla al conectarse con OpenAI' });
  }
});

app.post('/api/paypal/create-order', async (req, res) => {
  const { amount, currency = 'USD' } = req.body;
  try {
    const request = {
      body: {
        intent: paypal.CheckoutPaymentIntent.Capture,
        purchaseUnits: [
          {
            amount: {
              currencyCode: currency,
              value: amount?.toString(),
            },
          },
        ],
      },
    };
    const order = await ordersController.createOrder(request);
    res.json({ id: order.result.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear orden de PayPal' });
  }
});

app.post('/api/paypal/capture-order', async (req, res) => {
  const { orderId } = req.body;
  try {
    const capture = await ordersController.captureOrder({ id: orderId });
    res.json({ status: capture.result.status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al capturar pago de PayPal' });
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
