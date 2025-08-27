import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    console.log('🚀 Starting PayPal order capture...')
    
    // Verificar autenticación
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('❌ No authorization header provided')
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verificar variables de entorno
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
    const PAYPAL_CLIENT_ID = Deno.env.get('PAYPAL_CLIENT_ID');
    const PAYPAL_CLIENT_SECRET = Deno.env.get('PAYPAL_CLIENT_SECRET');
    const PAYPAL_BASE_URL = Deno.env.get('PAYPAL_BASE_URL') || 'https://api-m.sandbox.paypal.com';

    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      console.error('❌ PayPal credentials missing');
      return new Response(JSON.stringify({ error: 'PayPal credentials not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('❌ Supabase credentials missing');
      return new Response(JSON.stringify({ error: 'Supabase credentials not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      console.error('❌ User authentication failed:', userError)
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('✅ User authenticated:', user.id)

    let requestData;
    try {
      requestData = await req.json();
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError);
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { orderId } = requestData;

    if (!orderId) {
      console.error('❌ Order ID is required')
      return new Response(JSON.stringify({ error: 'Order ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('🔍 Looking for payment record:', orderId)

    // Verificar que la orden pertenece al usuario
    const { data: payment, error: paymentError } = await supabaseClient
      .from('payments')
      .select('*')
      .eq('paypal_order_id', orderId)
      .eq('user_id', user.id)
      .single()

    if (paymentError || !payment) {
      console.error('❌ Payment not found or unauthorized:', paymentError)
      return new Response(JSON.stringify({ error: 'Payment not found or unauthorized' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('✅ Payment record found:', payment.id)

    console.log('🔑 Getting PayPal access token...')

    // 1. Obtener token de acceso de PayPal
    const auth = btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`)
    
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
      return new Response(JSON.stringify({ error: 'Failed to connect to PayPal' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('❌ Error getting PayPal access token:', errorText)
      return new Response(JSON.stringify({ error: 'Failed to get PayPal access token' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let tokenData;
    try {
      tokenData = await tokenResponse.json();
    } catch (parseError) {
      console.error('❌ Failed to parse PayPal token response:', parseError);
      return new Response(JSON.stringify({ error: 'PayPal token response error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { access_token } = tokenData;
    if (!access_token) {
      console.error('❌ No access token received from PayPal');
      return new Response(JSON.stringify({ error: 'No access token from PayPal' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ PayPal access token obtained')

    // 2. Capturar la orden en PayPal
    console.log('💰 Capturing PayPal order:', orderId)
    
    let captureResponse;
    try {
      captureResponse = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`,
        },
      });
    } catch (fetchError) {
      console.error('❌ Network error capturing PayPal order:', fetchError);
      return new Response(JSON.stringify({ error: 'Failed to connect to PayPal capture API' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!captureResponse.ok) {
      const errorText = await captureResponse.text()
      console.error('❌ Error capturing PayPal order:', errorText)
      return new Response(JSON.stringify({ error: 'Failed to capture PayPal order' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let captureData;
    try {
      captureData = await captureResponse.json();
    } catch (parseError) {
      console.error('❌ Failed to parse PayPal capture response:', parseError);
      return new Response(JSON.stringify({ error: 'PayPal capture response error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const captureStatus = captureData.status
    console.log('✅ PayPal order captured with status:', captureStatus)

    // 3. Actualizar el estado del pago en la base de datos
    console.log('💾 Updating payment status in database...')
    
    const { error: updateError } = await supabaseClient
      .from('payments')
      .update({ 
        status: captureStatus,
        updated_at: new Date().toISOString()
      })
      .eq('paypal_order_id', orderId)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('❌ Error updating payment status:', updateError)
      return new Response(JSON.stringify({ error: 'Failed to update payment status' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('✅ Payment status updated successfully')

    // 4. Si el pago fue exitoso, actualizar el plan del usuario
    if (captureStatus === 'COMPLETED') {
      console.log('🎉 Payment completed, updating user plan to:', payment.plan_type)
      
      const { error: profileUpdateError } = await supabaseClient
        .from('profiles')
        .update({ 
          plan: payment.plan_type,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (profileUpdateError) {
        console.error('❌ Error updating user plan:', profileUpdateError)
        // No retornamos error aquí porque el pago ya fue procesado
      } else {
        console.log('✅ User plan updated successfully')
      }
    }

    console.log('🎯 Capture process completed successfully')

    return new Response(JSON.stringify({ 
      status: captureStatus,
      paymentId: captureData.id,
      planType: payment.plan_type
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('❌ Unhandled error in capture-paypal-order:', error)
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})