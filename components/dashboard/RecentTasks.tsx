const recentTasks = [
  { id: 1, title: "Finish project proposal", priority: "high", due: "Today" },
  { id: 2, title: "Review client feedback", priority: "medium", due: "Tomorrow" },
  { id: 3, title: "Prepare meeting agenda", priority: "low", due: "Apr 8" },
  { id: 4, title: "Update documentation", priority: "medium", due: "Apr 10" },
];

export default function RecentTasks() {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-100 h-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-semibold text-lg text-black ">Recent Tasks</h3>
        <a href="/dashboard/tasks" className="text-blue-600 text-sm hover:underline">
          View All
        </a>
      </div>

      <div className="space-y-3">
        {recentTasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center justify-between p-4 bg-zinc-50 hover:bg-zinc-100 rounded-2xl transition-colors"
          >
            <div className="flex items-center gap-3">
              <input type="checkbox" className="w-5 h-5 accent-blue-600" />
              <span className="font-medium">{task.title}</span>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`text-xs px-3 py-1 rounded-full font-medium ${
                  task.priority === 'high'
                    ? 'bg-red-100 text-red-700'
                    : task.priority === 'medium'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-zinc-200 text-zinc-700'
                }`}
              >
                {task.priority}
              </span>
              <span className="text-sm text-zinc-600">{task.due}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}