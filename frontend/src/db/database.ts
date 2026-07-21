import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';

const DB_NAME = 'database'; // sem extensão .db
let db: SQLiteDBConnection;
const sqlite = new SQLiteConnection(CapacitorSQLite);

export async function initDatabase() {
  // No Android/iOS, copia o .db dos assets pra pasta de dados do app
  // (só copia se ainda não existir lá, por causa do "false")
  if (Capacitor.getPlatform() !== 'web') {
    await sqlite.copyFromAssets(false);
  }

  const isConn = (await sqlite.isConnection(DB_NAME, false)).result;
  db = isConn
    ? await sqlite.retrieveConnection(DB_NAME, false)
    : await sqlite.createConnection(DB_NAME, false, 'no-encryption', 1, false);

  await db.open();
  return db;
}

export function getDb() {
  if (!db) throw new Error('Banco não inicializado — chame initDatabase() primeiro');
  return db;
}