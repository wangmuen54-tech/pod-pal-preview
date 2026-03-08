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
    const { url } = await req.json();
    if (!url) {
      return new Response(JSON.stringify({ error: 'URL is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    if (!FIRECRAWL_API_KEY) {
      return new Response(JSON.stringify({ error: 'FIRECRAWL_API_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 1: Scrape the podcast page with Firecrawl
    console.log('Scraping URL:', url);
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    const scrapeRes = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: ['markdown'],
        onlyMainContent: true,
      }),
    });

    const scrapeData = await scrapeRes.json();
    if (!scrapeRes.ok) {
      console.error('Firecrawl error:', scrapeData);
      return new Response(JSON.stringify({ error: `Failed to scrape page: ${scrapeData.error || scrapeRes.status}` }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const pageContent = scrapeData.data?.markdown || scrapeData.markdown || '';
    const pageTitle = scrapeData.data?.metadata?.title || scrapeData.metadata?.title || '';

    if (!pageContent) {
      return new Response(JSON.stringify({ error: 'Could not extract content from the page' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Scraped content length:', pageContent.length);

    // Step 2: Use AI to generate structured preview
    const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: `你是一个专业的播客预习助手。根据提供的播客页面内容，生成丰富、深入的结构化预习材料。
必须用中文回复。如果播客内容是英文的，也要翻译成中文。
目标是让听众在收听前就能建立完整的知识框架，带着问题去听，收获更大。

你必须调用 generate_preview 函数来返回结果。`
          },
          {
            role: 'user',
            content: `以下是播客页面的内容，请生成预习材料：

页面标题：${pageTitle}
页面URL：${formattedUrl}

页面内容：
${pageContent.slice(0, 8000)}`
          },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'generate_preview',
              description: '生成播客预习材料的结构化数据',
              parameters: {
                type: 'object',
                properties: {
                  title: { type: 'string', description: '播客单集标题（简短有力）' },
                  showName: { type: 'string', description: '播客节目名称（不是单集标题，而是这个播客节目/频道的名字，如"硬地骇客"、"半拿铁"、"纵横四海"等）' },
                  brief: { type: 'string', description: '30秒速览，3-4句话概括本期核心内容，让人快速了解这期在讲什么' },
                  background: { type: 'string', description: '背景知识，150-250字，介绍理解本期播客所需的前置知识和大背景' },
                  listenGuide: {
                    type: 'array',
                    items: { type: 'string' },
                    description: '收听指南：3-5个带着去听的思考问题，帮助听众主动思考',
                  },
                  keyPeople: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string', description: '人物名称' },
                        description: { type: 'string', description: '2-3句话介绍此人背景及其与本期内容的关联' },
                      },
                      required: ['name', 'description'],
                      additionalProperties: false,
                    },
                    description: '关键人物列表（2-5人）',
                  },
                  keyConcepts: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string', description: '概念名称' },
                        description: { type: 'string', description: '用通俗语言解释这个概念，包含为什么它重要' },
                      },
                      required: ['name', 'description'],
                      additionalProperties: false,
                    },
                    description: '核心概念列表（2-5个）',
                  },
                  keyEvents: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string', description: '事件名称（含时间）' },
                        description: { type: 'string', description: '事件简要说明及影响' },
                      },
                      required: ['name', 'description'],
                      additionalProperties: false,
                    },
                    description: '关键事件列表（1-4个）',
                  },
                  controversies: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string', description: '争议话题名称' },
                        description: { type: 'string', description: '不同观点和立场的简要说明' },
                      },
                      required: ['name', 'description'],
                      additionalProperties: false,
                    },
                    description: '争议与不同观点（1-3个，如果有的话）',
                  },
                  relatedResources: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string', description: '资源名称（书籍、文章、视频等）' },
                        description: { type: 'string', description: '简要说明为什么推荐这个资源' },
                      },
                      required: ['name', 'description'],
                      additionalProperties: false,
                    },
                    description: '延伸阅读/推荐资源（2-4个）',
                  },
                },
                required: ['title', 'showName', 'brief', 'background', 'listenGuide', 'keyPeople', 'keyConcepts', 'keyEvents', 'controversies', 'relatedResources'],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'generate_preview' } },
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
      return new Response(JSON.stringify({ error: 'AI analysis failed' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiRes.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      console.error('No tool call in AI response:', JSON.stringify(aiData));
      return new Response(JSON.stringify({ error: 'AI did not return structured data' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const preview = JSON.parse(toolCall.function.arguments);
    console.log('Preview generated:', preview.title);

    return new Response(JSON.stringify({ success: true, data: preview }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
