import { Suspense } from "react";
import LoginForm from "./login-form";

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="px-4 py-16 text-center text-zinc-500">Loading…</p>}>
      <LoginForm />
    </Suspense>
  );
}
