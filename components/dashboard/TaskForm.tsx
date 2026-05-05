'use client';

import { useForm } from 'react-hook-form';
import { Plus } from 'lucide-react';

type TaskFormData = {
  title: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
};

export default function TaskForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TaskFormData>();

  const onSubmit = (data: TaskFormData) => {
    console.log('New Task:', data);
    // TODO: Connect with Supabase later
    reset();
    alert('Task added successfully! (Demo)');
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-100">
      <h3 className="font-semibold text-lg mb-5 flex items-center gap-2 text-black">
        <Plus className="w-5 h-5" /> Quick Add Task
      </h3>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <input
          {...register('title', { required: 'Task title is required' })}
          type="text"
          placeholder="What needs to be done?"
          className="w-full px-4 py-3 border border-zinc-200 rounded-2xl focus:outline-none focus:border-blue-500"
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-zinc-600 block mb-1">Due Date</label>
            <input
              {...register('dueDate')}
              type="date"
              className="w-full px-4 py-3 border border-zinc-200 rounded-2xl focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-600 block mb-1">Priority</label>
            <select
              {...register('priority')}
              className="w-full px-4 py-3 border border-zinc-200 rounded-2xl focus:outline-none"
            >
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl font-medium transition-all active:scale-[0.985]"
        >
          Add Task
        </button>
      </form>
    </div>
  );
}