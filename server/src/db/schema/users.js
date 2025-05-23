import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";

// Enum for user roles
/**
 * @readonly
 * @enum {"USER" | "ORGANIZER"}
 */
export const UserRole = {
  USER: "USER",
  ORGANIZER: "ORGANIZER",
};

// Users table
export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  userName: varchar("user_name", { length: 255 }).unique(),
  password: text("password").notNull(),
  avatarUrl: text("avatar_url").default("avatar"),
  bio: text("bio").default("--"),
  // role: varchar("role", { length: 255 }).default(UserRole.USER).notNull(),
  isVerified: boolean("is_verified").notNull(),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: false }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: false })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: false })
    .defaultNow()
    .notNull(),
});

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} email
 * @property {string} fullName
 * @property {string} [userName]
 * @property {string} password
 * @property {"USER" | "ORGANIZER"} role
 * @property {Date} createdAt
 * @property {Date} updatedAt
 * @property {boolean} isVerified
 * @property {string} code
 * @property {Date} expiresAt
 */

/**
 * @typedef {Object} NewUser
 * @property {string} email
 * @property {string} fullName
 * @property {string} [userName]
 * @property {string} password
 * @property {"USER" | "ORGANIZER"} [role]
 * @property {boolean} isVerified
 */

/**
 * @typedef {Object} UserProfile
 * @property {string} id
 * @property {string} userId
 * @property {string} avatarUrl
 * @property {string} bio
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

/**
 * @typedef {Object} NewUserProfile
 * @property {string} userId
 * @property {string} avatarUrl
 * @property {string} bio
 */
