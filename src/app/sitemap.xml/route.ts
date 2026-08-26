import { NextResponse } from "next/server";
import {
  SITEMAP_XML_HEADERS,
  renderSitemapIndexXml,
  sitemapOriginFromRequest,
} from "@/lib/sitemap";

export const revalidate = 3600;

export async function GET(request: Request) {
  const xml = renderSitemapIndexXml(
    new Date(),
    sitemapOriginFromRequest(request),
  );
  return new NextResponse(xml, {
    headers: SITEMAP_XML_HEADERS,
  });
}
