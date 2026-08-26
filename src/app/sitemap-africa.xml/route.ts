import { NextResponse } from "next/server";
import {
  SITEMAP_XML_HEADERS,
  getAfricaSitemapEntries,
  renderSitemapXml,
  sitemapOriginFromRequest,
} from "@/lib/sitemap";

export const revalidate = 3600;

export async function GET(request: Request) {
  return new NextResponse(
    renderSitemapXml(
      getAfricaSitemapEntries(new Date(), sitemapOriginFromRequest(request)),
    ),
    {
      headers: SITEMAP_XML_HEADERS,
    },
  );
}
