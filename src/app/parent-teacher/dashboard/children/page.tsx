"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/parent-teacher/layout/DashboardLayout";
import LinkChildModal from "@/components/parent-teacher/dashboard/LinkChildModal";
import { getMyChildren, MyChild, linkChild, LinkChildResponse } from "@/lib/api/parent-teacher/parent";
import { showErrorToast, showSuccessToast } from "@/lib/toast";

export default function MyChildrenPage() {
  const [children, setChildren] = useState<MyChild[]>([]);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        setIsLoading(true);
        const data = await getMyChildren();
        setChildren(data);
      } catch (error) {
        console.error("Error fetching children:", error);
        showErrorToast("Failed to load children. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchChildren();
  }, []);

  const handleLinkChild = async (childData: { student_id: number; student_email: string; student_phone: string }) => {
    try {
      setIsLoading(true);
      const response: LinkChildResponse = await linkChild(childData);
      
      // Map the API response to our local MyChild interface
      const newChild: MyChild = {
        id: response.id,
        name: response.name,
        grade: response.grade,
        school: response.school,
        student_id: response.student_id,
        created_at: response.created_at,
      };
      
      setChildren((prev) => [...prev, newChild]);
      setIsLinkModalOpen(false);
      showSuccessToast("Child linked successfully!");
      
      // Refresh children list to get updated data
      const data = await getMyChildren();
      setChildren(data);
    } catch (error: any) {
      console.error("Error linking child:", error);
      showErrorToast(error?.message || "Failed to link child. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout onLinkChild={() => setIsLinkModalOpen(true)}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading children...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout onLinkChild={() => setIsLinkModalOpen(true)}>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-col sm:flex-row gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Children</h1>
            <p className="text-gray-600 mt-1">
              Manage and link your children to your account
            </p>
          </div>
          <button
            onClick={() => setIsLinkModalOpen(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-white shadow hover:bg-emerald-700 transition-colors sm:hidden"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Link Child
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="space-y-1">
              <p className="text-sm text-gray-600">
                You can link multiple children to your account and keep track of
                their learning journey.
              </p>
              <p className="text-xs text-gray-500">
                Linked children:{" "}
                <span className="font-semibold text-gray-900">
                  {children.length}
                </span>
              </p>
            </div>
            <button
              onClick={() => setIsLinkModalOpen(true)}
              className="hidden sm:inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-white shadow hover:bg-emerald-700 transition-colors"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Link New Child
            </button>
          </div>

          {children.length > 0 ? (
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <div className="hidden md:grid grid-cols-4 gap-4 bg-gray-50 px-4 py-3 text-xs font-medium text-gray-500">
                <div>Child</div>
                <div>Grade</div>
                <div>School</div>
                <div className="text-right">Student ID</div>
              </div>

              <div className="divide-y divide-gray-200">
                {children.map((child) => (
                  <div
                    key={child.id}
                    className="px-4 py-3 flex flex-col gap-2 md:grid md:grid-cols-4 md:items-center md:gap-4 hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {child.name}
                      </p>
                      <p className="text-xs text-gray-500 md:hidden">
                        {child.school}
                      </p>
                    </div>
                    <div className="text-sm text-gray-700">{child.grade}</div>
                    <div className="hidden md:block text-sm text-gray-700">
                      {child.school}
                    </div>
                    <div className="text-sm text-gray-700 md:text-right">
                      <span className={child.student_id ? "" : "text-gray-400 italic"}>
                        {child.student_id || "N/A"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center">
              <p className="text-gray-600 mb-3 text-sm">
                You have not linked any children yet.
              </p>
              <button
                onClick={() => setIsLinkModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-white shadow hover:bg-emerald-700 transition-colors text-sm font-medium"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Link Your First Child
              </button>
            </div>
          )}
        </div>
      </div>

      <LinkChildModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        onLink={handleLinkChild}
      />
    </DashboardLayout>
  );
}


