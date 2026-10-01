import fs from 'fs/promises';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'mock-db.json');

export type Transaction = {
  id: string;
  waiterPhone: string;
  payerPhone: string;
  tipAmount: number;
  rating: number;
  comment: string;
  timestamp: string;
};

export type Waiter = {
  phone: string;
  fullName?: string;
  status?: 'active' | 'terminated';
};

export type CompanyData = {
  waiters: Waiter[];
  transactions: Transaction[];
};

export type Database = {
  [companyKey: string]: CompanyData; // companyKey is typically `${companyId}_${branchCode}`
};

export async function getDb(): Promise<Database> {
  try {
    const data = await fs.readFile(DB_FILE, 'utf-8');
    return JSON.parse(data) as Database;
  } catch (error) {
    // If file doesn't exist, return empty db
    return {};
  }
}

export async function saveDb(db: Database): Promise<void> {
  await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

export async function getCompanyData(companyId: string, branchCode: string): Promise<CompanyData> {
  const db = await getDb();
  const key = `${companyId}_${branchCode}`;
  if (!db[key]) {
    return { waiters: [], transactions: [] };
  }
  return db[key];
}

export async function updateCompanyWaiters(companyId: string, branchCode: string, waiters: Waiter[]): Promise<void> {
  const db = await getDb();
  const key = `${companyId}_${branchCode}`;
  if (!db[key]) {
    db[key] = { waiters: [], transactions: [] };
  }
  db[key].waiters = waiters;
  await saveDb(db);
}

export async function addTransaction(companyId: string, branchCode: string, transaction: Omit<Transaction, 'id' | 'timestamp'>): Promise<Transaction> {
  const db = await getDb();
  const key = `${companyId}_${branchCode}`;
  if (!db[key]) {
    db[key] = { waiters: [], transactions: [] };
  }
  
  const newTransaction: Transaction = {
    ...transaction,
    id: Math.random().toString(36).substring(2, 9),
    timestamp: new Date().toISOString(),
  };
  
  db[key].transactions.push(newTransaction);
  await saveDb(db);
  return newTransaction;
}
