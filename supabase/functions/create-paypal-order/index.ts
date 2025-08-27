import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ 
      error: 'Method Not Allowed', 
      details: `Method ${req.method} is not allowed.` 
    }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const startTime = Date.now();
  console.log('🚀 Function started at:', new Date().toISOString());

  try {
    console.log('🚀 Starting PayPal order creation...');
    
    // Verificar autenticación
    const authHeader = req.headers.get('Authorization');
    console.log('🔍 Auth header present:', !!authHeader);
    
    if (!authHeader) {
      console.error('❌ No authorization header provided');
      return new Response(JSON.stringify({ 
        error: 'No authorization header', 
        details: 'Authorization header is missing.' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verificar variables de entorno
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
    const PAYPAL_CLIENT_ID = Deno.env.get('PAYPAL_CLIENT_ID');
    const PAYPAL_CLIENT_SECRET = Deno.env.get('PAYPAL_CLIENT_SECRET');
    const PAYPAL_BASE_URL = Deno.env.get('PAYPAL_BASE_URL') || 'https://api-m.sandbox.paypal.com';

    console.log('🔧 Environment check:', {
      hasSupabaseUrl: !!SUPABASE_URL,
      hasSupabaseKey: !!SUPABASE_ANON_KEY,
      hasPaypalClientId: !!PAYPAL_CLIENT_ID,
      hasPaypalSecret: !!PAYPAL_CLIENT_SECRET,
      paypalBaseUrl: PAYPAL_BASE_URL
    });

    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      console.error('❌ PayPal credentials missing');
      return new Response(JSON.stringify({ 
        error: 'PayPal credentials not configured',
        details: 'Missing PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET environment variables'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('❌ Supabase credentials missing');
      return new Response(JSON.stringify({ 
        error: 'Supabase credentials not configured',
        details: 'Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Crear cliente de Supabase
    console.log('🔧 Creating Supabase client...');
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verificar usuario autenticado
    console.log('👤 Verifying user authentication...');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ User authentication failed:', userError);
      return new Response(JSON.stringify({ 
        error: 'Unauthorized', 
        details: userError?.message || 'User not found or session invalid.' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ User authenticated:', user.id);

    // Parsear datos de la solicitud
    console.log('📦 Parsing request body...');
    let requestData;
    try {
      requestData = await req.json();
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError);
      return new Response(JSON.stringify({ 
        error: 'Invalid JSON', 
        details: 'Request body must be valid JSON' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { amount, planType } = requestData;
    console.log('📦 Request data received:', { amount, planType, type: typeof amount });

    if (!amount || !planType) {
      console.error('❌ Missing required parameters:', { amount, planType });
      return new Response(JSON.stringify({ 
        error: 'Missing required parameters', 
        details: 'Amount and planType are required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validar datos
    const numericAmount = parseFloat(amount);
    const validPlans = ['basic', 'professional', 'advanced'];
    
    if (isNaN(numericAmount) || numericAmount <= 0) {
      console.error('❌ Invalid amount:', amount);
      return new Response(JSON.stringify({ 
        error: 'Invalid amount', 
        details: 'Amount must be a positive number' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!validPlans.includes(planType)) {
      console.error('❌ Invalid planType:', planType);
      return new Response(JSON.stringify({ 
        error: 'Invalid planType', 
        details: 'planType must be one of: basic, professional, advanced' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ Order details validated:', { amount: numericAmount, planType, userId: user.id });

    // 1. Obtener token de acceso de PayPal
    console.log('🔑 Getting PayPal access token...');
    const auth = btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`);
    
    let tokenResponse;
    try {
      tokenResponse = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${auth}`,
        },
        body: 'grant_type=client_credentials',
      });
    } catch (fetchError) {
      console.error('❌ Network error getting PayPal token:', fetchError);
      return new Response(JSON.stringify({
        error: 'Network error',
        details: 'Failed to connect to PayPal API'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('📡 PayPal token response status:', tokenResponse.status, tokenResponse.statusText);

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('❌ Error getting PayPal access token:', { 
        status: tokenResponse.status, 
        text: errorText 
      });
      return new Response(JSON.stringify({
        error: 'PayPal authentication failed',
        details: `Failed to get PayPal access token: ${errorText}`,
        status: tokenResponse.status
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let tokenData;
    try {
      tokenData = await tokenResponse.json();
    } catch (parseError) {
      console.error('❌ Failed to parse PayPal token response:', parseError);
      return new Response(JSON.stringify({
        error: 'PayPal response error',
        details: 'Failed to parse PayPal token response'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { access_token } = tokenData;
    if (!access_token) {
      console.error('❌ No access token in PayPal response');
      return new Response(JSON.stringify({
        error: 'PayPal token error',
        details: 'No access token received from PayPal'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ PayPal access token obtained');

    // 2. Crear orden de PayPal
    const orderPayload = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: 'USD',
            value: numericAmount.toFixed(2),
          },
          description: `Suscripción IkbaTech - Plan ${planType}`,
        },
      ],
      application_context: {
        return_url: `${req.headers.get('origin') || 'http://localhost:5173'}/payment-success`,
        cancel_url: `${req.headers.get('origin') || 'http://localhost:5173'}/payment-cancel`,
        brand_name: 'IkbaTech',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'PAY_NOW',
      },
    };

    console.log('💰 Creating PayPal order with payload:', JSON.stringify(orderPayload, null, 2));

    let orderResponse;
    try {
      orderResponse = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`,
        },
        body: JSON.stringify(orderPayload),
      });
    } catch (fetchError) {
      console.error('❌ Network error creating PayPal order:', fetchError);
      return new Response(JSON.stringify({
        error: 'Network error',
        details: 'Failed to connect to PayPal order API'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('💰 PayPal order response status:', orderResponse.status, orderResponse.statusText);

    if (!orderResponse.ok) {
      const errorText = await orderResponse.text();
      console.error('❌ Error creating PayPal order:', { 
        status: orderResponse.status, 
        text: errorText 
      });
      return new Response(JSON.stringify({
        error: 'PayPal order creation failed',
        details: `Failed to create PayPal order: ${errorText}`,
        status: orderResponse.status
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let orderData;
    try {
      orderData = await orderResponse.json();
    } catch (parseError) {
      console.error('❌ Failed to parse PayPal order response:', parseError);
      return new Response(JSON.stringify({
        error: 'PayPal response error',
        details: 'Failed to parse PayPal order response'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!orderData.id) {
      console.error('❌ No order ID in PayPal response:', orderData);
      return new Response(JSON.stringify({
        error: 'PayPal order error',
        details: 'No order ID received from PayPal'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ PayPal order created:', orderData.id);

    // 3. Guardar orden en la base de datos (no crítico si falla)
    console.log('💾 Saving payment record to database...');
    
    try {
      const paymentData = {
        user_id: user.id,
        paypal_order_id: orderData.id,
        amount: numericAmount,
        currency: 'USD',
        status: 'CREATED',
        plan_type: planType,
      };
      
      console.log('💾 Payment data to insert:', JSON.stringify(paymentData, null, 2));
      
      const { error: insertError } = await supabaseClient
        .from('payments')
        .insert(paymentData);

      if (insertError) {
        console.error('❌ Detailed insert error:', JSON.stringify(insertError, null, 2));
        console.error('❌ Insert error code:', insertError.code);
        console.error('❌ Insert error message:', insertError.message);
        console.error('❌ Insert error details:', insertError.details);
        console.error('❌ Insert error hint:', insertError.hint);
        throw new Error(`Supabase: Failed to save payment record - ${insertError.message}`);
      } else {
        console.log('✅ Payment record saved successfully');
      }
    } catch (dbError) {
      console.error('❌ Database error details:', JSON.stringify(dbError, null, 2));
      if (dbError instanceof Error && dbError.message.includes('Supabase:')) {
        throw dbError;
      }
      throw new Error(`Supabase: Database operation failed - ${dbError instanceof Error ? dbError.message : 'Unknown error'}`);
    }

    // 4. Obtener URL de aprobación
    const approvalUrl = orderData.links?.find((link: any) => link.rel === 'approve')?.href;
    console.log('🔗 Approval URL:', approvalUrl);
    
    if (!approvalUrl) {
      console.error('❌ No approval URL found in PayPal response');
      console.log('PayPal response links:', orderData.links);
      return new Response(JSON.stringify({ 
        error: 'No approval URL received from PayPal',
        details: 'PayPal did not return an approval URL in the response'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const totalDuration = Date.now() - startTime;
    console.log('🎯 Order creation completed successfully in', totalDuration + 'ms');

    return new Response(JSON.stringify({ 
      orderId: orderData.id,
      approvalUrl: approvalUrl,
      status: 'success'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const totalDuration = Date.now() - startTime;
    console.error('❌ Unhandled error in create-paypal-order:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Total function duration:', totalDuration + 'ms');
    
    return new Response(JSON.stringify({ 
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'An unknown error occurred.',
      duration: totalDuration
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});