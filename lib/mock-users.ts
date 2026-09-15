import { getUpcomingViewingDates, isViewingDatePast } from "@/lib/viewing-dates";

export const mockUser = {
  id: "MM-USER-001",
  name: "Thiri Win",
  initials: "TW",
  email: "thiri.win@example.com",
  phone: "+95 9 420 123 456",
  city: "Yangon",
  preferredTownships: ["Kamayut", "Sanchaung", "Hlaing"],
  profileCompletion: 82,
  savedPropertyIds: ["MM-PROP-001", "MM-PROP-005", "MM-PROP-012", "MM-PROP-019"],
  recentlyViewedIds: ["MM-PROP-002", "MM-PROP-010", "MM-PROP-026"],
};

export interface ConversationMessage {
  id: string;
  sender: "user" | "owner";
  text: string;
  time: string;
}

export interface UserConversation {
  id: string;
  contact: string;
  propertyId: string;
  preview: string;
  time: string;
  unread: boolean;
  seekerName?: string;
  thread: ConversationMessage[];
}

export interface UserAppointment {
  id: string;
  propertyId: string;
  date: string;
  time: string;
  contact: string;
  status: string;
  seekerName?: string;
}

export const mockMessages: UserConversation[] = [
  {
    id: "MSG-001",
    contact: "Nandar Aye",
    propertyId: "MM-PROP-001",
    preview: "Yes, the apartment is available this weekend.",
    time: "10:42 AM",
    unread: true,
    thread: [
      { id: "MSG-001-1", sender: "user", text: "Hi, is the apartment available this weekend?", time: "10:36 AM" },
      { id: "MSG-001-2", sender: "owner", text: "Yes, the apartment is available this weekend.", time: "10:42 AM" },
    ],
  },
  {
    id: "MSG-002",
    contact: "Aung Kyaw",
    propertyId: "MM-PROP-005",
    preview: "I’ve shared the exact meeting point for tomorrow.",
    time: "Yesterday",
    unread: false,
    thread: [
      { id: "MSG-002-1", sender: "user", text: "Could you confirm where we should meet?", time: "Yesterday" },
      { id: "MSG-002-2", sender: "owner", text: "I’ve shared the exact meeting point for tomorrow.", time: "Yesterday" },
    ],
  },
  {
    id: "MSG-003",
    contact: "May Lwin",
    propertyId: "MM-PROP-012",
    preview: "The owner can include the dining table.",
    time: "Mon",
    unread: false,
    thread: [
      { id: "MSG-003-1", sender: "user", text: "Is any of the furniture included?", time: "Mon" },
      { id: "MSG-003-2", sender: "owner", text: "The owner can include the dining table.", time: "Mon" },
    ],
  },
];

export const mockAppointments: UserAppointment[] = [
  { id: "APT-001", propertyId: "MM-PROP-001", date: "Upcoming, 1", time: "10:30 AM", contact: "Nandar Aye", status: "Confirmed" },
  { id: "APT-002", propertyId: "MM-PROP-005", date: "Upcoming, 2", time: "2:00 PM", contact: "Aung Kyaw", status: "Awaiting owner" },
];

export function refreshDemoAppointmentDates(appointments: UserAppointment[], now = new Date()) {
  const upcoming = getUpcomingViewingDates(now);
  const currentDemoDates = new Map([
    ["APT-001", upcoming[0].englishLabel],
    ["APT-002", upcoming[1].englishLabel],
  ]);
  return appointments.map((appointment) => {
    const currentDate = currentDemoDates.get(appointment.id);
    return currentDate ? { ...appointment, date: currentDate } : appointment;
  });
}

export function normalizeAppointmentTimeline(appointments: UserAppointment[], now = new Date()) {
  return refreshDemoAppointmentDates(appointments, now).map((appointment) => {
    if (!isViewingDatePast(appointment.date, now)) return appointment;
    if (appointment.status === "Awaiting owner") return { ...appointment, status: "Expired" };
    if (appointment.status === "Confirmed") return { ...appointment, status: "Completed" };
    return appointment;
  });
}

export const ownerProfile = {
  name: "Daw Khin Myint",
  initials: "KM",
  role: "Property owner",
  verified: true,
  memberSince: "2023",
  responseTime: "18 min",
  properties: 25,
  views: 15000,
  messages: 250,
  inquiryRate: "8.4%",
};

export const agentProfile = {
  name: "Aung Zaw",
  initials: "AZ",
  role: "Verified agent",
  verified: true,
  memberSince: "2022",
  responseTime: "9 min",
  properties: 68,
  views: 42800,
  messages: 734,
  inquiryRate: "11.2%",
};

export const crmLeads = [
  { id: "LEAD-001", name: "Thiri Win", propertyId: "MM-PROP-001", intent: "Viewing request", time: "8 min ago", status: "New" },
  { id: "LEAD-002", name: "Ko Min", propertyId: "MM-PROP-005", intent: "Asked about ownership", time: "24 min ago", status: "Replied" },
  { id: "LEAD-003", name: "May Su", propertyId: "MM-PROP-012", intent: "Price question", time: "1 hr ago", status: "New" },
  { id: "LEAD-004", name: "Htet Naing", propertyId: "MM-PROP-019", intent: "Move-in date", time: "Yesterday", status: "Viewing" },
];

export const weeklyViews = [
  { day: "Mon", value: 1240 },
  { day: "Tue", value: 1860 },
  { day: "Wed", value: 1520 },
  { day: "Thu", value: 2310 },
  { day: "Fri", value: 2740 },
  { day: "Sat", value: 3220 },
  { day: "Sun", value: 2110 },
];
