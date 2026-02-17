"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React from "react";

type QuestionType = "Multiple Choice" | "True/False" | "Short Answer" | "Long Answer" | "Matching";

type Question = {
  id: string;
  question: string;
  type: QuestionType;
  expanded?: boolean;
  options?: string[];
  correctAnswer?: string;
  answer?: boolean;
};

function QuizQuestionsContent() {
  const params = useSearchParams();
  const quizTitle = params.get("title") || "Introduction to Algebra";
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [showSuccessModal, setShowSuccessModal] = React.useState(false);
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [showEditSuccessModal, setShowEditSuccessModal] = React.useState(false);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [deletingQuestionId, setDeletingQuestionId] = React.useState<string | null>(null);
  const [editingQuestionId, setEditingQuestionId] = React.useState<string | null>(null);
  const [answerType, setAnswerType] = React.useState<QuestionType>("Multiple Choice");
  const [questionText, setQuestionText] = React.useState("");
  const [hint, setHint] = React.useState("");
  // Multile Choice
  const [multipleChoiceOptions, setMultipleChoiceOptions] = React.useState<{ id: string; text: string; isCorrect: boolean }[]>([
    { id: "1", text: "", isCorrect: true },
    { id: "2", text: "", isCorrect: false },
  ]);
  const [trueFalseAnswer, setTrueFalseAnswer] = React.useState<boolean | null>(null);
  const [questions, setQuestions] = React.useState<Question[]>([
    {
      id: "1",
      question: "What is the value of x in the equation 2x + 5 = 11?",
      type: "Multiple Choice",
      expanded: false,
      options: ["3 (correct answer)", "4", "7", "11"],
      correctAnswer: "A",
    },
    {
      id: "2",
      question: "What is the value of x in the equation 2x + 5 = 11?",
      type: "Multiple Choice",
      expanded: false,
    },
    {
      id: "3",
      question: "The variable in an expression always has to be \"x.\"",
      type: "True/False",
      expanded: false,
      answer: false,
    },
    {
      id: "4",
      question: "The term \"3x²\" means \"3 times x squared.\"",
      type: "True/False",
      expanded: false,
      answer: true,
    },
    {
      id: "5",
      question: "Introduction to Algebra",
      type: "Short Answer",
      expanded: false,
    },
  ]);

  function toggleExpand(id: string) {
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, expanded: !q.expanded } : q)));
  }

  function handleDeleteClick(id: string) {
    setDeletingQuestionId(id);
    setShowDeleteModal(true);
  }

  function confirmDelete() {
    if (deletingQuestionId) {
      setQuestions((qs) => qs.filter((q) => q.id !== deletingQuestionId));
      setShowDeleteModal(false);
      setDeletingQuestionId(null);
    }
  }

  function cancelDelete() {
    setShowDeleteModal(false);
    setDeletingQuestionId(null);
  }

  function moveQuestion(id: string, direction: "up" | "down") {
    setQuestions((qs) => {
      const idx = qs.findIndex((q) => q.id === id);
      if (idx === -1) return qs;
      if (direction === "up" && idx === 0) return qs;
      if (direction === "down" && idx === qs.length - 1) return qs;
      const newQs = [...qs];
      const targetIdx = direction === "up" ? idx - 1 : idx + 1;
      [newQs[idx], newQs[targetIdx]] = [newQs[targetIdx], newQs[idx]];
      return newQs;
    });
  }

  function addMultipleChoiceOption() {
    setMultipleChoiceOptions([...multipleChoiceOptions, { id: Date.now().toString(), text: "", isCorrect: false }]);
  }

  function removeMultipleChoiceOption(id: string) {
    setMultipleChoiceOptions(multipleChoiceOptions.filter((opt) => opt.id !== id));
  }

  function updateMultipleChoiceOption(id: string, text: string) {
    setMultipleChoiceOptions(multipleChoiceOptions.map((opt) => (opt.id === id ? { ...opt, text } : opt)));
  }

  function setCorrectAnswer(id: string) {
    setMultipleChoiceOptions(multipleChoiceOptions.map((opt) => ({ ...opt, isCorrect: opt.id === id })));
  }

  function handleAddQuestion() {
    if (!questionText.trim()) return;

    let newQuestion: Question;
    const questionId = Date.now().toString();

    if (answerType === "Multiple Choice") {
      const options = multipleChoiceOptions.map((opt) => opt.text).filter((t) => t.trim());
      const correctIdx = multipleChoiceOptions.findIndex((opt) => opt.isCorrect);
      newQuestion = {
        id: questionId,
        question: questionText,
        type: "Multiple Choice",
        expanded: false,
        options: options.map((opt, i) => (i === correctIdx ? `${opt} (correct answer)` : opt)),
        correctAnswer: String.fromCharCode(65 + correctIdx),
      };
    } else if (answerType === "True/False") {
      newQuestion = {
        id: questionId,
        question: questionText,
        type: "True/False",
        expanded: false,
        answer: trueFalseAnswer ?? undefined,
      };
    } else {
      newQuestion = {
        id: questionId,
        question: questionText,
        type: answerType,
        expanded: false,
      };
    }

    setQuestions([...questions, newQuestion]);
    setShowAddModal(false);
    setShowSuccessModal(true);
    // Reset form
    setQuestionText("");
    setHint("");
    setAnswerType("Multiple Choice");
    setMultipleChoiceOptions([
      { id: "1", text: "", isCorrect: true },
      { id: "2", text: "", isCorrect: false },
    ]);
    setTrueFalseAnswer(null);
  }

  function handleCloseModal() {
    setShowAddModal(false);
    // Reset form
    setQuestionText("");
    setHint("");
    setAnswerType("Multiple Choice");
    setMultipleChoiceOptions([
      { id: "1", text: "", isCorrect: true },
      { id: "2", text: "", isCorrect: false },
    ]);
    setTrueFalseAnswer(null);
  }

  function handleEditQuestion(id: string) {
    const question = questions.find((q) => q.id === id);
    if (!question) return;

    setEditingQuestionId(id);
    setQuestionText(question.question);
    setAnswerType(question.type);
    setHint(""); 

    if (question.type === "Multiple Choice" && question.options) {
      const timestamp = Date.now();
      const options = question.options.map((opt, idx) => {
        const isCorrect = opt.includes("(correct answer)");
        const text = opt.replace(" (correct answer)", "");
        return {
          id: `edit-${timestamp}-${idx}`,
          text: text,
          isCorrect: isCorrect,
        };
      });
      setMultipleChoiceOptions(options.length > 0 ? options : [
        { id: "1", text: "", isCorrect: true },
        { id: "2", text: "", isCorrect: false },
      ]);
    } else if (question.type === "True/False") {
      setTrueFalseAnswer(question.answer ?? null);
    } else {
      setMultipleChoiceOptions([
        { id: "1", text: "", isCorrect: true },
        { id: "2", text: "", isCorrect: false },
      ]);
      setTrueFalseAnswer(null);
    }

    setShowEditModal(true);
  }

  function handleApplyChanges() {
    if (!editingQuestionId || !questionText.trim()) return;

    let updatedQuestion: Question;
    const questionId = editingQuestionId;

    if (answerType === "Multiple Choice") {
      const options = multipleChoiceOptions.map((opt) => opt.text).filter((t) => t.trim());
      const correctIdx = multipleChoiceOptions.findIndex((opt) => opt.isCorrect);
      updatedQuestion = {
        id: questionId,
        question: questionText,
        type: "Multiple Choice",
        expanded: false,
        options: options.map((opt, i) => (i === correctIdx ? `${opt} (correct answer)` : opt)),
        correctAnswer: String.fromCharCode(65 + correctIdx),
      };
    } else if (answerType === "True/False") {
      updatedQuestion = {
        id: questionId,
        question: questionText,
        type: "True/False",
        expanded: false,
        answer: trueFalseAnswer ?? undefined,
      };
    } else {
      updatedQuestion = {
        id: questionId,
        question: questionText,
        type: answerType,
        expanded: false,
      };
    }

    setQuestions(questions.map((q) => (q.id === questionId ? updatedQuestion : q)));
    setShowEditModal(false);
    setShowEditSuccessModal(true);
    // Reset form
    setQuestionText("");
    setHint("");
    setAnswerType("Multiple Choice");
    setMultipleChoiceOptions([
      { id: "1", text: "", isCorrect: true },
      { id: "2", text: "", isCorrect: false },
    ]);
    setTrueFalseAnswer(null);
    setEditingQuestionId(null);
  }

  function handleCloseEditModal() {
    setShowEditModal(false);
    // Reset form
    setQuestionText("");
    setHint("");
    setAnswerType("Multiple Choice");
    setMultipleChoiceOptions([
      { id: "1", text: "", isCorrect: true },
      { id: "2", text: "", isCorrect: false },
    ]);
    setTrueFalseAnswer(null);
    setEditingQuestionId(null);
  }

  function renderQuestionContent(q: Question) {
    if (q.type === "Multiple Choice" && q.expanded) {
      return (
        <div className="mt-3 space-y-2 text-sm">
          <div className="text-gray-600">Multiple Choice - {q.options?.length || 4} options</div>
          <div className="space-y-1.5">
            {q.options?.map((opt, i) => (
              <div key={i} className={`flex items-center gap-2 ${opt.includes("correct answer") ? "text-emerald-700 font-medium" : "text-gray-700"}`}>
                <span className="font-medium">{String.fromCharCode(65 + i)}.</span>
                <span>{opt.replace(" (correct answer)", "")}</span>
                {opt.includes("correct answer") && <span className="text-xs text-emerald-600">(correct answer)</span>}
              </div>
            ))}
          </div>
        </div>
      );
    }
    if (q.type === "True/False" && q.expanded) {
      return (
        <div className="mt-3 text-sm">
          <div className="text-gray-600">True/False</div>
          <div className={`mt-1 font-medium ${q.answer ? "text-emerald-700" : "text-rose-600"}`}>
            {q.answer ? "True" : "False"}
          </div>
        </div>
      );
    }
    if ((q.type === "Short Answer" || q.type === "Long Answer") && q.expanded) {
      return (
        <div className="mt-3 text-sm text-gray-600">
          {q.type}
        </div>
      );
    }
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Quiz Details Page</h1>
          <p className="text-sm text-gray-500">Add Questions for {quizTitle}</p>
        </div>
        <div className="hidden gap-3 sm:flex">
          <button className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Save Draft</button>
          <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">Next</button>
        </div>
      </div>

      <div className="mx-auto w-full max-w-4xl space-y-6">
        {/* Added Quiz Section */}
        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="mb-4 text-base font-semibold text-gray-900">Added Quiz</h2>

          <div className="space-y-3">
            {questions.map((q, idx) => (
              <div key={q.id} className="rounded-lg border border-emerald-200 bg-white p-4">
                <div className="flex items-start justify-between">
                  <div 
                    className="flex-1 cursor-pointer"
                    onClick={(e) => {
                      // Don't expand if clicking on action buttons
                      if ((e.target as HTMLElement).closest('button')) return;
                      toggleExpand(q.id);
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-sm font-medium text-gray-900">{idx + 1}.</span>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{q.question}</div>
                        {!q.expanded && q.type && (
                          <div className="mt-1 text-xs text-gray-500">{q.type}</div>
                        )}
                        {q.expanded && renderQuestionContent(q)}
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 flex items-center gap-2 text-gray-500" onClick={(e) => e.stopPropagation()}>
                    {/* Expand/Collapse Toggle */}
                    <button
                      onClick={() => toggleExpand(q.id)}
                      className="hover:text-gray-700"
                      aria-label={q.expanded ? "Collapse" : "Expand"}
                    >
                      {q.expanded ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="18 15 12 9 6 15" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      )}
                    </button>
                    <button onClick={() => handleEditQuestion(q.id)} className="hover:text-gray-700" aria-label="Edit">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
                      </svg>
                    </button>
                    <button onClick={() => handleDeleteClick(q.id)} className="text-rose-600 hover:text-rose-700" aria-label="Delete">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6" />
                        <path d="M14 11v6" />
                        <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add New Quiz Button */}
          <button 
            onClick={() => setShowAddModal(true)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50 px-4 py-6 text-emerald-700 hover:bg-emerald-100 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span className="font-medium">Add New Quiz</span>
          </button>
        </section>

        {/* Mobile Actions */}
        <div className="flex gap-3 sm:hidden">
          <button className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Save Draft</button>
          <button className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">Next</button>
        </div>

        <div className="text-center">
          <Link href="/lessons/create/quiz-assessment" className="text-sm text-emerald-700 hover:underline">Back</Link>
        </div>
      </div>

      {/* Add Question Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Add a New Question</h2>
              <button
                onClick={handleCloseModal}
                className="text-emerald-600 hover:text-emerald-700"
                aria-label="Close"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Question Field */}
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-gray-800">Question</label>
              <textarea
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                rows={4}
                placeholder='The variable in an expression always has to be "x."'
                className="w-full resize-y rounded-lg border border-gray-300 p-4 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Answer Type Selection */}
            <div className="mb-6">
              <label className="mb-3 block text-sm font-medium text-gray-800">Answer Type</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setAnswerType("Short Answer")}
                  className={`flex-1 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
                    answerType === "Short Answer"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Short Answer
                </button>
                <button
                  onClick={() => setAnswerType("Long Answer")}
                  className={`flex-1 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
                    answerType === "Long Answer"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Long Answer
                </button>
                <button
                  onClick={() => setAnswerType("True/False")}
                  className={`flex-1 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
                    answerType === "True/False"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  True/False
                </button>
                <button
                  onClick={() => setAnswerType("Multiple Choice")}
                  className={`flex-1 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
                    answerType === "Multiple Choice"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Multiple Choice
                </button>
              </div>
            </div>

            {/* Content based on Answer Type */}
            {answerType === "Multiple Choice" && (
              <div className="mb-6">
                <label className="mb-3 block text-sm font-medium text-gray-800">Options (select the correct answer)</label>
                <div className="space-y-3">
                  {multipleChoiceOptions.map((opt, idx) => (
                    <div key={opt.id} className="flex items-center gap-3">
                      <button
                        onClick={() => setCorrectAnswer(opt.id)}
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${
                          opt.isCorrect
                            ? "border-emerald-500 bg-emerald-500"
                            : "border-gray-300 bg-white"
                        }`}
                      >
                        {opt.isCorrect && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => updateMultipleChoiceOption(opt.id, e.target.value)}
                        placeholder={`Option ${idx + 1}`}
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        onClick={() => removeMultipleChoiceOption(opt.id)}
                        className="text-rose-600 hover:text-rose-700"
                        aria-label="Delete option"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6" />
                          <path d="M14 11v6" />
                          <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={addMultipleChoiceOption}
                  className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add Option
                </button>
              </div>
            )}

            {answerType === "True/False" && (
              <div className="mb-6">
                <label className="mb-3 block text-sm font-medium text-gray-800">Options (select the correct answer)</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setTrueFalseAnswer(true)}
                    className={`flex-1 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
                      trueFalseAnswer === true
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {trueFalseAnswer === true && (
                      <span className="mr-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                    )}
                    True
                  </button>
                  <button
                    onClick={() => setTrueFalseAnswer(false)}
                    className={`flex-1 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
                      trueFalseAnswer === false
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {trueFalseAnswer === false && (
                      <span className="mr-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                    )}
                    False
                  </button>
                </div>
              </div>
            )}

            {(answerType === "Short Answer" || answerType === "Long Answer") && (
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-gray-800">
                  {answerType === "Short Answer" ? "Short Answer Preview" : "Long Answer Preview"}
                </label>
                <div className="relative rounded-lg border border-gray-300 bg-gray-50 p-4">
                  {answerType === "Short Answer" ? (
                    <input
                      type="text"
                      placeholder="Student's text"
                      disabled
                      className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-500"
                    />
                  ) : (
                    <textarea
                      placeholder="Student's text"
                      disabled
                      rows={4}
                      className="w-full rounded border border-gray-300 bg-white p-3 text-gray-500"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Hint/Explanation */}
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-gray-800">Hint/Explanation (optional)</label>
              <textarea
                value={hint}
                onChange={(e) => setHint(e.target.value)}
                rows={3}
                placeholder="Provide a hint or explanation for the correct answer"
                className="w-full resize-y rounded-lg border border-gray-300 p-4 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Add Question Button */}
            <div className="flex justify-end">
              <button
                onClick={handleAddQuestion}
                className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Add Question
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-md rounded-xl bg-white p-8 shadow-xl">
            <div className="flex flex-col items-center text-center">
              {/* Success Icon */}
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              
              {/* Title */}
              <h2 className="mb-2 text-xl font-semibold text-gray-900">Quiz Created Successfully</h2>
              
              {/* Message */}
              <p className="mb-6 text-sm text-gray-600">
                Your Quiz has been submitted and will be reviewed for validation before it can be published. You'll receive a notification once the review is complete.
              </p>
              
              {/* Okay Button */}
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Okay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Question Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Edit Question</h2>
              <button
                onClick={handleCloseEditModal}
                className="text-emerald-600 hover:text-emerald-700"
                aria-label="Close"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Question Field */}
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-gray-800">Question</label>
              <textarea
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                rows={4}
                placeholder='The variable in an expression always has to be "x."'
                className="w-full resize-y rounded-lg border border-gray-300 p-4 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Answer Type Selection */}
            <div className="mb-6">
              <label className="mb-3 block text-sm font-medium text-gray-800">Answer Type</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setAnswerType("Short Answer")}
                  className={`flex-1 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
                    answerType === "Short Answer"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Short Answer
                </button>
                <button
                  onClick={() => setAnswerType("Long Answer")}
                  className={`flex-1 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
                    answerType === "Long Answer"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Long Answer
                </button>
                <button
                  onClick={() => setAnswerType("True/False")}
                  className={`flex-1 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
                    answerType === "True/False"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  True/False
                </button>
                <button
                  onClick={() => setAnswerType("Multiple Choice")}
                  className={`flex-1 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
                    answerType === "Multiple Choice"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Multiple Choice
                </button>
              </div>
            </div>

            {/* Content based on Answer Type */}
            {answerType === "Multiple Choice" && (
              <div className="mb-6">
                <label className="mb-3 block text-sm font-medium text-gray-800">Options (select the correct answer)</label>
                <div className="space-y-3">
                  {multipleChoiceOptions.map((opt, idx) => (
                    <div key={opt.id} className="flex items-center gap-3">
                      <button
                        onClick={() => setCorrectAnswer(opt.id)}
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${
                          opt.isCorrect
                            ? "border-emerald-500 bg-emerald-500"
                            : "border-gray-300 bg-white"
                        }`}
                      >
                        {opt.isCorrect && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => updateMultipleChoiceOption(opt.id, e.target.value)}
                        placeholder={`Option ${idx + 1}`}
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        onClick={() => removeMultipleChoiceOption(opt.id)}
                        className="text-rose-600 hover:text-rose-700"
                        aria-label="Delete option"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6" />
                          <path d="M14 11v6" />
                          <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={addMultipleChoiceOption}
                  className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add Option
                </button>
              </div>
            )}

            {answerType === "True/False" && (
              <div className="mb-6">
                <label className="mb-3 block text-sm font-medium text-gray-800">Options (select the correct answer)</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setTrueFalseAnswer(true)}
                    className={`flex-1 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
                      trueFalseAnswer === true
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {trueFalseAnswer === true && (
                      <span className="mr-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                    )}
                    True
                  </button>
                  <button
                    onClick={() => setTrueFalseAnswer(false)}
                    className={`flex-1 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
                      trueFalseAnswer === false
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {trueFalseAnswer === false && (
                      <span className="mr-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                    )}
                    False
                  </button>
                </div>
              </div>
            )}

            {(answerType === "Short Answer" || answerType === "Long Answer") && (
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-gray-800">
                  {answerType === "Short Answer" ? "Short Answer Preview" : "Long Answer Preview"}
                </label>
                <div className="relative rounded-lg border border-gray-300 bg-gray-50 p-4">
                  {answerType === "Short Answer" ? (
                    <input
                      type="text"
                      placeholder="Student's text"
                      disabled
                      className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-500"
                    />
                  ) : (
                    <textarea
                      placeholder="Student's text"
                      disabled
                      rows={4}
                      className="w-full rounded border border-gray-300 bg-white p-3 text-gray-500"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Hint/Explanation */}
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-gray-800">Hint/Explanation (optional)</label>
              <textarea
                value={hint}
                onChange={(e) => setHint(e.target.value)}
                rows={3}
                placeholder="Provide a hint or explanation for the correct answer"
                className="w-full resize-y rounded-lg border border-gray-300 p-4 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Apply Changes Button */}
            <div className="flex justify-end">
              <button
                onClick={handleApplyChanges}
                className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Success Modal */}
      {showEditSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-md rounded-xl bg-white p-8 shadow-xl">
            <div className="flex flex-col items-center text-center">
              {/* Success Icon */}
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              
              {/* Title */}
              <h2 className="mb-2 text-xl font-semibold text-gray-900">Quiz Edited Successfully</h2>
              
              {/* Message */}
              <p className="mb-6 text-sm text-gray-600">
                Your quiz has been edited successfully. It will be reviewed for validation before it can be published. You'll receive a notification once the review is complete.
              </p>
              
              {/* Okay Button */}
              <button
                onClick={() => setShowEditSuccessModal(false)}
                className="w-full rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Okay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex flex-col items-center text-center">
              {/* Warning Icon */}
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-600">
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </div>
              
              {/* Title */}
              <h2 className="mb-2 text-xl font-semibold text-gray-900">Delete Question</h2>
              
              {/* Message */}
              <p className="mb-6 text-sm text-gray-600">
                Are you sure you want to delete this question? This action cannot be undone.
              </p>
              
              {/* Action Buttons */}
              <div className="flex w-full gap-3">
                <button
                  onClick={cancelDelete}
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 rounded-lg bg-rose-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-rose-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function QuizQuestionsPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Quiz Details Page</h1>
            <p className="text-sm text-gray-500">Loading...</p>
          </div>
        </div>
        <div className="mx-auto w-full max-w-4xl space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="text-sm text-gray-600">Loading questions...</div>
          </div>
        </div>
      </div>
    }>
      <QuizQuestionsContent />
    </Suspense>
  );
}

