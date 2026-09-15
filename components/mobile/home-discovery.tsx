"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Bath, BedDouble, Check, ChevronDown, Heart, MapPin, Maximize2, Search, SlidersHorizontal, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { useLanguage } from "@/components/i18n/language-provider";
import { useAuth } from "@/components/auth/auth-provider";
import { MobileAppHeader } from "@/components/layout/mobile-app-header";
import { AnimatedAssetIcon } from "@/components/ui/animated-asset-icon";
import { ProgressiveImage } from "@/components/ui/progressive-image";
import { useToast } from "@/components/ui/toast-provider";
import { readStoredIds, STORAGE_KEYS, writeStoredIds } from "@/lib/local-storage";
import { mockUser } from "@/lib/mock-users";
import { a7Motion } from "@/lib/motion";
import { formatPropertyPrice, type Property } from "@/lib/properties";
import { cn } from "@/lib/utils";

type HomeMode = "rent" | "buy";

const locationCards = [
  { name: "Yangon", nameMy: "ရန်ကုန်", location: "Yangon", image: "/images/locations/yangon-karaweik-v2.jpg" },
  { name: "Mandalay", nameMy: "မန္တလေး", location: "Mandalay", image: "/images/locations/mandalay-u-bein-v2.jpg" },
  { name: "Bahan", nameMy: "ဗဟန်း", location: "Bahan", image: "/images/locations/bahan-shwedagon-v2.jpg" },
] as const;

interface HomeDiscoveryProps {
  recommendedByPurpose: Record<Property["purpose"], Property[]>;
  locationCounts: Record<string, number>;
}

function HomeDiscovery({ recommendedByPurpose, locationCounts }: HomeDiscoveryProps) {
  const { tx, isMyanmar } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [mode, setMode] = useState<HomeMode>("rent");
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState(mockUser.savedPropertyIds);

  const purpose: Property["purpose"] = mode === "rent" ? "rent" : "sale";
  const searchHref = buildSearchHref(mode);
  const browseAllHref = `${searchHref}&browse=all`;
  const recommended = recommendedByPurpose[purpose];

  useEffect(() => {
    const stored = readStoredIds(STORAGE_KEYS.saved, STORAGE_KEYS.legacySaved, mockUser.savedPropertyIds);
    queueMicrotask(() => setSaved(stored));
  }, []);

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams({ purpose });
    if (mode === "buy") params.set("mode", "buy");
    if (query.trim()) params.set("location", query.trim());
    router.push(`/search?${params.toString()}`);
  }

  function toggleSaved(property: Property) {
    const wasSaved = saved.includes(property.id);
    const next = wasSaved ? saved.filter((id) => id !== property.id) : [...saved, property.id];
    setSaved(next);
    writeStoredIds(STORAGE_KEYS.saved, next);
    toast({
      tone: "success",
      title: wasSaved ? tx("Removed from Saved Homes", "သိမ်းထားသောအိမ်မှ ဖယ်ပြီး") : tx("Saved for later", "နောက်မှကြည့်ရန် သိမ်းပြီး"),
      description: property.title,
    });
  }

  return (
    <div className="min-h-screen overflow-x-clip bg-[#FAF8FF] pb-[116px] text-[#191B24] lg:pb-12">
      <header className="a7-header-surface a7-safe-top sticky inset-x-0 top-0 z-50">
        <MobileAppHeader languageLabelClassName="inline-flex h-[18px] w-10 items-center justify-center !text-[12px] !leading-[18px]" />
      </header>

      <motion.main
        initial={reduceMotion ? false : "hidden"}
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: reduceMotion ? 0 : 0.06, delayChildren: reduceMotion ? 0 : 0.05 } } }}
        className="pt-0"
      >
        <motion.section variants={reveal(reduceMotion)} className="relative mx-1.5 h-[552px] max-w-[920px] overflow-hidden rounded-[26px] bg-[#191B24] sm:mx-auto sm:h-[610px] sm:rounded-[38px]" aria-labelledby="home-hero-title">
          <ProgressiveImage src="/images/properties/hero-modern-yangon-v2.png" alt="Contemporary tropical home in Yangon at blue hour" fill priority sizes="(max-width: 920px) calc(100vw - 12px), 920px" className="object-cover object-center" skeletonClassName="bg-[#DCEBFF]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,13,23,.52)_0%,rgba(7,13,23,.18)_34%,rgba(7,13,23,.84)_100%)]" />

          <div className="relative z-10 flex h-full flex-col justify-between px-5 pb-[18px] pt-3 sm:px-8 sm:pb-10 sm:pt-6">
            <div className="flex items-start justify-between gap-4">
              <div className="text-white"><p className="text-[12px] text-white/75 sm:text-[14px]">{tx("Good morning", "မင်္ဂလာနံနက်ခင်းပါ")}</p><p className="mt-0.5 text-[22px] font-semibold tracking-[-.04em] sm:text-[28px]">{user?.fullName.split(/\s+/)[0] ?? tx("Guest", "ဧည့်သည်")}</p></div>
              <Link href="/search?purpose=rent&location=Yangon" className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full border border-white/20 bg-black/25 px-3.5 text-[14px] font-medium leading-none text-white backdrop-blur-md"><MapPin className="size-[18px] shrink-0 text-[#4EA4FF]" /><span className="inline-flex h-4 items-center leading-4">{tx("Yangon", "ရန်ကုန်")}</span><ChevronDown className="size-3.5 shrink-0 text-white/70" /></Link>
            </div>

            <div className="relative -top-4 max-w-[620px]">
              <div>
                <div className="flex items-center gap-3">
                  <AnimatedAssetIcon src="/icons/a7-personal-search-3d.png" width={48} height={48} hover="float" className="size-12" imageClassName="drop-shadow-[0_8px_12px_rgba(0,0,0,.3)]" />
                  <p className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.16em] text-[#B2C5FF]"><span className="size-2 rounded-full bg-[#B2C5FF]" />{tx("Home discovery, made personal", "သင့်အတွက် ကိုယ်ပိုင်အိမ်ရှာဖွေမှု")}</p>
                </div>
                <h1 id="home-hero-title" className="mt-3 max-w-[470px] text-[36px] font-bold leading-[1.12] tracking-[-.045em] text-white sm:text-[50px]">{tx("Find a home that feels like you.", "သင့်စိတ်တိုင်းကျ အိမ်တစ်လုံးကို ရှာပါ။")}</h1>
                <p className="mt-3 max-w-[440px] text-[16px] leading-6 text-white/78">{tx("Clear prices, visible verification status, and direct inquiry tools.", "ရှင်းလင်းသောဈေးနှုန်း၊ မြင်သာသောစိစစ်မှုအခြေအနေနှင့် တိုက်ရိုက်မေးမြန်းနိုင်မှု။")}</p>
              </div>

              <form onSubmit={submitSearch} role="search" className="mt-5 flex h-16 items-center rounded-full bg-[#FAF8FF] p-1.5 pl-5 shadow-[0_14px_36px_rgba(0,0,0,.22)] focus-within:ring-4 focus-within:ring-[#B2C5FF]/25">
                <Search className="size-5 shrink-0 text-[#424655]" />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={tx("Township, landmark or property ID...", "မြို့နယ်၊ အထင်ကရနေရာ သို့မဟုတ် အိမ်နံပါတ်...")} aria-label={tx("Search for a home", "အိမ်ရှာရန်")} className="h-full min-w-0 flex-1 bg-transparent px-3 !text-[14px] !leading-[52px] text-[#191B24] outline-none placeholder:text-[#66758A] sm:!text-[16px]" />
                <button type="submit" className="grid size-[52px] shrink-0 place-items-center rounded-full bg-[#064D93] text-white shadow-[0_7px_18px_rgba(0,83,210,.28)] transition-transform active:scale-95" aria-label={tx("Search", "ရှာရန်")}><Search className="size-5" /></button>
              </form>

              <div className="mt-2 flex h-[58px] items-center rounded-full bg-[#FAF8FF]/92 p-1.5 shadow-lg backdrop-blur-md" role="tablist" aria-label={tx("Property purpose", "အိမ်ခြံမြေ ရည်ရွယ်ချက်")}>
                <ModeButton active={mode === "rent"} label={tx("Rent", "ငှားရန်")} onClick={() => setMode("rent")} />
                <ModeButton active={mode === "buy"} label={tx("Buy", "ဝယ်ရန်")} onClick={() => setMode("buy")} />
                <Link href={searchHref} className="ml-1 grid size-11 shrink-0 place-items-center rounded-full text-[#424655] transition-colors hover:bg-[#E6E7F4] hover:text-[#0053D2]" aria-label={tx("Open filters", "စစ်ထုတ်မှုဖွင့်ရန်")}><SlidersHorizontal className="size-5" /></Link>
              </div>
              <div className="mt-2 flex justify-end">
                <Link href="/assistant" className="grid h-12 min-w-[112px] grid-cols-[18px_auto] place-content-center items-center gap-2 rounded-full border border-[#A6CFFF] bg-[#064D93] px-4 text-sm font-semibold leading-none text-white shadow-[0_12px_28px_rgba(0,83,210,.32)] transition-transform hover:-translate-y-0.5"><Sparkles className="size-[18px] fill-current" /><span className="relative top-px whitespace-nowrap leading-none">{tx("Ask A7", "A7 ကိုမေးရန်")}</span></Link>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section variants={reveal(reduceMotion)} className="mx-auto mt-10 w-full max-w-[920px]" aria-labelledby="locations-title">
          <div className="flex items-center gap-3 px-4 sm:px-6">
            <AnimatedAssetIcon src="/icons/a7-location-choice-3d.png" width={48} height={48} hover="float" className="size-12" imageClassName="drop-shadow-[0_7px_10px_rgba(18,59,115,.17)]" />
            <h2 id="locations-title" className="text-[20px] font-semibold tracking-[-.035em] sm:text-[22px]">{tx("Where do you want to live?", "ဘယ်မှာနေချင်ပါသလဲ?")}</h2>
          </div>
          <div className="mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-6">
            {locationCards.map((location, index) => <LocationCard key={location.name} location={location} mode={mode} isMyanmar={isMyanmar} propertyCount={locationCounts[location.location] ?? 0} priority={index === 0} />)}
          </div>
        </motion.section>

        <motion.section variants={reveal(reduceMotion)} className="mx-auto mt-7 w-full max-w-[920px] px-4 sm:px-6" aria-labelledby="recommendations-title">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <AnimatedAssetIcon src="/icons/a7-recommended-home-3d.png" width={36} height={36} hover="float" className="size-9 shrink-0" imageClassName="drop-shadow-[0_6px_9px_rgba(18,59,115,.17)]" />
              <h2 id="recommendations-title" className="min-w-0 text-[20px] font-semibold leading-7 tracking-[-.035em] sm:text-[22px]">{tx("Recommended for you", "သင့်အတွက်အကြံပြုထားသည်")}</h2>
            </div>
            <Link href={browseAllHref} className="inline-flex h-11 shrink-0 items-center justify-center text-[14px] font-semibold leading-none text-[#0053D2]">{tx("View all", "အားလုံးကြည့်ရန်")}</Link>
          </div>
          <div className="mt-4 grid gap-6 md:grid-cols-2">
            {recommended.map((property) => <HomePropertyCard key={property.id} property={property} saved={saved.includes(property.id)} isMyanmar={isMyanmar} tx={tx} priority={false} onToggleSaved={toggleSaved} />)}
          </div>
        </motion.section>
      </motion.main>
    </div>
  );
}

function reveal(reduceMotion: boolean | null) {
  return { hidden: { opacity: 0, y: reduceMotion ? 0 : 12 }, show: { opacity: 1, y: 0, transition: reduceMotion ? { duration: 0 } : a7Motion.slow } };
}

function buildSearchHref(mode: HomeMode, location?: string) {
  const params = new URLSearchParams({ purpose: mode === "rent" ? "rent" : "sale" });
  if (mode === "buy") params.set("mode", "buy");
  if (location) params.set("location", location);
  return `/search?${params.toString()}`;
}

function ModeButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return <button type="button" role="tab" aria-selected={active} onClick={onClick} className={cn("inline-flex h-[46px] flex-1 items-center justify-center rounded-full !text-[16px] font-medium !leading-none transition-[background-color,color,box-shadow]", active ? "bg-white text-[#28558C] shadow-sm" : "text-[#58677B] hover:text-[#191B24]")}><span className="inline-flex h-5 items-center justify-center leading-5">{label}</span></button>;
}

function LocationCard({ location, mode, isMyanmar, propertyCount, priority }: { location: (typeof locationCards)[number]; mode: HomeMode; isMyanmar: boolean; propertyCount: number; priority: boolean }) {
  return (
    <Link href={buildSearchHref(mode, location.location)} aria-label={`${isMyanmar ? location.nameMy : location.name}: ${propertyCount} ${isMyanmar ? "အိမ်များ" : "properties"}`} className="group relative h-[200px] w-40 shrink-0 snap-start overflow-hidden rounded-xl bg-[#E1E2EE] shadow-sm">
      <ProgressiveImage src={location.image} alt="" fill priority={priority} sizes="160px" className="object-cover transition-transform duration-700 group-hover:scale-105" />
      <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
      <span className="absolute inset-x-3 bottom-3 text-white"><strong className="block text-[16px] font-semibold">{isMyanmar ? location.nameMy : location.name}</strong><small className="mt-1 block text-[10px] font-semibold uppercase tracking-[.05em] text-white/80">{propertyCount} {isMyanmar ? "အိမ်များ" : "Properties"}</small></span>
    </Link>
  );
}

function HomePropertyCard({ property, saved, isMyanmar, tx, priority, onToggleSaved }: { property: Property; saved: boolean; isMyanmar: boolean; tx: (english: string, myanmar: string) => string; priority: boolean; onToggleSaved: (property: Property) => void }) {
  return (
    <article className="overflow-hidden rounded-xl border border-[#E1E2EE] bg-[#FAF8FF] shadow-sm transition-transform active:scale-[.99]">
      <div className="relative aspect-[16/10] overflow-hidden bg-[#E1E2EE]">
        <Link href={`/properties/${property.id}`} className="absolute inset-0 z-10" aria-label={tx(`View ${property.title}`, `${property.title} ကိုကြည့်ရန်`)} />
        <ProgressiveImage src={property.images[0]} alt={property.title} fill priority={priority} sizes="(max-width: 767px) calc(100vw - 32px), 430px" className="object-cover transition-transform duration-700 hover:scale-[1.03]" />
        <span className="absolute left-3 top-3 z-20 inline-flex h-7 items-center justify-center gap-1.5 rounded-md bg-[#FAF8FF]/90 px-2.5 font-semibold uppercase tracking-[.06em] text-[#191B24] backdrop-blur-md"><Check className="size-3.5 shrink-0 text-[#0053D2]" /><span className="relative top-px inline-flex items-center text-[12px] leading-none">{property.purpose === "rent" ? tx("For rent", "ငှားရန်") : tx("For sale", "ရောင်းရန်")}</span></span>
        <button type="button" onClick={() => onToggleSaved(property)} aria-label={saved ? tx(`Remove ${property.title} from saved homes`, `${property.title} ကို သိမ်းထားမှုမှဖယ်ရန်`) : tx(`Save ${property.title}`, `${property.title} ကို သိမ်းရန်`)} aria-pressed={saved} className={cn("absolute right-3 top-3 z-20 grid size-11 place-items-center rounded-full bg-[#FAF8FF]/85 shadow-sm backdrop-blur-md transition-transform active:scale-95", saved ? "text-[#BA1A1A]" : "text-[#424655]")}><Heart className={cn("size-[19px]", saved && "fill-current")} /></button>
      </div>
      <div className="p-4">
        <p className="flex items-baseline text-[20px] font-bold leading-8 tracking-[-.035em] text-[#191B24]"><span>{formatPropertyPrice(property, isMyanmar ? "my" : "en")}</span>{property.purpose === "rent" && <span className="ml-1 text-[12px] font-normal leading-none tracking-normal text-[#424655]">{tx("/month", "/လ")}</span>}</p>
        <Link href={`/properties/${property.id}`} className="mt-1 block"><h3 className="truncate text-[16px] font-semibold !leading-6 text-[#191B24] transition-colors hover:text-[#0053D2]">{property.title}</h3></Link>
        <p className="mt-0.5 truncate text-[14px] leading-5 text-[#424655]">{property.township}, {property.city}</p>
        <div className="mb-3 mt-3 h-px bg-[#E1E2EE]" />
        <div className="grid grid-cols-3 items-center text-[#424655]">
          <span className="inline-flex h-6 min-w-0 items-center justify-center gap-1.5 border-r border-[#C2C6D8] text-[12px] font-medium leading-none"><BedDouble className="size-[18px] shrink-0" /><span className="whitespace-nowrap">{property.bedrooms} {tx("Bed", "အိပ်ခန်း")}</span></span>
          <span className="inline-flex h-6 min-w-0 items-center justify-center gap-1.5 border-r border-[#C2C6D8] text-[12px] font-medium leading-none"><Bath className="size-[18px] shrink-0" /><span className="whitespace-nowrap">{property.bathrooms} {tx("Bath", "ရေချိုးခန်း")}</span></span>
          <span className="inline-flex h-6 min-w-0 items-center justify-center gap-1.5 text-[12px] font-medium leading-none"><Maximize2 className="size-[17px] shrink-0" /><span className="whitespace-nowrap">{property.area_sqft.toLocaleString()} sqft</span></span>
        </div>
      </div>
    </article>
  );
}

export { HomeDiscovery };
