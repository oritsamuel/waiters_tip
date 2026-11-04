import { getCompanyData, updateCompanyWaiters } from '@/lib/db';
import { restaurants } from '@/lib/restaurants';

export type WaiterStatus = 'active' | 'terminated';

export type WaiterProfile = {
  id: string;
  waiterPhoneNumber: string;
  fullName: string;
  phone: string;
  photo: string;
  totalTips: number;
  averageRating: number;
  status: WaiterStatus;
  transactions: Array<{
    id: string;
    waiterPhone: string;
    payerPhone?: string;
    tipAmount: number;
    rating: number;
    comment: string;
    timestamp: string;
  }>;
};

export function normalizeWaiterStatus(value?: string, isActive?: boolean): WaiterStatus {
  if (typeof isActive === 'boolean') {
    return isActive ? 'active' : 'terminated';
  }

  return value === 'terminated' ? 'terminated' : 'active';
}

export function resolveCompanyContext(searchParams: URLSearchParams) {
  const branch = searchParams.get('branch');
  const restaurant = branch ? restaurants[branch] : undefined;

  if (restaurant) {
    return { companyId: restaurant.companyId, branchCode: restaurant.branchCode };
  }

  const companyId = searchParams.get('companyId');
  const branchCode = searchParams.get('branchCode');

  if (!companyId || !branchCode) {
    throw new Error('Branch not found.');
  }

  return { companyId, branchCode };
}

export async function getWaiterProfilesForCompany(
  companyId: string,
  branchCode: string,
  search?: string,
  status?: string,
) {
  const companyData = await getCompanyData(companyId, branchCode);
  const savedWaiters = Array.isArray(companyData.waiters) ? companyData.waiters : [];
  const allTransactions = Array.isArray(companyData.transactions) ? companyData.transactions : [];

  const profiles: WaiterProfile[] = savedWaiters.map((waiter) => {
    const phone = waiter.phone;
    const transactions = [...allTransactions]
      .filter((transaction) => transaction.waiterPhone === phone)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const totalTips = transactions.reduce((sum, transaction) => sum + Number(transaction.tipAmount || 0), 0);
    const averageRating = transactions.length
      ? transactions.reduce((sum, transaction) => sum + Number(transaction.rating || 0), 0) / transactions.length
      : 0;

    const isActive = typeof waiter.isActive === 'boolean' ? waiter.isActive : !waiter.status || waiter.status !== 'terminated';

    return {
      id: phone,
      waiterPhoneNumber: phone,
      phone,
      fullName: waiter.fullName || `Waiter (${phone})`,
      photo: '/waiter.png',
      totalTips,
      averageRating: Number(averageRating.toFixed(1)),
      status: normalizeWaiterStatus(waiter.status, isActive),
      transactions,
    };
  });

  const normalizedSearch = (search || '').trim().toLowerCase();
  const normalizedStatus = (status || '').trim().toLowerCase();

  return profiles.filter((waiter) => {
    const matchesStatus = !normalizedStatus || waiter.status === normalizedStatus;
    const searchText = [
      waiter.fullName,
      waiter.waiterPhoneNumber,
      ...waiter.transactions.flatMap((transaction) => [
        transaction.comment,
        String(transaction.tipAmount),
      ]),
    ]
      .join(' ')
      .toLowerCase();

    const matchesSearch = !normalizedSearch || searchText.includes(normalizedSearch);
    return matchesStatus && matchesSearch;
  });
}

export async function addWaiterToCompany(
  companyId: string,
  branchCode: string,
  fullName: string,
  phone: string,
) {
  const companyData = await getCompanyData(companyId, branchCode);
  const existing = (companyData.waiters || []).find((waiter) => waiter.phone === phone);

  if (existing) {
    existing.fullName = fullName;
    existing.status = normalizeWaiterStatus(existing.status);
  } else {
    companyData.waiters.push({
      phone,
      fullName,
      status: 'active',
    });
  }

  await updateCompanyWaiters(companyId, branchCode, companyData.waiters || []);

  return getWaiterProfilesForCompany(companyId, branchCode, '', 'all');
}

export async function updateWaiterStatusInCompany(
  companyId: string,
  branchCode: string,
  phone: string,
  status: WaiterStatus,
) {
  const companyData = await getCompanyData(companyId, branchCode);
  const waiter = (companyData.waiters || []).find((item) => item.phone === phone);

  if (!waiter) {
    throw new Error('Waiter not found.');
  }

  waiter.status = normalizeWaiterStatus(status);
  await updateCompanyWaiters(companyId, branchCode, companyData.waiters || []);

  return waiter;
}
