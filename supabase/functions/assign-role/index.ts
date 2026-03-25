import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Create Supabase client with service role key for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
  },
});

// Create regular client for RLS-enforced queries
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
});

interface RequestBody {
  userId: string;
  newRole: "customer" | "duty_clerk" | "shipping_clerk" | "dispatch_rider" | "management";
}

const VALID_ROLES = ["customer", "duty_clerk", "shipping_clerk", "dispatch_rider", "management"];

serve(async (req) => {
  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    // Get the authenticated user from the request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get user info from Supabase Auth
    const token = authHeader.replace("Bearer ", "");
    const { data, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !data.user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const adminUserId = data.user.id;

    // Check if admin has management role
    const { data: adminRole, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", adminUserId)
      .single();

    if (roleError || adminRole?.role !== "management") {
      return new Response(
        JSON.stringify({ error: "Only admins can assign roles" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Parse request body
    const body: RequestBody = await req.json();
    const { userId, newRole } = body;

    // Validate inputs
    if (!userId || !newRole) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: userId, newRole" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!VALID_ROLES.includes(newRole)) {
      return new Response(
        JSON.stringify({
          error: `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}`,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Prevent admin from removing their own admin role
    if (userId === adminUserId && newRole !== "management") {
      return new Response(
        JSON.stringify({ error: "Cannot remove your own admin role" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Assign role
    const { data: updatedRole, error: updateError } = await supabase
      .from("user_roles")
      .upsert(
        { user_id: userId, role: newRole },
        { onConflict: "user_id" }
      )
      .select()
      .single();

    if (updateError) {
      console.error("Role assignment error:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to assign role" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Log the action
    console.log(`Admin ${adminUserId} assigned role ${newRole} to user ${userId}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Role ${newRole} assigned successfully`,
        data: updatedRole,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
