export type RestaurantConfig = {
  name: string;
  companyId: string;
  branchCode: string;
};

export const defaultRestaurantSlug = "starbuck";

export const restaurants: Record<string, RestaurantConfig> = {
  starbuck: {
    name: "Starbucks",
    companyId: "50301",
    branchCode: "44496",
  },
  mcdonalds: {
    name: "McDonald's",
    companyId: "50301",
    branchCode: "44497",
  },
};