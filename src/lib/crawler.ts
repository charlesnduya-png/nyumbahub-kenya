const CRAWLER_UA =
  /bot|crawler|spider|slurp|facebookexternalhit|bingpreview|google-inspectiontool|storebot|yandex|baidu|duckduck|semrush|ahrefs|mj12|dotbot|petalbot|bytespider|gptbot|claudebot|ccbot|amazonbot|applebot|pingdom|uptimerobot|statuscake|betteruptime|site24x7|monitor|preview/i;

export function isCrawlerUserAgent(userAgent: string | null | undefined) {
  if (!userAgent) return false;
  return CRAWLER_UA.test(userAgent);
}
