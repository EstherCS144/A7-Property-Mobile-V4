import rawProperties from "@/data/properties.json";
import { getCoordinatesForProperty } from "@/lib/township-coordinates";
import type { Property } from "@/lib/properties";

const allProperties: Property[] = rawProperties.map((raw, index) => {
  const coords = getCoordinatesForProperty(index, raw.township);
  return { ...raw, lat: coords.lat, lng: coords.lng } as Property;
});

function getProperty(id: string) {
  return allProperties.find((property) => property.id === id);
}

export { allProperties, getProperty };
