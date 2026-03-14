import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, brief, background, keyPeople, keyConcepts, keyEvents, controversies, listenGuide } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const context = [
      `标题：${title}`,
      `速览：${brief}`,
      background ? `背景：${background}` : '',
      keyPeople?.length ? `关键人物：${keyPeople.map((p: any) => `${p.name}(${p.description})`).join('；')}` : '',
      keyConcepts?.length ? `核心概念：${keyConcepts.map((c: any) => `${c.name}(${c.description})`).join('；')}` : '',
      keyEvents?.length ? `关键事件：${keyEvents.map((e: any) => `${e.name}(${e.description})`).join('；')}` : '',
      controversies?.length ? `争议观点：${controversies.map((c: any) => `${c.name}(${c.description})`).join('；')}` : '',
      listenGuide?.length ? `收听问题：${listenGuide.join('；')}` : '',
    ].filter(Boolean).join('\n');

    const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content: `你是一个播客知识笔记助手。根据播客的预习材料，帮用户生成结构化的知识笔记。
笔记结构：
1. keyIdeas（核心观点）：提炼3-6个最重要的观点和知识点，每条简洁有力
2. highlights（高光语句）：提取2-4句播客中特别有启发性的金句或名言
3. myThoughts（我的思考）：站在听众角度写2-3句感想，自然、有洞察力
4. action（行动计划）：基于内容建议1-2个具体可执行的行动
5. rating（评分）：根据内容质量给出1-5分的推荐评分（可以有0.5分）

必须用中文回复。你必须调用 generate_notes 函数来返回结果。`
          },
          {
            role: 'user',
            content: `请根据以下播客预习材料生成知识笔记：\n\n${context}`
          },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'generate_notes',
              description: '生成播客知识笔记',
              parameters: {
                type: 'object',
                properties: {
                  keyIdeas: {
                    type: 'array',
                    items: { type: 'string' },
                    description: '3-6个核心观点',
                  },
                  highlights: {
                    type: 'array',
                    items: { type: 'string' },
                    description: '2-4条高光语句/金句',
                  },
                  myThoughts: { type: 'string', description: '2-3句思考感想' },
                  action: { type: 'string', description: '1-2个行动建议' },
                  rating: { type: 'number', description: '1-5分评分' },
                },
                required: ['keyIdeas', 'highlights', 'myThoughts', 'action', 'rating'],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'generate_notes' } },
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error('AI gateway error:', aiRes.status, errText);
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: 'AI请求过于频繁，请稍后再试' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: 'AI额度不足，请充值' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ error: 'AI生成笔记失败' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiRes.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error('No tool call in AI response:', JSON.stringify(aiData));
      return new Response(JSON.stringify({ error: 'AI未返回结构化数据' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const notes = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ success: true, data: notes }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
