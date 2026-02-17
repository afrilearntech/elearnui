'use client';

import Card from '@/components/ui/Card';
import { Icon } from '@iconify/react';

interface TaskItem {
  id: string;
  title: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
}

interface UpcomingTasksProps {
  title: string;
  tasks: TaskItem[];
}

export default function UpcomingTasks({ title, tasks }: UpcomingTasksProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="w-full lg:w-[280px] h-auto lg:h-[226px] lg:ml-[112px]">
      <h3 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: 'Andika, sans-serif' }}>
        {title}
      </h3>
      <div className="space-y-3">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <div key={task.id} className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)}`}></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900" style={{ fontFamily: 'Andika, sans-serif' }}>
                  {task.title}
                </p>
                <p className="text-xs text-gray-600" style={{ fontFamily: 'Andika, sans-serif' }}>
                  {task.dueDate}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-600" style={{ fontFamily: 'Andika, sans-serif' }}>
            No upcoming tasks
          </p>
        )}
      </div>
    </Card>
  );
}
