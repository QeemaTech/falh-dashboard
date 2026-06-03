import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronRight, Eye, Leaf, Loader2 } from "lucide-react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { useAuth } from "../../store/auth-store";
import { getStoredUser } from "../../services/auth-storage";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const defaultRedirect = "/";
  const redirectTo = (location.state as { from?: string } | undefined)?.from || defaultRedirect;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", rememberMe: true },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    try {
      await login(values as FormValues);
      const stored = getStoredUser();
      const target =
        stored?.role === "COMPANY" ? "/company/products" : redirectTo === "/company/products" ? "/" : redirectTo;
      navigate(target, { replace: true });
    } catch (error) {
      const message =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setServerError(message || "Login failed. Please try again.");
    }
  });

  return (
    <div className="min-h-screen bg-[#f4f6f4]">
      <div className="grid min-h-screen lg:grid-cols-2">
        <section className="relative hidden border-e border-[#e7ece7] bg-[#f3f4f3] px-8 py-7 lg:block">
          <div className="mb-16 flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-white shadow-sm">
              <Leaf className="size-4 text-[#23673A]" />
            </div>
            <p className="text-lg font-semibold text-[#0f172a]">Falh</p>
            <span className="rounded-md bg-white px-2 py-1 text-xs text-neutral-500">Admin</span>
          </div>

          <div className="mx-auto mt-28 max-w-md text-center">
            <div className="mx-auto mb-6 w-[250px] rounded-[22px] border border-[#e7ece7] bg-white p-8 shadow-[0_20px_40px_-32px_rgba(15,23,42,0.6)]">
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-[#23673A]/10">
                <Leaf className="size-8 text-[#23673A]" />
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-[#23673A]">FALH</h2>
              <p className="mt-6 text-3xl font-semibold leading-tight text-[#1f2937]">Management<br />Control Center</p>
            </div>

            <p className="text-sm text-neutral-500">Your Gateway to Agricultural Operations</p>
            <div className="mt-5 grid grid-cols-3 gap-5 text-center">
              <div>
                <p className="text-3xl font-semibold text-[#0f172a]">150+</p>
                <p className="text-xs text-neutral-500">Partners</p>
              </div>
              <div>
                <p className="text-3xl font-semibold text-[#0f172a]">200+</p>
                <p className="text-xs text-neutral-500">Products</p>
              </div>
              <div>
                <p className="text-3xl font-semibold text-[#0f172a]">30+</p>
                <p className="text-xs text-neutral-500">Services</p>
              </div>
            </div>
          </div>

          <p className="absolute bottom-7 inset-s-8 text-xs text-neutral-400">©2026 Falh</p>
        </section>

        <section className="flex items-center justify-center px-5 py-8 sm:px-8">
          <div className="w-full max-w-md">
            <div className="mb-10 flex justify-end">
              <div className="inline-flex rounded-full border border-[#e7ece7] bg-white p-1">
                <button className="rounded-full bg-[linear-gradient(90deg,#23673A,#2f8248)] px-3 py-1.5 text-xs font-semibold text-white">EN</button>
                <button className="rounded-full px-3 py-1.5 text-xs font-semibold text-neutral-600">AR</button>
              </div>
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-[#111827]">Sign in</h1>
            <p className="mt-2 text-sm text-neutral-500">Enter your credentials to access the dashboard</p>

            <form onSubmit={onSubmit} className="mt-8 space-y-5">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500">Email address</label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  className="h-12 border-[#dfe6df] bg-white text-neutral-800 placeholder:text-neutral-400 dark:bg-white dark:text-neutral-800"
                  {...form.register("email")}
                />
                {form.formState.errors.email ? (
                  <p className="mt-1 text-xs text-red-500">{form.formState.errors.email.message}</p>
                ) : null}
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500">Password</label>
                <div className="relative">
                  <Input
                    type="password"
                    placeholder="••••••••"
                    className="h-12 border-[#dfe6df] bg-white pe-11 text-neutral-800 placeholder:text-neutral-400 dark:bg-white dark:text-neutral-800"
                    {...form.register("password")}
                  />
                  <Eye className="pointer-events-none absolute inset-e-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
                </div>
                {form.formState.errors.password ? (
                  <p className="mt-1 text-xs text-red-500">{form.formState.errors.password.message}</p>
                ) : null}
              </div>

              {serverError ? <p className="text-sm text-red-500">{serverError}</p> : null}

              <Button
                type="submit"
                className="h-12 w-full rounded-[14px] bg-[linear-gradient(90deg,#23673A,#2f8248)] text-base font-semibold shadow-[0_16px_28px_-20px_rgba(35,103,58,0.95)]"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <>Sign In <ChevronRight className="size-4" /></>}
              </Button>

              <div className="flex items-center justify-between text-sm text-neutral-500">
                <label className="flex items-center gap-2 font-medium">
                  <input type="checkbox" {...form.register("rememberMe")} />
                  Remember me
                </label>
                <Link to="/forgot-password" className="text-[#23673A] hover:underline">
                  Forgot Password?
                </Link>
              </div>
            </form>

            <p className="mt-8 text-center text-xs text-neutral-400">Falh Admin Portal - internal use only</p>
          </div>
        </section>
      </div>
    </div>
  );
}
