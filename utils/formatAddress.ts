interface MultilingualString {
  en?: string | null;
  "zh-TW"?: string | null;
}

export interface AddressComponents {
  roomFlat?: string | null;
  floor?: string | null;
  blockNumber?: string | null;
  blockName?: MultilingualString | null;
  buildingName?: MultilingualString | null;
  streetNumber?: string | null;
  streetName?: MultilingualString | null;
  district?: MultilingualString | null;
  location?: MultilingualString | null;
  formattedAddress?: MultilingualString | null;
}

/**
 * Formats address in English style (smallest to largest unit)
 * Example: "Room 123, 7/F, Block A, Building B, 1 Example Street, District, Location"
 */
export function formatEnglishAddress(address: AddressComponents): string {
  const components: string[] = [];

  // Add components in English order (small to large)
  if (address.roomFlat) components.push(`Room ${address.roomFlat}`);
  if (address.floor) components.push(`${address.floor}/F`);
  if (address.blockNumber) components.push(`Block ${address.blockNumber}`);
  if (address.blockName?.en) components.push(address.blockName.en);
  if (address.buildingName?.en) components.push(address.buildingName.en);
  if (address.streetNumber && address.streetName?.en) {
    components.push(`${address.streetNumber} ${address.streetName.en}`);
  }
  if (address.district?.en) components.push(address.district.en);
  if (address.location?.en) components.push(address.location.en);

  return components.join(", ");
}

/**
 * Formats address in Traditional Chinese style (largest to smallest unit)
 * Example: "香港 九龍 示例區 示例街1號 B座 A座 7樓 123室"
 */
export function formatChineseAddress(address: AddressComponents): string {
  const components: string[] = [];

  // Add components in Chinese order (large to small)
  if (address.location?.["zh-TW"]) components.push(address.location["zh-TW"]);
  if (address.district?.["zh-TW"]) components.push(address.district["zh-TW"]);
  if (address.streetName?.["zh-TW"] && address.streetNumber) {
    components.push(`${address.streetName["zh-TW"]}${address.streetNumber}號`);
  }
  if (address.buildingName?.["zh-TW"])
    components.push(address.buildingName["zh-TW"]);
  if (address.blockName?.["zh-TW"]) components.push(address.blockName["zh-TW"]);
  if (address.blockNumber) components.push(`${address.blockNumber}座`);
  if (address.floor) components.push(`${address.floor}樓`);
  if (address.roomFlat) components.push(`${address.roomFlat}室`);

  // Join with spaces for Chinese formatting
  return components.join(" ");
}

/**
 * Formats address in both languages
 */
export function formatAddress(address: AddressComponents): {
  en: string;
  "zh-TW": string;
} {
  return {
    en: formatEnglishAddress(address),
    "zh-TW": formatChineseAddress(address),
  };
}

/**
 * Validates if an address has the minimum required fields in both languages
 */
export function isValidAddress(address: AddressComponents): boolean {
  // Define minimum required fields for a valid address
  const requiredFields = ["streetName", "district", "location"] as const;

  return requiredFields.every(
    (field) => address[field]?.en?.trim() && address[field]?.["zh-TW"]?.trim()
  );
}
