import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceRoleKey
);

export async function POST(req) {
  try {
    const { email, password, role, team_code } = await req.json();

    // Step 1: Create the user with auto-confirm
    const { data: userData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: { role, team_code },
      email_confirm: true
    });

    if (createUserError) {
      return new Response(JSON.stringify({ error: createUserError.message }), { status: 400 });
    }

    const userId = userData.user?.id;
    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID not returned' }), { status: 500 });
    }

    // Step 2: Insert user into the 'users' table (do NOT store password)
    const { error: userInsertError } = await supabaseAdmin
      .from('users')
      .insert([{ id: userId, email, team_code, role }]);

    if (userInsertError) {
      return new Response(JSON.stringify({ error: userInsertError.message }), { status: 400 });
    }

    return new Response(JSON.stringify({ message: 'User created successfully', userId }), { status: 200 });
  } catch {
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}
