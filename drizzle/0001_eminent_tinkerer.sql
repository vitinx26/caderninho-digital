CREATE TABLE `clientes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`estabelecimentoId` int NOT NULL,
	`nome` varchar(255) NOT NULL,
	`telefone` varchar(20),
	`email` varchar(320),
	`ativo` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clientes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `estabelecimentos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`adminId` int NOT NULL,
	`nome` varchar(255) NOT NULL,
	`telefone` varchar(20),
	`email` varchar(320),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `estabelecimentos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lancamentos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clienteId` int NOT NULL,
	`estabelecimentoId` int NOT NULL,
	`tipo` enum('debito','pagamento') NOT NULL,
	`valor` int NOT NULL,
	`descricao` text,
	`data` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lancamentos_id` PRIMARY KEY(`id`)
);
