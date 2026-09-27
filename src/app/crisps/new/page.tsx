import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import CrispForm from "@/components/CrispForm";

// Photo uploads (via createCrispAction on this page) can take a few seconds
// on a real photo — raise the Server Action timeout above Next.js's default
// so a normal upload never gets cut off mid-request.
export const maxDuration = 30;

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
