import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Verify caller identity from their JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return json({ error: 'Missing authorization header' }, 401);
    }

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
    } = await userClient.auth.getUser();

    if (!user) {
      return json({ error: 'Unauthorized' }, 401);
    }

    // 2. Check that the caller is an admin
    const { data: callerProfile } = await userClient
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single();

    if (!callerProfile?.is_active || callerProfile.role !== 'admin') {
      return json({ error: 'Forbidden: admin access required' }, 403);
    }

    // 3. Parse input
    const body = await req.json();
    const { email, full_name, role, barangay_id, password } = body;

    if (!email || !full_name || !role) {
      return json({ error: 'Missing required fields: email, full_name, role' }, 400);
    }

    if (!['user', 'staff', 'admin'].includes(role)) {
      return json({ error: 'Invalid role' }, 400);
    }

    // 4. Use the ADMIN client (service role) — does NOT touch caller's session
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SERVICE_ROLE_KEY')!   // ← CHANGED
    );

    const tempPassword = password || (crypto.randomUUID() + 'Aa1!');

    const { data: created, error: createErr } =
      await adminClient.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name,
          role,
          barangay_id: barangay_id ?? '',
        },
      });

    if (createErr) {
      return json({ error: createErr.message }, 400);
    }

    // 5. Ensure profile has the barangay (trigger sometimes misses it)
    if (barangay_id && created.user) {
      await adminClient
        .from('profiles')
        .update({ barangay_id })
        .eq('id', created.user.id);
    }

    return json({
      user: {
        id: created.user?.id,
        email: created.user?.email,
      },
      temporary_password: tempPassword,
    });
  } catch (err) {
    console.error('invite-user error:', err);
    return json({ error: String(err) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}