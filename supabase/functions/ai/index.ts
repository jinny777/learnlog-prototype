import Anthropic from "npm:@anthropic-ai/sdk@^0.24.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { type, text, log } = await req.json();
    const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY") });

    let prompt = "";

    if (type === "summarize") {
      prompt = `다음 학습 내용에서 핵심 포인트 3개와 콘텐츠 각도 메모를 추출해주세요.

텍스트:
${text}

다음 JSON 형식으로만 답해주세요 (다른 설명 없이):
{"points": ["포인트1", "포인트2", "포인트3"], "memo": "콘텐츠 각도 한 줄 메모"}`;
    } else if (type === "draft") {
      prompt = `다음 학습 기록으로 브런치 스타일의 글 초안을 작성해주세요.

제목: ${log.title}
태그: ${log.tag}
출처: ${log.source || ""}
핵심 포인트:
${(log.points || []).map((p: string, i: number) => `${i + 1}. ${p}`).join("\n")}
콘텐츠 각도 메모: ${log.memo || ""}

요구사항:
- 브런치 독자를 대상으로 하는 콘텐츠 크리에이터 관점
- 제목은 독자의 호기심을 자극하는 스타일
- 본문은 400~600자, 실용적이고 읽기 쉽게
- 다음 JSON 형식으로만 답해주세요 (다른 설명 없이):
{"title": "제목", "body": "본문 내용"}`;
    } else {
      return new Response(JSON.stringify({ error: "Unknown type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = (message.content[0] as { type: string; text: string }).text;
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("JSON 파싱 실패: " + raw);
    const result = JSON.parse(match[0]);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
