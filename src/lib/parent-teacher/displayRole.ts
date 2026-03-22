/**
 * Maps API / stored user.role values to the display strings used by DashboardLayout + Sidebar.
 * Handles casing differences (e.g. "teacher" vs "TEACHER") and minor variants.
 */
export type DashboardRoleDisplay = "Parent" | "Teacher" | "Head Teacher" | "User";

export function normalizeStoredUserRole(raw: string | undefined | null): DashboardRoleDisplay {
  const r = (raw ?? "")
    .toString()
    .trim()
    .toUpperCase()
    .replace(/[\s_-]+/g, "");

  if (r === "PARENT") return "Parent";
  if (r === "TEACHER") return "Teacher";
  if (r === "HEADTEACHER") return "Head Teacher";
  return "User";
}

/**
 * Read role from localStorage user object (client-only). Returns "User" if missing/invalid.
 */
export function readUserRoleFromLocalStorage(): DashboardRoleDisplay {
  if (typeof window === "undefined") return "User";
  try {
    const userStr = localStorage.getItem("user");
    if (!userStr) return "User";
    const user = JSON.parse(userStr) as { role?: string };
    return normalizeStoredUserRole(user.role);
  } catch {
    return "User";
  }
}

/**
 * Resolves which dashboard nav to show. Head teachers share URLs under `/teacher/...` for some pages,
 * so we keep "Head Teacher" from storage when set, and only use pathname to recover Teacher when
 * storage role is wrong/missing (e.g. casing mismatch before normalization).
 */
export function resolveSidebarRole(
  displayRole: DashboardRoleDisplay,
  pathname: string | null
): DashboardRoleDisplay {
  if (pathname?.startsWith("/parent-teacher/dashboard/headteacher")) {
    return "Head Teacher";
  }
  if (displayRole === "Head Teacher") {
    return "Head Teacher";
  }
  if (pathname?.startsWith("/parent-teacher/dashboard/teacher")) {
    return "Teacher";
  }
  return displayRole;
}
