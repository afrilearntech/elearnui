"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/parent-teacher/layout/DashboardLayout";
import LinkChildModal from "@/components/parent-teacher/dashboard/LinkChildModal";
import GradesOverview from "@/components/parent-teacher/dashboard/GradesOverview";
import AssessmentTracking from "@/components/parent-teacher/dashboard/AssessmentTracking";
import SubmissionsView from "@/components/parent-teacher/dashboard/SubmissionsView";
import TimeSpentAnalytics from "@/components/parent-teacher/dashboard/TimeSpentAnalytics";
import { getParentDashboard, DashboardChild, GradeOverview, linkChild, LinkChildResponse } from "@/lib/api/parent-teacher/parent";
import { showErrorToast, showSuccessToast } from "@/lib/toast";

interface Child {
  id: string;
  name: string;
  grade: string;
  school: string;
  studentId: string;
  studentDbId: number;
}

export default function DashboardPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [gradesOverview, setGradesOverview] = useState<GradeOverview[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const data = await getParentDashboard();
        
        const mappedChildren: Child[] = data.children.map((child) => ({
          id: child.student_db_id.toString(),
          name: child.name,
          grade: child.grade,
          school: child.school,
          studentId: child.student_id || `STU${child.student_db_id}`,
          studentDbId: child.student_db_id,
        }));

        setChildren(mappedChildren);
        setGradesOverview(data.grades_overview);
        
        if (mappedChildren.length > 0) {
          setSelectedChild(mappedChildren[0]);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        showErrorToast("Failed to load dashboard data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleLinkChild = async (childData: { student_id: number; student_email: string; student_phone: string }) => {
    try {
      setIsLoading(true);
      const response: LinkChildResponse = await linkChild(childData);
      
      // Map the API response to our local Child interface
      const newChild: Child = {
        id: response.id.toString(),
        name: response.name,
        grade: response.grade,
        school: response.school,
        studentId: response.student_id || `STU${response.id}`,
        studentDbId: response.id,
      };
      
      setChildren((prev) => [...prev, newChild]);
      setSelectedChild(newChild);
      setIsLinkModalOpen(false);
      showSuccessToast("Child linked successfully!");
      
      // Refresh dashboard data to get updated children list
      const data = await getParentDashboard();
      const mappedChildren: Child[] = data.children.map((child) => ({
        id: child.student_db_id.toString(),
        name: child.name,
        grade: child.grade,
        school: child.school,
        studentId: child.student_id || `STU${child.student_db_id}`,
        studentDbId: child.student_db_id,
      }));
      setChildren(mappedChildren);
      setGradesOverview(data.grades_overview);
    } catch (error: any) {
      console.error("Error linking child:", error);
      showErrorToast(error?.message || "Failed to link child. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getChildGrades = (childName: string) => {
    return gradesOverview.filter((grade) => grade.child_name === childName);
  };

  if (isLoading) {
    return (
      <DashboardLayout onLinkChild={() => setIsLinkModalOpen(true)}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
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
            <p className="text-gray-600 mt-1">Monitor your children's academic progress</p>
          </div>
          <button
            onClick={() => setIsLinkModalOpen(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-white shadow hover:bg-emerald-700 transition-colors sm:hidden"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Link Child
          </button>
        </div>

        {children.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {children.map((child) => (
              <button
                key={child.id}
                onClick={() => setSelectedChild(child)}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  selectedChild?.id === child.id
                    ? "border-emerald-500 bg-emerald-50 shadow-sm"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">
                      {child.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {child.grade}
                    </p>
                  </div>
                  {selectedChild?.id === child.id && (
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {child.school}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  ID: {child.studentId}
                </p>
              </button>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
            <p className="text-gray-600 mb-4">
              No children linked yet. Please link a child to view their progress.
            </p>
            <button
              onClick={() => setIsLinkModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-white shadow hover:bg-emerald-700 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Link Your First Child
            </button>
          </div>
        )}

        {selectedChild ? (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                {selectedChild.name}'s Progress
              </h2>
              <p className="text-sm text-gray-600">
                {selectedChild.grade} • {selectedChild.school}
              </p>
            </div>

            <GradesOverview 
              childId={selectedChild.id} 
              childName={selectedChild.name}
              grades={getChildGrades(selectedChild.name)}
            />

            <AssessmentTracking childId={selectedChild.id} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SubmissionsView childId={selectedChild.id} />
              <TimeSpentAnalytics childId={selectedChild.id} />
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
            <p className="text-gray-600 mb-4">
              No child selected. Please link a child to view their progress.
            </p>
            <button
              onClick={() => setIsLinkModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-white shadow hover:bg-emerald-700 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Link Your First Child
            </button>
          </div>
        )}
      </div>

      <LinkChildModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        onLink={handleLinkChild}
      />
    </DashboardLayout>
  );
}

