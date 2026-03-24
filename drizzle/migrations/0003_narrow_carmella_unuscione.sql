DROP TABLE `clients`;--> statement-breakpoint
DROP TABLE `sync_log`;--> statement-breakpoint
ALTER TABLE `users` DROP INDEX `users_email_unique`;--> statement-breakpoint
DROP INDEX `data_idx` ON `transactions`;--> statement-breakpoint
ALTER TABLE `transactions` MODIFY COLUMN `admin_id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `transactions` MODIFY COLUMN `data` bigint;--> statement-breakpoint
ALTER TABLE `transactions` MODIFY COLUMN `data_criacao` bigint;--> statement-breakpoint
ALTER TABLE `transactions` MODIFY COLUMN `data_atualizacao` bigint;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `name` text;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `email` varchar(320);--> statement-breakpoint
ALTER TABLE `users` ADD `loginMethod` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `createdAt` timestamp DEFAULT (now()) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `updatedAt` timestamp DEFAULT (now()) NOT NULL ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `users` ADD `lastSignedIn` timestamp DEFAULT (now()) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `template_whatsapp` text;--> statement-breakpoint
ALTER TABLE `users` ADD `email_notificacao` varchar(255);