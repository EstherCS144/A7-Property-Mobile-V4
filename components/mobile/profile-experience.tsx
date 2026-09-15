"use client";

import {
  Bell,
  Building2,
  Check,
  ChevronRight,
  CircleHelp,
  FileText,
  Globe2,
  LockKeyhole,
  LogOut,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ElementType, type ReactNode } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { useLanguage } from "@/components/i18n/language-provider";
import { MobileAppHeader } from "@/components/layout/mobile-app-header";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Sheet } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/toast-provider";
import { readStoredJson, STORAGE_KEYS, writeStoredJson } from "@/lib/local-storage";
import { mockUser } from "@/lib/mock-users";
import { cn } from "@/lib/utils";

type SettingId = "notifications" | "language" | "verification" | "help";

function ProfileExperience() {
  const { tx, language, setLanguage } = useLanguage();
  const reduceMotion = useReducedMotion();
  const { signOut, user, updateProfile } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [profile, setProfile] = useState({ name: user?.fullName ?? mockUser.name, city: mockUser.city });
  const [profileDraft, setProfileDraft] = useState(profile);
  const [profileOpen, setProfileOpen] = useState(false);
  const [activeSetting, setActiveSetting] = useState<SettingId | null>(null);
  const [notifications, setNotifications] = useState({ saved: true, messages: true, viewings: true });

  useEffect(() => {
    const storedProfile = readStoredJson(STORAGE_KEYS.profile, { name: user?.fullName ?? mockUser.name, city: mockUser.city });
    const syncedProfile = { ...storedProfile, name: user?.fullName ?? storedProfile.name };
    queueMicrotask(() => {
      setProfile(syncedProfile);
      setProfileDraft(syncedProfile);
    });
  }, [user?.fullName]);

  function saveProfile() {
    setProfile(profileDraft);
    writeStoredJson(STORAGE_KEYS.profile, profileDraft);
    updateProfile({ fullName: profileDraft.name });
    setProfileOpen(false);
    toast({ tone: "success", title: tx("Profile updated", "ပရိုဖိုင် ပြင်ဆင်ပြီးပါပြီ") });
  }

  function handleSignOut() {
    signOut();
    toast({ tone: "info", title: tx("Signed out", "အကောင့်မှ ထွက်ပြီးပါပြီ") });
    router.push("/sign-in");
  }

  const initials = profile.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const isVerified = Boolean(user?.idVerified && user?.phoneVerified);

  return (
    <div className="min-h-screen bg-[#F7F8FA] pb-28 text-[#1B1B1F] lg:pb-16">
      <header className="a7-header-surface a7-safe-top fixed inset-x-0 top-0 z-50">
        <MobileAppHeader
          avatarAlt={profile.name}
          onAvatarClick={() => { setProfileDraft(profile); setProfileOpen(true); }}
          onNotificationClick={() => setActiveSetting("notifications")}
          theme="light"
        />
      </header>

      <main className="mx-auto w-full max-w-[760px] px-4 pb-8 pt-[calc(80px+env(safe-area-inset-top))] sm:px-6">
        <motion.section initial={reduceMotion ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : 0.42, ease: [0.22, 1, 0.36, 1] }} className="flex flex-col items-center text-center" aria-labelledby="profile-title">
          <button type="button" onClick={() => { setProfileDraft(profile); setProfileOpen(true); }} className="relative rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0053D2]/20" aria-label={tx("Edit personal information", "ကိုယ်ရေးအချက်အလက်ပြင်ရန်")}>
            <Avatar src={user?.avatarUrl} alt={profile.name} initials={initials} size="lg" className="size-20 border border-[#E5E7EB] bg-[#E9EEF5] shadow-sm" />
            {isVerified && <span className="absolute bottom-0 right-0 z-10 grid size-6 place-items-center rounded-full bg-[#0053D2] text-white shadow-sm ring-2 ring-white"><Check className="size-3.5" strokeWidth={3} /></span>}
          </button>
          <h1 id="profile-title" className="mt-3 text-[24px] font-bold leading-8 tracking-[-.025em]">{profile.name}</h1>
          <p className="mt-0.5 text-[14px] leading-5 text-[#6B7280]">{tx("Device-local demo profile", "ဤစက်ပေါ်ရှိ နမူနာပရိုဖိုင်")}</p>
        </motion.section>

        <div className="mt-6 space-y-6">
          <motion.div initial={reduceMotion ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : 0.38, delay: reduceMotion ? 0 : 0.08, ease: [0.22, 1, 0.36, 1] }}><SettingsGroup title={tx("Account", "အကောင့်")}>
            <SettingsRow icon={UserRound} label={tx("Personal Information", "ကိုယ်ရေးအချက်အလက်")} onClick={() => { setProfileDraft(profile); setProfileOpen(true); }} />
            <SettingsRow icon={ShieldCheck} label={tx("Verification Status", "အတည်ပြုအခြေအနေ")} trailing={isVerified ? tx("Verified", "အတည်ပြုပြီး") : tx("Not verified", "မစိစစ်ရသေး")} onClick={() => setActiveSetting("verification")} />
            <SettingsRow
              icon={Building2}
              label={user?.accountType === "lister" ? tx("My Properties", "ကျွန်ုပ်၏အိမ်များ") : tx("Saved Homes", "သိမ်းထားသောအိမ်များ")}
              href={user?.accountType === "lister" ? "/owner?section=properties" : "/saved"}
            />
          </SettingsGroup></motion.div>

          <motion.div initial={reduceMotion ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : 0.38, delay: reduceMotion ? 0 : 0.14, ease: [0.22, 1, 0.36, 1] }}><SettingsGroup title={tx("Preferences", "စိတ်ကြိုက်ရွေးချယ်မှု")}>
            <SettingsRow icon={Globe2} label={tx("Language", "ဘာသာစကား")} trailing={language === "en" ? "EN" : "မြန်မာ"} onClick={() => setActiveSetting("language")} />
            <SettingsRow icon={Bell} label={tx("Notifications", "အသိပေးချက်များ")} onClick={() => setActiveSetting("notifications")} />
          </SettingsGroup></motion.div>

          <motion.div initial={reduceMotion ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : 0.38, delay: reduceMotion ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}><SettingsGroup title={tx("Support & Legal", "အကူအညီနှင့် စည်းမျဉ်းများ")}>
            <SettingsRow icon={CircleHelp} label={tx("Help Center", "အကူအညီစင်တာ")} onClick={() => setActiveSetting("help")} />
            <SettingsRow icon={LockKeyhole} label={tx("Privacy Policy", "ကိုယ်ရေးလုံခြုံမှု မူဝါဒ")} href="/privacy" />
            <SettingsRow icon={FileText} label={tx("Terms of Service", "ဝန်ဆောင်မှု စည်းကမ်းများ")} href="/terms" />
          </SettingsGroup></motion.div>
        </div>

        <motion.button initial={reduceMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : 0.36, delay: reduceMotion ? 0 : 0.26, ease: [0.22, 1, 0.36, 1] }} type="button" onClick={handleSignOut} className="mt-7 flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-white text-[15px] font-medium text-[#BA1A1A] shadow-sm transition-colors"><LogOut className="size-5" />{tx("Sign Out", "အကောင့်မှ ထွက်ရန်")}</motion.button>
      </main>

      <Modal
        open={profileOpen}
        onOpenChange={setProfileOpen}
        title={tx("Personal information", "ကိုယ်ရေးအချက်အလက်")}
        description={tx("Keep the details owners see accurate.", "အိမ်ရှင်များမြင်ရသော အချက်အလက်ကို မှန်ကန်စွာထားပါ။")}
        footer={<Button className="w-full" onClick={saveProfile}>{tx("Save changes", "ပြောင်းလဲမှုသိမ်းရန်")}</Button>}
      >
        <div className="space-y-5 p-5 sm:p-7">
          <div className="flex items-center gap-4"><Avatar src={user?.avatarUrl} alt="" initials={initials} size="lg" className="size-20 bg-[#EFE8DD] ring-4 ring-[#DCEBFF]" /><div><p className="text-[12px] font-semibold">{profileDraft.name}</p><p className="mt-1 text-[10px] text-[#667085]">{isVerified ? tx("Verified demo profile", "စိစစ်ထားသောနမူနာပရိုဖိုင်") : tx("Verification not completed", "စိစစ်မှုမပြီးသေး")}</p></div></div>
          <label className="block"><span className="text-[11px] font-semibold">{tx("Full name", "အမည်အပြည့်အစုံ")}</span><input value={profileDraft.name} onChange={(event) => setProfileDraft({ ...profileDraft, name: event.target.value })} className="mt-2 h-12 w-full rounded-[14px] border border-[#D0DEF0] bg-[#F8FBFF] px-4 text-[12px] outline-none focus:border-[#123B73] focus:ring-3 focus:ring-[#123B73]/12" /></label>
          <label className="block"><span className="text-[11px] font-semibold">{tx("Location", "နေရာ")}</span><select value={profileDraft.city} onChange={(event) => setProfileDraft({ ...profileDraft, city: event.target.value })} className="mt-2 h-12 w-full rounded-[14px] border border-[#D0DEF0] bg-[#F8FBFF] px-4 text-[12px] outline-none focus:border-[#123B73] focus:ring-3 focus:ring-[#123B73]/12"><option>Yangon</option><option>Mandalay</option></select></label>
          <div className="rounded-[14px] bg-[#F8FBFF] p-4 text-[10px] leading-5 text-[#5A6577]"><strong className="block text-[#101828]">{user?.email}</strong>{tx("This frontend demo stores profile data only in this browser.", "ဤ frontend နမူနာသည် ပရိုဖိုင်ဒေတာကို ဤ browser တွင်သာ သိမ်းသည်။")}</div>
        </div>
      </Modal>

      <Sheet open={Boolean(activeSetting)} onOpenChange={(open) => !open && setActiveSetting(null)} title={settingTitle(activeSetting, tx)} description={settingDescription(activeSetting, tx)} headerClassName="px-5 py-4 sm:px-7 sm:py-5">
        <div className="p-5 sm:p-7">
          {activeSetting === "verification" && <div className={cn("rounded-[18px] p-5 text-center", isVerified ? "bg-[#ECFDF5]" : "bg-[#FFF7E6]")}><ShieldCheck className={cn("mx-auto size-9", isVerified ? "fill-[#059669] text-white" : "text-[#A15C00]")} /><h2 className={cn("mt-3 text-[15px] font-semibold", isVerified ? "text-[#064E3B]" : "text-[#754400]")}>{isVerified ? tx("Demo profile marked verified", "နမူနာပရိုဖိုင်ကို စိစစ်ပြီးဟုမှတ်သားထားသည်") : tx("Verification not completed", "စိစစ်မှုမပြီးသေး")}</h2><p className={cn("mt-2 text-[11px] leading-5", isVerified ? "text-[#047857]" : "text-[#8A5A17]")}>{tx("A production account would require server-side identity and phone verification.", "Production အကောင့်တွင် server ဘက်မှ ကိုယ်ရေးနှင့်ဖုန်းစိစစ်မှု လိုအပ်သည်။")}</p></div>}
          {activeSetting === "notifications" && <div className="divide-y divide-[#D0DEF0]">{([["saved", tx("Saved-home updates", "သိမ်းထားသောအိမ်အသိပေးချက်")], ["messages", tx("New messages", "စာအသစ်များ")], ["viewings", tx("Viewing reminders", "အိမ်ကြည့်သတိပေးချက်")]] as const).map(([id, label]) => <div key={id} className="flex min-h-14 items-center gap-3 py-2"><span className="min-w-0 flex-1 text-sm font-medium leading-5">{label}</span><Toggle checked={notifications[id]} onChange={() => setNotifications({ ...notifications, [id]: !notifications[id] })} label={label} /></div>)}</div>}
          {activeSetting === "language" && <div className="grid gap-3"><p className="text-[12px] leading-5 text-[#5A6577]">{tx("Choose the language used throughout A7 Property.", "A7 Property တစ်ခုလုံးတွင် အသုံးပြုမည့် ဘာသာစကားကို ရွေးပါ။")}</p>{(["en", "my"] as const).map((option) => <button key={option} type="button" onClick={() => { setLanguage(option); setActiveSetting(null); }} className={cn("flex min-h-12 items-center justify-between rounded-[14px] border px-4 text-left text-[12px] font-semibold", language === option ? "border-[#0053D2] bg-[#EEF5FC] text-[#0053D2]" : "border-[#D0DEF0]")}>{option === "en" ? "English" : "မြန်မာ"}{language === option && <ShieldCheck className="size-4" />}</button>)}</div>}
          {activeSetting === "help" && <div className="space-y-3"><Link href="/help" className="flex min-h-14 items-center justify-between rounded-[16px] border border-[#D0DEF0] px-4 text-[12px] font-semibold">{tx("Help center", "အကူအညီစင်တာ")}<ChevronRight className="size-4" /></Link><Link href="/help#safety" className="flex min-h-14 items-center justify-between rounded-[16px] border border-[#D0DEF0] px-4 text-[12px] font-semibold">{tx("Report a safety issue", "လုံခြုံရေးပြဿနာတင်ပြရန်")}<ChevronRight className="size-4" /></Link></div>}
        </div>
      </Sheet>
    </div>
  );
}

function SettingsGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <div className="mb-2 flex min-h-11 items-center px-1">
        <h2 className="text-[12px] font-medium tracking-[.06em] text-[#6B7280]">{title.toUpperCase()}</h2>
      </div>
      <div className="overflow-hidden rounded-xl bg-[#EFEDF1] shadow-sm">{children}</div>
    </section>
  );
}

function SettingsRow({ icon: Icon, label, trailing, href, onClick }: { icon: ElementType; label: string; trailing?: string; href?: string; onClick?: () => void }) {
  const content = <><Icon className="size-5 shrink-0 text-[#0053D2]" /><span className="min-w-0 flex-1 text-[15px]">{label}</span>{trailing && <span className="shrink-0 text-[14px] text-[#6B7280]">{trailing}</span>}<ChevronRight className="size-5 shrink-0 text-[#9CA3AF]" /></>;
  const className = "flex min-h-[58px] w-full items-center gap-3 bg-white px-4 text-left transition-colors hover:bg-[#F7F8FA]";
  if (href) return <Link href={href} className={className}>{content}</Link>;
  return <button type="button" onClick={onClick} className={className}>{content}</button>;
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={onChange} className="relative h-11 w-12 shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0053D2]/18"><span className={cn("absolute left-0.5 top-2.5 h-6 w-11 overflow-hidden rounded-full transition-colors", checked ? "bg-[#0053D2]" : "bg-[#E3E2E6]")}><span className={cn("absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform", checked ? "translate-x-5" : "translate-x-0")} /></span></button>;
}

function settingTitle(setting: SettingId | null, tx: (english: string, myanmar: string) => string) {
  if (setting === "notifications") return tx("Notifications", "အသိပေးချက်များ");
  if (setting === "language") return tx("Language", "ဘာသာစကား");
  if (setting === "verification") return tx("Verification status", "အတည်ပြုအခြေအနေ");
  if (setting === "help") return tx("Help center", "အကူအညီစင်တာ");
  return tx("Settings", "ဆက်တင်များ");
}

function settingDescription(setting: SettingId | null, tx: (english: string, myanmar: string) => string) {
  if (setting === "notifications") return tx("Choose the updates that help your home search.", "အိမ်ရှာဖွေရာတွင် အသုံးဝင်သောအသိပေးချက်များကို ရွေးပါ။");
  if (setting === "language") return tx("A7 Property works in English and Myanmar.", "A7 Property ကို English နှင့် မြန်မာ နှစ်မျိုးသုံးနိုင်သည်။");
  if (setting === "verification") return tx("Review the verification flags stored in this frontend demo.", "ဤ frontend နမူနာတွင် သိမ်းထားသောစိစစ်မှုအခြေအနေကို ကြည့်ပါ။");
  if (setting === "help") return tx("Support for every step of your home journey.", "သင့်အိမ်ခရီးစဉ်အဆင့်တိုင်းအတွက် အကူအညီ။");
  return undefined;
}

export { ProfileExperience };
