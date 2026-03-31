import type { TeacherLesson, TeacherSubject } from "@/lib/api/parent-teacher/teacher";

export function normalizeGradeForMatch(grade: string | undefined | null): string {
  if (grade == null) return "";
  let s = grade.toString().normalize("NFKC").trim();
  s = s.replace(/[\u200B-\u200D\uFEFF]/g, "");
  return s.toUpperCase().replace(/\s+/g, " ");
}

/** e.g. "Grade 2", "GRADE 2", "G2" → 2 */
function extractGradeLevelNumber(grade: string | undefined | null): number | null {
  const n = normalizeGradeForMatch(grade);
  if (!n) return null;
  const gradeWord = n.match(/\bGRADE\s*(\d+)\b/);
  if (gradeWord) return parseInt(gradeWord[1], 10);
  const gShort = n.match(/\bG\s*(\d+)\b/);
  if (gShort) return parseInt(gShort[1], 10);
  const lone = n.match(/^(\d+)$/);
  if (lone) return parseInt(lone[1], 10);
  return null;
}

export function gradesMatch(lessonGrade: string | undefined | null, studentGrade: string | undefined | null): boolean {
  const a = normalizeGradeForMatch(lessonGrade);
  const b = normalizeGradeForMatch(studentGrade);
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.replace(/\s/g, "") === b.replace(/\s/g, "")) return true;
  const na = extractGradeLevelNumber(lessonGrade);
  const nb = extractGradeLevelNumber(studentGrade);
  if (na !== null && nb !== null && na === nb) return true;
  return false;
}

export function isApprovedStudentStatus(status: string | undefined | null): boolean {
  return (status ?? "").toUpperCase() === "APPROVED";
}

export function lessonHasAssignableGrade(grade: string | undefined | null): boolean {
  const g = normalizeGradeForMatch(grade);
  if (!g) return false;
  if (g.includes("UNASSIGNED")) return false;
  return true;
}

export function resolveLessonGrade(lesson: TeacherLesson, subject?: TeacherSubject): string {
  const fromLesson = [
    lesson.grade,
    lesson.subject_grade,
    lesson.topic_grade,
    lesson.period_grade,
    lesson.subject_detail?.grade,
  ].find((g) => typeof g === "string" && g.trim().length > 0);
  if (fromLesson) return fromLesson.trim();
  const sg = subject?.grade;
  if (typeof sg === "string" && sg.trim().length > 0) return sg.trim();
  return "Unassigned Grade";
}
