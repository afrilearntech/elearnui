"use client";

import { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import { createTeacherLesson, getSubjectsForSelect, getTeacherTopics, SubjectOption, TeacherTopic } from "@/lib/api/parent-teacher/teacher";
import { showErrorToast, showSuccessToast } from "@/lib/toast";

const LESSON_TYPES = ["VIDEO", "AUDIO", "PDF", "PPT", "DOC"];

interface CreateLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateLessonModal({ isOpen, onClose, onSuccess }: CreateLessonModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const thumbnailInputRef = useRef<HTMLInputElement | null>(null);

  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [allTopics, setAllTopics] = useState<TeacherTopic[]>([]);
  const [topics, setTopics] = useState<TeacherTopic[]>([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [lessonType, setLessonType] = useState<string>("VIDEO");
  const [subjectId, setSubjectId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [period, setPeriod] = useState("1");
  const [duration, setDuration] = useState("");

  const [resourceFile, setResourceFile] = useState<File | null>(null);
  const [resourcePreview, setResourcePreview] = useState<string | null>(null);
  const [resourceName, setResourceName] = useState("");

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchSubjectsList();
      fetchAllTopics();
    }
  }, [isOpen]);

  useEffect(() => {
    if (subjectId && allTopics.length > 0) {
      // Filter topics by selected subject
      const filteredTopics = allTopics.filter(topic => topic.subject === Number(subjectId));
      setTopics(filteredTopics);
      setTopicId(""); // Reset topic selection when subject changes
    } else {
      setTopics([]);
      setTopicId("");
    }
  }, [subjectId, allTopics]);

  useEffect(() => {
    return () => {
      if (resourcePreview) URL.revokeObjectURL(resourcePreview);
      if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    };
  }, [resourcePreview, thumbnailPreview]);

  async function fetchSubjectsList() {
    try {
      setIsLoadingSubjects(true);
      const data = await getSubjectsForSelect();
      setSubjects(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load subjects.";
      showErrorToast(message);
    } finally {
      setIsLoadingSubjects(false);
    }
  }

  async function fetchAllTopics() {
    try {
      setIsLoadingTopics(true);
      const data = await getTeacherTopics();
      setAllTopics(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load topics.";
      showErrorToast(message);
      setAllTopics([]);
    } finally {
      setIsLoadingTopics(false);
    }
  }

  function handleResourceChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setResourceFile(file);
    setResourceName(file.name);
    setResourcePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  }

  function handleThumbnailChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setThumbnailFile(file);
    setThumbnailPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  }

  function removeResourceFile() {
    if (resourcePreview) URL.revokeObjectURL(resourcePreview);
    setResourcePreview(null);
    setResourceFile(null);
    setResourceName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeThumbnailFile() {
    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    setThumbnailPreview(null);
    setThumbnailFile(null);
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
  }

  function resetForm() {
    setTitle("");
    setDescription("");
    setLessonType("VIDEO");
    setSubjectId("");
    setTopicId("");
    setPeriod("1");
    setDuration("");
    removeResourceFile();
    removeThumbnailFile();
  }

  async function handleSubmit() {
    if (isSubmitting) return;

    if (!title.trim()) {
      showErrorToast("Lesson title is required.");
      return;
    }
    if (!subjectId) {
      showErrorToast("Please select a subject.");
      return;
    }
    if (!topicId) {
      showErrorToast("Please select a topic.");
      return;
    }
    if (!lessonType) {
      showErrorToast("Please select a lesson type.");
      return;
    }
    if (!resourceFile) {
      showErrorToast("Please upload the lesson resource.");
      return;
    }
    if (!duration || Number(duration) <= 0) {
      showErrorToast("Please provide the estimated duration in minutes.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createTeacherLesson({
        subject: Number(subjectId),
        topic: Number(topicId),
        period: Number(period) || 1,
        title: title.trim(),
        description: description.trim(),
        type: lessonType,
        status: "PENDING", // Status is PENDING when created, will be APPROVED when approved by validators
        resource: resourceFile,
        thumbnail: thumbnailFile || null,
        moderation_comment: "",
        duration_minutes: Number(duration),
      });

      showSuccessToast("Lesson created successfully! It will be reviewed and approved.");
      resetForm();
      onSuccess();
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create lesson.";
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
            <h2 className="text-2xl font-bold text-gray-900">Create Lesson</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Icon icon="solar:close-circle-bold" className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Lesson Title */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">
              Lesson Title<span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Introduction to Algebra"
              className="w-full h-11 rounded-lg border border-gray-300 px-4 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Subject, Topic, Lesson type */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  Subject<span className="text-red-600">*</span>
                </label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full h-11 rounded-lg border border-gray-300 px-3 text-gray-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">{isLoadingSubjects ? "Loading subjects..." : "Select subject"}</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name} • {subject.grade}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  Topic<span className="text-red-600">*</span>
                </label>
                <select
                  value={topicId}
                  onChange={(e) => setTopicId(e.target.value)}
                  disabled={!subjectId || isLoadingTopics}
                  className="w-full h-11 rounded-lg border border-gray-300 px-3 text-gray-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:bg-gray-50"
                >
                  <option value="">
                    {!subjectId ? "Select a subject first" : isLoadingTopics ? "Loading topics..." : topics.length === 0 ? "No topics available" : "Select topic"}
                  </option>
                  {topics.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  Lesson Type<span className="text-red-600">*</span>
                </label>
                <select
                  value={lessonType}
                  onChange={(e) => setLessonType(e.target.value)}
                  className="w-full h-11 rounded-lg border border-gray-300 px-3 text-gray-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                >
                  {LESSON_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">Period</label>
                  <input
                    type="number"
                    min={1}
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    placeholder="e.g. 1"
                    className="w-full h-11 rounded-lg border border-gray-300 px-3 text-gray-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    Duration (minutes)<span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g. 45"
                    className="w-full h-11 rounded-lg border border-gray-300 px-3 text-gray-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">Lesson Description</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Write a detailed description for the lesson"
              className="w-full resize-y rounded-lg border border-gray-300 p-4 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Upload Resource */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">
              Upload Lesson Resource<span className="text-red-600">*</span>
            </label>
            <div className="rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50 p-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <Icon icon="solar:upload-bold" className="w-6 h-6" />
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Upload the lesson file (video, PPT, PDF, DOC). The backend stores the file securely.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,application/msword,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.wordprocessingml.document,video/*,audio/*"
                className="hidden"
                onChange={handleResourceChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Choose File
              </button>
              {resourceName && (
                <div className="mt-3 text-sm text-gray-700">Selected: {resourceName}</div>
              )}
            </div>

            {resourcePreview && (
              <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-900">Resource preview</div>
                  <button
                    type="button"
                    onClick={removeResourceFile}
                    className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                  >
                    <Icon icon="solar:trash-bin-trash-bold" className="w-4 h-4" />
                    Remove
                  </button>
                </div>
                {lessonType === "VIDEO" ? (
                  <video src={resourcePreview} controls className="mx-auto h-56 w-full max-w-3xl rounded-lg bg-black" />
                ) : (
                  <div className="rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50 p-6 text-center">
                    <div className="mx-auto my-6 flex h-40 w-full max-w-3xl items-center justify-center rounded-lg bg-white text-gray-600">
                      <div>
                        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                          <Icon icon="solar:document-bold" className="w-5 h-5" />
                        </div>
                        <div className="text-sm">Document Preview</div>
                        <div className="text-xs text-gray-500">{resourceName}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Upload Thumbnail */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">Cover Thumbnail (optional)</label>
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
              <p className="mt-2 text-xs text-gray-500">PNG or JPG, any size.</p>
            </div>
            {thumbnailPreview && (
              <div className="mt-4">
                <img
                  src={thumbnailPreview}
                  alt="Lesson thumbnail preview"
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
            {isSubmitting ? "Creating..." : "Create Lesson"}
          </button>
        </div>
      </div>
    </div>
  );
}

