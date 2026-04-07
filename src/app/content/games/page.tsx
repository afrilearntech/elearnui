"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getGames, GameRecord } from "@/lib/api/content/games";
import { moderateContent, ModerateAction } from "@/lib/api/content/lessons";
import Image from "@/components/images/SafeImage";

type GameRow = {
  id: string;
  name: string;
  type: string;
  creator: string;
  creatorId: number;
  date: string;
  status: "REJECTED" | "VALIDATED" | "PENDING" | "REQUEST_CHANGES";
  instructions: string;
  description: string;
  hint: string;
  correct_answer: string;
  image: string | null;
  moderation_comment?: string | null;
  created_at: string;
};

const statusMap: Record<string, GameRow["status"]> = {
  APPROVED: "VALIDATED",
  VALIDATED: "VALIDATED",
  PENDING: "PENDING",
  DRAFT: "PENDING",
  REJECTED: "REJECTED",
  REVIEW_REQUESTED: "REQUEST_CHANGES",
  REQUEST_CHANGES: "REQUEST_CHANGES",
};

function normalizeStatus(value?: string | null): GameRow["status"] {
  if (!value) return "PENDING";
  const upper = value.toUpperCase();
  return statusMap[upper] ?? (["VALIDATED", "REJECTED", "PENDING", "REQUEST_CHANGES"].includes(upper) ? (upper as GameRow["status"]) : "PENDING");
}

function mapGame(record: GameRecord): GameRow {
  const status = normalizeStatus(record.status);
  const formattedDate = record.created_at
    ? new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(new Date(record.created_at))
    : "";

  return {
    id: record.id.toString(),
    name: record.name,
    type: record.type,
    creator: record.created_by ? `Creator ${record.created_by}` : "Unknown Creator",
    creatorId: record.created_by,
    date: formattedDate,
    status,
    instructions: record.instructions || "",
    description: record.description || "",
    hint: record.hint || "",
    correct_answer: record.correct_answer || "",
    image: record.image,
    moderation_comment: record.moderation_comment,
    created_at: record.created_at,
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
  }
}

export default function GamesPage() {
  const router = useRouter();
  const [userRole, setUserRole] = React.useState<string>("CONTENTCREATOR");
  const [games, setGames] = React.useState<GameRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState("All");
  const [statusFilter, setStatusFilter] = React.useState("All");
  const [page, setPage] = React.useState(1);
  const pageSize = 10;
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [modalGame, setModalGame] = React.useState<GameRow | null>(null);
  const [isModerationModalOpen, setIsModerationModalOpen] = React.useState(false);
  const [moderationComment, setModerationComment] = React.useState("");
  const [moderationFormError, setModerationFormError] = React.useState<string | null>(null);
  const [pendingModerationAction, setPendingModerationAction] = React.useState<ModerateAction | null>(null);
  const [moderationLoadingAction, setModerationLoadingAction] = React.useState<ModerateAction | null>(null);
  const isModerationProcessing = moderationLoadingAction !== null;
  const isValidator = userRole === "CONTENTVALIDATOR";

  const fetchGames = React.useCallback(async (showLoading = true, updateModal = false) => {
    try {
      if (showLoading) {
        setIsLoading(true);
        setLoadError(null);
      }

      if (typeof window === "undefined") return;

      const token = localStorage.getItem("auth_token");
      if (!token) {
        setLoadError("Missing authentication token. Please sign in again.");
        return;
      }

      const data = await getGames(token);
      const mappedGames = data.map(mapGame);
      setGames(mappedGames);

      if (updateModal) {
        setModalGame((prev) => {
          if (!prev) return prev;
          const updatedGame = mappedGames.find((g) => g.id === prev.id);
          return updatedGame || prev;
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load games.";
      setLoadError(message);
      await notifyError(message);
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const userStr = localStorage.getItem("user");
    if (!userStr) return;
    try {
      const user = JSON.parse(userStr);
      setUserRole(user.role || "CONTENTCREATOR");
    } catch (error) {
      console.error("Error parsing user data:", error);
    }
  }, []);

  React.useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  const typeOptions = React.useMemo(() => {
    const options = new Set<string>();
    games.forEach((game) => {
      if (game.type && game.type.trim().length > 0) {
        options.add(game.type);
      }
    });
    return Array.from(options);
  }, [games]);

  const filtered = React.useMemo(() => {
    return games.filter((game) => {
      const matchesSearch = search.trim().length === 0 || game.name.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === "All" || game.type === typeFilter;
      const matchesStatus = statusFilter === "All" || game.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [games, search, typeFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);

  React.useEffect(() => {
    setPage(1);
  }, [search, typeFilter, statusFilter]);

  const getStatusBadge = (state: GameRow["status"]) => {
    switch (state) {
      case "VALIDATED":
        return "bg-emerald-100 text-emerald-700";
      case "REJECTED":
        return "bg-rose-100 text-rose-700";
      case "PENDING":
        return "bg-amber-100 text-amber-700";
      case "REQUEST_CHANGES":
        return "bg-indigo-100 text-indigo-700";
    }
  };

  const renderStatusLabel = (state: GameRow["status"]) => {
    if (state === "VALIDATED") return "Validated";
    if (state === "REJECTED") return "Rejected";
    if (state === "REQUEST_CHANGES") return "Revision Requested";
    return "Pending";
  };

  const handleReview = React.useCallback((game: GameRow) => {
    setModalGame(game);
    setIsModalOpen(true);
    setIsModerationModalOpen(false);
    setModerationComment("");
    setModerationFormError(null);
    setPendingModerationAction(null);
  }, []);

  const closeModal = React.useCallback(() => {
    setIsModalOpen(false);
    setModalGame(null);
    setIsModerationModalOpen(false);
    setModerationComment("");
    setModerationFormError(null);
    setPendingModerationAction(null);
  }, []);

  const updateGameStatusInState = React.useCallback(
    (gameId: number, status: GameRow["status"], moderationComment?: string | null) => {
      const gameIdString = String(gameId);
      setGames((prev) =>
        prev.map((game) =>
          game.id === gameIdString ? { ...game, status, moderation_comment: moderationComment ?? game.moderation_comment } : game,
        ),
      );
      setModalGame((prev) => {
        if (!prev) return prev;
        if (prev.id === gameIdString) {
          return { ...prev, status, moderation_comment: moderationComment ?? prev.moderation_comment };
        }
        return prev;
      });
    },
    [],
  );

  const submitModeration = React.useCallback(
    async (action: ModerateAction, comment?: string) => {
      if (!modalGame) return;
      if (typeof window === "undefined") return;

      const gameId = typeof modalGame.id === "string" ? parseInt(modalGame.id, 10) : modalGame.id;
      if (!gameId || Number.isNaN(gameId)) {
        await notifyError("Invalid game identifier.");
        return;
      }

      const token = localStorage.getItem("auth_token");
      if (!token) {
        await notifyError("Missing authentication token. Please sign in again.");
        return;
      }

      setModerationLoadingAction(action);
      try {
        const response = await moderateContent(
          {
            model: "game",
            id: gameId,
            action,
            ...(comment ? { moderation_comment: comment } : {}),
          },
          token,
        );
        const normalizedStatus = normalizeStatus(response.status);
        const updatedComment = response.moderation_comment ?? comment ?? null;
        updateGameStatusInState(response.id, normalizedStatus, updatedComment);

        await fetchGames(false, true);

        const successMessage =
          action === "approve"
            ? "Game approved successfully."
            : action === "reject"
            ? "Game rejected."
            : "Revision request submitted.";
        await notifySuccess(successMessage);

        if (action === "request_changes") {
          setIsModerationModalOpen(false);
          setModerationComment("");
          setModerationFormError(null);
          setPendingModerationAction(null);
          closeModal();
        } else if (action === "approve") {
          closeModal();
        } else if (action === "reject") {
          closeModal();
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to complete moderation action.";
        await notifyError(message);
      } finally {
        setModerationLoadingAction(null);
      }
    },
    [modalGame, updateGameStatusInState, closeModal, fetchGames],
  );

  const showModerationActions = isValidator && modalGame?.status === "PENDING";

  const handleModerationAction = React.useCallback(
    (action: ModerateAction) => {
      if (!modalGame || !showModerationActions) return;
      if (action === "request_changes") {
        setPendingModerationAction(action);
        setModerationComment("");
        setModerationFormError(null);
        setIsModerationModalOpen(true);
        return;
      }
      submitModeration(action);
    },
    [modalGame, showModerationActions, submitModeration],
  );

  const handleModerationModalSubmit = async () => {
    if (!pendingModerationAction) return;
    if (moderationComment.trim().length === 0) {
      setModerationFormError("Moderation comment is required.");
      return;
    }
    setModerationFormError(null);
    await submitModeration(pendingModerationAction, moderationComment.trim());
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Games</h1>
          <p className="text-sm text-gray-500">Create and manage interactive learning games.</p>
        </div>
        {!isValidator ? (
          <Link
            href="/content/games/create"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-emerald-700 transition-colors"
          >
            <span className="text-lg leading-none">+</span>
            Create Game
          </Link>
        ) : null}
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:flex-1">
          <input
            type="text"
            placeholder="search by game name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 sm:max-w-md text-gray-900 placeholder:text-gray-400"
          />
          <div className="grid w-full gap-3 sm:grid-cols-2">
            <select
              className="min-w-[140px] rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option>Type</option>
              <option>All</option>
              {typeOptions.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <select
              className="min-w-[140px] rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option>Status</option>
              <option>All</option>
              <option value="PENDING">Pending</option>
              <option value="VALIDATED">Validated</option>
              <option value="REJECTED">Rejected</option>
              <option value="REQUEST_CHANGES">Revision Requested</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 border-b border-gray-200">
        <button className="relative border-b-2 border-emerald-600 pb-2 px-1">
          <span className="text-sm font-medium text-gray-900">Games</span>
          <span className="ml-2 rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">{filtered.length}</span>
        </button>
      </div>

      {isValidator ? (
        <>
          <div className="hidden overflow-x-auto rounded-xl border border-gray-200 bg-white md:block">
            <div className="min-w-full">
              <div className="grid grid-cols-12 bg-[#F1F7E4] px-5 py-4 text-sm font-semibold text-gray-800">
                <div className="col-span-3">Game Name</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-2">Creator</div>
                <div className="col-span-2">Created Date</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>
              {isLoading ? (
                <div className="px-5 py-8 text-center text-sm text-gray-600">Loading games...</div>
              ) : loadError ? (
                <div className="px-5 py-8 text-center text-sm text-rose-600">{loadError}</div>
              ) : paged.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-gray-600">No games match your filters.</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {paged.map((game) => (
                    <div key={game.id} className="grid grid-cols-12 items-center px-5 py-4 text-sm hover:bg-gray-50">
                      <div className="col-span-3 text-gray-900 font-medium">{game.name}</div>
                      <div className="col-span-2 text-gray-700">{game.type}</div>
                      <div className="col-span-2 text-gray-700">{game.creator}</div>
                      <div className="col-span-2 text-gray-700">{game.date}</div>
                      <div className="col-span-1">
                        <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium whitespace-nowrap ${getStatusBadge(game.status)}`}>
                          {renderStatusLabel(game.status)}
                        </span>
                      </div>
                      <div className="col-span-2 flex items-center justify-end">
                        <button
                          className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
                          onClick={() => handleReview(game)}
                        >
                          Review
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4 md:hidden">
            {isLoading ? (
              <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-600">Loading games...</div>
            ) : loadError ? (
              <div className="rounded-xl border border-rose-200 bg-white p-6 text-center text-sm text-rose-600">{loadError}</div>
            ) : paged.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white p-5 text-center text-sm text-gray-600">
                No games match your filters.
              </div>
            ) : (
              paged.map((game) => (
                <div key={game.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-gray-900">{game.name}</p>
                      <p className="text-xs text-gray-500">{game.date}</p>
                    </div>
                    <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium whitespace-nowrap ${getStatusBadge(game.status)}`}>
                      {renderStatusLabel(game.status)}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-700">
                    <div>
                      <p className="text-xs uppercase text-gray-400">Type</p>
                      <p>{game.type}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-gray-400">Creator</p>
                      <p>{game.creator}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      className="rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
                      onClick={() => handleReview(game)}
                    >
                      Review
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <div className="space-y-4">
          {isLoading ? (
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-600">Loading games...</div>
          ) : loadError ? (
            <div className="rounded-xl border border-rose-200 bg-white p-6 text-center text-sm text-rose-600">{loadError}</div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-5 text-center text-sm text-gray-600">
              No games match your filters.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((game) => {
                return (
                  <button
                    key={game.id}
                    type="button"
                    onClick={() => handleReview(game)}
                    className="overflow-hidden rounded-2xl border border-gray-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="relative h-40 w-full overflow-hidden bg-gray-100">
                      {game.image ? (
                        <Image
                          src={game.image}
                          alt={game.name}
                          fill
                          className="object-cover"
                          sizes="(min-width: 1024px) 33vw, 100vw"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">No image</div>
                      )}
                    </div>
                    <div className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-semibold text-gray-900">{game.name}</p>
                          <p className="text-xs text-gray-500">{game.date || "Pending date"}</p>
                        </div>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusBadge(game.status)}`}>
                          {renderStatusLabel(game.status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {game.description ? game.description.slice(0, 120) : "No description provided yet."}
                        {game.description && game.description.length > 120 ? "…" : ""}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-purple-700">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <line x1="9" y1="3" x2="9" y2="21" />
                          </svg>
                          {game.type}
                        </span>
                        <span>{game.creator}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {isValidator ? (
        <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
            currentPage === 1
              ? "border-gray-200 text-gray-300 cursor-not-allowed"
              : "border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
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
                  className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                    totalPages === currentPage
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
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
              className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                active
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {n}
            </button>
          );
        })}
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
            currentPage === totalPages
              ? "border-gray-200 text-gray-300 cursor-not-allowed"
              : "border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          &gt;
        </button>
        </div>
      ) : null}

      {isModalOpen ? (
        <div
          className="fixed inset-0 z-120 flex items-start justify-center overflow-y-auto bg-black/60 py-10 px-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <p className="text-sm font-semibold text-emerald-600 uppercase">Preview of the game</p>
                <p className="text-xs text-gray-500">
                  {isValidator ? "Review all information before approving or requesting revisions" : "Here’s the complete overview of this game."}
                </p>
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
              {modalGame ? (
                <div className="space-y-6">
                  {modalGame.image ? (
                    <div className="relative mb-6 h-64 w-full overflow-hidden rounded-2xl bg-gray-100">
                      <Image
                        src={modalGame.image}
                        alt={modalGame.name || "Game preview"}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 900px"
                        priority
                      />
                    </div>
                  ) : null}
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900">{modalGame.name}</h2>
                    <div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-700">
                      <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-3 py-1 text-purple-700">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <line x1="9" y1="3" x2="9" y2="21" />
                        </svg>
                        {modalGame.type}
                      </span>
                    </div>
                  </div>

                  <section>
                    <h3 className="text-lg font-semibold text-gray-900">Instructions</h3>
                    <p className="mt-2 text-sm leading-relaxed text-gray-700">{modalGame.instructions || "No instructions provided."}</p>
                  </section>

                  {modalGame.description ? (
                    <section>
                      <h3 className="text-lg font-semibold text-gray-900">Description</h3>
                      <p className="mt-2 text-sm leading-relaxed text-gray-700">{modalGame.description}</p>
                    </section>
                  ) : null}

                  {modalGame.hint ? (
                    <section>
                      <h3 className="text-lg font-semibold text-gray-900">Hint</h3>
                      <p className="mt-2 text-sm leading-relaxed text-gray-700">{modalGame.hint}</p>
                    </section>
                  ) : null}

                  <section className="grid gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-4 md:grid-cols-3">
                    <div>
                      <p className="text-xs uppercase text-gray-400">Correct Answer</p>
                      <p className="text-sm font-semibold text-gray-800">{modalGame.correct_answer || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-gray-400">Status</p>
                      <span className={`mt-1 inline-flex rounded-lg px-3 py-1 text-xs font-semibold whitespace-nowrap ${getStatusBadge(modalGame.status)}`}>
                        {renderStatusLabel(modalGame.status)}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-gray-400">Created On</p>
                      <p className="text-sm font-semibold text-gray-800">
                        {modalGame.created_at
                          ? new Date(modalGame.created_at).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })
                          : "Unknown"}
                      </p>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Game Details</h3>
                    <div className="grid gap-3 text-sm text-gray-700 md:grid-cols-2">
                      <div>
                        <p className="text-xs uppercase text-gray-400">Creator</p>
                        <p>{modalGame.creator}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-gray-400">Type</p>
                        <p>{modalGame.type}</p>
                      </div>
                    </div>
                  </section>

                  {modalGame.status === "REQUEST_CHANGES" && modalGame.moderation_comment ? (
                    <section className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-200 px-3 py-1 text-xs font-semibold text-amber-900">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                          </svg>
                          Requested Review
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-amber-900 mb-1">Moderator Comment</h3>
                      <p className="mt-2 text-sm text-amber-800">{modalGame.moderation_comment}</p>
                    </section>
                  ) : modalGame.moderation_comment ? (
                    <section className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                      <h3 className="text-sm font-semibold text-amber-900">Moderator Comment</h3>
                      <p className="mt-2 text-sm text-amber-900">{modalGame.moderation_comment}</p>
                    </section>
                  ) : null}
                </div>
              ) : (
                <div className="py-16 text-center text-sm text-gray-600">No game selected.</div>
              )}
            </div>
            {showModerationActions ? (
              <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
                <button
                  onClick={closeModal}
                  className="rounded-lg border border-gray-200 bg-white px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isModerationProcessing}
                >
                  Close
                </button>
                <div className="flex flex-wrap gap-3">
                  <button
                    className="rounded-lg bg-rose-100 px-5 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-200 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={() => handleModerationAction("reject")}
                    disabled={isModerationProcessing && moderationLoadingAction === "reject"}
                  >
                    {moderationLoadingAction === "reject" ? (
                      <span className="flex items-center gap-2">
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-rose-700 border-t-transparent" />
                        Declining...
                      </span>
                    ) : (
                      "Decline Game"
                    )}
                  </button>
                  <button
                    className="rounded-lg bg-indigo-100 px-5 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-200 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={() => handleModerationAction("request_changes")}
                    disabled={isModerationProcessing && moderationLoadingAction === "request_changes"}
                  >
                    {moderationLoadingAction === "request_changes" ? (
                      <span className="flex items-center gap-2">
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-indigo-700 border-t-transparent" />
                        Sending...
                      </span>
                    ) : (
                      "Request Revision"
                    )}
                  </button>
                  <button
                    className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={() => handleModerationAction("approve")}
                    disabled={isModerationProcessing && moderationLoadingAction === "approve"}
                  >
                    {moderationLoadingAction === "approve" ? (
                      <span className="flex items-center gap-2">
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Approving...
                      </span>
                    ) : (
                      "Approve Game"
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
                <button
                  onClick={closeModal}
                  className="rounded-lg border border-gray-200 bg-white px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                {!isValidator && modalGame && modalGame.status === "REQUEST_CHANGES" ? (
                  <Link
                    href={`/content/games/create?edit=${modalGame.id}`}
                    className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                  >
                    Edit Game
                  </Link>
                ) : null}
              </div>
            )}

            {showModerationActions && isModerationModalOpen ? (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 px-4 py-6 backdrop-blur-[1px]">
                <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-5 shadow-xl">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">Request Revisions</h4>
                      <p className="text-sm text-gray-500">Tell the creator what needs to change.</p>
                    </div>
                    <button
                      aria-label="Close moderation modal"
                      onClick={() => {
                        setIsModerationModalOpen(false);
                        setModerationComment("");
                        setModerationFormError(null);
                        setPendingModerationAction(null);
                      }}
                      className="rounded-full p-1 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={isModerationProcessing}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-800">
                        Moderation Comment<span className="text-rose-600">*</span>
                      </label>
                      <textarea
                        rows={4}
                        value={moderationComment}
                        onChange={(event) => setModerationComment(event.target.value)}
                        className={`mt-1 w-full rounded-xl border px-4 py-3 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-emerald-500 ${
                          moderationFormError ? "border-rose-400" : "border-gray-200"
                        }`}
                        placeholder="Describe the changes needed..."
                        disabled={isModerationProcessing}
                      />
                      {moderationFormError ? (
                        <p className="mt-1 text-xs text-rose-600">{moderationFormError}</p>
                      ) : null}
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                        onClick={() => {
                          setIsModerationModalOpen(false);
                          setModerationComment("");
                          setModerationFormError(null);
                          setPendingModerationAction(null);
                        }}
                        disabled={moderationLoadingAction === "request_changes"}
                      >
                        Cancel
                      </button>
                      <button
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                        onClick={handleModerationModalSubmit}
                        disabled={moderationLoadingAction === "request_changes"}
                      >
                        {moderationLoadingAction === "request_changes" ? (
                          <span className="flex items-center gap-2">
                            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Sending...
                          </span>
                        ) : (
                          "Send Request"
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

