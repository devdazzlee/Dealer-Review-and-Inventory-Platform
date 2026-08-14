import { PrismaClient } from "@prisma/client";
import { AUTODEV, VEHICLE_SOURCE } from "../src/config/constants";

const TEMPLATES = [
  {
    make: "Toyota",
    model: "RAV4",
    trim: "XLE",
    bodyStyle: "SUV",
    fuelType: "Hybrid",
    transmission: "Automatic",
    condition: "USED",
    basePrice: 32990,
    mileage: 18400,
  },
  {
    make: "Honda",
    model: "Accord",
    trim: "EX",
    bodyStyle: "Sedan",
    fuelType: "Gasoline",
    transmission: "Automatic",
    condition: "USED",
    basePrice: 27990,
    mileage: 22100,
  },
  {
    make: "Ford",
    model: "F-150",
    trim: "XLT",
    bodyStyle: "Truck",
    fuelType: "Gasoline",
    transmission: "Automatic",
    condition: "USED",
    basePrice: 41990,
    mileage: 15600,
  },
  {
    make: "Tesla",
    model: "Model 3",
    trim: "Long Range",
    bodyStyle: "Sedan",
    fuelType: "Electric",
    transmission: "Automatic",
    condition: "USED",
    basePrice: 36990,
    mileage: 12800,
  },
  {
    make: "Hyundai",
    model: "Tucson",
    trim: "SEL",
    bodyStyle: "SUV",
    fuelType: "Gasoline",
    transmission: "Automatic",
    condition: "CPO",
    basePrice: 28990,
    mileage: 14200,
  },
] as const;

function vinFor(slug: string, index: number): string {
  const compact = slug.replace(/[^A-Z0-9]/gi, "").toUpperCase().padEnd(8, "X").slice(0, 8);
  return `1CAT${compact}${String(index).padStart(5, "0")}`.slice(0, 17);
}

export async function seedCatalogVehicles(prisma: PrismaClient): Promise<number> {
  const dealers = await prisma.dealer.findMany({
    select: { id: true, slug: true, name: true },
    orderBy: { name: "asc" },
  });

  let photoIndex = 1;
  let created = 0;

  for (const dealer of dealers) {
    if (dealer.slug === AUTODEV.dealerSlug) continue;

    for (let i = 0; i < 2; i++) {
      const template = TEMPLATES[(created + i) % TEMPLATES.length];
      const year = 2022 + ((created + i) % 4);
      const photos =
        photoIndex <= 100 ? [`/vehicles/${photoIndex}-1.webp`] : [];
      photoIndex += 1;

      await prisma.vehicle.create({
        data: {
          dealerId: dealer.id,
          vin: vinFor(dealer.slug, i + 1),
          year,
          make: template.make,
          model: template.model,
          trim: template.trim,
          mileage: template.mileage + created * 37,
          bodyStyle: template.bodyStyle,
          fuelType: template.fuelType,
          transmission: template.transmission,
          exteriorColor: i % 2 === 0 ? "Silver" : "Black",
          interiorColor: "Black",
          condition: template.condition,
          price: template.basePrice + created * 150,
          description: `${year} ${template.make} ${template.model} ${template.trim} available at ${dealer.name}. Inspected, fairly priced, and ready for a test drive.`,
          features: [
            "Backup camera",
            "Bluetooth",
            "Apple CarPlay / Android Auto",
            "Lane keep assist",
          ],
          photos,
          cachedPhotoCount: photos.length,
          source: VEHICLE_SOURCE.catalog,
          isActive: true,
        },
      });
      created += 1;
    }
  }

  return created;
}
