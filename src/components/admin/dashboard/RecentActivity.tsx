"use client";

import { Icon } from "@iconify/react";

interface Activity {
  type: string;
  description: string;
  time: string;
}

const activities: Activity[] = [
  {
    type: "New School Added",
    description:
      "Join our monthly seminar to learn key skills and ways you can get good job opportunities and stand out",
    time: "2hrs ago",
  },
  {
    type: "Content Approved",
    description:
      "Join our monthly seminar to learn key skills and ways you can get good job opportunities and stand out",
    time: "2hrs ago",
  },
];

export default function RecentActivity() {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Recent Activity Feed
      </h2>
      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div key={index} className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[#059669] flex items-center justify-center flex-shrink-0">
              <Icon
                icon="solar:pen-bold"
                className="w-5 h-5 text-white"
              />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 mb-1">{activity.type}</p>
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                {activity.description}
              </p>
              <p className="text-xs text-gray-500">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

