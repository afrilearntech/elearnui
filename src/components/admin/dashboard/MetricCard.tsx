"use client";

interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  changeType?: "increase" | "decrease";
}

export default function MetricCard({
  title,
  value,
  change,
  changeType = "increase",
}: MetricCardProps) {
  const isPositive = changeType === "increase";
  const changeColor = isPositive ? "text-green-600" : "text-red-600";
  const changeIcon = isPositive ? "▲" : "▼";

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
      <h3 className="text-sm font-medium text-gray-600 mb-2">{title}</h3>
      <div className="flex items-baseline justify-between">
        <p className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
        <div className={`text-sm font-semibold ${changeColor}`}>
          <span>{changeIcon}</span>
          <span>{Math.abs(change)}%</span>
          <span className="text-gray-500 ml-1">vs last month</span>
        </div>
      </div>
    </div>
  );
}

