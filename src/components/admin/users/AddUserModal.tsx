"use client";

import { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";
import { 
  createContentManager, 
  downloadContentManagerBulkTemplate, 
  bulkCreateContentManagers,
  BulkUploadContentManagerResponse 
} from "@/lib/api/admin/content-managers";
import {
  createTeacher,
  downloadTeacherBulkTemplate,
  bulkCreateTeachers,
  BulkUploadTeacherResponse
} from "@/lib/api/admin/teachers";
import {
  createStudent,
  downloadStudentBulkTemplate,
  bulkCreateStudents,
  BulkUploadStudentResponse
} from "@/lib/api/admin/students";
import { getSchools, School } from "@/lib/api/admin/schools";
import { showSuccessToast, showErrorToast } from "@/lib/toast";

interface AddUserModalProps {
  userType: "Student" | "Teacher" | "Content Manager";
  activeTab: "single" | "bulk";
  onTabChange: (tab: "single" | "bulk") => void;
  onClose: () => void;
  onSuccess?: () => void;
}

const gradeOptions = [
  "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6",
  "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"
];

export default function AddUserModal({ userType, activeTab, onTabChange, onClose, onSuccess }: AddUserModalProps) {
  if (!userType) {
    return null;
  }
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "CONTENTCREATOR" as "CONTENTCREATOR" | "CONTENTVALIDATOR",
    gender: "",
    dob: "",
    school_id: "",
    grade: "",
  });
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoadingSchools, setIsLoadingSchools] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<BulkUploadContentManagerResponse | BulkUploadTeacherResponse | BulkUploadStudentResponse | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Admin needs schools for both Teacher and Student creation
    if (userType === "Teacher" || userType === "Student") {
      fetchSchools();
    }
  }, [userType]);

  const fetchSchools = async () => {
    try {
      setIsLoadingSchools(true);
      const data = await getSchools();
      setSchools(data);
    } catch (error: any) {
      showErrorToast("Failed to load schools. Please try again.");
    } finally {
      setIsLoadingSchools(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);

      if (userType === "Content Manager") {
        const payload: any = {
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          role: formData.role,
        };

        if (formData.gender) {
          payload.gender = formData.gender;
        }

        if (formData.dob) {
          payload.dob = formData.dob;
        }

        await createContentManager(payload);
        showSuccessToast(`Content Manager created successfully!`);
      } else if (userType === "Teacher") {
        if (!formData.school_id) {
          showErrorToast("Please select a school.");
          return;
        }

        const payload = {
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          gender: formData.gender,
          dob: formData.dob,
          school_id: parseInt(formData.school_id),
          status: "APPROVED", // Automatically approve teachers created by admins
        };

        await createTeacher(payload);
        showSuccessToast(`Teacher created successfully!`);
      } else if (userType === "Student") {
        if (!formData.grade) {
          showErrorToast("Please select a grade.");
          return;
        }
        if (!formData.school_id) {
          showErrorToast("Please select a school.");
          return;
        }

        const payload = {
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          grade: formData.grade,
          gender: formData.gender,
          dob: formData.dob,
          school_id: parseInt(formData.school_id),
          status: "APPROVED", // Automatically approve students created by admins
        };

        await createStudent(payload);
        showSuccessToast(`Student created successfully!`);
      }
      
      if (onSuccess) {
        onSuccess();
      }
      
      setTimeout(() => {
        handleClose();
      }, 1000);
    } catch (error: any) {
      const message = error?.message || `Failed to create ${userType.toLowerCase()}. Please try again.`;
      showErrorToast(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      role: "CONTENTCREATOR",
      gender: "",
      dob: "",
      school_id: "",
      grade: "",
    });
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
      let blob: Blob;
      let filename: string;

      if (userType === "Content Manager") {
        blob = await downloadContentManagerBulkTemplate();
        filename = "content_managers_bulk_template.csv";
      } else if (userType === "Teacher") {
        blob = await downloadTeacherBulkTemplate();
        filename = "teachers_bulk_template.csv";
      } else if (userType === "Student") {
        blob = await downloadStudentBulkTemplate();
        filename = "students_bulk_template.csv";
      } else {
        throw new Error("Invalid user type");
      }
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      showSuccessToast("Template downloaded successfully!");
    } catch (error: any) {
      const message = error?.message || "Failed to download template.";
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
      let result: BulkUploadContentManagerResponse | BulkUploadTeacherResponse | BulkUploadStudentResponse;

      if (userType === "Content Manager") {
        result = await bulkCreateContentManagers(selectedFile);
      } else if (userType === "Teacher") {
        result = await bulkCreateTeachers(selectedFile);
      } else if (userType === "Student") {
        result = await bulkCreateStudents(selectedFile);
      } else {
        throw new Error("Invalid user type");
      }

      setUploadResult(result);
      
      if (result.summary.failed === 0) {
        showSuccessToast(
          `Successfully created ${result.summary.created} ${userType.toLowerCase()}(s)!`
        );
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          }
          handleClose();
        }, 1500);
      } else {
        showErrorToast(
          `Upload completed with errors. ${result.summary.created} created, ${result.summary.failed} failed.`
        );
      }
    } catch (error: any) {
      const message = error?.message || "Failed to upload file.";
      showErrorToast(message);
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getUserTypeLabel = () => {
    return userType === "Content Manager" ? "Content Manager" : userType;
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto border border-gray-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Add New {getUserTypeLabel()}</h2>
              <p className="text-sm text-gray-600 mt-1">Create a new {getUserTypeLabel().toLowerCase()} account</p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close modal"
            >
              <Icon icon="solar:close-circle-bold" className="w-6 h-6" />
            </button>
          </div>

          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex gap-2">
              <button
                onClick={() => onTabChange("single")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === "single"
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Add New {getUserTypeLabel()}
              </button>
              <button
                onClick={() => onTabChange("bulk")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === "bulk"
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Bulk Upload
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === "single" ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter full name"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter email address"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter phone number"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 bg-white"
                  />
                </div>

                {userType === "Content Manager" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 bg-white appearance-none"
                      >
                        <option value="CONTENTCREATOR">Content Creator</option>
                        <option value="CONTENTVALIDATOR">Content Validator</option>
                      </select>
                      <Icon
                        icon="solar:alt-arrow-down-bold"
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
                      />
                    </div>
                  </div>
                )}

                {(userType === "Teacher" || userType === "Student") && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      School <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        name="school_id"
                        value={formData.school_id}
                        onChange={handleInputChange}
                        required
                        disabled={isLoadingSchools}
                        className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 bg-white appearance-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="">{isLoadingSchools ? "Loading schools..." : "Select School"}</option>
                        {schools.map((school) => (
                          <option key={school.id} value={school.id}>
                            {school.name}
                          </option>
                        ))}
                      </select>
                      <Icon
                        icon="solar:alt-arrow-down-bold"
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
                      />
                    </div>
                  </div>
                )}

                {userType === "Student" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Grade <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        name="grade"
                        value={formData.grade}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 bg-white appearance-none"
                      >
                        <option value="">Select Grade</option>
                        {gradeOptions.map((grade) => (
                          <option key={grade} value={grade}>
                            {grade}
                          </option>
                        ))}
                      </select>
                      <Icon
                        icon="solar:alt-arrow-down-bold"
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 bg-white appearance-none"
                    >
                      <option value="">Select Gender</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                    <Icon
                      icon="solar:alt-arrow-down-bold"
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 bg-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Icon icon="solar:loading-bold" className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      `Add ${getUserTypeLabel()}`
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
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
                          {userType === "Content Manager" && (
                            <>
                              <li className="flex items-start gap-2">
                                <span className="text-red-600 mt-1">•</span>
                                <span><strong>Required fields:</strong> name, phone, role (creator|validator)</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-red-600 mt-1">•</span>
                                <span><strong>Optional fields:</strong> email, gender, dob</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-red-600 mt-1">•</span>
                                <span><strong>Role values:</strong> Must be exactly <code className="bg-red-100 px-1.5 py-0.5 rounded text-xs font-mono">creator</code> or <code className="bg-red-100 px-1.5 py-0.5 rounded text-xs font-mono">validator</code></span>
                              </li>
                            </>
                          )}
                          {userType === "Teacher" && (
                            <>
                              <li className="flex items-start gap-2">
                                <span className="text-red-600 mt-1">•</span>
                                <span><strong>Required fields:</strong> name, phone, email, gender, dob, school_id</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-red-600 mt-1">•</span>
                                <span><strong>Gender values:</strong> Must be exactly <code className="bg-red-100 px-1.5 py-0.5 rounded text-xs font-mono">MALE</code> or <code className="bg-red-100 px-1.5 py-0.5 rounded text-xs font-mono">FEMALE</code></span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-emerald-600 mt-1">•</span>
                                <span><strong>Note:</strong> All teachers created by admins will be automatically set to <code className="bg-emerald-100 px-1.5 py-0.5 rounded text-xs font-mono">APPROVED</code> status</span>
                              </li>
                            </>
                          )}
                          {userType === "Student" && (
                            <>
                              <li className="flex items-start gap-2">
                                <span className="text-red-600 mt-1">•</span>
                                <span><strong>Required fields:</strong> name, phone, email, grade, gender, dob</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-red-600 mt-1">•</span>
                                <span><strong>Gender values:</strong> Must be exactly <code className="bg-red-100 px-1.5 py-0.5 rounded text-xs font-mono">MALE</code> or <code className="bg-red-100 px-1.5 py-0.5 rounded text-xs font-mono">FEMALE</code></span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-red-600 mt-1">•</span>
                                <span><strong>Grade values:</strong> Must be exactly <code className="bg-red-100 px-1.5 py-0.5 rounded text-xs font-mono">Grade 1</code> through <code className="bg-red-100 px-1.5 py-0.5 rounded text-xs font-mono">Grade 12</code></span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-emerald-600 mt-1">•</span>
                                <span><strong>Note:</strong> All students created by admins will be automatically set to <code className="bg-emerald-100 px-1.5 py-0.5 rounded text-xs font-mono">APPROVED</code> status</span>
                              </li>
                            </>
                          )}
                          <li className="flex items-start gap-2">
                            <span className="text-red-600 mt-1">•</span>
                            <span><strong>Do not modify</strong> the column headers in the template</span>
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
                              .filter((r) => r.status === "error")
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
            )}
          </div>
        </div>
      </div>
    </>
  );
}
