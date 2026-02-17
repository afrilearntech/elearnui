"use client";

import { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import { createTeacherSubject } from "@/lib/api/parent-teacher/teacher";
import { showErrorToast, showSuccessToast } from "@/lib/toast";

const GRADES = Array.from({ length: 12 }, (_, i) => `GRADE ${i + 1}`);

interface CreateSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateSubjectModal({ isOpen, onClose, onSuccess }: CreateSubjectModalProps) {
  const thumbnailInputRef = useRef<HTMLInputElement | null>(null);

  const [name, setName] = useState("");
  const [grade, setGrade] = useState("");
  const [description, setDescription] = useState("");
  const [objectivesList, setObjectivesList] = useState<string[]>([]);
  const [currentObjective, setCurrentObjective] = useState("");

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    return () => {
      if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    };
  }, [thumbnailPreview]);

  function handleThumbnailChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (file.size > 10 * 1024 * 1024) {
      showErrorToast("File too large (max 10MB)");
      return;
    }
    
    setThumbnailFile(file);
    setThumbnailPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  }

  function removeThumbnailFile() {
    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    setThumbnailPreview(null);
    setThumbnailFile(null);
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
  }

  function addObjective() {
    if (!currentObjective.trim()) return;
    setObjectivesList((prev) => [...prev, currentObjective.trim()]);
    setCurrentObjective("");
  }

  function removeObjective(index: number) {
    setObjectivesList((prev) => prev.filter((_, i) => i !== index));
  }

  function getObjectivesString(): string {
    return objectivesList
      .map((item) => String(item).trim())
      .filter((item) => item.length > 0)
      .join(", ");
  }

  function resetForm() {
    setName("");
    setGrade("");
    setDescription("");
    setObjectivesList([]);
    setCurrentObjective("");
    removeThumbnailFile();
  }

  async function handleSubmit() {
    if (isSubmitting) return;

    if (!name.trim()) {
      showErrorToast("Subject name is required.");
      return;
    }
    if (!grade) {
      showErrorToast("Please select a grade level.");
      return;
    }
    if (!description.trim()) {
      showErrorToast("Subject description is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createTeacherSubject({
        name: name.trim(),
        grade: grade,
        status: "PENDING", // Status is PENDING when created, will be APPROVED when approved
        description: description.trim(),
        thumbnail: thumbnailFile || null,
        moderation_comment: "",
        objectives: getObjectivesString(),
      });

      showSuccessToast("Subject created successfully! It will be reviewed and approved.");
      resetForm();
      onSuccess();
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create subject.";
      showErrorToast(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-200">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Create Subject</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Icon icon="solar:close-circle-bold" className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Subject Name */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">
              Subject Name<span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mathematics"
              className="w-full h-11 rounded-lg border border-gray-300 px-4 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Grade Level */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">
              Grade Level<span className="text-red-600">*</span>
            </label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-full h-11 rounded-lg border border-gray-300 px-3 text-gray-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Select grade</option>
              {GRADES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">
              Subject Description<span className="text-red-600">*</span>
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Write a detailed description for the subject"
              className="w-full resize-y rounded-lg border border-gray-300 p-4 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Learning Objectives */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">
              Learning Objectives
            </label>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentObjective}
                  onChange={(e) => setCurrentObjective(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addObjective();
                    }
                  }}
                  placeholder="Enter a learning objective"
                  className="flex-1 h-11 rounded-lg border border-gray-300 px-4 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={addObjective}
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <Icon icon="solar:add-circle-bold" className="w-5 h-5" />
                </button>
              </div>
              {objectivesList.length > 0 && (
                <div className="space-y-2">
                  {objectivesList.map((objective, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2"
                    >
                      <span className="text-sm text-gray-700">{objective}</span>
                      <button
                        type="button"
                        onClick={() => removeObjective(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Icon icon="solar:trash-bin-trash-bold" className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Upload Thumbnail */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">
              Cover Thumbnail (optional)
            </label>
            <div className="rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50 p-6 text-center">
              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                className="hidden"
                onChange={handleThumbnailChange}
              />
              <button
                type="button"
                onClick={() => thumbnailInputRef.current?.click()}
                className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-emerald-700 shadow hover:bg-gray-50"
              >
                Upload Thumbnail
              </button>
              <p className="mt-2 text-xs text-gray-500">PNG or JPG, max 10MB</p>
            </div>
            {thumbnailPreview && (
              <div className="mt-4">
                <img
                  src={thumbnailPreview}
                  alt="Subject thumbnail preview"
                  className="mx-auto h-48 w-full max-w-2xl rounded-lg object-cover"
                />
                <button
                  onClick={removeThumbnailFile}
                  type="button"
                  className="mt-3 text-sm font-medium text-red-600 hover:underline"
                >
                  Remove image
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? "Creating..." : "Create Subject"}
          </button>
        </div>
      </div>
    </div>
  );
}

