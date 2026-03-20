CREATE TABLE `menu_categories` (
	`id` varchar(36) NOT NULL,
	`menu_id` varchar(36) NOT NULL,
	`nome` varchar(255) NOT NULL,
	`ordem` int NOT NULL,
	`data_criacao` bigint NOT NULL,
	CONSTRAINT `menu_categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `menu_items` (
	`id` varchar(36) NOT NULL,
	`category_id` varchar(36) NOT NULL,
	`nome` varchar(255) NOT NULL,
	`valor` int NOT NULL,
	`descricao` text,
	`ordem` int NOT NULL,
	`data_criacao` bigint NOT NULL,
	CONSTRAINT `menu_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `menus` (
	`id` varchar(36) NOT NULL,
	`admin_id` varchar(36) NOT NULL,
	`nome` varchar(255) NOT NULL,
	`ativo` boolean NOT NULL DEFAULT false,
	`data_criacao` bigint NOT NULL,
	`data_atualizacao` bigint NOT NULL,
	CONSTRAINT `menus_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `category_menu_id_idx` ON `menu_categories` (`menu_id`);--> statement-breakpoint
CREATE INDEX `item_category_id_idx` ON `menu_items` (`category_id`);--> statement-breakpoint
CREATE INDEX `menu_admin_id_idx` ON `menus` (`admin_id`);--> statement-breakpoint
CREATE INDEX `menu_ativo_idx` ON `menus` (`ativo`);--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `email_notificacao`;