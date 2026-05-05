import StatsCards from '@/components/dashboard/StatsCards';
import TaskForm from '@/components/dashboard/TaskForm';
import RecentTasks from '@/components/dashboard/RecentTasks';

export default function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-semibold text-zinc-900">
          Good morning, Abdullah 👋
        </h1>
        <p className="text-zinc-700 mt-1">
          Here&apos;s what you need to focus on today
        </p>
      </div>

      <StatsCards />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <TaskForm />
        </div>
        <div className="lg:col-span-2">
          <RecentTasks />
        </div>
      </div>
    </div>
  );
}