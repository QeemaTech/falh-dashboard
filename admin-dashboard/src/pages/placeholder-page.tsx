import { Card } from "../components/ui/card";

type Props = { title: string; description: string };

export function PlaceholderPage({ title, description }: Props) {
  return (
    <Card>
      <h2 className="mb-2 text-lg font-semibold">{title}</h2>
      <p className="text-sm text-neutral-600 dark:text-neutral-300">{description}</p>
    </Card>
  );
}
