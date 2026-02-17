import { Icon } from '@iconify/react';

interface Course {
  id: number | string;
  name?: string;
  title?: string;
  grade: string;
  teachers?: number[];
  teacher?: string;
  progress?: number;
  color?: string;
  icon?: string;
}

interface MyCoursesSectionProps {
  courses?: Course[];
}

export function MyCoursesSection({
  courses = []
}: MyCoursesSectionProps) {
  const getColorForIndex = (index: number): string => {
    const colors = ['blue', 'green', 'purple'];
    return colors[index % colors.length];
  };

  const getInitials = (name: string): string => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  const displayCourses = courses.length > 0 ? courses : [];
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return {
          bg: 'bg-blue-500',
          progress: 'bg-blue-500',
          button: 'bg-blue-600 hover:bg-blue-700'
        };
      case 'green':
        return {
          bg: 'bg-green-500',
          progress: 'bg-green-500',
          button: 'bg-green-600 hover:bg-green-700'
        };
      case 'purple':
        return {
          bg: 'bg-purple-500',
          progress: 'bg-purple-500',
          button: 'bg-purple-600 hover:bg-purple-700'
        };
      default:
        return {
          bg: 'bg-gray-500',
          progress: 'bg-gray-500',
          button: 'bg-gray-600 hover:bg-gray-700'
        };
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Andika, sans-serif' }}>
          My Courses
        </h2>
        <a href="/courses/all" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
          View all courses
        </a>
      </div>
      
      <div className="space-y-4">
        {displayCourses.length > 0 ? (
          displayCourses.map((course, index) => {
            const color = course.color || getColorForIndex(index);
            const colors = getColorClasses(color);
            const courseName = course.name || course.title || 'Untitled Course';
            const teacherCount = course.teachers ? course.teachers.length : 0;
            const progress = course.progress || 0;
            const icon = course.icon || getInitials(courseName);
            
          return (
            <div key={course.id} className="flex items-center p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <div className={`w-16 h-16 ${colors.bg} rounded-lg flex items-center justify-center text-white font-bold text-xl mr-4`}>
                  {icon}
              </div>
              
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1" style={{ fontFamily: 'Andika, sans-serif' }}>
                    {courseName}
                </h3>
                <p className="text-sm text-gray-600 mb-2" style={{ fontFamily: 'Andika, sans-serif' }}>
                    {course.grade} • {teacherCount} {teacherCount === 1 ? 'Teacher' : 'Teachers'}
                </p>
                <div className="flex items-center">
                  <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                    <div 
                      className={`h-2 rounded-full ${colors.progress}`}
                        style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                    <span className="text-sm font-medium text-gray-700">{progress}%</span>
                </div>
              </div>
              
              <button className={`px-4 py-2 text-white rounded-lg font-medium ${colors.button} transition-colors`}>
                Continue
              </button>
            </div>
          );
          })
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600" style={{ fontFamily: 'Andika, sans-serif' }}>
              No courses available. Start learning to see your courses here!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
