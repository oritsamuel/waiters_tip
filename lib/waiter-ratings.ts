type WaiterIdentity = {
  phoneNumber?: string;
  waiterPhoneNumber?: string;
  phone?: string;
  rating?: number;
};

export async function addAverageRatings<T extends WaiterIdentity>(
  waiters: T[],
  companyId: string,
  signal?: AbortSignal,
): Promise<T[]> {
  return Promise.all(waiters.map(async (waiter) => {
    const phoneNumber = waiter.phoneNumber || waiter.waiterPhoneNumber || waiter.phone;
    if (!phoneNumber) return waiter;

    try {
      const params = new URLSearchParams({ phoneNumber, companyId });
      const response = await fetch(`/api/waiter/get?${params.toString()}`, { signal });
      if (!response.ok) return waiter;

      const payload = await response.json().catch(() => null);
      const waiterData = Array.isArray(payload?.data)
        ? payload.data[0]
        : payload?.data ?? payload;
      const averageRating = Number(waiterData?.averageRating ?? waiterData?.rating);

      return Number.isFinite(averageRating)
        ? { ...waiter, rating: averageRating }
        : waiter;
    } catch {
      return waiter;
    }
  }));
}