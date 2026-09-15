"use client";

import { motion, useReducedMotion } from "framer-motion";
import { BadgeCheck, CheckCheck, LockKeyhole, MoreHorizontal, Search, Send, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { useLanguage } from "@/components/i18n/language-provider";
import { useAuth } from "@/components/auth/auth-provider";
import { MobileAppHeader } from "@/components/layout/mobile-app-header";
import { AnimatedAssetIcon } from "@/components/ui/animated-asset-icon";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker";
import { Message, MessageAvatar, MessageContent, MessageFooter, MessageGroup, MessageHeader } from "@/components/ui/message";
import { ProgressiveImage } from "@/components/ui/progressive-image";
import { Sheet } from "@/components/ui/sheet";
import { readStoredJson, STORAGE_KEYS, writeStoredJson } from "@/lib/local-storage";
import { mockMessages, mockUser, type UserConversation } from "@/lib/mock-users";
import { formatPropertyPrice, type Property } from "@/lib/properties";
import { cn } from "@/lib/utils";

function MessagesExperience({ properties }: { properties: Property[] }) {
  const { tx } = useLanguage();
  const reduceMotion = useReducedMotion();
  const [messages, setMessages] = useState<UserConversation[]>(mockMessages);
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>(mockMessages[0]?.id ?? null);
  const [mobileThreadOpen, setMobileThreadOpen] = useState(false);
  const [reply, setReply] = useState("");

  useEffect(() => {
    const storedMessages = readStoredJson<UserConversation[]>(STORAGE_KEYS.conversations, mockMessages);
    queueMicrotask(() => {
      setMessages(storedMessages);
      setActiveId(storedMessages[0]?.id ?? null);
    });
  }, []);

  const active = messages.find((conversation) => conversation.id === activeId) ?? null;
  const visibleMessages = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return messages.filter((conversation) => {
      const property = properties.find((item) => item.id === conversation.propertyId);
      if (!property) return false;
      return !normalizedQuery || `${conversation.contact} ${conversation.preview} ${property.title}`.toLowerCase().includes(normalizedQuery);
    });
  }, [messages, properties, query]);

  function openConversation(conversation: UserConversation) {
    const next = messages.map((item) => item.id === conversation.id ? { ...item, unread: false } : item);
    setMessages(next);
    writeStoredJson(STORAGE_KEYS.conversations, next);
    setActiveId(conversation.id);
    setMobileThreadOpen(true);
  }

  function sendReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = reply.trim();
    if (!text || !active) return;
    const next = messages.map((conversation) => conversation.id === active.id ? {
      ...conversation,
      preview: text,
      time: "Just now",
      thread: [...conversation.thread, { id: `${conversation.id}-${Date.now()}`, sender: "user" as const, text, time: "Just now" }],
    } : conversation);
    setMessages(next);
    writeStoredJson(STORAGE_KEYS.conversations, next);
    setReply("");
  }

  const entrance = reduceMotion ? { duration: 0 } : { type: "spring" as const, stiffness: 92, damping: 19 };

  return (
    <div className="min-h-screen bg-[#FAF8FF] pb-28 text-[#191B24] lg:pb-10">
      <header className="a7-header-surface a7-safe-top fixed inset-x-0 top-0 z-50">
        <div className="mx-auto w-full max-w-[920px]">
          <MobileAppHeader />
          <div className="px-4 pb-2 pt-1 sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <h1 className="text-[28px] font-bold leading-9 tracking-[-.025em]">{tx("Messages", "စာများ")}</h1>
              <AnimatedAssetIcon src="/icons/a7-messages-3d.png" width={52} height={52} hover="float" className="size-[52px]" imageClassName="drop-shadow-[0_8px_12px_rgba(18,59,115,.2)]" />
            </div>
            <label className="mt-4 flex h-11 items-center gap-2 rounded-xl bg-[#E6E7F4] px-3 transition-shadow focus-within:shadow-[0_0_0_3px_rgba(0,83,210,.10)]">
              <Search className="size-5 shrink-0 text-[#424655]" />
              <span className="sr-only">{tx("Search conversations", "စကားပြောမှုများရှာရန်")}</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={tx("Search", "ရှာရန်")} className="h-11 min-w-0 flex-1 bg-transparent py-0 text-[14px] leading-10 text-[#191B24] outline-none placeholder:text-[#727687]" />
            </label>
          </div>
        </div>
      </header>

      <motion.main initial={reduceMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={entrance} className="mx-auto min-h-screen w-full max-w-[920px] pb-8 pt-[calc(182px+env(safe-area-inset-top))]">
        <section aria-label={tx("Conversation list", "စကားပြောမှုစာရင်း")}>
          {visibleMessages.map((conversation, index) => <ConversationCard key={conversation.id} conversation={conversation} properties={properties} index={index} reduceMotion={Boolean(reduceMotion)} onClick={() => openConversation(conversation)} />)}
          {visibleMessages.length === 0 && <div className="px-6 py-16 text-center"><AnimatedAssetIcon src="/icons/a7-conversation-empty-3d.png" width={80} height={80} hover="float" className="mx-auto size-20" imageClassName="drop-shadow-[0_9px_14px_rgba(18,59,115,.16)]" /><p className="mt-3 text-[13px] font-semibold">{tx("No conversations found", "စကားပြောမှုမတွေ့ပါ")}</p><p className="mt-1 text-[12px] text-[#727687]">{tx("Try another name or property.", "အမည် သို့မဟုတ် အိမ်အမည်တစ်ခုကို ထပ်ရှာကြည့်ပါ။")}</p></div>}
        </section>
      </motion.main>

      <Sheet open={mobileThreadOpen} onOpenChange={setMobileThreadOpen} title={active?.contact ?? tx("Conversation", "စကားပြော")} description={tx("Review each listing’s contact verification status", "အိမ်တစ်ခုစီ၏ ဆက်သွယ်သူစိစစ်မှုကို ကြည့်ပါ")} side="right" className="max-w-none sm:max-w-[540px]">
        {active && <ConversationThread conversation={active} properties={properties} reply={reply} onReplyChange={setReply} onSubmit={sendReply} compact />}
      </Sheet>
    </div>
  );
}

function ConversationCard({ conversation, properties, index, reduceMotion, onClick }: { conversation: UserConversation; properties: Property[]; index: number; reduceMotion: boolean; onClick: () => void }) {
  const { tx } = useLanguage();
  const property = properties.find((item) => item.id === conversation.propertyId);
  if (!property) return null;
  const initials = conversation.contact.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const avatarTone = index === 0 ? "bg-[#DAE2FF] text-[#003FA3]" : index === 1 ? "bg-[#DCEFE8] text-[#146B53]" : "bg-[#F4E6E0] text-[#8A4C36]";
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: reduceMotion ? 0 : index * 0.06, duration: reduceMotion ? 0 : 0.34, ease: [0.22, 1, 0.36, 1] }}
      whileHover={reduceMotion ? undefined : { backgroundColor: "#F2F3FF" }}
      whileTap={reduceMotion ? undefined : { scale: 0.995 }}
      className="group flex w-full items-start gap-4 border-b border-[#C2C6D8]/30 bg-[#FAF8FF] px-4 py-4 text-left transition-colors last:border-b-0 sm:px-6"
      aria-label={tx(`Open conversation with ${conversation.contact} about ${property.title} (${property.id})`, `${conversation.contact} နှင့် ${property.title} (${property.id}) အကြောင်း စကားပြောခန်းဖွင့်ရန်`)}
    >
      <span className={cn("relative grid size-[52px] shrink-0 place-items-center rounded-full text-[16px] font-semibold leading-none shadow-sm", avatarTone)}>
        <span className="relative top-px inline-flex items-center leading-none">{initials}</span>
        {conversation.unread && <span className="absolute -right-0.5 top-0 size-3.5 rounded-full bg-[#007AFF] ring-2 ring-[#FAF8FF]" aria-label={tx("Unread message", "မဖတ်ရသေးသောစာ")} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-3">
          <strong className={cn("flex min-w-0 items-center gap-1 truncate text-[17px] tracking-[-.015em]", conversation.unread ? "font-semibold text-[#191B24]" : "font-medium text-[#292B34]")}><span className="truncate">{conversation.contact}</span>{property.verification_status === "verified" && <BadgeCheck className="size-4 shrink-0 fill-[#007AFF] text-white" />}</strong>
          <time className={cn("shrink-0 text-[13px]", conversation.unread ? "font-medium text-[#007AFF]" : "text-[#727687]")}>{conversation.time}</time>
        </span>
        <span className="mt-1 flex min-w-0 items-center gap-2 text-[#424655]">
          <span className="relative size-6 shrink-0 overflow-hidden rounded bg-[#E6E7F4] shadow-sm"><ProgressiveImage src={property.images[0]} alt="" fill sizes="24px" className="object-cover" /></span>
          <span className="truncate text-[14px]">{property.title}</span>
        </span>
        <span className={cn("mt-1 block line-clamp-2 pr-1 text-[15px] leading-5", conversation.unread ? "font-medium text-[#191B24]" : "text-[#424655]")}>{conversation.preview}</span>
      </span>
    </motion.button>
  );
}

function ConversationThread({ conversation, properties, reply, onReplyChange, onSubmit, compact = false }: { conversation: UserConversation; properties: Property[]; reply: string; onReplyChange: (value: string) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; compact?: boolean }) {
  const { isMyanmar, tx } = useLanguage();
  const { user } = useAuth();
  const property = properties.find((item) => item.id === conversation.propertyId);
  if (!property) return <EmptyConversation />;
  const role = property.owner.phone_verified
    ? (property.owner.type === "agent" ? tx("Phone-verified agent", "ဖုန်းစိစစ်ပြီးအကျိုးဆောင်") : tx("Phone-verified owner", "ဖုန်းစိစစ်ပြီးအိမ်ရှင်"))
    : tx("Phone not verified", "ဖုန်းမစိစစ်ရသေး");
  const contactInitials = conversation.contact.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const userInitials = user?.fullName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || mockUser.initials;
  return (
    <div className={cn("flex h-[620px] flex-col", compact && "h-[calc(100svh-126px)] min-h-[500px]")}>
      <div className="flex items-center gap-3 border-b border-[#D0DEF0] bg-[#F8FBFF]/90 px-4 py-3 sm:px-5">
        <Link href={`/properties/${property.id}`} className="relative h-14 w-[76px] shrink-0 overflow-hidden rounded-[13px] bg-[#D0DEF0]"><ProgressiveImage src={property.images[0]} alt={property.title} fill sizes="76px" className="object-cover" /></Link>
        <div className="min-w-0 flex-1"><Link href={`/properties/${property.id}`} className="block truncate text-[12px] font-semibold text-[#101828] hover:text-[#123B73]">{property.title}</Link><p className="mt-1 truncate text-[9px] text-[#78817C]">{formatPropertyPrice(property, isMyanmar ? "my" : "en")} · {property.township}</p><p className="mt-1 inline-flex items-center gap-1 text-[8px] font-semibold text-[#123B73]"><ShieldCheck className="size-3" />{conversation.contact} · {role}</p></div>
        <button type="button" className="grid size-11 place-items-center rounded-full bg-[#F8FBFF] text-[#69736E]" aria-label={tx("Conversation options", "စကားပြောရွေးချယ်မှု")}><MoreHorizontal className="size-4" /></button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-[#F8FBFF] p-4 sm:p-6">
        <div className="mt-auto space-y-5">
          <Marker className="mx-auto w-fit rounded-full border border-white/90 bg-[#F8FBFF]/78 px-3 py-1.5 text-[8px] font-semibold text-[#52716B] shadow-sm backdrop-blur">
            <MarkerIcon><LockKeyhole className="size-3" /></MarkerIcon>
            <MarkerContent>{tx("Your contact details remain private", "သင့်ဆက်သွယ်ရန်အချက်အလက်များ လုံခြုံသည်")}</MarkerContent>
          </Marker>
          <Marker variant="separator" className="text-[8px] font-semibold uppercase tracking-[0.08em] text-[#8A918D]"><MarkerContent>{tx("Today", "ယနေ့")}</MarkerContent></Marker>
          <MessageGroup className="gap-4">
            {conversation.thread.map((message) => {
              const isUser = message.sender === "user";
              return (
                <Message key={message.id} align={isUser ? "end" : "start"} className="gap-2.5">
                  <MessageAvatar className="min-w-8 overflow-visible bg-transparent">
                    <Avatar size="sm" className={cn("ring-2 ring-white", isUser ? "bg-[#123B73] text-white" : "bg-[#E7EEF7] text-[#123B73]")}>
                      <AvatarFallback>{isUser ? userInitials : contactInitials}</AvatarFallback>
                    </Avatar>
                  </MessageAvatar>
                  <MessageContent className="max-w-[82%] gap-1.5">
                    <MessageHeader className={cn("px-1 text-[8px]", isUser && "justify-end")}>{isUser ? tx("You", "သင်") : conversation.contact}</MessageHeader>
                    <Bubble variant={isUser ? "default" : "muted"} align={isUser ? "end" : "start"} className="max-w-full">
                      <BubbleContent className={cn("rounded-[18px] px-4 py-3 text-[11px] leading-5 shadow-[0_2px_8px_rgba(15,23,42,.045)]", isUser ? "rounded-br-[6px]" : "rounded-bl-[6px] text-[#38423E]")}>{message.text}</BubbleContent>
                    </Bubble>
                    <MessageFooter className={cn("gap-1 px-1 text-[8px]", isUser ? "text-[#6B7C91]" : "text-[#858D88]")}>{message.time}{isUser && <CheckCheck className="size-3 text-[#123B73]" />}</MessageFooter>
                  </MessageContent>
                </Message>
              );
            })}
          </MessageGroup>
        </div>
      </div>
      <form onSubmit={onSubmit} className="border-t border-[#D0DEF0] bg-[#F8FBFF] p-3 sm:p-4"><div className="flex items-end gap-2 rounded-[14px] border border-[#D0DEF0] bg-[#F8FBFF] p-2 transition-[border-color,box-shadow] focus-within:border-[#123B73] focus-within:shadow-[0_0_0_3px_rgba(18,59,115,.08)]"><textarea data-focus-ring="parent" value={reply} onChange={(event) => onReplyChange(event.target.value)} rows={1} aria-label={tx("Write a message", "စာရေးရန်")} placeholder={tx("Write a message…", "စာရေးပါ…")} className="max-h-28 min-h-11 flex-1 resize-none bg-transparent px-2 py-2 text-[11px] outline-none" /><button type="submit" disabled={!reply.trim()} className="grid size-11 shrink-0 place-items-center rounded-[12px] bg-[#123B73] text-white disabled:opacity-40" aria-label={tx("Send message", "စာပို့ရန်")}><Send className="size-4" /></button></div></form>
    </div>
  );
}

function EmptyConversation() {
  const { tx } = useLanguage();
  return <div className="grid h-[620px] place-items-center p-8 text-center"><div><AnimatedAssetIcon src="/icons/a7-conversation-empty-3d.png" width={80} height={80} hover="float" className="mx-auto size-20" imageClassName="drop-shadow-[0_9px_14px_rgba(18,59,115,.16)]" /><h2 className="mt-4 text-lg font-semibold">{tx("Choose a conversation", "စကားပြောခန်းတစ်ခု ရွေးပါ")}</h2><p className="mt-2 text-[11px] text-[#737C77]">{tx("Property details stay close while you chat.", "စကားပြောနေစဉ် အိမ်အသေးစိတ်ကို အလွယ်တကူ ကြည့်နိုင်ပါသည်။")}</p></div></div>;
}

export { MessagesExperience };
