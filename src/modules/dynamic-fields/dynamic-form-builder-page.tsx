import { Navigate } from "react-router-dom";

/** @deprecated Use /categories — fields are managed on the categories page. */
export function DynamicFormBuilderPage() {
  return <Navigate to="/categories" replace />;
}
