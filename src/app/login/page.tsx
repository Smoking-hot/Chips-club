import Link from "next/link";
import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="max-w-sm mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Log in</h1>
        <p className="text-muted text-sm mt-1">
          Welcome back to Chipsklubben.
        </p>
      </div>
      <LoginForm />
      <p className="text-sm text-muted">
        New here? You&apos;ll need an invite code.{" "}
        <Link href="/register" className="text-brand underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
