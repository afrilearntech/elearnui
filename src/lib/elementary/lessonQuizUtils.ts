import type { KidsAssessment } from '@/lib/api/dashboard';

export function isAssessmentLocked(assessmentId: number, allAssessments: KidsAssessment[]): boolean {
  if (typeof window === 'undefined') return false;

  const assessment = allAssessments.find((a) => a.id === assessmentId);
  if (!assessment || assessment.type !== 'lesson' || !assessment.lesson_id) {
    return false;
  }

  const lessonAssessments = allAssessments
    .filter((a) => a.type === 'lesson' && a.lesson_id)
    .sort((a, b) => (a.lesson_id || 0) - (b.lesson_id || 0));

  const currentIndex = lessonAssessments.findIndex((a) => a.id === assessmentId);
  if (currentIndex === 0) {
    return false;
  }

  const previousAssessment = lessonAssessments[currentIndex - 1];
  const previousCompleted = localStorage.getItem(`assessment_completed_${previousAssessment.id}`) === 'true';

  return !previousCompleted;
}

export function findAssessmentForLesson(
  lessonContentId: number,
  assessments: KidsAssessment[]
): KidsAssessment | undefined {
  return assessments.find(
    (a) => a.type?.toLowerCase() === 'lesson' && a.lesson_id === lessonContentId
  );
}
