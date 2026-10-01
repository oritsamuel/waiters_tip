import { redirect } from "next/navigation";
import { restaurants } from "@/lib/restaurants";

export default async function CompanyAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string | string[] }>;
}) {
  const { branch } = await searchParams;
  const selectedBranch = Array.isArray(branch) ? branch[0] : branch;

  if (selectedBranch && restaurants[selectedBranch]) {
    redirect(`/company-admin/report?branch=${encodeURIComponent(selectedBranch)}`);
  }

  redirect("/company-admin/login");
}
