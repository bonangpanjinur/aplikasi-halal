import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user: caller }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const { data: callerRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .single();

    const callerRoleValue = callerRole?.role;
    if (callerRoleValue !== "super_admin" && callerRoleValue !== "owner") {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
    }

    const { user_id, password, role } = await req.json();

    // Check target user's role
    const { data: targetRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user_id)
      .single();

    // Owner cannot modify super_admin or owner
    if (callerRoleValue === "owner" && (targetRole?.role === "super_admin" || targetRole?.role === "owner")) {
      return new Response(JSON.stringify({ error: "Owner tidak bisa mengubah super_admin atau owner" }), { status: 403, headers: corsHeaders });
    }

    // Owner cannot assign super_admin or owner role
    if (callerRoleValue === "owner" && role && (role === "super_admin" || role === "owner")) {
      return new Response(JSON.stringify({ error: "Owner tidak bisa menetapkan role super_admin atau owner" }), { status: 403, headers: corsHeaders });
    }

    // Update password if provided
    if (password) {
      const { error: pwError } = await supabaseAdmin.auth.admin.updateUserById(user_id, { password });
      if (pwError) {
        return new Response(JSON.stringify({ error: pwError.message }), { status: 400, headers: corsHeaders });
      }
    }

    // Update role if provided
    if (role) {
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .update({ role })
        .eq("user_id", user_id);
      if (roleError) {
        return new Response(JSON.stringify({ error: roleError.message }), { status: 400, headers: corsHeaders });
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: corsHeaders });
  }
});
