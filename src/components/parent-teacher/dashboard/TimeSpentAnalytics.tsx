"use client";

import { EstimatedTimeSpent } from "@/lib/api/parent-teacher/parent";

interface TimeSpentAnalyticsProps {
  childId: string;
  timeSpentData?: EstimatedTimeSpent[];
}

const colors = ["#059669", "#3B82F6", "#8B5CF6", "#F59E0B", "#EF4444", "#10B981", "#F97316", "#6366F1"];

export default function TimeSpentAnalytics({ childId, timeSpentData = [] }: TimeSpentAnalyticsProps) {
  if (!timeSpentData || timeSpentData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Time Spent on Assessments
          </h3>
          <p className="text-sm text-gray-600">No time data available yet.</p>
        </div>
      </div>
    );
  }

  // Calculate total time from the data
  const totalTime = timeSpentData.reduce((sum, item) => {
    // Parse time string like "12h 30m" or "2h" or "45m"
    const timeStr = item.time;
    let hours = 0;
    let minutes = 0;
    
    const hourMatch = timeStr.match(/(\d+)h/);
    const minuteMatch = timeStr.match(/(\d+)m/);
    
    if (hourMatch) hours = parseInt(hourMatch[1], 10);
    if (minuteMatch) minutes = parseInt(minuteMatch[1], 10);
    
    return sum + hours * 60 + minutes;
  }, 0);

  const totalHours = Math.floor(totalTime / 60);
  const totalMinutes = totalTime % 60;
  const totalTimeFormatted = totalHours > 0 
    ? (totalMinutes > 0 ? `${totalHours}h ${totalMinutes}m` : `${totalHours}h`)
    : `${totalMinutes}m`;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          Time Spent on Assessments
        </h3>
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-lg p-3 text-white">
          <p className="text-xs opacity-90 mb-1">
            Total Time
          </p>
          <p className="text-2xl font-bold">
            {totalTimeFormatted}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {timeSpentData.map((item, index) => {
          return (
            <div key={index}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: colors[index % colors.length] }}
                  ></div>
                  <span className="font-medium text-gray-900 text-sm">
                    {item.subject}
                  </span>
                </div>
                <span className="text-xs font-semibold text-gray-700">
                  {item.time}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: `${item.percentage}%`,
                    backgroundColor: colors[index % colors.length],
                  }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {item.percentage.toFixed(1)}% of total time
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center">
            <p className="text-xl font-bold text-gray-900">
              {timeSpentData.length}
            </p>
            <p className="text-xs text-gray-600">
              Subjects
            </p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-gray-900">
              {totalHours}
            </p>
            <p className="text-xs text-gray-600">
              Total Hours
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

