import { BarChart, Bar, CartesianGrid, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Card } from "./ui/card";

const data = [
  { month: "Jan", orders: 120 },
  { month: "Feb", orders: 200 },
  { month: "Mar", orders: 180 },
  { month: "Apr", orders: 250 },
  { month: "May", orders: 220 },
];

export function ChartCard() {
  return (
    <Card>
      <h3 className="mb-3 text-sm font-semibold">تحليلات الطلبات</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <Tooltip />
            <Bar dataKey="orders" fill="#23673A" radius={6} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
