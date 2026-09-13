/**
 * Authorized Manufacturing Plant Units
 * ONLY these 7 plants are permitted across all MES operations.
 */

export interface PlantUnitOption {
  code: string;
  name: string;
  label: string;
  category: "ROLLING_MILL" | "WIRE_ROD" | "BRIGHT_BAR" | "FORGING" | "SMS";
  categoryLabel: string;
}

export interface PlantCategoryGroup {
  category: "ROLLING_MILL" | "WIRE_ROD" | "BRIGHT_BAR" | "FORGING" | "SMS";
  categoryLabel: string;
  plants: PlantUnitOption[];
}

export const AUTHORIZED_PLANTS: PlantUnitOption[] = [
  // Rolling Mills
  {
    code: "RM10",
    name: "New Plant Rolling Mill 10",
    label: "RM10 - New Plant Rolling Mill 10",
    category: "ROLLING_MILL",
    categoryLabel: "Rolling Mills"
  },
  {
    code: "RM16",
    name: "Rolling Mill 16",
    label: "RM16 - Rolling Mill 16",
    category: "ROLLING_MILL",
    categoryLabel: "Rolling Mills"
  },
  {
    code: "RM20",
    name: "New Plant Rolling Mill 20",
    label: "RM20 - New Plant Rolling Mill 20",
    category: "ROLLING_MILL",
    categoryLabel: "Rolling Mills"
  },
  // Wire Rod Mill
  {
    code: "WRM",
    name: "Wire Rod Mill",
    label: "WRM - Wire Rod Mill",
    category: "WIRE_ROD",
    categoryLabel: "Wire Rod Mill"
  },
  // Bright Bar
  {
    code: "BB",
    name: "Bright Bar",
    label: "BB - Bright Bar",
    category: "BRIGHT_BAR",
    categoryLabel: "Bright Bar"
  },
  // Forging Plant
  {
    code: "FORGING",
    name: "Forging Plant",
    label: "FORGING - Forging Plant",
    category: "FORGING",
    categoryLabel: "Forging Plant"
  },
  // Steel Melting Shop / CCM
  {
    code: "SMS",
    name: "Steel Melting Shop / CCM",
    label: "SMS - Steel Melting Shop / CCM",
    category: "SMS",
    categoryLabel: "Steel Melting Shop / CCM"
  }
];

export const PLANT_CATEGORIES: PlantCategoryGroup[] = [
  {
    category: "ROLLING_MILL",
    categoryLabel: "Rolling Mills",
    plants: [
      {
        code: "RM10",
        name: "New Plant Rolling Mill 10",
        label: "RM10 - New Plant Rolling Mill 10",
        category: "ROLLING_MILL",
        categoryLabel: "Rolling Mills"
      },
      {
        code: "RM16",
        name: "Rolling Mill 16",
        label: "RM16 - Rolling Mill 16",
        category: "ROLLING_MILL",
        categoryLabel: "Rolling Mills"
      },
      {
        code: "RM20",
        name: "New Plant Rolling Mill 20",
        label: "RM20 - New Plant Rolling Mill 20",
        category: "ROLLING_MILL",
        categoryLabel: "Rolling Mills"
      }
    ]
  },
  {
    category: "WIRE_ROD",
    categoryLabel: "Wire Rod Mill",
    plants: [
      {
        code: "WRM",
        name: "Wire Rod Mill",
        label: "WRM - Wire Rod Mill",
        category: "WIRE_ROD",
        categoryLabel: "Wire Rod Mill"
      }
    ]
  },
  {
    category: "BRIGHT_BAR",
    categoryLabel: "Bright Bar",
    plants: [
      {
        code: "BB",
        name: "Bright Bar",
        label: "BB - Bright Bar",
        category: "BRIGHT_BAR",
        categoryLabel: "Bright Bar"
      }
    ]
  },
  {
    category: "FORGING",
    categoryLabel: "Forging Plant",
    plants: [
      {
        code: "FORGING",
        name: "Forging Plant",
        label: "FORGING - Forging Plant",
        category: "FORGING",
        categoryLabel: "Forging Plant"
      }
    ]
  },
  {
    category: "SMS",
    categoryLabel: "Steel Melting Shop / CCM",
    plants: [
      {
        code: "SMS",
        name: "Steel Melting Shop / CCM",
        label: "SMS - Steel Melting Shop / CCM",
        category: "SMS",
        categoryLabel: "Steel Melting Shop / CCM"
      }
    ]
  }
];

/**
 * Normalizes any variation of a plant name or code into its official "CODE - Name" display format
 */
export function formatPlantName(input?: string | null): string {
  if (!input) return "";
  const cleaned = input.trim();
  const upper = cleaned.toUpperCase();

  // Direct label match
  const exact = AUTHORIZED_PLANTS.find(
    (p) => p.label.toUpperCase() === upper || p.code === upper
  );
  if (exact) return exact.label;

  // Code or substring matches
  if (upper.includes("RM10") || upper.includes("MILL 10")) return "RM10 - New Plant Rolling Mill 10";
  if (upper.includes("RM16") || upper.includes("MILL 16")) return "RM16 - Rolling Mill 16";
  if (upper.includes("RM20") || upper.includes("MILL 20")) return "RM20 - New Plant Rolling Mill 20";
  if (upper.includes("WRM") || upper.includes("WIRE ROD")) return "WRM - Wire Rod Mill";
  if (upper.includes("BB") || upper.includes("BRIGHT BAR")) return "BB - Bright Bar";
  if (upper.includes("FORGING")) return "FORGING - Forging Plant";
  if (upper.includes("SMS") || upper.includes("MELTING")) return "SMS - Steel Melting Shop / CCM";

  return cleaned;
}

/**
 * Checks if a plant string maps to one of the 7 authorized plants
 */
export function isAuthorizedPlant(input?: string | null): boolean {
  if (!input) return false;
  const formatted = formatPlantName(input);
  return AUTHORIZED_PLANTS.some((p) => p.label === formatted);
}
