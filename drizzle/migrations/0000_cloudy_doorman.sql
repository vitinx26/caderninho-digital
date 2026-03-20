CREATE TABLE `clients` (
	`id` varchar(36) NOT NULL,
	`admin_id` varchar(36) NOT NULL,
	`nome` varchar(255) NOT NULL,
	`telefone` varchar(20),
	`email` varchar(255),
	`ativo` boolean NOT NULL DEFAULT true,
	`data_criacao` bigint NOT NULL,
	`data_atualizacao` bigint NOT NULL,
	CONSTRAINT `clients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `menu_categories` (
	`id` varchar(36) NOT NULL,
	`menu_id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`order` int NOT NULL DEFAULT 0,
	`created_at` bigint NOT NULL,
	CONSTRAINT `menu_categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `menu_items` (
	`id` varchar(36) NOT NULL,
	`category_id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`price` int NOT NULL,
	`order` int NOT NULL DEFAULT 0,
	`created_at` bigint NOT NULL,
	CONSTRAINT `menu_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `menus` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`is_active` boolean NOT NULL DEFAULT false,
	`created_at` bigint NOT NULL,
	`updated_at` bigint NOT NULL,
	CONSTRAINT `menus_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` varchar(36) NOT NULL,
	`admin_id` varchar(36) NOT NULL,
	`cliente_id` varchar(36) NOT NULL,
	`tipo` varchar(20) NOT NULL,
	`valor` int NOT NULL,
	`descricao` text NOT NULL,
	`data` bigint NOT NULL,
	`data_criacao` bigint NOT NULL,
	`data_atualizacao` bigint NOT NULL,
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`email` varchar(255) NOT NULL,
	`nome` varchar(255) NOT NULL,
	`tipo` varchar(20) NOT NULL,
	`telefone` varchar(20),
	`nome_estabelecimento` varchar(255),
	`template_whatsapp` text,
	`senha` text NOT NULL,
	`data_criacao` bigint NOT NULL,
	`data_atualizacao` bigint NOT NULL,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE INDEX `admin_id_idx` ON `clients` (`admin_id`);--> statement-breakpoint
CREATE INDEX `nome_idx` ON `clients` (`nome`);--> statement-breakpoint
CREATE INDEX `menu_id_idx` ON `menu_categories` (`menu_id`);--> statement-breakpoint
CREATE INDEX `category_id_idx` ON `menu_items` (`category_id`);--> statement-breakpoint
CREATE INDEX `is_active_idx` ON `menus` (`is_active`);--> statement-breakpoint
CREATE INDEX `admin_id_idx` ON `transactions` (`admin_id`);--> statement-breakpoint
CREATE INDEX `cliente_id_idx` ON `transactions` (`cliente_id`);--> statement-breakpoint
CREATE INDEX `data_idx` ON `transactions` (`data`);--> statement-breakpoint
CREATE INDEX `email_idx` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `tipo_idx` ON `users` (`tipo`);