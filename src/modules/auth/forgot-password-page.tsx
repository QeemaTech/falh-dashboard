import { Link } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";

export function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-4 dark:bg-neutral-950">
      <Card className="w-full max-w-md space-y-3">
        <h1 className="text-lg font-semibold">Forgot Password</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          Use the backend endpoint `/api/auth/forgot-password/send-otp` from this screen integration step.
        </p>
        <Link to="/login">
          <Button variant="outline">Back to Login</Button>
        </Link>
      </Card>
    </div>
  );
}
