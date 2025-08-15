import { createClient } from '@supabase/supabase-js';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

Deno.serve(async (req: Request) => {
  const payload = await req.json();

  try {
    const { error } = await supabase.from('payments').insert(payload);
    if (error) {
      console.error('Error inserting payment:', error);
    }
  } catch (err) {
    console.error('Unexpected exception inserting payment:', err);
  }

  return new Response('ok');
});
