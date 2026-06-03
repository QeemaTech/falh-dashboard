import { useForm, type SubmitHandler, type FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ZodTypeAny } from "zod";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";

type Field = { name: string; label: string; placeholder?: string };

type Props = {
  title: string;
  schema: ZodTypeAny;
  fields: Field[];
  onSubmit: SubmitHandler<FieldValues>;
};

export function ReusableForm({ title, schema, fields, onSubmit }: Props) {
  const { register, handleSubmit, formState } = useForm<FieldValues>({
    resolver: zodResolver(schema as never),
  });

  return (
    <Card>
      <h3 className="mb-4 text-sm font-semibold">{title}</h3>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        {fields.map((field) => (
          <div key={field.name} className="space-y-1">
            <label className="text-xs font-medium">{field.label}</label>
            <Input placeholder={field.placeholder} {...register(field.name as never)} />
          </div>
        ))}
        <Button type="submit" disabled={formState.isSubmitting}>
          حفظ
        </Button>
      </form>
    </Card>
  );
}
