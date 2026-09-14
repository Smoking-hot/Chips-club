import Link from "next/link";
import RegisterForm from "@/components/RegisterForm";

export default async function RegisterPage({
  searchParams,
}: PageProps<"/register">) {
  const { code } = await searchParams;
  const inviteCode = typeof code === "string" ? code : undefined;

  return (
    <div className="max-w-sm mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Join Chipsklubben</h1>
        <p className="text-muted text-sm mt-1">
          Membership is invite-only — ask a member for a code.
        </p>
      </div>
      <RegisterForm inviteCode={inviteCode} />
      <p className="text-sm text-muted">
        Already a member?{" "}
        <Link href="/login" className="text-brand underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
