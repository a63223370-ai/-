import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const invitations = sqliteTable("invitations", {
  token: text("token").primaryKey(),
  createdAt: integer("created_at").notNull(),
  startsAt: integer("starts_at"),
  expiresAt: integer("expires_at"),
  completedAt: integer("completed_at"),
  status: text("status").notNull().default("ready"),
  answers: text("answers").notNull().default("{}"),
  nickname: text("nickname").notNull().default(""),
  version: integer("version").notNull().default(0),
  questionnaireVersion: text("questionnaire_version").notNull().default("3.0.0"),
  report: text("report"),
});
