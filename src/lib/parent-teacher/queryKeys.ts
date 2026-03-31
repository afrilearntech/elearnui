/**
 * Stable keys for TanStack Query in the parent/teacher portal.
 * Use these with queryClient.invalidateQueries / invalidateQueries.
 */
export const ptQueryKeys = {
  teacherDashboard: ["parent-teacher", "teacher", "dashboard"] as const,
  headTeacherDashboard: ["parent-teacher", "headteacher", "dashboard"] as const,
  /** Lessons + subjects + students bundle (role resolved inside queryFn). */
  lessonsBundle: ["parent-teacher", "teacher", "lessons-bundle"] as const,
  headTeacherStudents: ["parent-teacher", "headteacher", "students"] as const,
  headTeacherTeachers: ["parent-teacher", "headteacher", "teachers"] as const,
  headTeacherLeaderboard: ["parent-teacher", "headteacher", "leaderboard"] as const,
  /** Teacher "My Class" student roster (`getTeacherStudents`). */
  teacherClassStudents: ["parent-teacher", "teacher", "class-students"] as const,
  /** Parent linked-children list (`getMyChildren`). */
  parentMyChildren: ["parent-teacher", "parent", "my-children"] as const,
  /** Admin student directory (`getAdminStudents`). */
  adminStudents: ["admin", "students"] as const,
};
