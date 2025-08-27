import { supabase } from '../lib/supabase';
import { SUPABASE_CONFIG } from '../config/supabase-config';

export interface PayPalOrderRequest {
  amount: number;
  planType: 'basic' | 'professional' | 'advanced';
}

export interface PayPalOrderResponse {
  orderId: string;
  approvalUrl: string;
}

export interface PayPalCaptureResponse {
  status: string;
  paymentId: string;
  planType: string;
}

class PayPalService {
  async createOrder(orderData: PayPalOrderRequest, accessToken: string): Promise<PayPalOrderResponse> {
    console.log('🚀 PayPalService: Starting createOrder', orderData);
    
    try {
      if (!accessToken) {
        console.error('❌ PayPalService: No access token provided');
        throw new Error('Token de acceso no proporcionado');
      }

      console.log('✅ PayPalService: Access token provided');
      
      const supabaseUrl = SUPABASE_CONFIG.url;
      const supabaseKey = SUPABASE_CONFIG.anonKey;
      
      if (!supabaseUrl) {
        console.error('❌ PayPalService: Supabase URL not configured');
        throw new Error('URL de Supabase no configurada');
      }

      if (!supabaseKey) {
        console.error('❌ PayPalService: Supabase key not configured');
        throw new Error('Clave de Supabase no configurada');
      }

      const functionUrl = `${supabaseUrl}/functions/v1/create-paypal-order`;
      console.log('📡 PayPalService: Calling function at', functionUrl);

      const requestPayload = {
        amount: orderData.amount,
        planType: orderData.planType
      };

      console.log('📦 PayPalService: Request payload:', requestPayload);

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
        },
        body: JSON.stringify(requestPayload),
      });

      console.log('📡 PayPalService: Response received', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      if (!response.ok) {
        let errorMessage = 'Error al crear orden de PayPal';
        let errorDetails = {};
        
        try {
          const errorData = await response.json();
          console.log('❌ PayPalService: Error response data:', errorData);
          errorMessage = errorData.error || errorMessage;
          errorDetails = errorData;
          
          // Mensajes de error más específicos
          if (response.status === 401) {
            errorMessage = 'No autorizado. Por favor, inicia sesión nuevamente.';
          } else if (response.status === 500) {
            if (errorData.details?.includes('PayPal credentials')) {
              errorMessage = 'Error de configuración de PayPal. Contacta al soporte técnico.';
            } else if (errorData.details?.includes('Supabase')) {
              errorMessage = 'Error de configuración del servidor. Contacta al soporte técnico.';
            }
          } else if (response.status === 400) {
            errorMessage = 'Datos de pago inválidos. Verifica la información e intenta nuevamente.';
          }
        } catch (parseError) {
          console.log('❌ PayPalService: Failed to parse error response');
          errorMessage = `Error HTTP ${response.status}: ${response.statusText}`;
        }
        
        console.error('❌ PayPalService: Error from Edge Function', { 
          errorMessage, 
          status: response.status, 
          details: errorDetails 
        });
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('✅ PayPalService: Success response', result);

      if (!result.orderId || !result.approvalUrl) {
        console.error('❌ PayPalService: Invalid response structure', result);
        throw new Error('Respuesta inválida del servidor de pagos');
      }

      console.log('✅ PayPalService: Order created successfully', result);
      
      return result;
    } catch (error) {
      console.error('❌ PayPalService: Exception caught', error);
      
      // Re-lanzar el error con mensaje más específico si es necesario
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error('Error desconocido al procesar el pago');
      }
    }
  }

  async captureOrder(orderId: string): Promise<PayPalCaptureResponse> {
    console.log('🚀 PayPalService: Starting captureOrder', { orderId });
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Usuario no autenticado');
      }

      const supabaseUrl = SUPABASE_CONFIG.url;
      const supabaseKey = SUPABASE_CONFIG.anonKey;
      
      if (!supabaseUrl) {
        throw new Error('URL de Supabase no configurada');
      }

      const functionUrl = `${supabaseUrl}/functions/v1/capture-paypal-order`;
      console.log('📡 PayPalService: Calling capture function at', functionUrl);

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'apikey': supabaseKey || '',
        },
        body: JSON.stringify({ orderId }),
      });

      console.log('📡 PayPalService: Capture response status', { 
        status: response.status, 
        statusText: response.statusText 
      });

      if (!response.ok) {
        let errorMessage = 'Error al capturar orden de PayPal';
        try {
          const errorData = await response.json();
          console.log('❌ PayPalService: Capture error response:', errorData);
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `Error HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('✅ PayPalService: Order captured successfully', result);
      
      return result;
    } catch (error) {
      console.error('❌ PayPalService: Error capturing PayPal order', error);
      throw error;
    }
  }

  async getUserPayments() {
    console.log('🚀 PayPalService: Fetching user payments');

    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      console.log('✅ PayPalService: User payments fetched successfully', { count: data.length });
      return data;
    } catch (error) {
      console.error('❌ PayPalService: Error fetching user payments', error);
      throw error;
    }
  }

  // Obtener precios de los planes
  getPlanPrices() {
    return {
      basic: 44.80,
      professional: 78.40,
      advanced: 134.40
    };
  }

  // Obtener información completa de los planes
  getPlansInfo() {
    const prices = this.getPlanPrices();
    
    return {
      basic: {
        name: 'Plan Básico',
        price: prices.basic,
        features: [
          'Consultas legales básicas',
          'Análisis de documentos simples',
          'Plantillas básicas',
          'Soporte por email'
        ]
      },
      professional: {
        name: 'Plan Profesional',
        price: prices.professional,
        features: [
          'Consultas legales avanzadas',
          'Análisis completo de documentos',
          'Todas las plantillas legales',
          'Generación de borradores',
          'Soporte prioritario',
          'Jurisprudencia actualizada'
        ]
      },
      advanced: {
        name: 'Plan Avanzado',
        price: prices.advanced,
        features: [
          'Acceso completo a todas las funciones',
          'IA especializada en casos complejos',
          'Análisis jurisprudencial profundo',
          'Consultoría legal personalizada',
          'Soporte 24/7',
          'Integraciones personalizadas'
        ]
      }
    };
  }
}

export const paypalService = new PayPalService();