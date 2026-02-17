"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { getTeachers, TeacherRecord } from "@/lib/api/content/teachers";
import { moderateContent, ModerateAction } from "@/lib/api/content/lessons";

type TeacherRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  school: number;
  status: "APPROVED" | "PENDING" | "REJECTED" | "VALIDATED";
  created_at: string;
  updated_at: string;
  moderation_comment: string | null;
};

const statusMap: Record<string, TeacherRow["status"]> = {
  APPROVED: "VALIDATED",
  VALIDATED: "VALIDATED",
  PENDING: "PENDING",
  REJECTED: "REJECTED",
  REQUEST_CHANGES: "PENDING",
  CHANGES_REQUESTED: "PENDING",
  REQUEST_REVIEW: "PENDING",
  REVIEW_REQUESTED: "PENDING",
  DRAFT: "PENDING",
};

function normalizeStatus(value?: string | null): TeacherRow["status"] {
  if (!value) return "PENDING";
  const trimmed = String(value).trim();
  if (!trimmed) return "PENDING";
  const upper = trimmed.toUpperCase();
  if (statusMap[upper]) {
    return statusMap[upper];
  }
  if (["APPROVED", "VALIDATED", "REJECTED", "PENDING"].includes(upper)) {
    return upper === "APPROVED" ? "VALIDATED" : (upper as TeacherRow["status"]);
  }
  return "PENDING";
}

function mapTeacher(record: TeacherRecord): TeacherRow {
  const status = normalizeStatus(record.status);
  return {
    id: record.id.toString(),
    name: record.profile?.name || "Unknown",
    email: record.profile?.email || "N/A",
    phone: record.profile?.phone || "N/A",
    school: record.school,
    status,
    created_at: record.created_at,
    updated_at: record.updated_at,
    moderation_comment: record.moderation_comment ?? null,
  };
}

async function notifyError(message: string) {
  if (typeof window !== "undefined") {
    const { showErrorToast } = await import("@/lib/toast");
    showErrorToast(message);
  } else {
    console.error(message);
  }
}

async function notifySuccess(message: string) {
  if (typeof window !== "undefined") {
    const { showSuccessToast } = await import("@/lib/toast");
    showSuccessToast(message);
  } else {
    console.log(message);
  }
}

export default function TeachersPage() {
  const router = useRouter();
  const [teachers, setTeachers] = React.useState<TeacherRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("All");
  const [page, setPage] = React.useState(1);
  const pageSize = 10;
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [modalTeacher, setModalTeacher] = React.useState<TeacherRow | null>(null);
  const [moderationLoadingAction, setModerationLoadingAction] = React.useState<ModerateAction | null>(null);
  const isModerationProcessing = moderationLoadingAction !== null;

  React.useEffect(() => {
    let isMounted = true;

    async function fetchTeachers() {
      try {
        setIsLoading(true);
        setLoadError(null);

        if (typeof window === "undefined") return;

        const token = localStorage.getItem("auth_token");
        if (!token) {
          setLoadError("Missing authentication token. Please sign in again.");
          return;
        }

        const data = await getTeachers(token);
        if (!isMounted) return;

        setTeachers(data.map(mapTeacher));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to load teachers.";
        setLoadError(message);
        await notifyError(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchTeachers();

    return () => {
      isMounted = false;
    };
  }, []);

  const renderStatusLabel = (state: TeacherRow["status"]) => {
    if (state === "VALIDATED" || state === "APPROVED") return "Validated";
    if (state === "REJECTED") return "Rejected";
    return "Pending";
  };

  const getStatusBadge = (state: TeacherRow["status"]) => {
    switch (state) {
      case "VALIDATED":
      case "APPROVED":
        return "bg-emerald-100 text-emerald-700";
      case "REJECTED":
        return "bg-rose-100 text-rose-700";
      case "PENDING":
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-amber-100 text-amber-700";
    }
  };

  const statusOptions = React.useMemo(() => {
    const options = new Set<string>();
    teachers.forEach((teacher) => {
      const statusLabel = renderStatusLabel(teacher.status);
      if (statusLabel) {
        options.add(statusLabel);
      }
    });
    return Array.from(options);
  }, [teachers]);

  const filtered = React.useMemo(() => {
    return teachers.filter((teacher) => {
      const searchTerm = search.toLowerCase();
      const matchesSearch =
        search.trim().length === 0 ||
        teacher.name.toLowerCase().includes(searchTerm) ||
        teacher.email.toLowerCase().includes(searchTerm) ||
        teacher.phone.includes(searchTerm) ||
        teacher.id.includes(searchTerm) ||
        teacher.school.toString().includes(searchTerm);
      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Approved" && (teacher.status === "APPROVED" || teacher.status === "VALIDATED")) ||
        (statusFilter === "Pending" && teacher.status === "PENDING") ||
        (statusFilter === "Rejected" && teacher.status === "REJECTED");
      return matchesSearch && matchesStatus;
    });
  }, [teachers, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);

  React.useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const handleReview = React.useCallback((teacher: TeacherRow) => {
    setIsModalOpen(true);
    setModalTeacher(teacher);
  }, []);

  const closeModal = React.useCallback(() => {
    setIsModalOpen(false);
    setModalTeacher(null);
  }, []);

  const updateTeacherStatusInState = React.useCallback(
    (teacherId: number, status: TeacherRow["status"], moderationComment?: string | null) => {
      const teacherIdString = String(teacherId);
      setTeachers((prev) =>
        prev.map((teacher) =>
          teacher.id === teacherIdString ? { ...teacher, status, moderation_comment: moderationComment ?? teacher.moderation_comment } : teacher,
        ),
      );
      setModalTeacher((prev) => {
        if (!prev) return prev;
        if (prev.id === teacherIdString) {
          return { ...prev, status, moderation_comment: moderationComment ?? prev.moderation_comment };
        }
        return prev;
      });
    },
    [],
  );

  const submitModeration = React.useCallback(
    async (action: ModerateAction, comment?: string) => {
      if (!modalTeacher) return;

      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      if (!token) {
        await notifyError("Authentication token is missing. Please sign in again.");
        return;
      }

      try {
        setModerationLoadingAction(action);
        const response = await moderateContent(
          {
            model: "teacher",
            id: parseInt(modalTeacher.id, 10),
            action,
            moderation_comment: comment,
          },
          token,
        );

        const newStatus = normalizeStatus(response.status);
        updateTeacherStatusInState(parseInt(modalTeacher.id, 10), newStatus, response.moderation_comment ?? comment ?? null);

        if (action === "approve") {
          await notifySuccess("Teacher approved successfully!");
        } else if (action === "reject") {
          await notifySuccess("Teacher rejected successfully!");
        }

        setTimeout(() => {
          closeModal();
        }, 1000);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to submit moderation action.";
        await notifyError(message);
      } finally {
        setModerationLoadingAction(null);
      }
    },
    [modalTeacher, updateTeacherStatusInState, closeModal],
  );

  const handleModerationAction = React.useCallback(
    (action: ModerateAction) => {
      submitModeration(action);
    },
    [submitModeration],
  );

  const showModerationActions = modalTeacher && modalTeacher.status === "PENDING";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Teachers</h1>
        <p className="mt-1 text-sm text-gray-500">Manage and review teacher registrations</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 pl-10 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <svg
              className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Validated</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="hidden md:block rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="grid grid-cols-12 bg-[#F1F7E4] px-5 py-4 text-sm font-semibold text-gray-800">
          <div className="col-span-3">Teacher Name</div>
          <div className="col-span-2">Email</div>
          <div className="col-span-2">Phone</div>
          <div className="col-span-1">School</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-3 text-right">Actions</div>
        </div>
        {isLoading ? (
          <div className="px-5 py-8 text-center text-sm text-gray-600">Loading teachers...</div>
        ) : loadError ? (
          <div className="px-5 py-8 text-center text-sm text-rose-600">{loadError}</div>
        ) : paged.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-gray-600">No teachers match your filters.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {paged.map((teacher) => (
              <div key={teacher.id} className="grid grid-cols-12 items-center px-5 py-4 text-sm hover:bg-gray-50">
                <div className="col-span-3 text-gray-900 font-medium">{teacher.name}</div>
                <div className="col-span-2 text-gray-700">{teacher.email}</div>
                <div className="col-span-2 text-gray-700">{teacher.phone}</div>
                <div className="col-span-1 text-gray-700">#{teacher.school}</div>
                <div className="col-span-1">
                  <span className={`inline-flex max-w-[120px] justify-center rounded-lg px-2 py-1 text-[11px] font-semibold text-center leading-tight tracking-wide whitespace-nowrap ${getStatusBadge(teacher.status)}`}>
                    {renderStatusLabel(teacher.status)}
                  </span>
                </div>
                <div className="col-span-3 flex items-center justify-end">
                  <button
                    className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
                    onClick={() => handleReview(teacher)}
                  >
                    Review
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4 md:hidden">
        {isLoading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-600">Loading teachers...</div>
        ) : loadError ? (
          <div className="rounded-xl border border-rose-200 bg-white p-6 text-center text-sm text-rose-600">{loadError}</div>
        ) : paged.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-600">No teachers match your filters.</div>
        ) : (
          paged.map((teacher) => (
            <div key={teacher.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-gray-900">{teacher.name}</p>
                  <p className="text-xs text-gray-500">{teacher.email}</p>
                </div>
                <span className={`inline-flex max-w-[140px] justify-center rounded-lg px-3 py-1 text-[11px] font-semibold text-center leading-tight tracking-wide whitespace-nowrap ${getStatusBadge(teacher.status)}`}>
                  {renderStatusLabel(teacher.status)}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-700">
                <div>
                  <p className="text-xs uppercase text-gray-400">Phone</p>
                  <p>{teacher.phone}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-400">School</p>
                  <p>#{teacher.school}</p>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  className="rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
                  onClick={() => handleReview(teacher)}
                >
                  Review
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className={`rounded-md border px-3 py-1.5 text-sm ${currentPage === 1 ? "border-gray-200 text-gray-300" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
        >
          &lt;
        </button>
        {Array.from({ length: Math.min(totalPages, 10) }).map((_, i) => {
          const n = i + 1;
          const active = n === currentPage;
          if (totalPages > 10 && i === 8) {
            return (
              <React.Fragment key="ellipsis">
                <span className="px-2 text-gray-500">...</span>
                <button
                  onClick={() => setPage(totalPages)}
                  className={`rounded-md border px-3 py-1.5 text-sm ${totalPages === currentPage ? "border-emerald-600 bg-emerald-600 text-white" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
                >
                  {totalPages}
                </button>
              </React.Fragment>
            );
          }
          if (totalPages > 10 && i > 8) return null;
          return (
            <button
              key={n}
              onClick={() => setPage(n)}
              className={`rounded-md border px-3 py-1.5 text-sm ${
                active ? "border-emerald-600 bg-emerald-600 text-white" : "border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {n}
            </button>
          );
        })}
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className={`rounded-md border px-3 py-1.5 text-sm ${currentPage === totalPages ? "border-gray-200 text-gray-300" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
        >
          &gt;
        </button>
      </div>

      {isModalOpen ? (
        <div
          className="fixed inset-0 z-120 flex items-start justify-center overflow-y-auto bg-black/60 py-10 px-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="relative w-full max-w-4xl rounded-xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <p className="text-sm font-semibold text-emerald-600 uppercase">Teacher Details</p>
                <p className="text-xs text-gray-500">Review all information before approving or requesting revisions</p>
              </div>
              <button
                aria-label="Close"
                onClick={closeModal}
                className="rounded-full border border-gray-200 p-2 text-gray-500 hover:bg-gray-50"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="max-h-[80vh] overflow-y-auto p-6">
              {modalTeacher ? (
                <>
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-semibold text-gray-900">{modalTeacher.name}</h2>
                      <div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-700">
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-3 py-1 text-emerald-700">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                            <polyline points="22,6 12,13 2,6" />
                          </svg>
                          {modalTeacher.email}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-3 py-1 text-sky-700">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                          </svg>
                          {modalTeacher.phone}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-3 py-1 text-purple-700">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                          </svg>
                          School #{modalTeacher.school}
                        </span>
                      </div>
                    </div>

                    <section className="grid gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4 md:grid-cols-3">
                      <div>
                        <p className="text-xs uppercase text-gray-400">Status</p>
                        <span className={`mt-1 inline-flex rounded-lg px-3 py-1 text-xs font-semibold whitespace-nowrap ${getStatusBadge(modalTeacher.status)}`}>
                          {renderStatusLabel(modalTeacher.status)}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-gray-400">Created On</p>
                        <p className="text-sm font-semibold text-gray-800">
                          {modalTeacher.created_at
                            ? new Date(modalTeacher.created_at).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })
                            : "Unknown"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-gray-400">Last Updated</p>
                        <p className="text-sm font-semibold text-gray-800">
                          {modalTeacher.updated_at
                            ? new Date(modalTeacher.updated_at).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })
                            : "Unknown"}
                        </p>
                      </div>
                    </section>

                    <section className="grid gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4 md:grid-cols-2">
                      <div>
                        <p className="text-xs uppercase text-gray-400">Teacher ID</p>
                        <p className="text-sm font-semibold text-gray-800">#{modalTeacher.id}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-gray-400">Email</p>
                        <p className="text-sm font-semibold text-gray-800">{modalTeacher.email}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-gray-400">Phone</p>
                        <p className="text-sm font-semibold text-gray-800">{modalTeacher.phone}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-gray-400">School ID</p>
                        <p className="text-sm font-semibold text-gray-800">#{modalTeacher.school}</p>
                      </div>
                    </section>

                    {modalTeacher.moderation_comment ? (
                      <section className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                        <h3 className="text-sm font-semibold text-amber-900">Moderator Comment</h3>
                        <p className="mt-2 text-sm text-amber-900">{modalTeacher.moderation_comment}</p>
                      </section>
                    ) : null}
                  </div>
                </>
              ) : (
                <div className="py-16 text-center text-sm text-gray-600">No teacher selected.</div>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
              <button
                onClick={closeModal}
                className="rounded-lg border border-gray-200 bg-white px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isModerationProcessing}
              >
                Close
              </button>
              {showModerationActions ? (
                <div className="flex flex-wrap gap-3">
                  <button
                    className="rounded-lg bg-rose-100 px-5 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-200 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={() => handleModerationAction("reject")}
                    disabled={isModerationProcessing}
                  >
                    {moderationLoadingAction === "reject" ? (
                      <span className="flex items-center gap-2">
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-rose-700 border-t-transparent" />
                        Declining...
                      </span>
                    ) : (
                      "Reject Teacher"
                    )}
                  </button>
                  <button
                    className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={() => handleModerationAction("approve")}
                    disabled={isModerationProcessing}
                  >
                    {moderationLoadingAction === "approve" ? (
                      <span className="flex items-center gap-2">
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Approving...
                      </span>
                    ) : (
                      "Approve Teacher"
                    )}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

