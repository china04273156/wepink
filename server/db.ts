import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from '../shared/schema';

let db: any = null;

export async function getDatabase() {
  if (db) return db;

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
      database: process.env.DB_NAME || 'wepink',
    });

    db = drizzle(connection, { schema, mode: 'default' });
    console.log('✅ Database connected successfully');
    return db;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

export async function initializeDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
    });

    // Criar banco de dados se não existir
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'wepink'}`);
    console.log('✅ Database created or already exists');

    await connection.end();
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}
