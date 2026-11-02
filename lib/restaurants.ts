export type RestaurantConfig = {
  name: string;
  companyId: string;
  branchCode: string;
};

export const defaultRestaurantSlug = "";

export const restaurants: Record<string, RestaurantConfig> = {};
