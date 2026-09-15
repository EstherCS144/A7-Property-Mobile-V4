"use client";

import Link from "next/link";
import {
  BarChart3,
  Building2,
  Check,
  ChevronRight,
  CircleAlert,
  Eye,
  MessageCircle,
  Pencil,
  Search,
  Send,
  Settings,
  ShieldCheck,
  TrendingUp,
  Upload,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { useAuth } from "@/components/auth/auth-provider";
import { ListingEditorSheet, type ListingDraft } from "@/components/dashboard/listing-editor-sheet";
import { MetricCard } from "@/components/dashboard/metric-card";
import { useLanguage } from "@/components/i18n/language-provider";
import { Badge } from "@/components/ui/badge";
import { AnimatedAssetIcon } from "@/components/ui/animated-asset-icon";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet } from "@/components/ui/sheet";
import { readStoredJson, STORAGE_KEYS, writeStoredJson } from "@/lib/local-storage";
import { agentProfile, crmLeads, mockUser, normalizeAppointmentTimeline, ownerProfile, weeklyViews, type UserAppointment, type UserConversation } from "@/lib/mock-users";
import { formatPropertyPrice, type Property } from "@/lib/properties";
import { cn } from "@/lib/utils";

type CRMRole = "owner" | "agent";
type CRMLead = {
  id: string;
  name: string;
  propertyId: string;
  intent: string;
  time: string;
  status: string;
  conversationId?: string;
  viewingId?: string;
};

const notificationItems = [
  { id: "verification", title: "2 listings need documents", titleMy: "အိမ်စာရင်း ၂ ခုတွင် စာရွက်စာတမ်းလိုအပ်သည်", detail: "Add ownership or address evidence before publishing.", detailMy: "မတင်မီ ပိုင်ဆိုင်မှု သို့မဟုတ် လိပ်စာအထောက်အထား ထည့်ပါ။", time: "Today", timeMy: "ယနေ့" },
  { id: "lead", title: "New viewing request from Thiri Win", titleMy: "Thiri Win ထံမှ အိမ်ကြည့်ခွင့်အသစ်", detail: "Light-filled condo in Bahan · Saturday morning.", detailMy: "ဗဟန်းရှိ အလင်းရောင်ကောင်းသောကွန်ဒို · စနေနံနက်။", time: "8 min", timeMy: "၈ မိနစ်" },
  { id: "performance", title: "Weekly listing report is ready", titleMy: "အပတ်စဉ်စာရင်းအစီရင်ခံစာ အဆင်သင့်ဖြစ်ပြီ", detail: "Views are up 18.6% across active properties.", detailMy: "လက်ရှိအိမ်စာရင်းများ၏ ကြည့်ရှုမှု ၁၈.၆% တိုးလာသည်။", time: "1 hr", timeMy: "၁ နာရီ" },
];

function PropertyCRM({ role, properties }: { role: CRMRole; properties: Property[] }) {
  const router = useRouter();
  const { user } = useAuth();
  const { isMyanmar, tx } = useLanguage();
  const searchParams = useSearchParams();
  const requestedSection = searchParams.get("section") ?? "overview";
  const createRequested = role === "owner" && searchParams.get("create") === "1";
  const profile = role === "owner" ? ownerProfile : agentProfile;
  const displayName = user?.fullName || profile.name;
  const displayInitials = displayName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const portfolio = useMemo(() => properties.slice(role === "owner" ? 0 : 20, role === "owner" ? 25 : 88), [properties, role]);

  const [editorOpen, setEditorOpen] = useState(createRequested);
  const [leads, setLeads] = useState<CRMLead[]>(crmLeads);
  const [drafts, setDrafts] = useState<ListingDraft[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [selectedLead, setSelectedLead] = useState<CRMLead | null>(null);
  const [leadInboxOpen, setLeadInboxOpen] = useState(false);
  const [verificationOpen, setVerificationOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [showAll, setShowAll] = useState(requestedSection === "properties");
  const [notice, setNotice] = useState("");
  const [leadReply, setLeadReply] = useState("");
  const [leadStatus, setLeadStatus] = useState("");
  const [documentsReady, setDocumentsReady] = useState(false);
  const [settingsDraft, setSettingsDraft] = useState({
    name: displayName,
    email: role === "owner" ? "khinmyint@example.com" : "aungzaw@a7agency.com",
    phone: role === "owner" ? "+95 9 421 880 221" : "+95 9 777 210 045",
    instantLeads: true,
    weeklyReports: true,
  });

  useEffect(() => {
    if (requestedSection === "overview") {
      window.scrollTo({ top: 0, behavior: "instant" });
      return;
    }
    const target = requestedSection === "overview" ? "crm-overview" : `crm-${requestedSection}`;
    const frame = window.requestAnimationFrame(() => {
      if (requestedSection === "properties") setShowAll(true);
      document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [requestedSection]);

  useEffect(() => {
    function loadLocalWorkflow() {
      const conversations = readStoredJson<UserConversation[]>(STORAGE_KEYS.conversations, []);
      const storedViewings = readStoredJson<UserAppointment[]>(STORAGE_KEYS.viewings, []);
      const viewings = normalizeAppointmentTimeline(storedViewings);
      if (JSON.stringify(viewings) !== JSON.stringify(storedViewings)) writeStoredJson(STORAGE_KEYS.viewings, viewings);
      const conversationLeads: CRMLead[] = conversations.map((conversation) => ({
        id: `conversation-${conversation.id}`,
        name: conversation.seekerName || mockUser.name,
        propertyId: conversation.propertyId,
        intent: conversation.thread[0]?.text || "Property inquiry",
        time: conversation.time,
        status: conversation.thread.at(-1)?.sender === "owner" ? "Replied" : "New",
        conversationId: conversation.id,
      }));
      const viewingLeads: CRMLead[] = viewings.map((viewing) => ({
        id: `viewing-${viewing.id}`,
        name: viewing.seekerName || mockUser.name,
        propertyId: viewing.propertyId,
        intent: `Viewing request · ${viewing.date}, ${viewing.time}`,
        time: "Device local",
        status: viewing.status,
        viewingId: viewing.id,
      }));
      setLeads([...viewingLeads, ...conversationLeads, ...(viewingLeads.length || conversationLeads.length ? [] : crmLeads)]);
      setDrafts(readStoredJson<ListingDraft[]>(STORAGE_KEYS.crmDrafts, []));
    }

    loadLocalWorkflow();
    const handleStorageChange = () => loadLocalWorkflow();
    window.addEventListener("a7:stored-json-change", handleStorageChange);
    return () => window.removeEventListener("a7:stored-json-change", handleStorageChange);
  }, []);

  function createListing() {
    setSelectedProperty(null);
    setEditorOpen(true);
  }

  function editListing(property: Property) {
    setSelectedProperty(property);
    setEditorOpen(true);
  }

  function saveListing(draft: ListingDraft) {
    const current = readStoredJson<ListingDraft[]>(STORAGE_KEYS.crmDrafts, []);
    const next = [draft, ...current.filter((item) => item.title !== draft.title)].slice(0, 20);
    writeStoredJson(STORAGE_KEYS.crmDrafts, next);
    setDrafts(next);
    setNotice(tx(`${draft.title || "Listing draft"} was saved on this device.`, `${draft.title || "အိမ်စာရင်းမူကြမ်း"} ကို ဤစက်တွင် သိမ်းပြီးပါပြီ။`));
  }

  function handleEditorOpenChange(open: boolean) {
    setEditorOpen(open);
    if (!open && createRequested) router.replace("/owner", { scroll: false });
  }

  function openProperties() {
    setShowAll(true);
    router.replace(`/${role}?section=properties`, { scroll: false });
  }

  function openLead(lead: CRMLead) {
    setSelectedLead(lead);
    setLeadReply("");
    setLeadStatus("");
  }

  function sendLeadReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!leadReply.trim() || !selectedLead) return;
    const text = leadReply.trim();
    const conversations = readStoredJson<UserConversation[]>(STORAGE_KEYS.conversations, []);
    const property = properties.find((item) => item.id === selectedLead.propertyId);
    const existingIndex = conversations.findIndex((conversation) => conversation.id === selectedLead.conversationId);
    const nextConversation: UserConversation = existingIndex >= 0 ? {
      ...conversations[existingIndex],
      preview: text,
      time: "Just now",
      unread: true,
      thread: [...conversations[existingIndex].thread, { id: `${conversations[existingIndex].id}-${Date.now()}`, sender: "owner", text, time: "Just now" }],
    } : {
      id: `MSG-${Date.now()}`,
      contact: property?.owner.name || displayName,
      propertyId: selectedLead.propertyId,
      preview: text,
      time: "Just now",
      unread: true,
      seekerName: selectedLead.name,
      thread: [{ id: `MSG-${Date.now()}-1`, sender: "owner", text, time: "Just now" }],
    };
    const nextConversations = existingIndex >= 0
      ? conversations.map((conversation, index) => index === existingIndex ? nextConversation : conversation)
      : [nextConversation, ...conversations];
    writeStoredJson(STORAGE_KEYS.conversations, nextConversations);
    setLeads((current) => current.map((lead) => lead.id === selectedLead.id ? { ...lead, status: "Replied", conversationId: nextConversation.id } : lead));
    setSelectedLead((current) => current ? { ...current, status: "Replied", conversationId: nextConversation.id } : current);
    setLeadStatus(tx(`Reply saved for ${selectedLead.name}; it is now visible in Messages.`, `${selectedLead.name} အတွက် ပြန်စာသိမ်းပြီး စာများတွင် မြင်နိုင်ပါပြီ။`));
    setLeadReply("");
  }

  function updateViewingStatus(status: "Confirmed" | "Declined") {
    if (!selectedLead?.viewingId) return;
    const viewings = readStoredJson<UserAppointment[]>(STORAGE_KEYS.viewings, []);
    writeStoredJson(STORAGE_KEYS.viewings, viewings.map((viewing) => viewing.id === selectedLead.viewingId ? { ...viewing, status } : viewing));
    setLeads((current) => current.map((lead) => lead.id === selectedLead.id ? { ...lead, status } : lead));
    setSelectedLead((current) => current ? { ...current, status } : current);
    setLeadStatus(tx(`Viewing request ${status.toLowerCase()} and synced to the seeker dashboard.`, `အိမ်ကြည့်ခွင့်ကို ${status === "Confirmed" ? "အတည်ပြု" : "ငြင်းပယ်"}ပြီး ရှာဖွေသူဒက်ရှ်ဘုတ်နှင့် ချိတ်ဆက်ပြီးပါပြီ။`));
  }

  function saveWorkspaceSettings() {
    writeStoredJson(`a7-property-${role}-settings`, settingsDraft);
    setNotice(tx("Workspace settings saved.", "လုပ်ငန်းခွင်ဆက်တင်များ သိမ်းပြီးပါပြီ။"));
  }

  const maxView = Math.max(...weeklyViews.map((item) => item.value));
  const displayedProperties = showAll ? portfolio : portfolio.slice(0, 5);
  const selectedLeadProperty = selectedLead ? properties.find((property) => property.id === selectedLead.propertyId) : null;
  const statusLabel = (status: string) => ({
    "Awaiting owner": tx("Awaiting owner", "အိမ်ရှင်စောင့်ဆိုင်းဆဲ"),
    Confirmed: tx("Confirmed", "အတည်ပြုပြီး"),
    Declined: tx("Declined", "ငြင်းပယ်ပြီး"),
    Expired: tx("Expired", "သက်တမ်းကုန်ပြီ"),
    Completed: tx("Completed", "ပြီးဆုံးပြီ"),
    New: tx("New", "အသစ်"),
    Replied: tx("Replied", "ပြန်ကြားပြီး"),
    Active: tx("Active", "အသုံးပြုနေသည်"),
  } as Record<string, string>)[status] ?? status;
  const leadIntentLabel = (intent: string) => intent.replace(/^Viewing request/, tx("Viewing request", "အိမ်ကြည့်ခွင့်တောင်းဆိုမှု"));
  const leadTimeLabel = (time: string) => time === "Device local" ? tx("Device local", "ဤစက်တွင်") : time === "Just now" ? tx("Just now", "ယခုလေးတင်") : time;
  const weekdayLabel = (day: string) => ({ Mon: "တနင်္လာ", Tue: "အင်္ဂါ", Wed: "ဗုဒ္ဓဟူး", Thu: "ကြာသပတေး", Fri: "သောကြာ", Sat: "စနေ", Sun: "တနင်္ဂနွေ" } as Record<string, string>)[day] ?? day;

  return (
    <DashboardShell
      role={role}
      name={displayName}
      initials={displayInitials}
      title={role === "owner" ? tx("Property performance", "အိမ်ခြံမြေစွမ်းဆောင်ရည်") : tx("Agency workspace", "အကျိုးဆောင်လုပ်ငန်းခွင်")}
      description={role === "owner" ? tx("Manage device-local listing drafts, inquiries, and viewing requests from one place.", "ဤစက်တွင် သိမ်းထားသောမူကြမ်းများ၊ မေးမြန်းမှုများနှင့် အိမ်ကြည့်ခွင့်များကို တစ်နေရာတည်းမှ စီမံပါ။") : tx("Coordinate demo inventory and local leads across your frontend workspace.", "နမူနာအိမ်စာရင်းနှင့် ဤစက်ရှိစိတ်ဝင်စားသူများကို frontend လုပ်ငန်းခွင်မှ စီမံပါ။")}
      primaryAction={{ label: tx("Create listing", "အိမ်စာရင်းဖန်တီးရန်"), onClick: createListing }}
      onNotifications={() => setNotificationsOpen(true)}
    >
      <div id="crm-overview" className="scroll-mt-24">
        <div className="premium-surface mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[20px] p-3.5 sm:p-4">
          <div className="flex items-center gap-3">
            <AnimatedAssetIcon src="/icons/a7-listing-workspace-3d.png" width={56} height={56} hover="float" className="size-14" />
            <span>
              <strong className="flex items-center gap-1.5 text-[13px] text-[#101828]">{displayName}{user?.idVerified && user.phoneVerified && <ShieldCheck className="size-4 text-[#287A4B]" />}</strong>
              <small className="mt-1 block text-[10px] text-[#667085]">{role === "owner" ? tx("Property owner", "အိမ်ရှင်") : user?.idVerified && user.phoneVerified ? tx("Verified agent", "စိစစ်ပြီးအကျိုးဆောင်") : tx("Agent demo profile", "နမူနာအကျိုးဆောင်ပရိုဖိုင်")} · {tx("frontend demo workspace", "frontend နမူနာလုပ်ငန်းခွင်")}</small>
            </span>
          </div>
          <Link href={role === "owner" ? "/agent" : "/owner"} className="flex min-h-11 items-center gap-1 text-[11px] font-semibold text-[#123B73]">{role === "owner" ? tx("Switch to agent view", "အကျိုးဆောင်မြင်ကွင်းသို့ ပြောင်းရန်") : tx("Switch to owner view", "အိမ်ရှင်မြင်ကွင်းသို့ ပြောင်းရန်")} <ChevronRight className="size-3.5" /></Link>
        </div>
        {notice && <div className="mb-5 flex items-center gap-2 rounded-xl border border-[#2D7D46]/20 bg-[#EAF4FF] px-4 py-3 text-xs text-[#123B73]" role="status"><Check className="size-4" />{notice}</div>}
      </div>

      <section id="crm-analytics" className="scroll-mt-24">
        <div className="grid min-w-0 grid-cols-1 gap-3 min-[380px]:grid-cols-2 sm:gap-4 xl:grid-cols-4">
          <MetricCard label={tx("Demo properties", "နမူနာအိမ်များ")} value={new Intl.NumberFormat("en-US").format(portfolio.length)} change={tx(`${drafts.length} local draft${drafts.length === 1 ? "" : "s"}`, `ဤစက်ရှိမူကြမ်း ${drafts.length} ခု`)} icon={Building2} />
          <MetricCard label={tx("Listing views", "အိမ်စာရင်းကြည့်ရှုမှု")} value={new Intl.NumberFormat("en-US").format(profile.views)} change="+18.6%" icon={Eye} tone="sand" />
          <MetricCard label={tx("Local leads", "ဤစက်ရှိစိတ်ဝင်စားသူများ")} value={new Intl.NumberFormat("en-US").format(leads.length)} change={tx("Synced with Messages", "စာများနှင့် ချိတ်ဆက်ထားသည်")} icon={MessageCircle} tone="copper" />
          <MetricCard label={tx("Inquiry conversion", "မေးမြန်းမှုမှ ပြောင်းလဲနှုန်း")} value={profile.inquiryRate} change={tx("Above average", "ပျမ်းမျှအထက်")} icon={TrendingUp} />
        </div>

        <div className="mt-5 grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,.65fr)]">
          <Card className="overflow-hidden">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-start justify-between"><div><h2 className="text-lg font-semibold tracking-[-0.03em]">{tx("Sample listing views", "နမူနာအိမ်စာရင်းကြည့်ရှုမှု")}</h2><p className="mt-1 text-[11px] text-[#667085]">{tx("Illustrative frontend data, not live analytics", "ရှင်းလင်းပြသရန် frontend နမူနာဒေတာသာဖြစ်ပြီး တိုက်ရိုက်သုံးသပ်ချက်မဟုတ်ပါ")}</p></div><Badge variant="success"><TrendingUp className="size-3.5" />{tx("Demo", "နမူနာ")}</Badge></div>
              <div className="premium-grid mt-6 flex h-48 items-end gap-2 rounded-2xl border border-[#101828]/6 px-3 pt-4 sm:h-52 sm:gap-5 sm:px-5">
                {weeklyViews.map((item) => (
                  <div key={item.day} className="flex h-full flex-1 flex-col justify-end gap-2">
                    <div className="group relative rounded-t-xl bg-[linear-gradient(180deg,#D4A574_0%,#123B73_100%)] shadow-[0_8px_16px_rgba(18,59,115,.12)] transition-all hover:brightness-105" style={{ height: `${Math.round((item.value / maxView) * 90)}%` }}><span className="absolute -top-6 left-1/2 hidden -translate-x-1/2 text-[10px] font-semibold group-hover:block">{item.value}</span></div>
                    <span className="pb-2 text-center text-[10px] text-[#667085]">{isMyanmar ? weekdayLabel(item.day) : item.day}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card id="crm-verification" className="scroll-mt-24 overflow-hidden">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-start justify-between"><div><h2 className="text-lg font-semibold tracking-[-0.03em]">{tx("Verification health", "စိစစ်မှုအခြေအနေ")}</h2><p className="mt-1 text-[11px] text-[#667085]">{tx("Keep every listing trusted", "အိမ်စာရင်းတိုင်းကို ယုံကြည်စိတ်ချရစေပါ")}</p></div><span className="grid size-10 place-items-center rounded-xl bg-[#DCEBFF] text-[#287A4B]"><ShieldCheck className="size-5" /></span></div>
              <div className="mt-5 space-y-2.5">
                {[user?.idVerified ? tx("Identity marked verified", "ကိုယ်ရေးအချက်အလက် စိစစ်ပြီး") : tx("Identity not verified", "ကိုယ်ရေးအချက်အလက် မစိစစ်ရသေး"), user?.phoneVerified ? tx("Phone marked verified", "ဖုန်းစိစစ်ပြီး") : tx("Phone not verified", "ဖုန်းမစိစစ်ရသေး"), tx(`${portfolio.filter((item) => item.verification_status === "verified").length} demo listings verified`, `နမူနာအိမ်စာရင်း ${portfolio.filter((item) => item.verification_status === "verified").length} ခု စိစစ်ပြီး`), tx(`${portfolio.filter((item) => item.verification_status !== "verified").length} listings need review`, `အိမ်စာရင်း ${portfolio.filter((item) => item.verification_status !== "verified").length} ခု ပြန်စစ်ရန်လိုသည်`)].map((item, index) => (
                  <div key={item} className="flex items-center gap-3 rounded-xl border border-[#101828]/5 bg-[#F8FBFF] p-3 text-[11px] font-medium"><span className={`grid size-6 place-items-center rounded-full ${(index === 0 && !user?.idVerified) || (index === 1 && !user?.phoneVerified) || index === 3 ? "bg-[#FFF7E8] text-[#9A6500]" : "bg-[#DCEBFF] text-[#287A4B]"}`}>{(index === 0 && !user?.idVerified) || (index === 1 && !user?.phoneVerified) || index === 3 ? "!" : <Check className="size-3.5" />}</span>{item}</div>
                ))}
              </div>
              <Button variant="outline" className="mt-5 w-full text-xs" onClick={() => setVerificationOpen(true)}>{tx("Review verification", "စိစစ်မှု ပြန်ကြည့်ရန်")}</Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <div className="mt-5 grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,.6fr)]">
        <section id="crm-properties" className="min-w-0 scroll-mt-24 overflow-hidden rounded-[22px] border border-[#101828]/8 bg-[#F8FBFF] shadow-sm">
          <div className="flex min-w-0 items-end justify-between gap-3 border-b border-[#101828]/8 p-5 sm:p-6">
            <div className="min-w-0"><h2 className="text-lg font-semibold tracking-[-0.03em]">{tx("Properties", "အိမ်ခြံမြေများ")}</h2><p className="mt-1 text-[10px] text-[#667085]">{tx("Price, availability, and listing quality", "ဈေးနှုန်း၊ ရရှိနိုင်မှုနှင့် အိမ်စာရင်းအရည်အသွေး")}</p></div>
            <button type="button" onClick={() => showAll ? setShowAll(false) : openProperties()} className="inline-flex min-h-11 shrink-0 items-center text-[10px] font-semibold text-[#123B73]">{showAll ? tx("Show featured", "အထူးရွေးထားသည်များပြရန်") : tx("View all", "အားလုံးကြည့်ရန်")}</button>
          </div>
          {drafts.length > 0 && <div className="min-w-0 border-b border-[#D0DEF0] bg-[#FFF9ED] p-4 sm:p-5"><p className="text-[9px] font-semibold uppercase tracking-wider text-[#8A5A17]">{tx("Saved on this device", "ဤစက်တွင် သိမ်းထားသည်")}</p><div className="mt-3 grid min-w-0 gap-2 sm:grid-cols-2">{drafts.map((draft) => <div key={`${draft.title}-${draft.township}`} className="min-w-0 rounded-xl border border-[#E8D9B8] bg-white p-3"><strong className="block truncate text-[11px]">{draft.title}</strong><span className="mt-1 block truncate text-[9px] text-[#776849]">{draft.township} · {Number(draft.price).toLocaleString()} MMK · {tx("Draft", "မူကြမ်း")}</span></div>)}</div></div>}
          <div className="hidden max-h-[640px] overflow-auto md:block">
            <table className="w-full min-w-[700px] text-left">
              <thead className="sticky top-0 z-10 bg-[#F8FBFF] text-[9px] uppercase tracking-wider text-[#667085]"><tr><th className="px-5 py-3 font-semibold">{tx("Property", "အိမ်ခြံမြေ")}</th><th className="px-4 py-3 font-semibold">{tx("Price", "ဈေးနှုန်း")}</th><th className="px-4 py-3 font-semibold">{tx("Views", "ကြည့်ရှုမှု")}</th><th className="px-4 py-3 font-semibold">{tx("Status", "အခြေအနေ")}</th><th className="px-4 py-3"><span className="sr-only">{tx("Actions", "လုပ်ဆောင်ချက်များ")}</span></th></tr></thead>
              <tbody className="divide-y divide-[#D0DEF0]">
                {displayedProperties.map((property, index) => (
                  <tr key={property.id}>
                    <td className="px-5 py-4"><strong className="block max-w-[260px] truncate text-[11px]">{property.title}</strong><small className="mt-1 block text-[9px] text-[#667085]">{property.township} · {property.id}</small></td>
                    <td className="px-4 py-4 text-[10px] font-semibold">{formatPropertyPrice(property, isMyanmar ? "my" : "en")}</td>
                    <td className="px-4 py-4 text-[10px]">{new Intl.NumberFormat("en-US").format(430 + index * 287)}</td>
                    <td className="px-4 py-4"><Badge variant={index === 3 ? "warning" : "success"}>{index === 3 ? tx("Needs review", "ပြန်စစ်ရန်လိုသည်") : statusLabel("Active")}</Badge></td>
                    <td className="px-4 py-4"><Button size="icon" variant="ghost" className="size-11" onClick={() => editListing(property)} aria-label={tx(`Edit ${property.title}`, `${property.title} ကို ပြင်ရန်`)}><Pencil className="size-4" /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="max-h-[640px] divide-y divide-[#D0DEF0] overflow-auto md:hidden">
            {displayedProperties.map((property, index) => (
              <div key={property.id} className="p-4">
                <div className="flex items-start justify-between gap-3"><span className="min-w-0"><strong className="block truncate text-xs">{property.title}</strong><small className="mt-1 block text-[9px] text-[#667085]">{property.township} · {430 + index * 287} {tx("views", "ကြည့်ရှုမှု")}</small></span><Button size="icon" variant="ghost" className="size-11 shrink-0" onClick={() => editListing(property)} aria-label={tx(`Edit ${property.title}`, `${property.title} ကို ပြင်ရန်`)}><Pencil className="size-4" /></Button></div>
                <div className="mt-3 flex items-center justify-between"><span className="text-[10px] font-semibold">{formatPropertyPrice(property, isMyanmar ? "my" : "en")}</span><Badge variant="success">{statusLabel("Active")}</Badge></div>
              </div>
            ))}
          </div>
        </section>

        <section id="crm-messages" className="min-w-0 scroll-mt-24 rounded-[22px] border border-[#101828]/8 bg-[#F8FBFF] p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between"><div className="min-w-0"><h2 className="text-lg font-semibold tracking-[-0.03em]">{tx("Recent leads", "လတ်တလောစိတ်ဝင်စားသူများ")}</h2><p className="mt-1 text-[10px] text-[#667085]">{tx("Prioritized by intent", "စိတ်ဝင်စားမှုအလိုက် ဦးစားပေးထားသည်")}</p></div><BarChart3 className="size-5 shrink-0 text-[#123B73]" /></div>
          <div className="mt-4 divide-y divide-[#D0DEF0]">
            {leads.slice(0, 5).map((lead) => (
              <button key={lead.id} type="button" onClick={() => openLead(lead)} className="flex w-full items-center gap-3 py-4 text-left">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#DCEBFF] text-[10px] font-semibold text-[#667085]">{lead.name.split(" ").map((part) => part[0]).join("")}</span>
                <span className="min-w-0 flex-1"><strong className="block truncate text-[11px]">{lead.name}</strong><small className="mt-1 block truncate text-[9px] text-[#667085]">{leadIntentLabel(lead.intent)} · {leadTimeLabel(lead.time)}</small></span>
                <Badge variant={lead.status === "New" ? "brand" : "neutral"}>{statusLabel(lead.status)}</Badge>
              </button>
            ))}
          </div>
          <Button variant="outline" className="mt-3 w-full text-xs" onClick={() => setLeadInboxOpen(true)}>{tx("Open lead inbox", "စိတ်ဝင်စားသူစာပုံးဖွင့်ရန်")}</Button>
        </section>
      </div>

      <section id="crm-settings" className="mt-5 min-w-0 scroll-mt-24 rounded-[22px] border border-[#101828]/8 bg-[#F8FBFF] p-5 shadow-sm sm:p-6">
        <div className="flex items-start justify-between"><div className="min-w-0"><h2 className="text-lg font-semibold tracking-[-0.03em]">{tx("Workspace settings", "လုပ်ငန်းခွင်ဆက်တင်များ")}</h2><p className="mt-1 text-[10px] text-[#667085]">{tx("Contact details and notification preferences", "ဆက်သွယ်ရန်အချက်အလက်နှင့် အသိပေးချက်ရွေးချယ်မှုများ")}</p></div><Settings className="size-5 shrink-0 text-[#123B73]" /></div>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <label><span className="text-[10px] font-semibold text-[#667085]">{tx("Display name", "ပြသမည့်အမည်")}</span><input value={settingsDraft.name} onChange={(event) => setSettingsDraft({ ...settingsDraft, name: event.target.value })} className="mt-2 h-11 w-full rounded-xl border border-[#D0DEF0] px-3 text-xs outline-none focus:border-[#123B73]" /></label>
          <label><span className="text-[10px] font-semibold text-[#667085]">{tx("Email", "အီးမေးလ်")}</span><input type="email" value={settingsDraft.email} onChange={(event) => setSettingsDraft({ ...settingsDraft, email: event.target.value })} className="mt-2 h-11 w-full rounded-xl border border-[#D0DEF0] px-3 text-xs outline-none focus:border-[#123B73]" /></label>
          <label><span className="text-[10px] font-semibold text-[#667085]">{tx("Phone", "ဖုန်း")}</span><input value={settingsDraft.phone} onChange={(event) => setSettingsDraft({ ...settingsDraft, phone: event.target.value })} className="mt-2 h-11 w-full rounded-xl border border-[#D0DEF0] px-3 text-xs outline-none focus:border-[#123B73]" /></label>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-5 border-t border-[#D0DEF0] pt-5">
          {[["instantLeads", tx("Instant lead alerts", "စိတ်ဝင်စားသူအသိပေးချက်ချက်ချင်း")], ["weeklyReports", tx("Weekly performance reports", "အပတ်စဉ်စွမ်းဆောင်ရည်အစီရင်ခံစာ")]].map(([key, label]) => (
            <label key={key} className="inline-flex items-center gap-2 text-[11px] font-medium"><input type="checkbox" checked={settingsDraft[key as "instantLeads" | "weeklyReports"]} onChange={(event) => setSettingsDraft({ ...settingsDraft, [key]: event.target.checked })} className="size-4 accent-[#123B73]" />{label}</label>
          ))}
          <Button className="ml-auto rounded-full px-5" onClick={saveWorkspaceSettings}>{tx("Save settings", "ဆက်တင်များသိမ်းရန်")}</Button>
        </div>
      </section>

      <ListingEditorSheet open={editorOpen} onOpenChange={handleEditorOpenChange} property={selectedProperty} onSave={saveListing} />

      <Sheet open={Boolean(selectedLead)} onOpenChange={(open) => { if (!open) setSelectedLead(null); }} title={selectedLead ? `${selectedLead.name} · ${leadIntentLabel(selectedLead.intent)}` : tx("Lead details", "စိတ်ဝင်စားသူအသေးစိတ်")} description={selectedLeadProperty?.title} side="right" footer={selectedLead && (
        <form onSubmit={sendLeadReply} className="flex items-center gap-2"><input value={leadReply} onChange={(event) => setLeadReply(event.target.value)} placeholder={tx("Write a reply…", "ပြန်စာရေးပါ…")} aria-label={tx("Reply to lead", "စိတ်ဝင်စားသူကို ပြန်စာရေးရန်")} className="h-11 min-w-0 flex-1 rounded-full border border-[#D0DEF0] px-4 text-xs outline-none focus:border-[#123B73]" /><Button type="submit" size="icon" className="size-11 rounded-full" disabled={!leadReply.trim()} aria-label={tx("Send lead reply", "ပြန်စာပို့ရန်")}><Send className="size-4" /></Button></form>
      )}>
        {selectedLead && (
          <div className="space-y-5 p-5 sm:p-7">
            {leadStatus && <div role="status" className="rounded-2xl bg-[#DCEBFF] p-4 text-xs text-[#27714D]">{leadStatus}</div>}
            <div className="flex items-center gap-4 rounded-2xl bg-[#F8FBFF] p-4"><span className="grid size-12 place-items-center rounded-full bg-[#F8FBFF] text-xs font-semibold text-[#123B73]">{selectedLead.name.split(" ").map((part) => part[0]).join("")}</span><span><strong className="block text-sm">{selectedLead.name}</strong><small className="mt-1 block text-[10px] text-[#667085]">{leadTimeLabel(selectedLead.time)} · {statusLabel(selectedLead.status)}</small></span></div>
            <div className="rounded-2xl border border-[#D0DEF0] p-4"><span className="text-[9px] font-semibold uppercase tracking-wider text-[#667085]">{tx("Customer intent", "ဝယ်ယူသူစိတ်ဝင်စားမှု")}</span><p className="mt-2 text-xs font-semibold">{leadIntentLabel(selectedLead.intent)}</p><p className="mt-2 text-[11px] leading-5 text-[#667085]">{tx("This home seeker is ready for a clear, timely answer. Reply through A7 to keep their contact details private.", "ဤအိမ်ရှာဖွေသူအား တိကျပြီး အချိန်မီဖြေကြားပါ။ ဆက်သွယ်ရန်အချက်အလက်ကို လုံခြုံစေရန် A7 မှတစ်ဆင့် ပြန်ကြားပါ။")}</p></div>
            {selectedLead.viewingId && <div className="grid grid-cols-2 gap-2"><Button type="button" onClick={() => updateViewingStatus("Confirmed")}>{tx("Confirm viewing", "အိမ်ကြည့်ခွင့်အတည်ပြုရန်")}</Button><Button type="button" variant="outline" onClick={() => updateViewingStatus("Declined")}>{tx("Decline", "ငြင်းပယ်ရန်")}</Button></div>}
            {selectedLeadProperty && <Link href={`/properties/${selectedLeadProperty.id}`} className="flex min-h-11 items-center justify-between rounded-2xl border border-[#4DA3FF] bg-[#DCEBFF] p-4 text-xs font-semibold text-[#123B73]">{tx("View property", "အိမ်ကြည့်ရန်")} <ChevronRight className="size-4" /></Link>}
          </div>
        )}
      </Sheet>

      <Sheet open={leadInboxOpen} onOpenChange={setLeadInboxOpen} title={tx("Lead inbox", "စိတ်ဝင်စားသူစာပုံး")} description={tx("Every active property conversation, prioritized by intent.", "လက်ရှိအိမ်မေးမြန်းမှုတိုင်းကို စိတ်ဝင်စားမှုအလိုက် ဦးစားပေးထားသည်။")} side="right">
        <div className="p-5 sm:p-7">
          <label className="flex h-11 items-center gap-2 rounded-xl border border-[#D0DEF0] bg-[#F8FBFF] px-3"><Search className="size-4 text-[#7A8793]" /><input placeholder={tx("Search leads", "စိတ်ဝင်စားသူရှာရန်")} aria-label={tx("Search leads", "စိတ်ဝင်စားသူရှာရန်")} className="min-w-0 flex-1 bg-transparent text-xs outline-none" /></label>
          <div className="mt-5 divide-y divide-[#D0DEF0]">
            {leads.map((lead) => <button key={lead.id} type="button" onClick={() => { setLeadInboxOpen(false); openLead(lead); }} className="flex min-h-11 w-full items-center gap-3 py-4 text-left"><span className="grid size-10 place-items-center rounded-full bg-[#DCEBFF] text-[10px] font-semibold">{lead.name.split(" ").map((part) => part[0]).join("")}</span><span className="min-w-0 flex-1"><strong className="block text-xs">{lead.name}</strong><small className="mt-1 block truncate text-[10px] text-[#667085]">{leadIntentLabel(lead.intent)} · {leadTimeLabel(lead.time)}</small></span><ChevronRight className="size-4 text-[#9AA4AE]" /></button>)}
          </div>
        </div>
      </Sheet>

      <Sheet open={verificationOpen} onOpenChange={setVerificationOpen} title={tx("Verification center", "စိစစ်မှုဗဟို")} description={tx("Resolve listing issues and keep your inventory trusted.", "အိမ်စာရင်းပြဿနာများကို ဖြေရှင်းပြီး ယုံကြည်စိတ်ချရစေပါ။")} side="right" footer={!documentsReady && <Button className="w-full" onClick={() => setDocumentsReady(true)}><Upload className="size-4" />{tx("Submit documents", "စာရွက်စာတမ်းတင်ရန်")}</Button>}>
        {documentsReady ? (
          <div className="flex min-h-[420px] flex-col items-center justify-center p-8 text-center"><AnimatedAssetIcon src="/icons/a7-verification-saved-3d.png" width={96} height={96} hover="float" className="size-24" imageClassName="drop-shadow-[0_10px_16px_rgba(18,59,115,.18)]" /><h3 className="mt-5 text-lg font-semibold">{tx("Demo submission saved", "နမူနာတင်ပြမှု သိမ်းပြီး")}</h3><p className="mt-2 max-w-xs text-xs leading-5 text-[#667380]">{tx("No files were uploaded to a server. A production backend would securely store and review the documents.", "ဆာဗာသို့ ဖိုင်မတင်ထားပါ။ ထုတ်လုပ်မှု backend တွင် စာရွက်စာတမ်းများကို လုံခြုံစွာသိမ်းပြီး စစ်ဆေးမည်။")}</p><Button variant="outline" className="mt-6 rounded-full" onClick={() => setVerificationOpen(false)}>{tx("Done", "ပြီးပြီ")}</Button></div>
        ) : (
          <div className="space-y-4 p-5 sm:p-7">
            {portfolio.slice(3, 5).map((property) => <div key={property.id} className="rounded-2xl border border-[#E5D9C3] bg-[#FFFBF2] p-4"><div className="flex items-start gap-3"><CircleAlert className="mt-0.5 size-5 shrink-0 text-[#A16B13]" /><span><strong className="block text-xs">{property.title}</strong><small className="mt-1 block text-[10px] leading-4 text-[#776849]">{tx("Ownership or address evidence needs an update.", "ပိုင်ဆိုင်မှု သို့မဟုတ် လိပ်စာအထောက်အထားကို အပ်ဒိတ်လုပ်ရန်လိုသည်။")}</small></span></div></div>)}
            <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#4DA3FF] bg-[#DCEBFF] p-5 text-center"><input type="file" multiple className="sr-only" /><AnimatedAssetIcon src="/icons/a7-verification-documents-3d.png" width={72} height={72} hover="float" className="size-[72px]" imageClassName="drop-shadow-[0_9px_14px_rgba(18,59,115,.16)]" /><strong className="mt-3 text-xs">{tx("Choose verification documents", "စိစစ်ရန်စာရွက်စာတမ်းရွေးပါ")}</strong><small className="mt-1 text-[9px] text-[#73808C]">PDF, JPG, or PNG</small></label>
          </div>
        )}
      </Sheet>

      <Sheet open={notificationsOpen} onOpenChange={setNotificationsOpen} title={tx("Notifications", "အသိပေးချက်များ")} description={tx("Important updates across your workspace.", "လုပ်ငန်းခွင်ရှိ အရေးကြီးအပ်ဒိတ်များ။")} side="right">
        <div className="divide-y divide-[#D0DEF0] p-5 sm:p-7">
          {notificationItems.map((item, index) => <button key={item.id} type="button" onClick={() => { if (item.id === "verification") { setNotificationsOpen(false); setVerificationOpen(true); } else if (item.id === "lead" && leads[0]) { setNotificationsOpen(false); openLead(leads[0]); } }} className="flex min-h-11 w-full items-start gap-3 py-4 text-left"><span className={cn("mt-1 size-2 shrink-0 rounded-full", index < 2 ? "bg-[#123B73]" : "bg-[#D0DEF0]")} /><span className="min-w-0 flex-1"><strong className="block text-xs">{isMyanmar ? item.titleMy : item.title}</strong><small className="mt-1.5 block text-[10px] leading-4 text-[#73808C]">{isMyanmar ? item.detailMy : item.detail}</small></span><small className="shrink-0 text-[9px] text-[#8E98A2]">{isMyanmar ? item.timeMy : item.time}</small></button>)}
        </div>
      </Sheet>
    </DashboardShell>
  );
}

export { PropertyCRM };
