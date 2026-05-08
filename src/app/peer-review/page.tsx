'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '@iconify/react';
import ElementaryNavbar from '@/components/elementary/ElementaryNavbar';
import ElementarySidebar from '@/components/elementary/ElementarySidebar';
import StudentLoadingScreen from '@/components/ui/StudentLoadingScreen';
import {
  getKidsAssessments,
  getKidsPeerSolutions,
  KidsAssessment,
} from '@/lib/api/dashboard';
import { ApiClientError } from '@/lib/api/client';
import { formatErrorMessage, showErrorToast } from '@/lib/toast';
import { useStudentAuthReady } from '@/hooks/student/useStudentAuthReady';
import { studentQueryKeys } from '@/lib/student/queryKeys';

type Scope = 'lesson' | 'general';

function resolveScope(assessment: KidsAssessment): Scope {
  const type = String(assessment.type || '').toLowerCase();
  return type.includes('lesson') || Boolean(assessment.lesson_id) ? 'lesson' : 'general';
}

export default function PeerReviewPage() {
  const authReady = useStudentAuthReady();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<number | null>(null);

  const {
    data: assessmentsData,
    isPending: isAssessmentsPending,
    isError: isAssessmentsError,
    error: assessmentsError,
  } = useQuery({
    queryKey: studentQueryKeys.kidsAssessments,
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Missing auth token');
      return getKidsAssessments(token);
    },
    enabled: authReady,
  });

  const eligibleAssessments = useMemo(() => {
    return (assessmentsData?.assessments || []).filter((assessment) => assessment.has_questions !== false);
  }, [assessmentsData]);

  const selectedAssessment = useMemo(
    () => eligibleAssessments.find((assessment) => assessment.id === selectedAssessmentId) || null,
    [eligibleAssessments, selectedAssessmentId],
  );
  const selectedScope = selectedAssessment ? resolveScope(selectedAssessment) : null;

  useEffect(() => {
    if (!selectedAssessmentId && eligibleAssessments.length > 0) {
      setSelectedAssessmentId(eligibleAssessments[0].id);
    }
  }, [eligibleAssessments, selectedAssessmentId]);

  const {
    data: peerData,
    isPending: isPeerPending,
    isError: isPeerError,
    error: peerError,
  } = useQuery({
    queryKey:
      selectedAssessment && selectedScope
        ? studentQueryKeys.kidsPeerSolutions(selectedScope, selectedAssessment.id)
        : ['student', 'kids-peer-solutions', 'idle'],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      if (!token || !selectedAssessment || !selectedScope) {
        throw new Error('Invalid peer review request');
      }
      return getKidsPeerSolutions(
        token,
        selectedScope === 'general'
          ? { general_id: selectedAssessment.id }
          : { lesson_id: selectedAssessment.id },
      );
    },
    enabled: authReady && Boolean(selectedAssessment && selectedScope),
  });

  useEffect(() => {
    if (!isAssessmentsError) return;
    const message =
      assessmentsError instanceof ApiClientError
        ? assessmentsError.message
        : assessmentsError instanceof Error
        ? assessmentsError.message
        : 'Failed to load assessments.';
    showErrorToast(formatErrorMessage(message));
  }, [assessmentsError, isAssessmentsError]);

  useEffect(() => {
    if (!isPeerError) return;
    const message =
      peerError instanceof ApiClientError
        ? peerError.message
        : peerError instanceof Error
        ? peerError.message
        : 'Failed to load peer solutions.';
    showErrorToast(formatErrorMessage(message));
  }, [peerError, isPeerError]);

  return (
    <div className="min-h-screen">
      <ElementaryNavbar onMenuToggle={() => setIsMobileMenuOpen((prev) => !prev)} />

      <div className="flex">
        <ElementarySidebar
          activeItem="peer-review"
          isMobileMenuOpen={isMobileMenuOpen}
          onMobileMenuClose={() => setIsMobileMenuOpen(false)}
        />

        <main className="flex-1 overflow-x-hidden bg-linear-to-br from-[#DBEAFE] via-[#F0FDF4] to-[#CFFAFE] sm:pl-[280px] lg:pl-[320px]">
          {!authReady || isAssessmentsPending ? (
            <StudentLoadingScreen
              title="Loading peer reviews..."
              subtitle="Preparing classmates' solutions for your review."
            />
          ) : (
            <div className="p-4 lg:p-8 max-w-full">
              <div className="sm:mx-8 mx-4 mb-6 rounded-3xl border border-white/70 bg-white/75 p-6 shadow-lg">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
                  <span>🧠</span> Peer Review
                </div>
                <h1
                  className="text-2xl sm:text-3xl font-bold text-[#6D28D9]"
                  style={{ fontFamily: 'Andika, sans-serif' }}>
                  Learn From Classmates
                </h1>
                <p className="mt-2 text-sm sm:text-base text-gray-600" style={{ fontFamily: 'Andika, sans-serif' }}>
                  Select an assessment to review how other students solved it, including attachments.
                </p>
              </div>

              <div className="sm:mx-8 mx-4 mb-6 rounded-2xl border border-white/70 bg-white/85 p-4 shadow">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Choose Assessment</label>
                <select
                  value={selectedAssessmentId ?? ''}
                  onChange={(e) => setSelectedAssessmentId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200">
                  <option value="">Select assessment</option>
                  {eligibleAssessments.map((assessment) => (
                    <option key={assessment.id} value={assessment.id}>
                      {assessment.title} ({resolveScope(assessment) === 'lesson' ? 'Lesson' : 'General'})
                    </option>
                  ))}
                </select>
              </div>

              {!selectedAssessment ? (
                <div className="sm:mx-8 mx-4 rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
                  <Icon icon="mdi:account-group-outline" width={44} height={44} className="mx-auto text-gray-300" />
                  <p className="mt-3 text-sm text-gray-600" style={{ fontFamily: 'Andika, sans-serif' }}>
                    Pick an assessment to begin peer review.
                  </p>
                </div>
              ) : isPeerPending ? (
                <StudentLoadingScreen
                  title="Loading peer solutions..."
                  subtitle="Gathering classmates' responses and files."
                />
              ) : (
                <div className="sm:mx-8 mx-4 space-y-4">
                  <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
                    <p className="text-xs font-semibold text-violet-700 uppercase tracking-wide">Assessment</p>
                    <p className="mt-1 text-lg font-bold text-violet-900" style={{ fontFamily: 'Andika, sans-serif' }}>
                      {peerData?.assessment.title || selectedAssessment.title}
                    </p>
                    <p className="text-sm text-violet-800">{peerData?.assessment.type || selectedAssessment.type}</p>
                  </div>

                  {peerData?.solutions?.length ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {peerData.solutions.map((solution, index) => (
                        <article
                          key={`${solution.peer_label}-${solution.submitted_at}-${index}`}
                          className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                          <div className="flex items-center justify-between gap-3">
                            <h2 className="text-base font-semibold text-gray-900" style={{ fontFamily: 'Andika, sans-serif' }}>
                              {solution.peer_label}
                            </h2>
                            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                              Submitted {new Date(solution.submitted_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="mt-3 text-sm text-gray-700 whitespace-pre-wrap">{solution.solution || 'No text solution.'}</p>
                          {solution.attachment ? (
                            <a
                              href={solution.attachment}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100">
                              <Icon icon="mdi:paperclip" width={16} height={16} />
                              View attachment
                            </a>
                          ) : (
                            <p className="mt-4 text-xs text-gray-500">No attachment provided.</p>
                          )}
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
                      <Icon icon="mdi:file-document-outline" width={44} height={44} className="mx-auto text-gray-300" />
                      <p className="mt-3 text-sm text-gray-600" style={{ fontFamily: 'Andika, sans-serif' }}>
                        No peer solutions available yet for this assessment.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

