import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: 'gateway02.us-east-1.prod.aws.tidbcloud.com',
  user: '6G4J6icMmx5rEXy.0667aace6315',
  password: '9aO0mRP2dNUT0b15PdcK',
  database: 'dyVJYfPkMaKo6dqqnRNgqj',
  port: 4000,
  ssl: { rejectUnauthorized: false },
  waitForConnections: true,
  connectionLimit: 1,
  queueLimit: 0,
});

try {
  const [rows] = await connection.execute('SHOW TABLES');
  console.log('Tabelas no banco:');
  rows.forEach(row => {
    const tableName = Object.values(row)[0];
    console.log(`- ${tableName}`);
  });
} catch (error) {
  console.error('Erro:', error.message);
}

await connection.end();
