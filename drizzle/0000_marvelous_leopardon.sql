CREATE TABLE `invitations` (
	`token` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`starts_at` integer,
	`expires_at` integer,
	`completed_at` integer,
	`status` text DEFAULT 'ready' NOT NULL,
	`answers` text DEFAULT '{}' NOT NULL,
	`nickname` text DEFAULT '' NOT NULL,
	`version` integer DEFAULT 0 NOT NULL,
	`questionnaire_version` text DEFAULT '3.0.0' NOT NULL,
	`report` text
);
