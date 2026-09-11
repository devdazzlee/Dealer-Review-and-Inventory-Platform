import "dotenv/config";
import { prisma } from "../lib/prisma";

const KEY = process.env.AUTODEV_API_KEY!;

async function getListing(vin: string): Promise<any | null> {
  try {
    const res = await fetch(`https://api.auto.dev/listings/${vin}`, {
      headers: { Authorization: `Bearer ${KEY}`, Accept: "application/json" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return { _status: res.status };
    return await res.json();
  } catch (e) {
    return { _err: (e as Error).message };
  }
}

async function probeUrl(url: string): Promise<number> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: "https://www.auto.dev/",
        Range: "bytes=0-0",
      },
      signal: AbortSignal.timeout(12000),
    });
    return res.status;
  } catch {
    return 0;
  }
}

async function main() {
  const vins = await prisma.vehicle.findMany({
    where: { source: "autodev", isActive: true, cachedPhotoCount: 0 },
    take: 15,
    select: { vin: true, year: true, make: true, model: true },
  });

  for (const v of vins) {
    const listing = await getListing(v.vin);
    const rl = listing?.retailListing ?? {};
    const primary = rl.primaryImage ?? null;
    const count = rl.photoCount ?? null;
    const vdp = rl.vdp ?? null;
    const directProbe = await probeUrl(`https://retail.photos.vin/${v.vin}-1.jpg`);
    let primaryProbe = "";
    if (primary) primaryProbe = String(await probeUrl(primary));

    console.log(
      `${v.vin} ${v.year} ${v.make} ${v.model}\n` +
        `  api: photoCount=${count} primaryImage=${primary ?? "(none)"}${primary ? ` [probe ${primaryProbe}]` : ""}\n` +
        `  retail.photos.vin/-1.jpg probe=${directProbe}  vdp=${vdp ?? "(none)"}` +
        (listing?._status ? `  [listing HTTP ${listing._status}]` : "") +
        (listing?._err ? `  [listing err ${listing._err}]` : "")
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
