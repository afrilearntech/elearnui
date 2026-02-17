"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import DashboardLayout from "@/components/admin/layout/DashboardLayout";
import { Icon } from "@iconify/react";
import { 
  getCounties, 
  County, 
  updateCounty, 
  createCounty,
  downloadCountyBulkTemplate,
  bulkCreateCounties,
  BulkUploadCountyResponse,
} from "@/lib/api/admin/counties";
import { showErrorToast, showSuccessToast } from "@/lib/toast";

type CountyStatus = "APPROVED" | "PENDING" | "REJECTED" | "REVIEW_REQUESTED" | "DRAFT";

const statusOptions = ["All", "APPROVED", "PENDING", "REJECTED", "REVIEW_REQUESTED"];

export default function CountyPage() {
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [page, setPage] = useState(1);
  const [selectedCounty, setSelectedCounty] = useState<County | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [counties, setCounties] = useState<County[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: "",
  });
  const [createFormErrors, setCreateFormErrors] = useState<{ name?: string }>({});
  const pageSize = 10;

  useEffect(() => {
    const fetchCounties = async () => {
      try {
        setIsLoading(true);
        const data = await getCounties();
        setCounties(data);
      } catch (error) {
        showErrorToast("Failed to load counties. Please try again.");
        console.error("Error fetching counties:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCounties();
  }, []);

  const filteredCounties = useMemo(() => {
    return counties.filter((county) => {
      const matchesSearch =
        search.trim().length === 0 ||
        county.name.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = selectedStatus === "All" || county.status === selectedStatus;
      return matchesSearch && matchesStatus;
    });
  }, [search, selectedStatus, counties]);

  const totalPages = Math.max(1, Math.ceil(filteredCounties.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const pagedCounties = filteredCounties.slice(start, start + pageSize);

  useEffect(() => {
    setPage(1);
  }, [search, selectedStatus]);

  const handleViewClick = (county: County) => {
    setSelectedCounty(county);
    setIsViewModalOpen(true);
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedCounty(null);
  };

  const getStatusBadge = (status: CountyStatus) => {
    if (status === "APPROVED") {
      return "bg-emerald-100 text-emerald-700";
    }
    if (status === "PENDING") {
      return "bg-yellow-100 text-yellow-700";
    }
    if (status === "REJECTED") {
      return "bg-red-100 text-red-700";
    }
    if (status === "REVIEW_REQUESTED") {
      return "bg-blue-100 text-blue-700";
    }
    return "bg-gray-100 text-gray-600";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleCreateCounty = async () => {
    const errors: typeof createFormErrors = {};
    if (!createFormData.name.trim()) {
      errors.name = "County name is required";
    }

    if (Object.keys(errors).length > 0) {
      setCreateFormErrors(errors);
      return;
    }

    try {
      setIsCreating(true);
      setCreateFormErrors({});
      const newCounty = await createCounty({
        name: createFormData.name.trim(),
        status: "APPROVED",
      });
      setCounties((prev) => [newCounty, ...prev]);
      showSuccessToast("County created successfully!");
      setIsCreateModalOpen(false);
      setCreateFormData({ name: "" });
    } catch (error: any) {
      showErrorToast(error.message || "Failed to create county. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <DashboardLayout onAddCounty={() => setIsCreateModalOpen(true)}>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-col sm:flex-row gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">County Management</h1>
            <p className="text-gray-600 mt-1">Manage all counties</p>
          </div>
          <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-white shadow hover:bg-emerald-700 transition-colors"
            >
              <Icon icon="solar:add-circle-bold" className="w-5 h-5" />
              Add County
            </button>
            <button
              onClick={() => setIsBulkModalOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-emerald-200 px-5 py-2.5 text-emerald-700 bg-white hover:bg-emerald-50 hover:border-emerald-300 transition-colors"
            >
              <Icon icon="solar:upload-bold" className="w-5 h-5" />
              Bulk Upload Counties
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Icon
                  icon="solar:magnifer-bold"
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10"
                />
                <input
                  type="text"
                  placeholder="search Name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-400"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 sm:w-auto">
              <div className="relative sm:w-48">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 bg-white appearance-none cursor-pointer"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status === "All" ? "All Status" : status}
                    </option>
                  ))}
                </select>
                <Icon
                  icon="solar:alt-arrow-down-bold"
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
                />
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              <p className="text-gray-500 text-sm mt-3">Loading counties...</p>
            </div>
          ) : filteredCounties.length === 0 ? (
            <div className="text-center py-12">
              <Icon icon="solar:map-point-bold" className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No counties found</p>
              <p className="text-gray-400 text-xs mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr className="bg-emerald-50">
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider hidden lg:table-cell">
                          Created At
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold text-gray-900 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pagedCounties.map((county) => (
                        <tr key={county.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{county.name}</div>
                            <div className="text-xs text-gray-500 lg:hidden">
                              {formatDate(county.created_at)}
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600 hidden lg:table-cell">
                            {formatDate(county.created_at)}
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
                                county.status
                              )}`}
                            >
                              {county.status}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleViewClick(county)}
                              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            >
                              <Icon icon="solar:eye-bold" className="w-4 h-4" />
                              <span className="hidden sm:inline">View</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t border-gray-200">
                  <div className="text-sm text-gray-600 order-2 sm:order-1">
                    Showing <span className="font-medium">{start + 1}</span> to{" "}
                    <span className="font-medium">
                      {Math.min(start + pageSize, filteredCounties.length)}
                    </span>{" "}
                    of <span className="font-medium">{filteredCounties.length}</span> counties
                  </div>
                  <div className="flex items-center gap-2 order-1 sm:order-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      aria-label="Previous page"
                    >
                      <Icon icon="solar:alt-arrow-left-bold" className="w-4 h-4" />
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`px-3 py-2 border rounded-lg text-sm font-medium transition-colors min-w-[40px] ${
                            currentPage === pageNum
                              ? "bg-emerald-600 text-white border-emerald-600"
                              : "border-gray-300 text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    {totalPages > 5 && currentPage < totalPages - 2 && (
                      <>
                        <span className="px-2 text-gray-500">...</span>
                        <button
                          onClick={() => setPage(totalPages - 1)}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          {totalPages - 1}
                        </button>
                        <button
                          onClick={() => setPage(totalPages)}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      aria-label="Next page"
                    >
                      <Icon icon="solar:alt-arrow-right-bold" className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {isViewModalOpen && selectedCounty && (
        <CountyViewModal
          county={selectedCounty}
          onClose={closeViewModal}
          onUpdate={(updatedCounty) => {
            setCounties((prev) =>
              prev.map((c) => (c.id === updatedCounty.id ? updatedCounty : c))
            );
            setSelectedCounty(updatedCounty);
          }}
        />
      )}

      {isCreateModalOpen && (
        <CreateCountyModal
          onClose={() => {
            setIsCreateModalOpen(false);
            setCreateFormData({ name: "" });
            setCreateFormErrors({});
          }}
          onSubmit={handleCreateCounty}
          formData={createFormData}
          setFormData={setCreateFormData}
          errors={createFormErrors}
          isSubmitting={isCreating}
        />
      )}

      {isBulkModalOpen && (
        <BulkUploadCountiesModal
          onClose={() => setIsBulkModalOpen(false)}
          onSuccess={(result) => {
            // After a successful bulk upload, refresh counties list
            setCounties((prev) => {
              // For simplicity just trigger a refetch via effect by resetting state
              // but here we simply return prev; external caller can still refresh page if needed.
              return prev;
            });
            showSuccessToast(
              `Bulk upload completed: ${result.summary.created} created, ${result.summary.failed} failed.`
            );
          }}
        />
      )}
    </DashboardLayout>
  );
}

function CountyViewModal({
  county,
  onClose,
  onUpdate,
}: {
  county: County;
  onClose: () => void;
  onUpdate: (county: County) => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionType, setActionType] = useState<
    "APPROVE" | "REJECT" | "REVIEW_REQUESTED" | null
  >(null);
  const [showRequestReviewModal, setShowRequestReviewModal] = useState(false);
  const [moderationComment, setModerationComment] = useState("");
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: CountyStatus) => {
    if (status === "APPROVED") {
      return "bg-emerald-100 text-emerald-700";
    }
    if (status === "PENDING") {
      return "bg-yellow-100 text-yellow-700";
    }
    if (status === "REJECTED") {
      return "bg-red-100 text-red-700";
    }
    if (status === "REVIEW_REQUESTED") {
      return "bg-blue-100 text-blue-700";
    }
    return "bg-gray-100 text-gray-600";
  };

  const handleApprove = async () => {
    try {
      setIsSubmitting(true);
      setActionType("APPROVE");
      const updated = await updateCounty(county.id, {
        status: "APPROVED",
        name: county.name,
      });
      onUpdate(updated);
      showSuccessToast("County approved successfully!");
      onClose();
    } catch (error: any) {
      showErrorToast(error.message || "Failed to approve county. Please try again.");
    } finally {
      setIsSubmitting(false);
      setActionType(null);
    }
  };

  const handleReject = async () => {
    try {
      setIsSubmitting(true);
      setActionType("REJECT");
      const updated = await updateCounty(county.id, {
        status: "REJECTED",
        name: county.name,
      });
      onUpdate(updated);
      showSuccessToast("County rejected successfully!");
      onClose();
    } catch (error: any) {
      showErrorToast(error.message || "Failed to reject county. Please try again.");
    } finally {
      setIsSubmitting(false);
      setActionType(null);
    }
  };

  const handleRequestReview = () => {
    setShowRequestReviewModal(true);
  };

  const handleSubmitRequestReview = async () => {
    if (!moderationComment.trim()) {
      showErrorToast("Please provide a moderation comment.");
      return;
    }

    try {
      setIsSubmitting(true);
      setActionType("REVIEW_REQUESTED");
      const updated = await updateCounty(county.id, {
        status: "REVIEW_REQUESTED",
        name: county.name,
        moderation_comment: moderationComment.trim(),
      });
      onUpdate(updated);
      showSuccessToast("Review requested successfully!");
      setShowRequestReviewModal(false);
      setModerationComment("");
      onClose();
    } catch (error: any) {
      showErrorToast(error.message || "Failed to request review. Please try again.");
    } finally {
      setIsSubmitting(false);
      setActionType(null);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[55]"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
        <div
          className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto border border-gray-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
            <h2 className="text-xl font-bold text-gray-900">County Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close modal"
            >
              <Icon icon="solar:close-circle-bold" className="w-6 h-6" />
            </button>
          </div>

          <div className="px-6 py-6 space-y-6">
            <div>
              <label className="text-sm font-medium text-gray-500">County Name</label>
              <p className="mt-1 text-base text-gray-900 font-semibold">{county.name}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <div className="mt-1">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(
                      county.status
                    )}`}
                  >
                    {county.status}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Created At</label>
                <p className="mt-1 text-base text-gray-900">{formatDate(county.created_at)}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Last Updated</label>
                <p className="mt-1 text-base text-gray-900">{formatDate(county.updated_at)}</p>
              </div>
            </div>

            {county.moderation_comment && (
              <div>
                <label className="text-sm font-medium text-gray-500">Moderation Comment</label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-700">{county.moderation_comment}</p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Close
              </button>
              {county.status === "PENDING" && (
                <>
                  <button
                    onClick={handleApprove}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSubmitting && actionType === "APPROVE" ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Approving...
                      </>
                    ) : (
                      "Approve"
                    )}
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSubmitting && actionType === "REJECT" ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Rejecting...
                      </>
                    ) : (
                      "Reject"
                    )}
                  </button>
                  <button
                    onClick={handleRequestReview}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSubmitting && actionType === "REVIEW_REQUESTED" ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Requesting...
                      </>
                    ) : (
                      "Request Review"
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      {showRequestReviewModal && (
        <RequestReviewModal
          countyName={county.name}
          moderationComment={moderationComment}
          setModerationComment={setModerationComment}
          onSubmit={handleSubmitRequestReview}
          onClose={() => {
            setShowRequestReviewModal(false);
            setModerationComment("");
          }}
          isSubmitting={isSubmitting && actionType === "REVIEW_REQUESTED"}
        />
      )}
    </>
  );
}

function CreateCountyModal({
  onClose,
  onSubmit,
  formData,
  setFormData,
  errors,
  isSubmitting,
}: {
  onClose: () => void;
  onSubmit: () => void;
  formData: { name: string };
  setFormData: (data: { name: string }) => void;
  errors: { name?: string };
  isSubmitting: boolean;
}) {
  const disabled = isSubmitting || !formData.name.trim();

  return (
    <>
      <div
        className="fixed inset-0 z-[55]"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
        <div
          className="bg-white rounded-lg shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto pointer-events-auto border border-gray-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Create New County</h3>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
              aria-label="Close modal"
            >
              <Icon icon="solar:close-circle-bold" className="w-6 h-6" />
            </button>
          </div>

          <div className="px-6 py-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                County Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter county name"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-400 ${
                  errors.name ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={onSubmit}
                disabled={disabled}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create County"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function BulkUploadCountiesModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (result: BulkUploadCountyResponse) => void;
}) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<BulkUploadCountyResponse | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    setSelectedFile(null);
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose();
  };

  const handleDownloadTemplate = async () => {
    try {
      setIsDownloading(true);
      const blob = await downloadCountyBulkTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "counties_bulk_template.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showSuccessToast("County bulk template downloaded successfully!");
    } catch (error: any) {
      const message = error?.message || "Failed to download county bulk template.";
      showErrorToast(message);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleFileSelect = (file: File) => {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      showErrorToast("Please select a CSV file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showErrorToast("File size must be less than 10MB.");
      return;
    }
    setSelectedFile(file);
    setUploadResult(null);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      showErrorToast("Please select a file to upload.");
      return;
    }
    try {
      setIsUploading(true);
      const result = await bulkCreateCounties(selectedFile);
      setUploadResult(result);

      if (result.summary.failed === 0) {
        showSuccessToast(
          `Successfully created ${result.summary.created} county(ies)!`
        );
        onSuccess(result);
        setTimeout(() => handleClose(), 1500);
      } else {
        showErrorToast(
          `Upload completed with errors. ${result.summary.created} created, ${result.summary.failed} failed.`
        );
      }
    } catch (error: any) {
      const message = error?.message || "Failed to upload counties file.";
      showErrorToast(message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[55] bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto border border-gray-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Bulk Upload Counties</h3>
              <p className="text-sm text-gray-600 mt-1">
                Upload a CSV file to quickly create multiple counties at once.
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close modal"
            >
              <Icon icon="solar:close-circle-bold" className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <Icon
                  icon="solar:info-circle-bold"
                  className="w-6 h-6 text-emerald-700 flex-shrink-0 mt-0.5"
                />
                <div className="flex-1">
                  <h4 className="text-base font-semibold text-emerald-900 mb-2">
                    How county bulk upload works
                  </h4>
                  <ul className="space-y-2 text-sm text-emerald-900">
                    <li className="flex items-start gap-2">
                      <span className="mt-1 text-emerald-700">•</span>
                      <span>
                        <strong>Step 1:</strong> Download the official template so your CSV has the correct columns.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 text-emerald-700">•</span>
                      <span>
                        <strong>Step 2:</strong> Fill in one row per county (e.g. <code className="bg-emerald-100 px-1.5 py-0.5 rounded text-xs font-mono">Montserrado</code>, <code className="bg-emerald-100 px-1.5 py-0.5 rounded text-xs font-mono">Bong</code>).
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 text-emerald-700">•</span>
                      <span>
                        <strong>Step 3:</strong> Upload the CSV here. We will validate each row and show you which ones succeeded or failed.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 text-emerald-700">•</span>
                      <span>
                        Existing county names will be flagged as errors (e.g. <code className="bg-emerald-100 px-1.5 py-0.5 rounded text-xs font-mono">County with this name already exists.</code>).
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border border-emerald-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-emerald-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <Icon icon="solar:document-download-bold" className="w-6 h-6 text-emerald-700" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900 mb-1">
                    Download counties CSV template
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Use this template to prepare your county list. Do not rename or remove the header columns.
                  </p>
                  <button
                    onClick={handleDownloadTemplate}
                    disabled={isDownloading}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDownloading ? (
                      <>
                        <Icon icon="solar:loading-bold" className="w-5 h-5 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Icon icon="solar:download-bold" className="w-5 h-5" />
                        Download Template
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">
                Upload CSV file
              </h4>

              {!selectedFile ? (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                    dragActive
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-gray-300 hover:border-emerald-400"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                  <Icon
                    icon="solar:cloud-upload-bold"
                    className="w-16 h-16 text-gray-400 mx-auto mb-4"
                  />
                  <p className="text-gray-700 mb-2">
                    Drag and drop your CSV file here, or{" "}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      browse
                    </button>
                  </p>
                  <p className="text-sm text-gray-500">
                    CSV files only, maximum 10MB.
                  </p>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon icon="solar:file-text-bold" className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(selectedFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="text-gray-400 hover:text-red-600 transition-colors ml-4"
                    >
                      <Icon icon="solar:trash-bin-trash-bold" className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {uploadResult && (
              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                  Upload summary
                </h4>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {uploadResult.summary.total_rows}
                    </p>
                    <p className="text-xs text-gray-600">Total Rows</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-600">
                      {uploadResult.summary.created}
                    </p>
                    <p className="text-xs text-gray-600">Created</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">
                      {uploadResult.summary.failed}
                    </p>
                    <p className="text-xs text-gray-600">Failed</p>
                  </div>
                </div>

                {uploadResult.summary.failed > 0 && (
                  <div className="mt-4">
                    <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
                      <p className="text-sm font-semibold text-red-900 mb-2 flex items-center gap-2">
                        <Icon icon="solar:danger-triangle-bold" className="w-5 h-5" />
                        Failed rows ({uploadResult.summary.failed})
                      </p>
                      <p className="text-xs text-red-700">
                        Review the errors below, fix them in your CSV, and try again for those rows.
                      </p>
                    </div>
                    <div className="mt-3 max-h-64 overflow-y-auto space-y-3">
                      {uploadResult.results
                        .filter((r) => r.status === "error")
                        .map((result, index) => (
                          <div
                            key={`${result.row ?? index}-error`}
                            className="bg-red-50 border border-red-200 rounded-lg p-3"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-semibold text-red-900">
                                Row {result.row ?? index + 1}
                                {result.name && ` - ${result.name}`}
                              </p>
                              <span className="px-2 py-0.5 bg-red-200 text-red-900 text-xs font-medium rounded">
                                ERROR
                              </span>
                            </div>
                            {result.errors && Object.keys(result.errors).length > 0 && (
                              <ul className="mt-2 space-y-1 text-xs text-red-800">
                                {Object.entries(result.errors).map(([field, messages]) => (
                                  <li key={field}>
                                    <span className="font-semibold capitalize">{field}:</span>{" "}
                                    {Array.isArray(messages) ? messages.join(", ") : messages}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <Icon icon="solar:loading-bold" className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Icon icon="solar:upload-bold" className="w-4 h-4" />
                    Upload & Process
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}


function RequestReviewModal({
  countyName,
  moderationComment,
  setModerationComment,
  onSubmit,
  onClose,
  isSubmitting,
}: {
  countyName: string;
  moderationComment: string;
  setModerationComment: (comment: string) => void;
  onSubmit: () => void;
  onClose: () => void;
  isSubmitting: boolean;
}) {
  const disabled = isSubmitting || !moderationComment.trim();

  return (
    <>
      <div
        className="fixed inset-0 z-[65]"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
        <div
          className="bg-white rounded-lg shadow-2xl max-w-lg w-full pointer-events-auto border border-gray-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Request Review</h3>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
              aria-label="Close modal"
            >
              <Icon icon="solar:close-circle-bold" className="w-6 h-6" />
            </button>
          </div>

          <div className="px-6 py-6 space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Please provide a comment explaining what changes are needed for{" "}
                <span className="font-semibold text-gray-900">{countyName}</span>:
              </p>
              <textarea
                value={moderationComment}
                onChange={(e) => setModerationComment(e.target.value)}
                placeholder="Enter moderation comment..."
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-400 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={onSubmit}
                disabled={disabled}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
