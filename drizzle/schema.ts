import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/* ========== DONORS ========== */
export const donors = mysqlTable("donors", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  bloodGroup: mysqlEnum("bloodGroup", ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"]).notNull(),
  area: varchar("area", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 32 }).notNull(),
  lastDonationDate: varchar("lastDonationDate", { length: 16 }), // YYYY-MM-DD
  isFirstTime: int("isFirstTime").default(0),
  userId: int("userId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Donor = typeof donors.$inferSelect;
export type InsertDonor = typeof donors.$inferInsert;

/* ========== BLOOD BANKS ========== */
export const bloodBanks = mysqlTable("bloodBanks", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  area: varchar("area", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 32 }).notNull(),
  isOpen24x7: int("isOpen24x7").default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BloodBank = typeof bloodBanks.$inferSelect;
export type InsertBloodBank = typeof bloodBanks.$inferInsert;

/* ========== BLOOD CAMPS ========== */
export const bloodCamps = mysqlTable("bloodCamps", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  organizer: varchar("organizer", { length: 255 }).notNull(),
  location: varchar("location", { length: 512 }).notNull(),
  date: varchar("date", { length: 16 }).notNull(), // YYYY-MM-DD
  registeredCount: int("registeredCount").default(0),
  capacity: int("capacity").default(100),
  userId: int("userId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BloodCamp = typeof bloodCamps.$inferSelect;
export type InsertBloodCamp = typeof bloodCamps.$inferInsert;
