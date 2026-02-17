import { Icon } from '@iconify/react';

interface Assignment {
  id: number | string;
  title: string;
  dueDate?: string;
  due_at?: string;
  due_in_days?: number;
  course: string;
  status?: 'urgent' | 'due-soon' | 'upcoming';
  icon?: string;
}

interface AssignmentsDueSectionProps {
  assignments?: Assignment[];
}

export function AssignmentsDueSection({
  assignments = []
}: AssignmentsDueSectionProps) {
  const getStatusFromDays = (days: number): 'urgent' | 'due-soon' | 'upcoming' => {
    if (days <= 1) return 'urgent';
    if (days <= 7) return 'due-soon';
    return 'upcoming';
  };

  const formatDueDate = (due_in_days: number | undefined, due_at: string | undefined): string => {
    if (due_in_days !== undefined) {
      if (due_in_days === 0) return 'Due today';
      if (due_in_days === 1) return 'Due tomorrow';
      if (due_in_days <= 7) return `Due in ${due_in_days} days`;
      return 'Due next week';
    }
    if (due_at) {
      const date = new Date(due_at);
      const today = new Date();
      const diffTime = date.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return 'Due today';
      if (diffDays === 1) return 'Due tomorrow';
      if (diffDays <= 7) return `Due in ${diffDays} days`;
      return 'Due next week';
    }
    return 'Due date not specified';
  };

  const getIconForType = (type: string | undefined): string => {
    if (type === 'lesson') return 'mdi:book-open-variant';
    return 'mdi:file-document-outline';
  };

  const displayAssignments = assignments.length > 0 ? assignments : [];
  const getStatusClasses = (status: string) => {
    switch (status) {
      case 'urgent':
        return {
          cardBg: 'bg-red-50',
          iconBg: 'bg-red-50',
          iconColor: 'text-red-600',
          button: 'bg-red-500 hover:bg-red-600 text-white',
          buttonText: 'Urgent'
        };
      case 'due-soon':
        return {
          cardBg: 'bg-yellow-50',
          iconBg: 'bg-yellow-50',
          iconColor: 'text-yellow-600',
          button: 'bg-yellow-500 hover:bg-yellow-600 text-white',
          buttonText: 'Due Soon'
        };
      case 'upcoming':
        return {
          cardBg: 'bg-gray-50',
          iconBg: 'bg-gray-50',
          iconColor: 'text-gray-600',
          button: 'bg-gray-200 text-gray-500',
          buttonText: ''
        };
      default:
        return {
          cardBg: 'bg-gray-50',
          iconBg: 'bg-gray-50',
          iconColor: 'text-gray-600',
          button: 'bg-gray-200 text-gray-500',
          buttonText: ''
        };
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Andika, sans-serif' }}>
          Assignments Due
        </h2>
        <a href="#" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
          View all
        </a>
      </div>
      
      <div className="space-y-4">
        {displayAssignments.length > 0 ? (
          displayAssignments.map((assignment) => {
            const status = assignment.status || getStatusFromDays(assignment.due_in_days || 999);
            const statusClasses = getStatusClasses(status);
            const dueDateText = assignment.dueDate || formatDueDate(assignment.due_in_days, assignment.due_at);
            const icon = assignment.icon || getIconForType((assignment as any).type);
            
          return (
            <div key={assignment.id} className={`flex items-center p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow ${statusClasses.cardBg}`}>
              <div className={`w-12 h-12 ${statusClasses.iconBg} rounded-lg flex items-center justify-center mr-4`}>
                  <Icon icon={icon} className={`w-6 h-6 ${statusClasses.iconColor}`} />
              </div>
              
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1" style={{ fontFamily: 'Andika, sans-serif' }}>
                  {assignment.title}
                </h3>
                <p className="text-sm text-gray-600" style={{ fontFamily: 'Andika, sans-serif' }}>
                    {dueDateText} • {assignment.course}
                </p>
              </div>
              
              {statusClasses.buttonText && (
                <button className={`px-4 py-2 rounded-lg font-medium transition-colors ${statusClasses.button}`}>
                  {statusClasses.buttonText}
                </button>
              )}
            </div>
          );
          })
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600" style={{ fontFamily: 'Andika, sans-serif' }}>
              No assignments due. Great job staying on top of your work!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
