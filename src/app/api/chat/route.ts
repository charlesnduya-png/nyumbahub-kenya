import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  message: z.string().trim().min(1).max(2000),
  sessionId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Message is required" },
        { status: 400 },
      );
    }

    const lower = parsed.data.message.toLowerCase();
    let reply =
      "Karibu to Your Home! I can help you search for properties, understand neighbourhoods, or explain the buying process. Try asking about areas like Karen, Diani, or Nakuru.";

    if (lower.includes("rent") || lower.includes("lease")) {
      reply =
        "For rentals, filter by 'For Rent' on our properties page. Popular areas include Kilimani, Westlands, and Syokimau. Furnished units typically start from KES 45,000/month in Nairobi.";
    } else if (lower.includes("buy") || lower.includes("purchase")) {
      reply =
        "Ready to buy? Browse verified listings, compare properties side-by-side, and connect with licensed EARB agents. Always verify title deeds via Ardhi Sasa before paying.";
    } else if (lower.includes("agent")) {
      reply =
        "Our verified agents cover Nairobi, Mombasa, Nakuru, and Kiambu. Visit the Agents page to filter by county and read reviews from past clients.";
    }

    return NextResponse.json({
      success: true,
      data: {
        reply,
        sessionId: parsed.data.sessionId ?? `chat-${Date.now()}`,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to process message" },
      { status: 500 },
    );
  }
}
