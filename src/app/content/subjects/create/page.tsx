"use client";

import Link from "next/link";
import React from "react";
import { useRouter } from "next/navigation";
import { createSubject, createTopic, getTopics, getSubjectById, updateSubject } from "@/lib/api/content/subjects";
import { showErrorToast, showSuccessToast } from "@/lib/toast";

type Topic = {
  id: string;
  title: string;
  description?: string;
  expanded?: boolean;
  apiId?: number;
};

function Stepper({ active }: { active: 1 | 2 | 3 }) {
  const steps = [
    { id: 1, label: "Subject Details" },
    { id: 2, label: "Topics" },
    { id: 3, label: "Publish" },
  ];
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4">
      <ol className="flex w-full items-center justify-between">
        {steps.map((s, idx) => (
          <li key={s.id} className="flex items-center gap-2 sm:gap-3">
            <span className={`flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full text-xs sm:text-sm font-semibold ${idx + 1 <= active ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-600"}`}>{s.id}</span>
            <span className={`text-xs sm:text-sm ${idx + 1 === active ? "text-gray-900 font-medium" : "text-gray-500"}`}>{s.label}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function CreateSubjectPage() {
  const router = useRouter();
  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [name, setName] = React.useState("");
  const [grade, setGrade] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [objectivesList, setObjectivesList] = React.useState<string[]>([]);
  const [currentObjective, setCurrentObjective] = React.useState("");
  const [activeStatus, setActiveStatus] = React.useState(true);
  const [coverPreview, setCoverPreview] = React.useState<string | null>(null);
  const [coverName, setCoverName] = React.useState<string>("");
  const [coverError, setCoverError] = React.useState<string>("");
  const [coverFile, setCoverFile] = React.useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [showModal, setShowModal] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [subjectId, setSubjectId] = React.useState<number | null>(null);
  const [isCreatingSubject, setIsCreatingSubject] = React.useState(false);
  const [isLoadingTopics, setIsLoadingTopics] = React.useState(false);
  const [isLoadingSubject, setIsLoadingSubject] = React.useState(false);
  const [subjectData, setSubjectData] = React.useState<any>(null);

  const [topics, setTopics] = React.useState<Topic[]>([]);
  const [showTopicModal, setShowTopicModal] = React.useState(false);
  const [topicTitle, setTopicTitle] = React.useState("");
  const [topicDesc, setTopicDesc] = React.useState("");
  const [isCreatingTopic, setIsCreatingTopic] = React.useState(false);

  function onChooseFileClick() {
    fileInputRef.current?.click();
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverError("");
    if (file.size > 10 * 1024 * 1024) {
      setCoverError("File too large (max 10MB)");
      setCoverPreview(null);
      setCoverName("");
      setCoverFile(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setCoverPreview(url);
    setCoverName(file.name);
    setCoverFile(file);
  }

  function onRemoveFile() {
    if (coverPreview) {
      URL.revokeObjectURL(coverPreview);
    }
    setCoverPreview(null);
    setCoverName("");
    setCoverError("");
    setCoverFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function fetchTopics(subjectIdParam: number, token: string) {
    setIsLoadingTopics(true);
    try {
      const topicsData = await getTopics(token, subjectIdParam);
      const mappedTopics: Topic[] = topicsData.map((t) => ({
        id: t.id.toString(),
        title: t.name,
        description: "",
        expanded: false,
        apiId: t.id,
      }));
      setTopics(mappedTopics);
    } catch (error) {
      console.error("Failed to fetch topics:", error);
    } finally {
      setIsLoadingTopics(false);
    }
  }

  async function addTopic() {
    if (!topicTitle.trim()) return;
    if (!subjectId) {
      showErrorToast("Subject must be created first");
      return;
    }

    setIsCreatingTopic(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      if (!token) {
        showErrorToast("Missing authentication token. Please sign in again.");
        setIsCreatingTopic(false);
        return;
      }

      await createTopic(
        {
          subject: subjectId,
          name: topicTitle.trim(),
        },
        token
      );

      await fetchTopics(subjectId, token);
      setShowTopicModal(false);
      setTopicTitle("");
      setTopicDesc("");
      showSuccessToast("Topic added successfully");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create topic. Please try again.";
      showErrorToast(message);
    } finally {
      setIsCreatingTopic(false);
    }
  }

  function toggleTopic(id: string) {
    setTopics((prev) => prev.map((t) => (t.id === id ? { ...t, expanded: !t.expanded } : t)));
  }

  function removeTopic(id: string) {
    setTopics((prev) => prev.filter((t) => t.id !== id));
  }

  function getStatusValue() {
    return "DRAFT";
  }

  function getObjectivesString(): string {
    return objectivesList
      .map((item) => String(item).trim())
      .filter((item) => item.length > 0)
      .join(", ");
  }

  function addObjective() {
    if (!currentObjective.trim()) return;
    setObjectivesList((prev) => [...prev, currentObjective.trim()]);
    setCurrentObjective("");
  }

  function removeObjective(index: number) {
    setObjectivesList((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleStep1Next() {
    if (!name.trim()) {
      showErrorToast("Subject name is required.");
      return;
    }
    if (!grade) {
      showErrorToast("Please select a grade level.");
      return;
    }

    if (subjectId) {
      setStep(2);
      return;
    }

    setIsCreatingSubject(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      if (!token) {
        showErrorToast("Missing authentication token. Please sign in again.");
        setIsCreatingSubject(false);
        return;
      }

    if (!grade) {
      showErrorToast("Please select a grade level.");
      setIsCreatingSubject(false);
      return;
    }

      const objectivesString = getObjectivesString();
      
      const payload = {
        name: name.trim(),
        grade: grade,
        status: "DRAFT",
        description: description.trim() || "",
        thumbnail: coverFile || null,
        objectives: objectivesString,
      };

      const response = await createSubject(payload, token);
      if (response && response.id) {
        const newSubjectId = response.id;
        setSubjectId(newSubjectId);
        try {
          await fetchTopics(newSubjectId, token);
        } catch (error) {
          console.error("Failed to fetch topics:", error);
        }
        setStep(2);
        showSuccessToast("Subject created. Now add topics.");
      } else {
        console.error("Invalid response format:", response);
        showErrorToast("Subject created but failed to get subject ID. Please refresh and try again.");
      }
    } catch (error) {
      let message = "Unable to create subject. Please try again.";
      if (error instanceof Error) {
        message = error.message;
        if (error.name === "ApiClientError" && (error as any).errors) {
          const apiErrors = (error as any).errors;
          const errorMessages = Object.entries(apiErrors)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
            .join("; ");
          message = errorMessages || message;
        }
      }
      showErrorToast(message);
      console.error("Subject creation error:", error);
    } finally {
      setIsCreatingSubject(false);
    }
  }

  React.useEffect(() => {
    if (step === 2 && subjectId) {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      if (token) {
        fetchTopics(subjectId, token);
      }
    }
  }, [step, subjectId]);

  React.useEffect(() => {
    if (step === 3 && subjectId) {
      const fetchSubjectData = async () => {
        setIsLoadingSubject(true);
        try {
          const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
          if (!token) {
            showErrorToast("Missing authentication token. Please sign in again.");
            return;
          }
          const data = await getSubjectById(subjectId, token);
          setSubjectData(data);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unable to load subject details.";
          showErrorToast(message);
        } finally {
          setIsLoadingSubject(false);
        }
      };
      fetchSubjectData();
    }
  }, [step, subjectId]);

  async function handlePublish() {
    if (isSubmitting || !subjectId) return;

    setIsSubmitting(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      if (!token) {
        showErrorToast("Missing authentication token. Please sign in again.");
        setIsSubmitting(false);
        return;
      }

      await updateSubject(
        subjectId,
        {
          status: "PENDING",
        },
        token
      );

      showSuccessToast("Subject published successfully.");
      setShowModal(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to publish subject. Please try again.";
      showErrorToast(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Create New Subject</h1>
          <p className="text-sm text-gray-500">
            {step === 1
              ? "Fill in the details to create a subject"
              : step === 2
              ? "Add and organize the topics for the subject"
              : "Preview and review all details before publishing"}
          </p>
        </div>
        <div className="hidden gap-3 sm:flex">
          <button
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            type="button"
            disabled={isSubmitting}
          >
            Save Draft
          </button>
          {step === 1 && (
            <button 
              onClick={handleStep1Next} 
              disabled={isCreatingSubject}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isCreatingSubject ? "Creating..." : "Next Step"}
            </button>
          )}
          {step === 2 && (
            <button onClick={() => setStep(3)} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">Next Step</button>
          )}
          {step === 3 && (
            <button
              type="button"
              onClick={handlePublish}
              disabled={isSubmitting}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Publishing..." : "Publish"}
            </button>
          )}
        </div>
      </div>

      <div className="mx-auto w-full max-w-4xl space-y-6">
        <Stepper active={step} />

        {step === 1 ? (
        /* Form */
        <form className="space-y-6">
        {/* Subject Name */}
        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <label className="mb-2 block text-sm font-medium text-gray-800">Subject Name</label>
          <input value={name} onChange={(e)=>setName(e.target.value)} type="text" placeholder="eg. Maths" className="h-11 w-full max-w-3xl rounded-lg border border-gray-300 px-4 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"/>
          <div className="mt-4 max-w-3xl">
            <label className="mb-2 block text-sm font-medium text-gray-800">Grade level</label>
            <select value={grade} onChange={(e)=>setGrade(e.target.value)} className="h-11 w-full rounded-lg border border-gray-300 px-3 text-gray-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500">
              <option value="">Select grade</option>
              {Array.from({length:12}).map((_,i)=>(<option key={i+1} value={`GRADE ${i+1}`}>{`GRADE ${i+1}`}</option>))}
            </select>
          </div>
        </section>

        {/* Description */}
        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <label className="mb-2 block text-sm font-medium text-gray-800">Subject Description</label>
          <textarea value={description} onChange={(e)=>setDescription(e.target.value)} rows={6} placeholder="Write a detailed description for the subject" className="w-full max-w-3xl resize-y rounded-lg border border-gray-300 p-4 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"/>
        </section>

        {/* Objectives */}
        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-3">
            <label className="text-sm font-medium text-gray-800">Learning Objectives</label>
            <span className="text-xs text-gray-500 ml-2">(Optional)</span>
          </div>
          
          {objectivesList.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {objectivesList.map((obj, idx) => (
                <div key={idx} className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm text-emerald-700 border border-emerald-200">
                  <span>{obj}</span>
                  <button
                    type="button"
                    onClick={() => removeObjective(idx)}
                    className="ml-1 rounded-full hover:bg-emerald-100 p-0.5"
                    aria-label="Remove objective"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={currentObjective}
              onChange={(e) => setCurrentObjective(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addObjective();
                }
              }}
              placeholder="Enter an objective and press Enter or click Add"
              className="flex-1 h-11 rounded-lg border border-gray-300 px-4 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="button"
              onClick={addObjective}
              disabled={!currentObjective.trim()}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </div>
        </section>

        {/* Status */}
        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <label className="mb-2 block text-sm font-medium text-gray-800">Status</label>
          <div className="flex max-w-3xl items-center justify-between rounded-lg px-3 py-2">
            <p className="text-sm text-gray-600">Active Subjects are visible to validator; draft are hidden</p>
            <label className="inline-flex cursor-pointer items-center">
              <input type="checkbox" className="peer sr-only" checked={activeStatus} onChange={(e)=>setActiveStatus(e.target.checked)} />
              <span className="h-6 w-11 rounded-full bg-gray-300 transition peer-checked:bg-emerald-500"></span>
              <span className="-ml-8 h-5 w-5 translate-x-0 rounded-full bg-white transition peer-checked:translate-x-5"></span>
            </label>
          </div>
        </section>

        {/* Cover Image */}
        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <label className="mb-2 block text-sm font-medium text-gray-800">Cover Image (subject thumbnail)</label>
          <div className="max-w-3xl rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50 p-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 16l-4-4-4 4"/><path d="M12 12V3"/><path d="M20 21H4"/></svg>
            </div>
            <p className="text-sm text-gray-600">Please select or drag and drop PNG, JPG, GIF</p>
            <p className="text-xs text-gray-500">UP TO 10MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/gif"
              className="hidden"
              onChange={onFileChange}
            />
            <button type="button" onClick={onChooseFileClick} className="mt-4 rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700">Choose File</button>
            {coverName ? (
              <div className="mt-4 flex items-center justify-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  <span className="max-w-[280px] truncate">{coverName}</span>
                  <button type="button" aria-label="Remove file" onClick={onRemoveFile} className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              </div>
            ) : null}
            {coverError ? (
              <div className="mt-2 text-sm text-red-600">{coverError}</div>
            ) : null}
            {coverPreview ? (
              <div className="mt-4">
                {/* preview image */}
                <img src={coverPreview} alt="Cover preview" className="mx-auto h-40 w-auto rounded-md object-contain" />
              </div>
            ) : null}
          </div>
        </section>

        {/* Mobile Actions */}
        <div className="flex gap-3 sm:hidden">
          <button
            type="button"
            className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            disabled={isSubmitting}
          >
            Save Draft
          </button>
          {step === 1 ? (
            <button 
              onClick={handleStep1Next} 
              disabled={isCreatingSubject}
              className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isCreatingSubject ? "Creating..." : "Next Step"}
            </button>
          ) : null}
        </div>

        {/* Back link */}
        <div>
          <Link href="/subjects" className="text-sm text-emerald-700 hover:underline">Back to Subjects</Link>
        </div>
        </form>
        ) : step === 2 ? (
          <section className="space-y-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <h3 className="mb-3 text-base font-semibold text-gray-900">Added Subject</h3>
              <div className="space-y-3">
                {isLoadingTopics ? (
                  <div className="text-sm text-gray-600">Loading topics...</div>
                ) : topics.length === 0 ? (
                  <div className="text-sm text-gray-600">No topics added yet.</div>
                ) : (
                  topics.map((t) => (
                    <div key={t.id} className="rounded-lg border border-gray-200">
                      <button type="button" onClick={() => toggleTopic(t.id)} className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-left">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-3 w-3 items-center justify-center rounded-full bg-emerald-600"></span>
                          <span className="text-sm text-gray-800">{t.title}</span>
                        </div>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                          {t.expanded ? (<polyline points="18 15 12 9 6 15" />) : (<polyline points="6 9 12 15 18 9" />)}
                        </svg>
                      </button>
                      {t.expanded && t.description ? (
                        <div className="px-4 pb-4 text-sm text-gray-600">{t.description}</div>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowTopicModal(true);
                }} 
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50 px-4 py-6 text-emerald-700 hover:bg-emerald-100"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                <span className="font-medium">Add New Topic</span>
              </button>
            </div>
            <div className="flex justify-between">
              <button 
                type="button"
                onClick={() => setStep(1)} 
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
              <button 
                type="button"
                onClick={() => setStep(3)} 
                disabled={isLoadingTopics}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoadingTopics ? "Loading..." : "Next Step"}
              </button>
            </div>
          </section>
        ) : (
          <section className="space-y-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 sm:p-4 text-xs sm:text-sm text-emerald-700">
              This is how your subject will appear to students. Review all details before publishing
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              {isLoadingSubject ? (
                <div className="text-center py-8 text-sm text-gray-600">Loading subject details...</div>
              ) : subjectData ? (
                <>
                  {subjectData.thumbnail ? (
                    <img src={subjectData.thumbnail} alt="cover" className="mx-auto h-48 sm:h-64 w-full max-w-3xl rounded-lg object-cover" />
                  ) : coverPreview ? (
                    <img src={coverPreview} alt="cover" className="mx-auto h-48 sm:h-64 w-full max-w-3xl rounded-lg object-cover" />
                  ) : null}
                  <h2 className="mt-4 text-xl sm:text-2xl font-semibold text-gray-900">{subjectData.name || "Untitled Subject"}</h2>
                  <div className="mt-2 flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-gray-700">
                    {subjectData.grade ? <span>{subjectData.grade}</span> : null}
                    <span className={`rounded-full px-2 py-0.5 text-xs ${subjectData.status === "PENDING" || subjectData.status === "APPROVED" || subjectData.status === "VALIDATED" ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-600"}`}>
                      {subjectData.status === "PENDING" ? "Pending" : subjectData.status === "APPROVED" || subjectData.status === "VALIDATED" ? "Approved" : "Draft"}
                    </span>
                  </div>
                  {subjectData.description ? (
                    <div className="mt-6">
                      <h3 className="text-base font-semibold text-gray-900">Subject Description</h3>
                      <p className="mt-2 text-sm leading-6 text-gray-700 whitespace-pre-wrap">{subjectData.description}</p>
                    </div>
                  ) : null}
                  {subjectData.objectives && subjectData.objectives.length > 0 ? (
                    <div className="mt-6">
                      <h3 className="text-base font-semibold text-gray-900">Learning Objectives</h3>
                      <ul className="mt-2 space-y-2">
                        {subjectData.objectives.map((obj: string, idx: number) => (
                          <li key={idx} className="text-sm leading-6 text-gray-700 flex items-start gap-2">
                            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                              {idx + 1}
                            </span>
                            <span>{obj}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </>
              ) : (
                <>
                  {coverPreview ? (
                    <img src={coverPreview} alt="cover" className="mx-auto h-48 sm:h-64 w-full max-w-3xl rounded-lg object-cover" />
                  ) : null}
                  <h2 className="mt-4 text-xl sm:text-2xl font-semibold text-gray-900">{name || "Untitled Subject"}</h2>
                  <div className="mt-2 flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-gray-700">
                    {grade ? <span>{grade}</span> : null}
                    <span className={`rounded-full px-2 py-0.5 text-xs ${activeStatus ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-600"}`}>{activeStatus ? "Active" : "Draft"}</span>
                  </div>
                  {description ? (
                    <div className="mt-6">
                      <h3 className="text-base font-semibold text-gray-900">Subject Description</h3>
                      <p className="mt-2 text-sm leading-6 text-gray-700 whitespace-pre-wrap">{description}</p>
                    </div>
                  ) : null}
                  {objectivesList.length > 0 ? (
                    <div className="mt-6">
                      <h3 className="text-base font-semibold text-gray-900">Learning Objectives</h3>
                      <ul className="mt-2 space-y-2">
                        {objectivesList.map((obj, idx) => (
                          <li key={idx} className="text-sm leading-6 text-gray-700 flex items-start gap-2">
                            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                              {idx + 1}
                            </span>
                            <span>{obj}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </>
              )}

              {subjectData && subjectData.topics && subjectData.topics.length > 0 ? (
                <div className="mt-6">
                  <h3 className="text-base font-semibold text-gray-900">Topics</h3>
                  <div className="mt-3 space-y-3">
                    {subjectData.topics.map((t: { id: number; name: string }) => (
                      <div key={t.id} className="rounded-lg border border-gray-200">
                        <div className="flex w-full items-center justify-between rounded-lg px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex h-3 w-3 items-center justify-center rounded-full bg-emerald-600"></span>
                            <span className="text-sm text-gray-800">{t.name}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : topics.length > 0 ? (
                <div className="mt-6">
                  <h3 className="text-base font-semibold text-gray-900">Topics</h3>
                  <div className="mt-3 space-y-3">
                    {topics.map((t) => (
                      <div key={t.id} className="rounded-lg border border-gray-200">
                        <button type="button" onClick={() => toggleTopic(t.id)} className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-left">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex h-3 w-3 items-center justify-center rounded-full bg-emerald-600"></span>
                            <span className="text-sm text-gray-800">{t.title}</span>
                          </div>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                            {t.expanded ? (<polyline points="18 15 12 9 6 15" />) : (<polyline points="6 9 12 15 18 9" />)}
                          </svg>
                        </button>
                        {t.expanded && t.description ? (
                          <div className="px-4 pb-4 text-sm text-gray-600">{t.description}</div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                disabled={isSubmitting}
              >
                Back
              </button>
              <button
                type="button"
                onClick={handlePublish}
                disabled={isSubmitting}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Publishing..." : "Publish"}
              </button>
            </div>
          </section>
        )}
      </div>

      {showModal ? (
        <div className="fixed inset-0 z-100 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div role="dialog" aria-modal="true" className="relative z-101 w-[90%] max-w-sm rounded-xl bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <h3 className="text-base font-semibold text-gray-900">Submitted Successfully</h3>
            <p className="mt-2 text-sm text-gray-600">Your subject has been submitted and will be reviewed for validation before it can be published. You'll receive a notification once the review is complete.</p>
            <button onClick={() => router.push('/subjects')} className="mt-5 inline-flex items-center justify-center rounded-full bg-emerald-600 px-6 py-2 text-sm font-semibold text-white hover:bg-emerald-700">Okay</button>
          </div>
        </div>
      ) : null}

      {showTopicModal ? (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowTopicModal(false);
            }} 
          />
          <div 
            className="relative z-101 w-full max-w-xl rounded-xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">Add Topic</h2>
              <button 
                type="button"
                aria-label="Close" 
                onClick={() => setShowTopicModal(false)} 
                className="rounded-full p-1 text-gray-500 hover:bg-gray-100"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-800">Add Topic</label>
                <input value={topicTitle} onChange={(e)=>setTopicTitle(e.target.value)} placeholder="Introduction to Algebra" className="h-11 w-full rounded-lg border border-gray-300 px-4 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-800">Topic Description</label>
                </div>
                <textarea value={topicDesc} onChange={(e)=>setTopicDesc(e.target.value)} rows={6} placeholder="Learn how letters and numbers work together to solve simple math problems." className="w-full resize-y rounded-lg border border-gray-300 p-4 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500" />
              </div>
              <button 
                type="button"
                onClick={addTopic} 
                disabled={isCreatingTopic}
                className="mt-2 w-full rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isCreatingTopic ? "Adding..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}


