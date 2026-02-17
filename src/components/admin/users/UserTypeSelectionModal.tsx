"use client";

import { Icon } from "@iconify/react";

interface UserTypeSelectionModalProps {
  onSelect: (type: "Student" | "Teacher" | "Content Manager") => void;
  onClose: () => void;
}

const userTypes = [
  {
    type: "Student" as const,
    icon: "solar:book-bookmark-bold",
    color: "emerald",
    description: "Add a new student to the platform"
  },
  {
    type: "Teacher" as const,
    icon: "solar:users-group-rounded-bold",
    color: "purple",
    description: "Add a new teacher account"
  },
  {
    type: "Content Manager" as const,
    icon: "solar:user-bold",
    color: "indigo",
    description: "Add a content creator or validator"
  }
];

export default function UserTypeSelectionModal({ onSelect, onClose }: UserTypeSelectionModalProps) {
  return (
    <>
      <div
        className="fixed inset-0 z-[55] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full pointer-events-auto border border-gray-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10 rounded-t-2xl">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Select User Type</h2>
              <p className="text-sm text-gray-600 mt-1">Choose the type of user you want to add</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close modal"
            >
              <Icon icon="solar:close-circle-bold" className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {userTypes.map((userType) => {
                const colorConfig: Record<string, {
                  bg: string;
                  border: string;
                  hover: string;
                  text: string;
                  icon: string;
                }> = {
                  emerald: {
                    bg: "bg-emerald-50",
                    border: "border-emerald-200",
                    hover: "hover:bg-emerald-100",
                    text: "text-emerald-700",
                    icon: "text-emerald-600"
                  },
                  blue: {
                    bg: "bg-blue-50",
                    border: "border-blue-200",
                    hover: "hover:bg-blue-100",
                    text: "text-blue-700",
                    icon: "text-blue-600"
                  },
                  purple: {
                    bg: "bg-purple-50",
                    border: "border-purple-200",
                    hover: "hover:bg-purple-100",
                    text: "text-purple-700",
                    icon: "text-purple-600"
                  },
                  indigo: {
                    bg: "bg-indigo-50",
                    border: "border-indigo-200",
                    hover: "hover:bg-indigo-100",
                    text: "text-indigo-700",
                    icon: "text-indigo-600"
                  },
                  red: {
                    bg: "bg-red-50",
                    border: "border-red-200",
                    hover: "hover:bg-red-100",
                    text: "text-red-700",
                    icon: "text-red-600"
                  }
                };

                const colors = colorConfig[userType.color] || colorConfig.purple;

                return (
                  <button
                    key={userType.type}
                    onClick={() => onSelect(userType.type)}
                    className={`p-6 rounded-xl border-2 transition-all duration-200 text-left group ${colors.bg} ${colors.border} ${colors.hover} ${colors.text}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg bg-white/50 group-hover:bg-white transition-colors`}>
                        <Icon icon={userType.icon} className={`w-8 h-8 ${colors.icon}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{userType.type}</h3>
                        <p className="text-sm text-gray-600">{userType.description}</p>
                      </div>
                      <Icon 
                        icon="solar:alt-arrow-right-bold" 
                        className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0 mt-1"
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end rounded-b-2xl">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
