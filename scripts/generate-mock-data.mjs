import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const root = process.cwd();

const locations = [
  { city: "Yangon", township: "Bahan", landmark: "Shwe Dagon Pagoda Road" },
  { city: "Yangon", township: "Kamayut", landmark: "Hledan Centre" },
  { city: "Yangon", township: "Hlaing", landmark: "Insein Road" },
  { city: "Yangon", township: "Yankin", landmark: "Myanmar Plaza" },
  { city: "Yangon", township: "Sanchaung", landmark: "Dhammazedi Road" },
  { city: "Yangon", township: "Dagon", landmark: "People's Park" },
  { city: "Yangon", township: "Mayangone", landmark: "8 Mile Junction" },
  { city: "Mandalay", township: "Chanmyathazi", landmark: "62nd Street" },
  { city: "Mandalay", township: "Aungmyaythazan", landmark: "Mandalay Palace" },
];

const types = ["condo", "apartment", "house", "mini_condo", "villa"];
const typeLabel = {
  condo: "Condo",
  apartment: "Apartment",
  house: "Family House",
  mini_condo: "Mini Condo",
  villa: "Villa",
};
const rentalPrices = [300000, 500000, 800000, 1500000];
const salePrices = [120000000, 185000000, 260000000, 520000000, 680000000, 900000000];
const furnitureOptions = ["unfurnished", "partly_furnished", "fully_furnished"];
const amenitySets = [
  ["24-hour security", "lift", "car parking", "backup generator"],
  ["air conditioning", "balcony", "water heater", "fiber internet ready"],
  ["car parking", "private garden", "water tank", "quiet street"],
  ["swimming pool", "gym", "24-hour security", "reception"],
  ["market nearby", "public transport nearby", "balcony", "pet friendly"],
];
const ownerFirstNames = ["Thiri", "Aung", "Khin", "Nandar", "Min", "May", "Zaw", "Su", "Htet", "Ei"];
const ownerLastNames = ["Win", "Oo", "Naing", "Aye", "Tun", "Lwin", "Myint", "Hlaing", "Kyaw", "Mon"];
const imageSets = [
  ["/images/properties/jade-residence-exterior.jpg", "/images/properties/warm-living-room.jpg", "/images/properties/family-house.jpg"],
  ["/images/properties/warm-living-room.jpg", "/images/properties/family-house.jpg", "/images/properties/jade-residence-exterior.jpg"],
  ["/images/properties/family-house.jpg", "/images/properties/warm-living-room.jpg", "/images/properties/jade-residence-exterior.jpg"],
  ["/images/properties/hero-yangon-home.jpg", "/images/properties/jade-residence-exterior.jpg", "/images/properties/warm-living-room.jpg"],
  ["/images/properties/hero-yangon-home.jpg", "/images/properties/warm-living-room.jpg", "/images/properties/jade-residence-exterior.jpg"],
];

function buildListing(index) {
  const location = locations[index % locations.length];
  const purpose = index % 5 < 3 ? "rent" : "sale";
  const propertyType = types[(index * 3 + (purpose === "sale" ? 2 : 0)) % types.length];
  const bedrooms = propertyType === "villa" ? 4 + (index % 2) : propertyType === "house" ? 3 + (index % 2) : 1 + (index % 3);
  const bathrooms = Math.max(1, bedrooms - (index % 2));
  const areaSqft = propertyType === "villa" ? 3200 + (index % 6) * 350 : propertyType === "house" ? 1800 + (index % 5) * 260 : 650 + (index % 7) * 170;
  const price = purpose === "rent" ? rentalPrices[index % rentalPrices.length] : salePrices[index % salePrices.length];
  const typeName = typeLabel[propertyType];
  const character = ["Light-filled", "Quiet", "Well-kept", "Spacious", "Move-in ready"][index % 5];
  const title = `${character} ${bedrooms}-bed ${typeName.toLowerCase()} in ${location.township}`;
  const streetNumber = 12 + ((index * 7) % 78);
  const street = location.city === "Mandalay" ? `${54 + (index % 19)}th Street` : ["Kabar Aye Pagoda Road", "Pyay Road", "Inya Road", "Baho Road", "U Wisara Road"][index % 5];
  const verified = index % 11 === 0 ? "pending" : index % 17 === 0 ? "unverified" : "verified";
  const ownerType = index % 4 === 0 ? "agent" : "owner";

  return {
    id: `MM-PROP-${String(index + 1).padStart(3, "0")}`,
    title,
    description: `${character} ${typeName.toLowerCase()} with practical rooms, good natural light, and easy access to ${location.landmark}. This demo listing includes clear ${purpose === "rent" ? "monthly terms" : "ownership details"}, a sample photo set, and a viewing contact.`,
    property_type: propertyType,
    purpose,
    city: location.city,
    township: location.township,
    address: `No. ${streetNumber}, ${street}, near ${location.landmark}, ${location.township}`,
    price,
    currency: "MMK",
    bedrooms,
    bathrooms,
    area_sqft: areaSqft,
    floor: propertyType === "house" || propertyType === "villa" ? null : 2 + (index % 14),
    year_built: 2008 + (index % 18),
    furniture: furnitureOptions[index % furnitureOptions.length],
    amenities: amenitySets[index % amenitySets.length],
    images: imageSets[index % imageSets.length],
    owner: {
      id: `MM-USER-${String((index % 38) + 1).padStart(3, "0")}`,
      name: `${ownerFirstNames[index % ownerFirstNames.length]} ${ownerLastNames[(index * 3) % ownerLastNames.length]}`,
      type: ownerType,
      phone_verified: index % 17 !== 0,
      response_time_minutes: 8 + (index % 13) * 7,
    },
    verification_status: verified,
    rating: Number((4.2 + (index % 8) * 0.1).toFixed(1)),
  };
}

const properties = Array.from({ length: 100 }, (_, index) => buildListing(index));

const promptScenes = [
  ["yangon_condo_exterior", "a contemporary mid-rise Yangon condominium exterior with shaded balconies, tropical planting, a clean resident drop-off and believable neighboring buildings"],
  ["modern_apartment_living_room", "a modern Myanmar apartment living room with teak accents, linen seating, woven details, ceiling fan and practical tiled floor"],
  ["bedroom_interior", "a calm Southeast Asian bedroom with a teak bed, cotton bedding, wardrobe, bedside lighting and soft neutral walls"],
  ["kitchen", "a compact but premium apartment kitchen with warm timber cabinets, pale stone counters, ventilation hood and practical storage"],
  ["bathroom", "a clean modern bathroom with pale local stone, walk-in shower, warm timber vanity and frosted ventilation window"],
  ["family_house", "a welcoming two-storey Myanmar family house with a gated front garden, shaded veranda and realistic urban neighborhood context"],
  ["luxury_villa", "a refined tropical villa with deep roof overhangs, timber screens, courtyard garden and understated contemporary Myanmar character"],
  ["city_view", "an elevated Yangon apartment view at golden hour with a plausible low-rise cityscape, tropical trees and distant pagoda silhouettes"],
];
const lighting = ["soft early-morning daylight", "bright overcast daylight", "warm late-afternoon light", "gentle window light"];
const framing = ["wide horizontal composition", "eye-level architectural composition", "natural 35mm editorial framing", "balanced real-estate photography composition"];

const imagePrompts = Array.from({ length: 50 }, (_, index) => {
  const [category, scene] = promptScenes[index % promptScenes.length];
  return {
    id: `property-image-prompt-${String(index + 1).padStart(2, "0")}`,
    category,
    prompt: `Use case: photorealistic-natural\nAsset type: property marketplace photography\nPrimary request: ${scene}.\nStyle/medium: real camera architectural photography, editorial but honest, subtle Southeast Asian design, natural material texture and small lived-in imperfections.\nComposition/framing: ${framing[index % framing.length]}, believable room or building proportions, restrained wide-angle lens, clear focal point.\nLighting/mood: ${lighting[index % lighting.length]}, warm, calm and trustworthy.\nConstraints: Myanmar lifestyle context without people; realistic construction, furniture and skyline; suitable for a premium mobile-first property card.\nAvoid: AI-looking surfaces, CGI gloss, unreal buildings, impossible views, extreme HDR, people, text, logos, signage, watermarks, fisheye distortion.`,
  };
});

async function saveJson(path, value) {
  const output = join(root, path);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

await saveJson("public/data/properties.json", properties);
await saveJson("data/properties.json", properties);
await saveJson("docs/property-image-prompts.json", imagePrompts);

console.log(`Generated ${properties.length} properties and ${imagePrompts.length} image prompts.`);
