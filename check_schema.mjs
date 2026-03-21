import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: 'gateway02.us-east-1.prod.aws.tidbcloud.com',
  user: '6G4J6icMmx5rEXy.0667aace6315',
  password: '9aO0mRP2dNUT0b15PdcK',
  database: 'dyVJYfPkMaKo6dqqnRNgqj',
  port: 4000,
  ssl: { rejectUnauthorized: false },
});

try {
  const [rows] = await connection.execute('DESCRIBE users');
  console.log('Estrutura da tabela users:');
  rows.forEach(row => {
    console.log(`${row.Field}: ${row.Type} (${row.Null === 'YES' ? 'nullable' : 'not null'})`);
  });
} catch (error) {
  console.error('Erro:', error.message);
}

await connection.end();
