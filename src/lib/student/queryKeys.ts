/**
 * TanStack Query keys for the student (elementary) app.
 */
export const studentQueryKeys = {
  elementaryDashboard: ["student", "elementary", "dashboard"] as const,
  subjectsLessons: ["student", "elementary", "subjects-lessons"] as const,
  userProfile: ["student", "user-profile"] as const,
  lessonDetail: (lessonId: string) => ["student", "lesson", lessonId] as const,
  kidsAssessments: ["student", "kids-assessments"] as const,
  kidsStories: ["student", "kids-stories"] as const,
  kidsStoryDetail: (storyId: number) => ["student", "kids-story-detail", storyId] as const,
  assignmentDetail: (assignmentId: string) => ["student", "assignment", assignmentId] as const,
};
