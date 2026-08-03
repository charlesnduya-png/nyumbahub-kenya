export interface ViewsPoint {
  label: string;
  views: number;
  inquiries: number;
}

export interface ListingViewsSeries {
  id: string;
  title: string;
  totalViews: number;
  series: ViewsPoint[];
}

/** Last 7 days of portfolio views (demo analytics). */
export const portfolioViewsSeries: ViewsPoint[] = [
  { label: "Mon", views: 120, inquiries: 3 },
  { label: "Tue", views: 186, inquiries: 5 },
  { label: "Wed", views: 154, inquiries: 4 },
  { label: "Thu", views: 210, inquiries: 7 },
  { label: "Fri", views: 278, inquiries: 9 },
  { label: "Sat", views: 342, inquiries: 12 },
  { label: "Sun", views: 265, inquiries: 8 },
];

export const listingViewsBreakdown: ListingViewsSeries[] = [
  {
    id: "prop-1",
    title: "Modern 3BR Apartment in Kilimani",
    totalViews: 1240,
    series: [
      { label: "Mon", views: 110, inquiries: 1 },
      { label: "Tue", views: 140, inquiries: 2 },
      { label: "Wed", views: 160, inquiries: 1 },
      { label: "Thu", views: 190, inquiries: 3 },
      { label: "Fri", views: 220, inquiries: 2 },
      { label: "Sat", views: 250, inquiries: 4 },
      { label: "Sun", views: 170, inquiries: 2 },
    ],
  },
  {
    id: "prop-2",
    title: "Spacious Family House in Runda",
    totalViews: 980,
    series: [
      { label: "Mon", views: 90, inquiries: 1 },
      { label: "Tue", views: 120, inquiries: 1 },
      { label: "Wed", views: 100, inquiries: 0 },
      { label: "Thu", views: 150, inquiries: 2 },
      { label: "Fri", views: 180, inquiries: 3 },
      { label: "Sat", views: 200, inquiries: 2 },
      { label: "Sun", views: 140, inquiries: 1 },
    ],
  },
  {
    id: "prop-3",
    title: "Furnished 2BR in Westlands",
    totalViews: 560,
    series: [
      { label: "Mon", views: 40, inquiries: 1 },
      { label: "Tue", views: 55, inquiries: 0 },
      { label: "Wed", views: 70, inquiries: 2 },
      { label: "Thu", views: 85, inquiries: 1 },
      { label: "Fri", views: 95, inquiries: 2 },
      { label: "Sat", views: 120, inquiries: 3 },
      { label: "Sun", views: 95, inquiries: 1 },
    ],
  },
];

export function getTotalPortfolioViews() {
  return portfolioViewsSeries.reduce((sum, d) => sum + d.views, 0);
}
