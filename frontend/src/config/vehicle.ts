import type { BodyStyle, VehicleSort } from "@/types/vehicle";

export const MAKES = [
  "Toyota",
  "Honda",
  "Ford",
  "Chevrolet",
  "BMW",
  "Mercedes-Benz",
  "Hyundai",
  "Nissan",
  "Kia",
  "Subaru",
  "Tesla",
  "Jeep",
] as const;

export const MODELS_BY_MAKE: Record<string, string[]> = {
  Toyota: ["Camry", "Corolla", "RAV4", "Highlander", "Tacoma", "Prius"],
  Honda: ["Civic", "Accord", "CR-V", "Pilot", "Odyssey", "HR-V"],
  Ford: ["F-150", "Escape", "Explorer", "Mustang", "Bronco", "Edge"],
  Chevrolet: ["Silverado", "Equinox", "Malibu", "Tahoe", "Traverse", "Blazer"],
  BMW: ["3 Series", "5 Series", "X3", "X5", "X1", "4 Series"],
  "Mercedes-Benz": ["C-Class", "E-Class", "GLC", "GLE", "A-Class", "GLA"],
  Hyundai: ["Elantra", "Sonata", "Tucson", "Santa Fe", "Kona", "Palisade"],
  Nissan: ["Altima", "Sentra", "Rogue", "Murano", "Frontier", "Kicks"],
  Kia: ["Forte", "K5", "Sportage", "Sorento", "Telluride", "Soul"],
  Subaru: ["Outback", "Forester", "Crosstrek", "Impreza", "Ascent", "Legacy"],
  Tesla: ["Model 3", "Model Y", "Model S", "Model X"],
  Jeep: ["Wrangler", "Grand Cherokee", "Cherokee", "Compass", "Gladiator"],
};

export const BODY_STYLES: { value: BodyStyle; label: string }[] = [
  { value: "SUV", label: "SUV" },
  { value: "Sedan", label: "Sedan" },
  { value: "Truck", label: "Truck" },
  { value: "Coupe", label: "Coupe" },
  { value: "Van", label: "Van" },
  { value: "Minivan", label: "Minivan" },
  { value: "Electric", label: "Electric" },
  { value: "Hatchback", label: "Hatchback" },
];

export const HOME_BODY_STYLES: { value: string; label: string }[] = [
  { value: "SUV", label: "SUV" },
  { value: "Sedan", label: "Sedan" },
  { value: "Truck", label: "Truck" },
  { value: "Electric", label: "Electric" },
  { value: "Luxury", label: "Luxury" },
  { value: "Minivan", label: "Minivan" },
];

export const CONDITIONS = [
  { value: "NEW", label: "New" },
  { value: "USED", label: "Used" },
  { value: "CPO", label: "Certified Pre-Owned" },
] as const;

export const PRICE_OPTIONS = [
  { value: 5000, label: "$5,000" },
  { value: 10000, label: "$10,000" },
  { value: 15000, label: "$15,000" },
  { value: 20000, label: "$20,000" },
  { value: 25000, label: "$25,000" },
  { value: 30000, label: "$30,000" },
  { value: 40000, label: "$40,000" },
  { value: 50000, label: "$50,000" },
  { value: 100000, label: "$50,000+" },
] as const;

export const MAX_PRICE_OPTIONS = [
  { value: "5000", label: "$5K" },
  { value: "10000", label: "$10K" },
  { value: "15000", label: "$15K" },
  { value: "20000", label: "$20K" },
  { value: "25000", label: "$25K" },
  { value: "30000", label: "$30K" },
  { value: "40000", label: "$40K" },
  { value: "50000", label: "$50K+" },
] as const;

export const MILEAGE_OPTIONS = [
  { value: "25000", label: "Up to 25,000 mi" },
  { value: "50000", label: "Up to 50,000 mi" },
  { value: "75000", label: "Up to 75,000 mi" },
  { value: "100000", label: "Up to 100,000 mi" },
  { value: "any", label: "Any mileage" },
] as const;

export const CURRENT_YEAR = 2024;

export const YEARS: number[] = Array.from(
  { length: CURRENT_YEAR - 2000 + 1 },
  (_, i) => CURRENT_YEAR - i
);

export const SORT_OPTIONS: { value: VehicleSort; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "newest", label: "Newest" },
  { value: "rating", label: "Dealer Rating" },
];

export const RATING_FILTER_OPTIONS = [
  { value: "5", label: "5★" },
  { value: "4", label: "4★ & up" },
  { value: "3", label: "3★ & up" },
  { value: "2", label: "2★ & up" },
] as const;

export const QUICK_SEARCH_PILLS: { label: string; href: string }[] = [
  { label: "Toyota", href: "/vehicles?make=Toyota" },
  { label: "Honda", href: "/vehicles?make=Honda" },
  { label: "Ford", href: "/vehicles?make=Ford" },
  { label: "BMW", href: "/vehicles?make=BMW" },
  { label: "Mercedes", href: "/vehicles?make=Mercedes-Benz" },
  { label: "SUVs", href: "/vehicles?bodyStyle=SUV" },
  { label: "Under $15K", href: "/vehicles?priceTo=15000" },
  { label: "Electric", href: "/vehicles?bodyStyle=Electric" },
];

export const BRAND_PILLS = [
  "Toyota",
  "Honda",
  "Ford",
  "Chevrolet",
  "BMW",
  "Mercedes-Benz",
  "Hyundai",
  "Nissan",
  "Kia",
  "Subaru",
] as const;

export const VEHICLES_PER_PAGE = 20;
