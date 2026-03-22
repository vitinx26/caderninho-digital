-- Remover constraint de foreign key entre transactions e clients
-- Isso permite que clienteId seja um user (cliente logado) ou um client (cliente tradicional)

-- Verificar se constraint existe antes de remover
ALTER TABLE `transactions` DROP FOREIGN KEY IF EXISTS `transactions_cliente_id_clients_id_fk`;
