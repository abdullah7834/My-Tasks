import { CheckCircle, Clock, Calendar, List } from 'lucide-react';

const stats = [
  {
    title: "Today's Tasks",
    value: "7",
    icon: Clock,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    title: "Completed",
    value: "24",
    icon: CheckCircle,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    title: "Upcoming",
    value: "12",
    icon: Calendar,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    title: "Total Tasks",
    value: "43",
    icon: List,
    color: "text-zinc-600",
    bg: "bg-zinc-100",
  },
];

export default function StatsCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-100 hover:shadow transition-shadow"
        >
          <div className={`w-12 h-12 ${stat.bg} rounded-2xl flex items-center justify-center mb-4`}>
            <stat.icon className={`w-6 h-6 ${stat.color}`} />
          </div>
          <p className="text-3xl font-semibold text-zinc-900">{stat.value}</p>
          <p className="text-zinc-700 mt-1">{stat.title}</p>
        </div>
      ))}
    </div>
  );
}