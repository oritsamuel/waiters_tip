import { notFound } from "next/navigation";
import HomePage from "../page";
import { restaurants } from "@/lib/restaurants";

export default async function RestaurantPage({
  params,
}: {
  params: Promise<{ restaurant: string }>;
}) {
  const { restaurant } = await params;
  if (!restaurants[restaurant]) notFound();

  return <HomePage />;
}