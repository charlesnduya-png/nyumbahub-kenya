import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  message: z.string().trim().min(1).max(2000),
  propertyId: z.string().optional(),
  context: z.string().optional(),
});

const STUB_RESPONSES: Record<string, string> = {
  mortgage:
    "For a typical Kenyan mortgage at ~13% p.a. over 20 years, expect monthly repayments of roughly KES 1,200 per KES 100,000 borrowed. Use our mortgage calculator on the property detail page for exact figures.",
  viewing:
    "To book a viewing, click 'Schedule Viewing' on the property page or WhatsApp the listing agent directly. Most agents offer weekday and Saturday slots.",
  default:
    "I'm Your Home's property assistant. I can help with mortgage estimates, viewing bookings, neighbourhood info, and title verification tips. What would you like to know about this listing?",
};

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
    let reply = STUB_RESPONSES.default;

    if (lower.includes("mortgage") || lower.includes("loan") || lower.includes("finance")) {
      reply = STUB_RESPONSES.mortgage;
    } else if (
      lower.includes("view") ||
      lower.includes("visit") ||
      lower.includes("see")
    ) {
      reply = STUB_RESPONSES.viewing;
    } else if (lower.includes("title") || lower.includes("deed")) {
      reply =
        "Always verify the title deed via Ardhi Sasa before paying a deposit. Request a copy of the green card or certificate of lease and confirm the seller's ID matches the registered owner.";
    } else if (lower.includes("karen") || lower.includes("kilimani") || lower.includes("westlands")) {
      reply =
        "Nairobi suburbs like Karen, Kilimani, and Westlands remain popular with expatriates and professionals. Kilimani offers walkable amenities; Karen provides larger compounds; Westlands suits corporate tenants near Sarit and ABC Place.";
    }

    return NextResponse.json({
      success: true,
      data: {
        reply,
        propertyId: parsed.data.propertyId ?? null,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to process chat message" },
      { status: 500 },
    );
  }
}
