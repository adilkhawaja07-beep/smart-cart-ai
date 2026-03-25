import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, conversationId, interfaceType } = await req.json();
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

    // Fetch product data for context
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: products } = await supabase
      .from("products")
      .select("name, price, original_price, unit, badge, in_stock, description")
      .limit(50);

    const { data: inventory } = await supabase
      .from("inventory")
      .select("product_id, quantity, reorder_level, products(name)")
      .limit(50);

    const productContext = products?.map(p => 
      `${p.name}: $${p.price}/${p.unit}${p.badge ? ` [${p.badge}]` : ''}${p.in_stock ? '' : ' (OUT OF STOCK)'}${p.description ? ` - ${p.description}` : ''}`
    ).join('\n') || 'No products available';

    let systemPrompt = '';
    
    if (interfaceType === 'customer') {
      systemPrompt = `You are FreshCart's friendly shopping assistant. Help customers discover products, check availability, get recommendations, and find substitutions.

Current product catalog:
${productContext}

Guidelines:
- Be warm, helpful, and concise
- Suggest products based on what's in stock
- Mention prices and any active deals/badges
- If something is out of stock, suggest alternatives
- Help with meal planning and recipe suggestions
- When a customer asks for a recipe, ALWAYS suggest recipes using ONLY ingredients available in our store
- Include exact quantities and prices so the customer knows what to buy
- Format recipes with clear ingredient lists (with prices) and step-by-step instructions
- At the end of a recipe, show a "Shopping List" with total estimated cost
- Use markdown for formatting when helpful`;
    } else {
      // Management interface - include analytics context
      const { data: salesData } = await supabase
        .from("sales_log")
        .select("product_id, quantity, revenue, cost, profit, sold_at, products(name)")
        .order("sold_at", { ascending: false })
        .limit(100);

      const inventoryContext = inventory?.map((i: any) => 
        `${i.products?.name}: ${i.quantity} units (reorder at ${i.reorder_level})`
      ).join('\n') || 'No inventory data';

      const totalRevenue = salesData?.reduce((sum, s) => sum + Number(s.revenue), 0) || 0;
      const totalProfit = salesData?.reduce((sum, s) => sum + Number(s.profit || 0), 0) || 0;
      const totalCost = salesData?.reduce((sum, s) => sum + Number(s.cost || 0), 0) || 0;

      systemPrompt = `You are FreshCart's business intelligence assistant for management. Provide data-driven insights and actionable recommendations.

Product Catalog:
${productContext}

Current Inventory Levels:
${inventoryContext}

Recent Sales Summary (last 100 transactions):
- Total Revenue: $${totalRevenue.toFixed(2)}
- Total Cost: $${totalCost.toFixed(2)}  
- Total Profit: $${totalProfit.toFixed(2)}
- Gross Margin: ${totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0}%

Raw sales data (recent):
${salesData?.slice(0, 30).map((s: any) => 
  `${s.products?.name}: qty=${s.quantity}, rev=$${s.revenue}, profit=$${s.profit}, date=${new Date(s.sold_at).toLocaleDateString()}`
).join('\n') || 'No sales data'}

Guidelines:
- Provide specific numbers and calculations
- Calculate metrics like inventory turnover, DSI, gross margin per product
- Identify trends and patterns
- Give actionable business recommendations
- Use markdown tables and formatting for data
- Be analytical and professional`;
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
