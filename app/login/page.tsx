import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage(): Promise<React.JSX.Element> {
  const user = await getCurrentUser();
  if (user) {
    redirect("/tickets");
  }

  return (
    <div className="mx-auto max-w-md">
      <LoginForm />
      <div className="mt-4 rounded-md border bg-white p-4 text-sm text-gray-700">
        <p className="font-semibold">Comptes de démonstration (seed)</p>
        <p>- admin@ticketing.local / admin123</p>
        <p>- user@ticketing.local / user123</p>
      </div>
    </div>
  );
}
