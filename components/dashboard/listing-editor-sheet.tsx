"use client";

import { Camera } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/i18n/language-provider";
import { AnimatedAssetIcon } from "@/components/ui/animated-asset-icon";
import { Sheet } from "@/components/ui/sheet";
import { propertyTypeLabels, searchLocations, type Property } from "@/lib/properties";

interface ListingDraft {
  title: string;
  township: string;
  purpose: "rent" | "sale";
  propertyType: Property["property_type"];
  price: string;
  bedrooms: string;
  bathrooms: string;
}

interface ListingEditorSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property?: Property | null;
  onSave: (draft: ListingDraft) => void;
}

function ListingEditorSheet({ open, onOpenChange, property, onSave }: ListingEditorSheetProps) {
  const { tx } = useLanguage();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [photoCount, setPhotoCount] = useState(0);
  const [draft, setDraft] = useState<ListingDraft>({ title: "", township: "Bahan", purpose: "rent", propertyType: "condo", price: "", bedrooms: "2", bathrooms: "1" });

  useEffect(() => {
    if (!open) return;
    queueMicrotask(() => {
      setSaved(false);
      setError("");
      setPhotoCount(property?.images.length ?? 0);
      setDraft(property ? { title: property.title, township: property.township, purpose: property.purpose, propertyType: property.property_type, price: String(property.price), bedrooms: String(property.bedrooms), bathrooms: String(property.bathrooms) } : { title: "", township: "Bahan", purpose: "rent", propertyType: "condo", price: "", bedrooms: "2", bathrooms: "1" });
    });
  }, [open, property]);

  const field = (key: keyof ListingDraft, value: string) => setDraft((current) => ({ ...current, [key]: value }));
  function save() {
    if (!draft.title.trim()) {
      setError(tx("Add a clear property title.", "ရှင်းလင်းသောအိမ်စာရင်းခေါင်းစဉ် ထည့်ပါ။"));
      return;
    }
    if (!draft.price || Number(draft.price) <= 0) {
      setError(tx("Add a valid price in MMK.", "မှန်ကန်သော ကျပ်ဈေးနှုန်း ထည့်ပါ။"));
      return;
    }
    setError("");
    onSave(draft);
    setSaved(true);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={property ? tx("Edit property", "အိမ်စာရင်းပြင်ရန်") : tx("Create a listing", "အိမ်စာရင်းဖန်တီးရန်")} description={tx("Add clear facts and strong photos. You can save a draft before publishing.", "တိကျသောအချက်အလက်နှင့် ပုံကောင်းများထည့်ပါ။ မတင်မီ မူကြမ်းအဖြစ် သိမ်းနိုင်သည်။")} side="right" footer={!saved && <Button className="w-full" onClick={save}>{property ? tx("Save changes", "ပြင်ဆင်ချက်များသိမ်းရန်") : tx("Save listing draft", "အိမ်စာရင်းမူကြမ်းသိမ်းရန်")}</Button>}>
      {saved ? <div className="flex min-h-[420px] flex-col items-center justify-center p-8 text-center"><AnimatedAssetIcon src="/icons/a7-draft-saved-3d.png" width={96} height={96} hover="float" className="size-24" imageClassName="drop-shadow-[0_10px_16px_rgba(18,59,115,.18)]" /><h3 className="mt-5 text-lg font-semibold">{property ? tx("Property updated", "အိမ်စာရင်း အပ်ဒိတ်ပြီး") : tx("Draft created", "မူကြမ်းဖန်တီးပြီး")}</h3><p className="mt-2 max-w-xs text-xs leading-5 text-[#59616A]">{tx("Your listing is saved. Complete verification before publishing it to home seekers.", "အိမ်စာရင်းကို သိမ်းပြီးပါပြီ။ အိမ်ရှာဖွေသူများထံ မတင်မီ စိစစ်မှုအပြီးသတ်ပါ။")}</p><Button variant="outline" className="mt-6" onClick={() => onOpenChange(false)}>{tx("Back to properties", "အိမ်စာရင်းများသို့ ပြန်ရန်")}</Button></div> : <div className="space-y-5 p-5 sm:p-7">
        {error && <div role="alert" className="rounded-xl border border-[#EAB7B1] bg-[#FFF7F6] px-4 py-3 text-xs text-[#B13D34]">{error}</div>}
        <label className="block"><span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-[#667085]">{tx("Property title", "အိမ်စာရင်းခေါင်းစဉ်")}</span><input value={draft.title} onChange={(event) => field("title", event.target.value)} placeholder={tx("Bright 2-bed condo near Hledan", "လှည်းတန်းအနီး အလင်းရောင်ကောင်းသော အိပ်ခန်း ၂ ခန်းကွန်ဒို")} className="h-11 w-full rounded-xl border border-[#101828]/12 px-3 text-xs outline-none focus:border-[#123B73]" /></label>
        <div className="grid grid-cols-2 gap-3"><label><span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-[#667085]">{tx("Purpose", "ရည်ရွယ်ချက်")}</span><select value={draft.purpose} onChange={(event) => field("purpose", event.target.value)} className="h-11 w-full rounded-xl border border-[#101828]/12 bg-[#F8FBFF] px-3 text-xs"><option value="rent">{tx("For rent", "ငှားရန်")}</option><option value="sale">{tx("For sale", "ရောင်းရန်")}</option></select></label><label><span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-[#667085]">{tx("Property type", "အိမ်အမျိုးအစား")}</span><select value={draft.propertyType} onChange={(event) => field("propertyType", event.target.value)} className="h-11 w-full rounded-xl border border-[#101828]/12 bg-[#F8FBFF] px-3 text-xs">{Object.entries(propertyTypeLabels).map(([value, label]) => <option key={value} value={value}>{tx(label, ({ condo: "ကွန်ဒို", apartment: "တိုက်ခန်း", house: "အိမ်", villa: "ဗီလာ", mini_condo: "မီနီကွန်ဒို" } as Record<string, string>)[value] ?? label)}</option>)}</select></label></div>
        <label className="block"><span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-[#667085]">{tx("Township", "မြို့နယ်")}</span><select value={draft.township} onChange={(event) => field("township", event.target.value)} className="h-11 w-full rounded-xl border border-[#101828]/12 bg-[#F8FBFF] px-3 text-xs">{searchLocations.filter((item) => !["All Myanmar", "Yangon", "Mandalay"].includes(item)).map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="block"><span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-[#667085]">{tx("Price in MMK", "ကျပ်ဈေးနှုန်း")}</span><input type="number" value={draft.price} onChange={(event) => field("price", event.target.value)} placeholder="800000" className="h-11 w-full rounded-xl border border-[#101828]/12 px-3 text-xs outline-none focus:border-[#123B73]" /></label>
        <div className="grid grid-cols-2 gap-3"><label><span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-[#667085]">{tx("Bedrooms", "အိပ်ခန်း")}</span><input type="number" min="0" value={draft.bedrooms} onChange={(event) => field("bedrooms", event.target.value)} className="h-11 w-full rounded-xl border border-[#101828]/12 px-3 text-xs" /></label><label><span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-[#667085]">{tx("Bathrooms", "ရေချိုးခန်း")}</span><input type="number" min="0" value={draft.bathrooms} onChange={(event) => field("bathrooms", event.target.value)} className="h-11 w-full rounded-xl border border-[#101828]/12 px-3 text-xs" /></label></div>
        <div><span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-[#667085]">{tx("Photos", "ဓာတ်ပုံများ")}</span><label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#123B73]/30 bg-[#EAF4FF]/60 p-5 text-center"><input type="file" accept="image/*" multiple className="sr-only" onChange={(event) => setPhotoCount(Math.min(event.target.files?.length ?? 0, 20))} /><AnimatedAssetIcon src="/icons/a7-property-photos-3d.png" width={64} height={64} hover="float" className="size-16" imageClassName="drop-shadow-[0_8px_12px_rgba(18,59,115,.18)]" /><strong className="mt-2 text-xs">{photoCount ? tx(`${photoCount} photo${photoCount === 1 ? "" : "s"} ready`, `ဓာတ်ပုံ ${photoCount} ပုံ အဆင်သင့်`) : tx("Upload property photos", "အိမ်ဓာတ်ပုံများတင်ရန်")}</strong><small className="mt-1 text-[9px] text-[#667085]">{tx("JPG or PNG · up to 20 photos", "JPG သို့မဟုတ် PNG · ပုံ ၂၀ အထိ")}</small></label><p className="mt-2 flex items-center gap-1.5 text-[9px] text-[#667085]"><Camera className="size-3.5" />{tx("Start with a bright, wide room photo for more inquiries.", "မေးမြန်းမှုများလာစေရန် အလင်းရောင်ကောင်းသော အခန်းကျယ်ပုံကို ပထမထည့်ပါ။")}</p></div>
      </div>}
    </Sheet>
  );
}

export { ListingEditorSheet };
export type { ListingDraft };
