"use client";

import { useState, useRef } from "react";
import { Icon } from "@iconify/react";
import {
  downloadTeacherBulkTemplate,
  bulkCreateTeachers,
  downloadHeadTeacherTeacherBulkTemplate,
  bulkCreateHeadTeacherTeachers,
  BulkUploadTeacherResponse,
} from "@/lib/api/parent-teacher/teacher";
import { showSuccessToast, showErrorToast } from "@/lib/toast";

interface BulkUploadTeachersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  roleMode?: "teacher" | "headteacher";
}

export default function BulkUploadTeachersModal({
  isOpen,
  onClose,
  onSuccess,
  roleMode = "teacher",
}: BulkUploadTeachersModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<BulkUploadTeacherResponse | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = async () => {
    try {
      setIsDownloading(true);
      const blob =
        roleMode === "headteacher"
          ? await downloadHeadTeacherTeacherBulkTemplate()
          : await downloadTeacherBulkTemplate();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "teachers_bulk_template.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      showSuccessToast("Template downloaded successfully!");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to download template.";
      showErrorToast(message);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleFileSelect = (file: File) => {
    if (!file.name.endsWith(".csv")) {
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

  const handleUpload = async () => {
    if (!selectedFile) {
      showErrorToast("Please select a file to upload.");
      return;
    }

    try {
      setIsUploading(true);
      const result =
        roleMode === "headteacher"
          ? await bulkCreateHeadTeacherTeachers(selectedFile)
          : await bulkCreateTeachers(selectedFile);
      setUploadResult(result);
      
      if (result.summary.failed === 0) {
        showSuccessToast(
          `Successfully created ${result.summary.created} teacher(s)!`
        );
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 1500);
      } else {
        showErrorToast(
          `Upload completed with errors. ${result.summary.created} created, ${result.summary.failed} failed.`
        );
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to upload file.";
      showErrorToast(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose();
  };

  const removeFile = () => {
    setSelectedFile(null);
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Bulk Upload Teachers</h2>
              <p className="text-sm text-gray-600 mt-1">
                Upload a CSV file to create multiple teachers at once
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Icon icon="solar:close-circle-bold" className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <Icon icon="solar:danger-triangle-bold" className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-base font-semibold text-red-900 mb-3">
                  Important Instructions
                </h3>
                <ul className="space-y-2 text-sm text-red-800">
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">•</span>
                    <span><strong>Download the template first</strong> to ensure correct formatting</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">•</span>
                    <span><strong>Date format:</strong> Use <code className="bg-red-100 px-1.5 py-0.5 rounded text-xs font-mono">YYYY-MM-DD</code> (e.g., 2025-12-10) for date of birth</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">•</span>
                    <span><strong>Required fields:</strong> name, phone, email, gender, dob, school_id</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">•</span>
                    <span><strong>Gender values:</strong> Must be exactly <code className="bg-red-100 px-1.5 py-0.5 rounded text-xs font-mono">MALE</code> or <code className="bg-red-100 px-1.5 py-0.5 rounded text-xs font-mono">FEMALE</code></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">•</span>
                    <span><strong>Do not modify</strong> the column headers in the template</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">•</span>
                    <span><strong>Check for errors</strong> after upload - failed rows will be displayed below</span>
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
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Download Template
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Download the CSV template file to ensure your data is formatted correctly.
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Upload CSV File
            </h3>

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
                <p className="text-gray-600 mb-2">
                  Drag and drop your CSV file here, or{" "}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    browse
                  </button>
                </p>
                <p className="text-sm text-gray-500">
                  CSV files only, max 10MB
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
                    onClick={removeFile}
                    className="text-gray-400 hover:text-red-600 transition-colors ml-4"
                  >
                    <Icon icon="solar:trash-bin-trash-bold" className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {!selectedFile && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Icon icon="solar:folder-bold" className="w-5 h-5" />
                Select File
              </button>
            )}
          </div>

          {uploadResult && (
            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                Upload Summary
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
                    <p className="text-sm font-semibold text-red-900 mb-3 flex items-center gap-2">
                      <Icon icon="solar:danger-triangle-bold" className="w-5 h-5" />
                      Failed Records ({uploadResult.summary.failed})
                    </p>
                  </div>
                  <div className="mt-3 max-h-64 overflow-y-auto space-y-3">
                    {uploadResult.results
                      .filter((r) => r.status === "error" || r.status !== "created")
                      .map((result, index) => (
                        <div
                          key={index}
                          className="bg-red-50 border-2 border-red-200 rounded-lg p-4"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-red-900 mb-1">
                                Row {result.row || index + 1}
                                {result.name && ` - ${result.name}`}
                              </p>
                              {result.phone && (
                                <p className="text-xs text-red-700 mb-2">
                                  Phone: {result.phone}
                                </p>
                              )}
                            </div>
                            <span className="px-2 py-1 bg-red-200 text-red-900 text-xs font-medium rounded">
                              {result.status?.toUpperCase() || "ERROR"}
                            </span>
                          </div>
                          {result.errors && Object.keys(result.errors).length > 0 && (
                            <div className="mt-3 pt-3 border-t border-red-300">
                              <p className="text-xs font-semibold text-red-900 mb-2">
                                Errors:
                              </p>
                              <ul className="space-y-1">
                                {Object.entries(result.errors).map(([field, messages]) => (
                                  <li key={field} className="text-xs text-red-800">
                                    <span className="font-medium capitalize">{field}:</span>{" "}
                                    {Array.isArray(messages) ? messages.join(", ") : messages}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex gap-3 justify-end">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
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
                Upload
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

