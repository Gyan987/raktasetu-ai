import { eq, desc, like, or, and, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertDonor, InsertBloodBank, InsertBloodCamp, donors, bloodBanks, bloodCamps, InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

/* ========== USERS ========== */
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  textFields.forEach(field => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  });
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/* ========== DONORS ========== */
export async function seedDonors() {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select({ count: sql`COUNT(*)`.as('count') }).from(donors);
  const count = Number(existing[0]?.count ?? 0);
  if (count > 0) return;

  const initialDonors: Omit<InsertDonor, "id" | "createdAt" | "updatedAt" | "userId">[] = [
    { name: "Priya Sen", bloodGroup: "B+", area: "Salt Lake, Kolkata", phone: "+919830000001", lastDonationDate: "2025-06-15", isFirstTime: 0 },
    { name: "Rahul Ghosh", bloodGroup: "O+", area: "Park Street, Kolkata", phone: "+919830000002", lastDonationDate: "2025-08-20", isFirstTime: 0 },
    { name: "Arjun Das", bloodGroup: "B+", area: "Ballygunge, Kolkata", phone: "+919830000003", lastDonationDate: null, isFirstTime: 1 },
    { name: "Sneha Roy", bloodGroup: "AB+", area: "New Town, Kolkata", phone: "+919830000004", lastDonationDate: "2025-03-10", isFirstTime: 0 },
    { name: "Ankit Kumar", bloodGroup: "O-", area: "Howrah, Kolkata", phone: "+919830000005", lastDonationDate: "2025-05-01", isFirstTime: 0 },
    { name: "Rina Basu", bloodGroup: "A+", area: "Jadavpur, Kolkata", phone: "+919830000006", lastDonationDate: null, isFirstTime: 1 },
    { name: "Sourav Mitra", bloodGroup: "B-", area: "Behala, Kolkata", phone: "+919830000007", lastDonationDate: "2025-09-05", isFirstTime: 0 },
    { name: "Ishita Chowdhury", bloodGroup: "B+", area: "Rajarhat, Kolkata", phone: "+919830000008", lastDonationDate: "2025-07-25", isFirstTime: 0 },
    { name: "Deep Kar", bloodGroup: "O+", area: "Salt Lake, Kolkata", phone: "+919830000009", lastDonationDate: null, isFirstTime: 1 },
  ];

  for (const d of initialDonors) {
    await db.insert(donors).values(d);
  }
}

export async function listDonors(bloodGroup?: string, search?: string) {
  const db = await getDb();
  if (!db) return [];

  if (bloodGroup && bloodGroup !== "All" && search) {
    return await db.select().from(donors)
      .where(and(eq(donors.bloodGroup, bloodGroup as any), or(like(donors.name, `%${search}%`), like(donors.area, `%${search}%`))))
      .orderBy(desc(donors.createdAt));
  }
  if (bloodGroup && bloodGroup !== "All") {
    return await db.select().from(donors).where(eq(donors.bloodGroup, bloodGroup as any)).orderBy(desc(donors.createdAt));
  }
  if (search) {
    return await db.select().from(donors)
      .where(or(like(donors.name, `%${search}%`), like(donors.area, `%${search}%`)))
      .orderBy(desc(donors.createdAt));
  }
  return await db.select().from(donors).orderBy(desc(donors.createdAt));
}

export async function createDonor(data: InsertDonor) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(donors).values(data);
  return { id: result[0].insertId };
}

export async function getCompatibleDonors(requestedGroup: string, locationText?: string) {
  const db = await getDb();
  if (!db) return [];

  const compatible: Record<string, string[]> = {
    "O-": ["O-"], "O+": ["O-", "O+"], "A-": ["A-", "O-"], "A+": ["A+", "A-", "O+", "O-"],
    "B-": ["B-", "O-"], "B+": ["B+", "B-", "O+", "O-"], "AB-": ["AB-", "A-", "B-", "O-"],
    "AB+": ["AB+", "AB-", "A+", "A-", "B+", "B-", "O+", "O-"]
  };

  const acceptable = compatible[requestedGroup] || [requestedGroup];
  const groupConditions = acceptable.map(g => eq(donors.bloodGroup, g as any));

  let query;
  if (locationText) {
    const firstWord = locationText.split(",")[0].trim();
    query = db.select().from(donors)
      .where(and(or(...groupConditions), like(donors.area, `%${firstWord}%`)));
  } else {
    query = db.select().from(donors).where(or(...groupConditions));
  }

  const allMatches = await query;
  return allMatches.sort((a, b) => {
    const aExact = a.bloodGroup === requestedGroup ? 0 : 1;
    const bExact = b.bloodGroup === requestedGroup ? 0 : 1;
    return aExact - bExact;
  });
}

export async function getDonorCount() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql`COUNT(*)`.as('count') }).from(donors);
  return Number(result[0]?.count ?? 0);
}

/* ========== BLOOD BANKS ========== */
export async function seedBloodBanks() {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select({ count: sql`COUNT(*)`.as('count') }).from(bloodBanks);
  const count = Number(existing[0]?.count ?? 0);
  if (count > 0) return;

  const initialBanks: Omit<InsertBloodBank, "id" | "createdAt" | "updatedAt">[] = [
    { name: "Central Blood Bank", area: "Manicktala, Kolkata", phone: "+913322412345", isOpen24x7: 1 },
    { name: "SSKM Hospital Blood Bank", area: "AJC Bose Rd, Kolkata", phone: "+913322233333", isOpen24x7: 1 },
    { name: "Apollo Gleneagles Blood Bank", area: "Salt Lake, Kolkata", phone: "+913344115555", isOpen24x7: 1 },
    { name: "AMRI Hospitals Blood Bank", area: "Dhakuria, Kolkata", phone: "+913366800000", isOpen24x7: 1 },
    { name: "NRS Medical College Blood Bank", area: "Sealdah, Kolkata", phone: "+913322841000", isOpen24x7: 1 },
  ];

  for (const b of initialBanks) {
    await db.insert(bloodBanks).values(b);
  }
}

export async function listBloodBanks() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(bloodBanks).orderBy(desc(bloodBanks.createdAt));
}

export async function getBloodBankCount() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql`COUNT(*)`.as('count') }).from(bloodBanks);
  return Number(result[0]?.count ?? 0);
}

/* ========== BLOOD CAMPS ========== */
export async function seedBloodCamps() {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select({ count: sql`COUNT(*)`.as('count') }).from(bloodCamps);
  const count = Number(existing[0]?.count ?? 0);
  if (count > 0) return;

  const initialCamps: Omit<InsertBloodCamp, "id" | "createdAt" | "updatedAt">[] = [
    { name: "Winter Blood Drive 2026", organizer: "Jadavpur University NSS", location: "JU Salt Lake Campus, Kolkata", date: "2026-01-20", registeredCount: 47, capacity: 120 },
    { name: "Save Lives Camp", organizer: "Rotary Club Kolkata", location: "Netaji Indoor Stadium, Kolkata", date: "2026-02-10", registeredCount: 82, capacity: 200 },
  ];

  for (const c of initialCamps) {
    await db.insert(bloodCamps).values(c);
  }
}

export async function listBloodCamps() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(bloodCamps).orderBy(desc(bloodCamps.date));
}

export async function createBloodCamp(data: InsertBloodCamp) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(bloodCamps).values(data);
  return { id: result[0].insertId };
}
