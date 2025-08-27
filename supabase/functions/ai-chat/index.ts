import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Plan limits configuration
const PLAN_LIMITS = {
  free: {
    maxMessages: 3,
    canUploadDocuments: false,
    canUseLegalTemplates: false,
    canUseComparativeAnalysis: false,
  },
  basic: {
    maxMessages: 100,
    canUploadDocuments: true,
    canUseLegalTemplates: true,
    canUseComparativeAnalysis: false,
  },
  professional: {
    maxMessages: 400,
    canUploadDocuments: true,
    canUseLegalTemplates: true,
    canUseComparativeAnalysis: true,
  },
  advanced: {
    maxMessages: -1, // Unlimited
    canUploadDocuments: true,
    canUseLegalTemplates: true,
    canUseComparativeAnalysis: true,
  }
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('🔄 CORS preflight request received');
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    console.log('❌ Invalid method:', req.method);
    return new Response(JSON.stringify({ 
      error: 'Method Not Allowed' 
    }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const startTime = Date.now();

  try {
    console.log('🚀 Edge Function ai-chat started');
    
    // Verificar API key de OpenAI PRIMERO
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY'); // <-- FIX: Use variable name
    if (!OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY not found in environment');
      return new Response(JSON.stringify({ 
        error: 'OpenAI API key not configured',
        details: 'Configura OPENAI_API_KEY en Supabase Dashboard → Settings → Edge Functions → Environment Variables'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ OpenAI API key found');
    
    // Verificar autenticación
    const authHeader = req.headers.get('Authorization');
    console.log('🔐 Auth header present:', !!authHeader);
    
    if (!authHeader) {
      console.error('❌ No authorization header');
      return new Response(JSON.stringify({ 
        error: 'No authorization header',
        details: 'Authorization header is required'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Permitir usuarios anónimos con token especial
    const isAnonymousRequest = authHeader.includes('anonymous') || authHeader.includes(Deno.env.get('SUPABASE_ANON_KEY') || '');
    console.log('👤 Is anonymous request:', isAnonymousRequest);
    
    // Crear cliente de Supabase
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL'); // <-- FIX: Use variable name
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY'); // <-- FIX: Use variable name
    
    console.log('🔧 Environment check:', {
      hasSupabaseUrl: !!SUPABASE_URL,
      hasSupabaseKey: !!SUPABASE_ANON_KEY,
      hasOpenAIKey: !!OPENAI_API_KEY
    });
    
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('❌ Supabase credentials missing');
      return new Response(JSON.stringify({ 
        error: 'Supabase credentials not configured',
        details: 'SUPABASE_URL or SUPABASE_ANON_KEY missing'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ Supabase credentials found');

    let supabaseClient;
    let user = null;
    
    if (isAnonymousRequest) {
      // Para usuarios anónimos, crear cliente sin autenticación
      supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      console.log('👤 Anonymous user detected');
    } else {
      // Para usuarios autenticados, usar el header de autorización
      supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: authHeader } }
      });

      // Verificar usuario autenticado
      const { data: { user: authUser }, error: userError } = await supabaseClient.auth.getUser();
      if (userError || !authUser) {
        console.error('❌ User authentication failed:', userError);
        return new Response(JSON.stringify({ 
          error: 'Unauthorized',
          details: userError?.message || 'Invalid session'
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      user = authUser;
      console.log('✅ User authenticated:', user.id);
    }

    // Parsear request
    let requestBody;
    try {
      requestBody = await req.json();
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
    
    const { 
      messages, 
      type = 'chat', 
      isAnonymous = false,
      imageData,
      fileName,
      query // Added for RAG
    } = requestBody;

    console.log('📦 Request parsed:', {
      messagesCount: messages?.length || 0,
      type,
      isAnonymous,
      hasImageData: !!imageData
    });

    if (!messages || !Array.isArray(messages)) {
      console.error('❌ Invalid messages array');
      return new Response(JSON.stringify({ 
        error: 'Messages array is required',
        details: 'messages must be a non-empty array'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Determinar el plan del usuario
    let userPlan = 'free';
    let planLimits = PLAN_LIMITS.free;
    
    if (!isAnonymous && user) {
      // Obtener perfil del usuario para verificar plan
      const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('plan')
        .eq('id', user.id)
        .single();

      if (!profileError && profile) {
        userPlan = profile.plan || 'free';
        planLimits = PLAN_LIMITS[userPlan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free;
      }
    }

    console.log('📋 User plan:', userPlan, 'Anonymous:', isAnonymous);

    // Verificar límites de plan ANTES de procesar
    // 1. Verificar límite de mensajes
    if (planLimits.maxMessages !== -1) {
      // Contar mensajes del usuario en el último mes
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      const { count: messageCount, error: countError } = await supabaseClient
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'user')
        .gte('created_at', oneMonthAgo.toISOString())
        .in('chat_id', 
          supabaseClient
            .from('chats')
            .select('id')
            .eq('user_id', user?.id) // Use user?.id for anonymous requests
        );

      if (countError) {
        console.error('❌ Error counting messages:', countError);
      } else if (messageCount && messageCount >= planLimits.maxMessages) {
        return new Response(JSON.stringify({
          error: 'Message limit reached',
          details: `Your ${userPlan} plan allows ${planLimits.maxMessages} messages per month. Please upgrade your plan.`,
          planLimits: planLimits
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // 2. Verificar funcionalidades específicas del plan
    if (type === 'document' && !planLimits.canUploadDocuments) {
      return new Response(JSON.stringify({
        error: 'Feature not available',
        details: 'Document analysis is not available in your current plan. Please upgrade.',
        planLimits: planLimits
      }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (type === 'draft' && !planLimits.canUseLegalTemplates) {
      return new Response(JSON.stringify({
        error: 'Feature not available',
        details: 'Legal templates are not available in your current plan. Please upgrade.',
        planLimits: planLimits
      }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (type === 'comparative' && !planLimits.canUseComparativeAnalysis) {
      return new Response(JSON.stringify({
        error: 'Feature not available',
        details: 'Comparative analysis is not available in your current plan. Please upgrade.',
        planLimits: planLimits
      }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    console.log('✅ Plan limits verified, proceeding with AI request');

    // Construir prompt del sistema optimizado para velocidad
    const systemPrompt = `Eres IkbaTech, asistente de IA legal para estudiantes de derecho y abogados profesionales.

IDENTIDAD Y FUNCIÓN:
• Asistente educativo y profesional para el ámbito jurídico
• Apoyas tanto a estudiantes de derecho como a abogados profesionales
• Proporcionas explicaciones claras, análisis jurídico y apoyo académico
• Tu función es educar, explicar y asistir en el aprendizaje y práctica del derecho

METODOLOGÍA DE COMUNICACIÓN:
• Adapta tu lenguaje al nivel del usuario (estudiante o profesional)
• Para estudiantes: Explica conceptos claramente, define términos técnicos
• Para profesionales: Usa terminología jurídica precisa y análisis técnico
• Siempre proporciona contexto educativo y fundamentos legales
• Fomenta el aprendizaje y la comprensión profunda del derecho

ESTRUCTURA DE RESPUESTA EDUCATIVA:
• Explicación clara del concepto o problema jurídico
• Fundamentos legales: "según Art. X CPRG", "conforme Art. Y CPP"
• Ejemplos prácticos y casos relevantes
• Referencias jurisprudenciales importantes
• Pasos o elementos a considerar
• Recursos adicionales para profundizar

IMPORTANTE: NO eres un abogado, eres un asistente educativo. Siempre recuerda al usuario consultar con profesionales para casos específicos.

Responde SIEMPRE de manera educativa, clara y útil, adaptándote al nivel del usuario y fomentando el aprendizaje del derecho.`;

    // RAG: Si hay una consulta específica, buscar documentos relevantes
    let relevantContext = '';
    if (query && planLimits.canUploadDocuments) {
      try {
        console.log('🔍 Searching for relevant documents...');
        // Generar embedding para la consulta
        const embeddingResponse = await fetch(`${SUPABASE_URL}/functions/v1/generate-embeddings`, {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY
          },
          body: JSON.stringify({
            text: query
          })
        });
        if (embeddingResponse.ok) {
          const embeddingData = await embeddingResponse.json();
          const queryEmbedding = embeddingData.embedding;
          // Buscar documentos similares
          const { data: relevantDocs, error: searchError } = await supabaseClient.rpc('search_documents', {
            query_embedding: JSON.stringify(queryEmbedding),
            match_threshold: 0.7,
            match_count: 3
          });
          if (!searchError && relevantDocs && relevantDocs.length > 0) {
            relevantContext = '\n\nCONTEXTO DE DOCUMENTOS RELEVANTES:\n' + relevantDocs.map((doc, index)=>`[Documento ${index + 1}: ${doc.title}]\n${doc.content}`).join('\n\n');
            console.log('✅ Found relevant documents:', relevantDocs.length);
          }
        }
      } catch (error) {
        console.warn('⚠️ RAG search failed, continuing without context:', error);
      }
    }

    // Preparar mensajes para OpenAI
    const openAIMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    // Si es análisis de imagen, modificar el último mensaje
    if (type === 'image' && requestBody.imageData) { // Use requestBody.imageData
      const lastMessage = openAIMessages[openAIMessages.length - 1];
      openAIMessages[openAIMessages.length - 1] = {
        role: 'user',
        content: [
          {
            type: 'text',
            text: lastMessage.content
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${requestBody.imageData}` // Use requestBody.imageData
            }
          }
        ]
      };
    }

    // Si es análisis comparativo, agregar el contenido a comparar
    if (type === 'comparative' && requestBody.entity1 && requestBody.entity2) { // Use requestBody.entity1, entity2
      const entity1Label = requestBody.entity1Name || (requestBody.analysisType === 'document' ? 'Documento 1' : 'Escenario 1');
      const entity2Label = requestBody.entity2Name || (requestBody.analysisType === 'document' ? 'Documento 2' : 'Escenario 2');
      
      const comparativeContent = `Analiza comparativamente:

**${entity1Label}:**
${requestBody.entity1}

**${entity2Label}:**
${requestBody.entity2}

Proporciona un análisis estructurado con similitudes, diferencias, fortalezas, debilidades y recomendaciones profesionales.`;

      openAIMessages.push({ role: 'user', content: comparativeContent });
    }

    // Agregar contexto RAG si está disponible
    if (relevantContext) {
      openAIMessages.push({ role: 'system', content: relevantContext }); // Add as a system message for context
    }

    console.log('🤖 Calling OpenAI API...');

    // Determinar modelo según el tipo
    const model = type === 'image' ? 'gpt-4o' : 'gpt-4';
    
    // Configurar payload para OpenAI
    let openAIPayload: any = {
      model: model,
      messages: openAIMessages,
      max_tokens: 2000,
      temperature: 0.7,
    };

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(openAIPayload),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('❌ OpenAI API error:', errorText);
      return new Response(JSON.stringify({
        error: 'Error from OpenAI API',
        details: errorText
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const openAIData = await openAIResponse.json();
    const aiResponse = openAIData.choices.message.content;

    const totalTime = Date.now() - startTime;
    console.log('✅ OpenAI response received in', totalTime + 'ms');

    return new Response(JSON.stringify({
      content: aiResponse,
      usage: {
        promptTokens: openAIData.usage?.prompt_tokens || 0,
        completionTokens: openAIData.usage?.completion_tokens || 0,
        totalTokens: openAIData.usage?.total_tokens || 0
      },
      planInfo: {
        currentPlan: userPlan,
        limits: planLimits
      },
      responseTime: totalTime
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error('❌ Unhandled error:', error);
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error',
      responseTime: totalTime
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});