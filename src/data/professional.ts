export type InboxMessageStatus = "UNREAD" | "READ" | "ARCHIVED";

export interface ProfessionalInboxMessage {
  id: string;
  fromName: string;
  fromEmail: string;
  fromPhone: string;
  subject: string;
  preview: string;
  body: string;
  propertyTitle?: string;
  propertyId?: string;
  status: InboxMessageStatus;
  createdAt: string;
}

export interface ProfessionalInquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  propertyTitle: string;
  propertyId: string;
  message: string;
  status:
    | "NEW"
    | "CONTACTED"
    | "VIEWING_SCHEDULED"
    | "NEGOTIATING"
    | "WON"
    | "LOST";
  source: "listing" | "whatsapp" | "call" | "website";
  createdAt: string;
}

export const mockInboxMessages: ProfessionalInboxMessage[] = [
  {
    id: "msg-1",
    fromName: "Peter Kamau",
    fromEmail: "peter.k@example.com",
    fromPhone: "0712345678",
    subject: "Viewing request — Kilimani apartment",
    preview: "Hi, can we view the Kilimani 3BR this Saturday at 10am?",
    body: "Hi, I saw your Modern 3BR Apartment in Kilimani on NyumbaHub. Can we view it this Saturday at 10am? I'm a serious buyer with pre-approval from Equity Bank.",
    propertyTitle: "Modern 3BR Apartment in Kilimani",
    propertyId: "prop-1",
    status: "UNREAD",
    createdAt: "2026-08-03T08:20:00.000Z",
  },
  {
    id: "msg-2",
    fromName: "Sarah Njeri",
    fromEmail: "sarah.n@example.com",
    fromPhone: "0723456789",
    subject: "Corporate lease enquiry",
    preview: "We need a furnished 2BR in Westlands for 12 months…",
    body: "Hello, our company needs a furnished 2BR in Westlands for 12 months. Budget is flexible if the unit includes parking and backup power. Please share availability.",
    propertyTitle: "Furnished 2BR in Westlands",
    propertyId: "prop-3",
    status: "UNREAD",
    createdAt: "2026-08-02T15:10:00.000Z",
  },
  {
    id: "msg-3",
    fromName: "James Otieno",
    fromEmail: "james.o@example.com",
    fromPhone: "0700112233",
    subject: "Title deed confirmation",
    preview: "Before we proceed, can you confirm the title status…",
    body: "Before we proceed on the Runda house, can you confirm the title deed is clean and available for due diligence this week?",
    propertyTitle: "Spacious Family House in Runda",
    propertyId: "prop-2",
    status: "READ",
    createdAt: "2026-08-01T11:45:00.000Z",
  },
  {
    id: "msg-4",
    fromName: "Amina Hassan",
    fromEmail: "buyer@nyumbahub.co.ke",
    fromPhone: "0733445566",
    subject: "Price negotiation — Kitengela plot",
    preview: "Is the Kitengela plot still available at KES 3.2M?",
    body: "Habari, is the Kitengela 1/8 acre still available? Would you consider KES 3.0M cash within 14 days?",
    propertyTitle: "1/8 Acre Plot in Kitengela",
    propertyId: "prop-5",
    status: "READ",
    createdAt: "2026-07-30T09:05:00.000Z",
  },
];

export const mockProfessionalInquiries: ProfessionalInquiry[] = [
  {
    id: "inq-1",
    name: "Peter Kamau",
    email: "peter.k@example.com",
    phone: "0712345678",
    propertyTitle: "Modern 3BR Apartment in Kilimani",
    propertyId: "prop-1",
    message: "Interested in viewing this Saturday morning.",
    status: "NEW",
    source: "listing",
    createdAt: "2026-08-03T08:20:00.000Z",
  },
  {
    id: "inq-2",
    name: "Sarah Njeri",
    email: "sarah.n@example.com",
    phone: "0723456789",
    propertyTitle: "Furnished 2BR in Westlands",
    propertyId: "prop-3",
    message: "Corporate lease for 12 months. Can we negotiate?",
    status: "CONTACTED",
    source: "website",
    createdAt: "2026-08-02T14:00:00.000Z",
  },
  {
    id: "inq-3",
    name: "Brian Mwangi",
    email: "brian.m@example.com",
    phone: "0744556677",
    propertyTitle: "Beachfront Villa in Diani",
    propertyId: "prop-4",
    message: "Holiday booking for Easter weekend — 8 guests.",
    status: "VIEWING_SCHEDULED",
    source: "whatsapp",
    createdAt: "2026-08-01T16:30:00.000Z",
  },
  {
    id: "inq-4",
    name: "Lucy Wairimu",
    email: "lucy.w@example.com",
    phone: "0711223344",
    propertyTitle: "Commercial Office Space – Upper Hill",
    propertyId: "prop-6",
    message: "Looking for 350 sqm office with parking for NGO HQ.",
    status: "NEGOTIATING",
    source: "listing",
    createdAt: "2026-07-29T10:15:00.000Z",
  },
  {
    id: "inq-5",
    name: "Daniel Kariuki",
    email: "daniel.k@example.com",
    phone: "0799887766",
    propertyTitle: "Spacious Family House in Runda",
    propertyId: "prop-2",
    message: "Cash buyer. Please share more interior photos.",
    status: "NEW",
    source: "call",
    createdAt: "2026-07-28T12:00:00.000Z",
  },
];

export const mockProfessionalStats = {
  totalListings: 8,
  activeListings: 5,
  pendingListings: 2,
  rejectedListings: 1,
  unreadMessages: 2,
  totalInquiries: 5,
  newInquiries: 2,
  totalViews: 4520,
  conversionRate: 12.5,
};
