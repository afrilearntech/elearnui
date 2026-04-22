"use client";

import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { getQuestions, createQuestion, Question, CreateQuestionRequest } from "@/lib/api/parent-teacher/teacher";
import { showSuccessToast, showErrorToast, formatErrorMessage } from "@/lib/toast";
import { ApiClientError } from "@/lib/api/client";

interface AddQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  assessmentId: number;
  assessmentType: "general" | "lesson";
  assessmentTitle: string;
  onQuestionAdded?: () => void;
}

const QUESTION_TYPES = [
  { value: "MULTIPLE_CHOICE", label: "Multiple Choice" },
  { value: "TRUE_FALSE", label: "True/False" },
  { value: "SHORT_ANSWER", label: "Short Answer" },
  { value: "ESSAY", label: "Essay" },
  { value: "FILL_IN_THE_BLANK", label: "Fill in the Blank" },
] as const;

export default function AddQuestionsModal({
  isOpen,
  onClose,
  assessmentId,
  assessmentType,
  assessmentTitle,
  onQuestionAdded,
}: AddQuestionsModalProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateQuestionRequest>({
    type: "MULTIPLE_CHOICE",
    question: "",
    answer: "",
    options: ["", "", "", ""],
    ...(assessmentType === "general"
      ? { general_assessment_id: assessmentId }
      : { lesson_assessment_id: assessmentId }),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      fetchQuestions();
      setFormData({
        type: "MULTIPLE_CHOICE",
        question: "",
        answer: "",
        options: ["", "", "", ""],
        ...(assessmentType === "general"
          ? { general_assessment_id: assessmentId }
          : { lesson_assessment_id: assessmentId }),
      });
      setErrors({});
    }
  }, [isOpen, assessmentId, assessmentType]);

  const fetchQuestions = async () => {
    setIsLoadingQuestions(true);
    try {
      const params =
        assessmentType === "general"
          ? { general_assessment_id: assessmentId }
          : { lesson_assessment_id: assessmentId };
      const data = await getQuestions(params);
      setQuestions(data);
    } catch (error) {
      console.error("Error fetching questions:", error);
      showErrorToast("Failed to load questions. Please try again.");
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    setFormData((prev) => {
      const newOptions = [...(prev.options || [])];
      newOptions[index] = value;
      return { ...prev, options: newOptions };
    });
  };

  const addOption = () => {
    setFormData((prev) => ({
      ...prev,
      options: [...(prev.options || []), ""],
    }));
  };

  const removeOption = (index: number) => {
    setFormData((prev) => {
      const newOptions = [...(prev.options || [])];
      newOptions.splice(index, 1);
      return { ...prev, options: newOptions };
    });
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as CreateQuestionRequest["type"];
    setFormData((prev) => ({
      ...prev,
      type: newType,
      options: 
        newType === "MULTIPLE_CHOICE" ? ["", "", "", ""] :
        newType === "TRUE_FALSE" ? ["True", "False"] :
        newType === "FILL_IN_THE_BLANK" ? [] :
        undefined,
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.question.trim()) {
      newErrors.question = "Question is required";
    }

    if (!formData.answer.trim()) {
      newErrors.answer = "Answer is required";
    }

    if (formData.type === "MULTIPLE_CHOICE") {
      if (!formData.options || formData.options.length < 2) {
        newErrors.options = "At least 2 options are required";
      } else {
        const validOptions = formData.options.filter((opt) => opt.trim() !== "");
        if (validOptions.length < 2) {
          newErrors.options = "At least 2 options are required";
        }
        if (!formData.options.includes(formData.answer)) {
          newErrors.answer = "Answer must be one of the options";
        }
      }
    }

    if (formData.type === "TRUE_FALSE") {
      if (formData.answer.toUpperCase() !== "TRUE" && formData.answer.toUpperCase() !== "FALSE") {
        newErrors.answer = "Answer must be 'True' or 'False'";
      }
      // TRUE_FALSE questions require options - ensure they're set
      if (!formData.options || formData.options.length < 2 || 
          !formData.options.includes("True") || !formData.options.includes("False")) {
        // Auto-fix: set options if missing
        if (!formData.options || formData.options.length < 2) {
          setFormData(prev => ({ ...prev, options: ["True", "False"] }));
        }
      }
    }

    if (formData.type === "FILL_IN_THE_BLANK") {
      // FILL_IN_THE_BLANK requires options (possible answers/choices)
      const validOptions = formData.options?.filter((opt) => opt.trim() !== "") || [];
      if (validOptions.length === 0) {
        newErrors.options = "At least one option is required for Fill in the Blank questions.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Prepare options based on question type
      let optionsToInclude: string[] | undefined = undefined;
      if (formData.type === "MULTIPLE_CHOICE" && formData.options) {
        optionsToInclude = formData.options.filter((opt) => opt.trim() !== "");
      } else if (formData.type === "TRUE_FALSE") {
        // Always include True/False options for TRUE_FALSE questions
        optionsToInclude = formData.options && formData.options.length >= 2 
          ? formData.options 
          : ["True", "False"];
      } else if (formData.type === "FILL_IN_THE_BLANK" && formData.options && formData.options.length > 0) {
        optionsToInclude = formData.options.filter((opt) => opt.trim() !== "");
      }

      const payload: CreateQuestionRequest = {
        ...(assessmentType === "general"
          ? { general_assessment_id: assessmentId }
          : { lesson_assessment_id: assessmentId }),
        type: formData.type,
        question: formData.question.trim(),
        answer: formData.answer.trim(),
        ...(optionsToInclude ? { options: optionsToInclude } : {}),
      };

      await createQuestion(payload);

      showSuccessToast("Question added successfully!");

      // Clear form but keep modal open
      setFormData({
        type: formData.type, // Keep the same type
        question: "",
        answer: "",
        options: 
          formData.type === "MULTIPLE_CHOICE" ? ["", "", "", ""] :
          formData.type === "TRUE_FALSE" ? ["True", "False"] :
          formData.type === "FILL_IN_THE_BLANK" ? [] :
          undefined,
        ...(assessmentType === "general"
          ? { general_assessment_id: assessmentId }
          : { lesson_assessment_id: assessmentId }),
      });
      setErrors({});

      // Refresh questions list
      await fetchQuestions();

      // Notify parent if callback provided
      if (onQuestionAdded) {
        onQuestionAdded();
      }
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.errors) {
          const fieldErrors: Record<string, string> = {};
          Object.keys(error.errors).forEach((key) => {
            const errorMessages = error.errors![key];
            if (errorMessages && errorMessages.length > 0) {
              fieldErrors[key] = errorMessages[0];
            }
          });
          setErrors(fieldErrors);
          showErrorToast("Please check the form and try again.");
        } else {
          showErrorToast(formatErrorMessage(error.message || "Failed to create question"));
        }
      } else {
        showErrorToast("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden border border-gray-200 flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Add Questions</h2>
              <p className="text-sm text-gray-600 mt-1">{assessmentTitle}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Icon icon="solar:close-circle-bold" className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            {/* Left: Existing Questions */}
            <div className="lg:border-r lg:border-gray-200 lg:pr-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Existing Questions ({questions.length})
              </h3>

              {isLoadingQuestions ? (
                <div className="flex items-center justify-center py-8">
                  <Icon icon="solar:loading-bold" className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
              ) : questions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Icon icon="solar:question-circle-bold" className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>No questions added yet</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                  {questions.map((q, index) => (
                    <div
                      key={q.id}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded">
                          {q.type.replace(/_/g, " ")}
                        </span>
                        <span className="text-xs text-gray-400">#{index + 1}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 mb-2">{q.question}</p>
                      <div className="text-xs text-gray-600">
                        <span className="font-medium">Answer:</span> {q.answer}
                      </div>
                      {q.type === "MULTIPLE_CHOICE" && q.options && q.options.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <span className="text-xs font-medium text-gray-600">Options:</span>
                          <ul className="list-disc list-inside text-xs text-gray-600 ml-2">
                            {q.options.map((opt, optIdx) => (
                              <li key={opt.id || optIdx}>{opt.value}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Add Question Form */}
            <div className="lg:pl-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Question</h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Question Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleTypeChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 font-medium cursor-pointer appearance-none"
                    style={{ 
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.5rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.5em 1.5em',
                      paddingRight: '2.5rem'
                    }}
                  >
                    {QUESTION_TYPES.map((type) => (
                      <option key={type.value} value={type.value} className="text-gray-900">
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Question */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="question"
                    value={formData.question}
                    onChange={handleInputChange}
                    rows={3}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-900 text-gray-900 bg-white ${
                      errors.question ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Enter your question..."
                  />
                  {errors.question && (
                    <p className="mt-1 text-sm text-red-600">{errors.question}</p>
                  )}
                </div>

                {/* Answer */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Answer <span className="text-red-500">*</span>
                  </label>
                  {formData.type === "MULTIPLE_CHOICE" ? (
                    <select
                      name="answer"
                      value={formData.answer}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white ${
                        errors.answer ? "border-red-500" : "border-gray-300"
                      }`}
                    >
                      <option value="">Select correct option</option>
                      {(formData.options || [])
                        .filter((opt) => opt.trim() !== "")
                        .map((opt, idx) => (
                          <option key={`${opt}-${idx}`} value={opt}>
                            {opt}
                          </option>
                        ))}
                    </select>
                  ) : formData.type === "TRUE_FALSE" ? (
                    <select
                      name="answer"
                      value={formData.answer}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white ${
                        errors.answer ? "border-red-500" : "border-gray-300"
                      }`}
                    >
                      <option value="">Select answer</option>
                      <option value="True">True</option>
                      <option value="False">False</option>
                    </select>
                  ) : formData.type === "ESSAY" ? (
                    <textarea
                      name="answer"
                      value={formData.answer}
                      onChange={handleInputChange}
                      rows={4}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-900 text-gray-900 bg-white ${
                        errors.answer ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Enter the expected answer or answer key..."
                    />
                  ) : (
                    <input
                      type="text"
                      name="answer"
                      value={formData.answer}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-900 text-gray-900 bg-white ${
                        errors.answer ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Enter the answer..."
                    />
                  )}
                  {errors.answer && (
                    <p className="mt-1 text-sm text-red-600">{errors.answer}</p>
                  )}
                </div>

                {/* Options (for Multiple Choice, True/False, Fill in the Blank) */}
                {(formData.type === "MULTIPLE_CHOICE" || formData.type === "FILL_IN_THE_BLANK") && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Options <span className="text-red-500">*</span>
                      <span className="text-xs text-gray-500 ml-2">
                        {formData.type === "MULTIPLE_CHOICE" 
                          ? "(At least 2 required)" 
                          : formData.type === "FILL_IN_THE_BLANK"
                          ? "(Enter possible answers/choices)"
                          : ""}
                      </span>
                    </label>
                    <div className="space-y-2">
                      {formData.options?.map((option, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => handleOptionChange(index, e.target.value)}
                            className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-900 text-gray-900 bg-white ${
                              errors.options ? "border-red-500" : "border-gray-300"
                            }`}
                            placeholder={`Option ${index + 1}`}
                          />
                          {formData.options && formData.options.length > (formData.type === "MULTIPLE_CHOICE" ? 2 : 1) && (
                            <button
                              type="button"
                              onClick={() => removeOption(index)}
                              className="text-red-500 hover:text-red-700 transition-colors"
                            >
                              <Icon icon="solar:trash-bin-trash-bold" className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      ))}
                      {errors.options && (
                        <p className="text-sm text-red-600">{errors.options}</p>
                      )}
                      <button
                        type="button"
                        onClick={addOption}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                      >
                        <Icon icon="solar:add-circle-bold" className="w-5 h-5" />
                        Add Option
                      </button>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex items-center gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Icon icon="solar:loading-bold" className="w-5 h-5 animate-spin" />
                        <span>Adding...</span>
                      </>
                    ) : (
                      <>
                        <Icon icon="solar:add-circle-bold" className="w-5 h-5" />
                        <span>Add Question</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Done
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

