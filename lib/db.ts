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
  id?: string;
  phone: string;
  fullName?: string;
  status?: 'active' | 'terminated';
  isActive?: boolean;
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

export async function findWaiterByIdentifier(identifier: string): Promise<Waiter | null> {
  const normalized = String(identifier ?? '').trim();
  if (!normalized) {
    return null;
  }

  const db = await getDb();

  for (const companyData of Object.values(db)) {
    if (!Array.isArray(companyData?.waiters)) continue;

    const waiter = companyData.waiters.find((item) => {
      const itemId = item.id ? String(item.id) : '';
      const itemPhone = item.phone ? String(item.phone) : '';
      return itemId === normalized || itemPhone === normalized;
    });

    if (waiter) return waiter;
  }

  return null;
}

export async function findWaiterByPhone(phone: string): Promise<Waiter | null> {
  return findWaiterByIdentifier(phone);
}

export async function setWaiterActiveState(identifier: string, isActive: boolean): Promise<boolean> {
  const normalized = String(identifier ?? '').trim();
  if (!normalized) {
    return false;
  }

  const db = await getDb();
  let updated = false;

  Object.values(db).forEach((companyData) => {
    if (!Array.isArray(companyData?.waiters)) return;

    companyData.waiters.forEach((waiter) => {
      const waiterId = waiter.id ? String(waiter.id) : '';
      const waiterPhone = waiter.phone ? String(waiter.phone) : '';
      if (waiterId !== normalized && waiterPhone !== normalized) return;

      waiter.isActive = isActive;
      waiter.status = isActive ? 'active' : 'terminated';
      updated = true;
    });
  });

  if (updated) {
    await saveDb(db);
  }

  return updated;
}
