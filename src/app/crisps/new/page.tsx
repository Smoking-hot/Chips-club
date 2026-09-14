import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import CrispForm from "@/components/CrispForm";

export default async function NewCrispPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Add a crisp</h1>
        <p className="text-muted text-sm mt-1">
          New to the listing? Add it here along with your own rating and
          tasting notes.
        </p>
      </div>
      <CrispForm />
    </div>
  );
}
