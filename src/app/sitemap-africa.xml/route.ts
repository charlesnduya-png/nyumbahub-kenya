import { NextResponse } from "next/server";
import {
  SITEMAP_XML_HEADERS,
  getAfricaSitemapEntries,
  renderSitemapXml,
} from "@/lib/sitemap";

export const revalidate = 3600;

export async function GET() {
  return new NextResponse(renderSitemapXml(getAfricaSitemapEntries()), {
    headers: SITEMAP_XML_HEADERS,
  });
}
