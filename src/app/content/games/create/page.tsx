"use client";

import Link from "next/link";
import React from "react";
import { useRouter } from "next/navigation";
import { createGame } from "@/lib/api/content/games";
import { showErrorToast, showSuccessToast } from "@/lib/toast";

const GAME_TYPES = ["MUSIC", "WORD_PUZZLE", "IMAGE_PUZZLE", "SHAPE", "COLOR", "NUMBER"];

export default function CreateGamePage() {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [type, setType] = React.useState<string>(GAME_TYPES[0]);
  const [instructions, setInstructions] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [hint, setHint] = React.useState("");
  const [correctAnswer, setCorrectAnswer] = React.useState("");
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [imageName, setImageName] = React.useState("");
  const [imageError, setImageError] = React.useState("");
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isSubmitting) return;

    if (!name.trim()) {
      showErrorToast("Game name is required.");
      return;
    }
    if (!instructions.trim()) {
      showErrorToast("Please provide game instructions.");
      return;
    }
    if (!description.trim()) {
      showErrorToast("Please provide a short description.");
      return;
    }
    if (!correctAnswer.trim()) {
      showErrorToast("Correct answer is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      if (!token) {
        showErrorToast("Missing authentication token. Please sign in again.");
        setIsSubmitting(false);
        return;
      }

      await createGame(
        {
          name: name.trim(),
          instructions: instructions.trim(),
          description: description.trim(),
          hint: hint.trim(),
          correct_answer: correctAnswer.trim(),
          type,
          image: imageFile,
          status: "PENDING",
        },
        token,
      );

      showSuccessToast("Game submitted for review.");
      router.push("/content/games");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create game. Please try again.";
      showErrorToast(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Game</h1>
          <p className="text-sm text-gray-500">Create a new learning game for students.</p>
        </div>
        <Link href="/games" className="text-sm font-medium text-emerald-700 hover:underline">
          Back to Games
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium text-gray-800">Game Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rhythm Master"
                className="h-11 w-full rounded-lg border border-gray-300 px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="w-full space-y-2 sm:max-w-xs">
              <label className="text-sm font-medium text-gray-800">Game Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
              >
                {GAME_TYPES.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-800">Instructions</label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={4}
              placeholder="Describe how to play the game..."
              className="mt-2 w-full rounded-lg border border-gray-300 p-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-800">Game Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="What students will learn..."
              className="mt-2 w-full rounded-lg border border-gray-300 p-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-800">Hint (optional)</label>
              <textarea
                value={hint}
                onChange={(e) => setHint(e.target.value)}
                rows={3}
                placeholder="Give learners a gentle nudge..."
                className="mt-2 w-full rounded-lg border border-gray-300 p-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-800">Correct Answer</label>
              <textarea
                value={correctAnswer}
                onChange={(e) => setCorrectAnswer(e.target.value)}
                rows={3}
                placeholder="Provide the expected answer"
                className="mt-2 w-full rounded-lg border border-gray-300 p-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-800">Cover Image (optional)</label>
            <p className="text-xs text-gray-500">Upload a game thumbnail to help validators recognize this game.</p>
            <div className="rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50 p-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 16l-4-4-4 4" />
                  <path d="M12 12V3" />
                  <path d="M20 21H4" />
                </svg>
              </div>
              <p className="text-sm text-gray-600">PNG or JPG format.</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setImageError("");
                  const previewUrl = URL.createObjectURL(file);
                  setImagePreview((prev) => {
                    if (prev) URL.revokeObjectURL(prev);
                    return previewUrl;
                  });
                  setImageName(file.name);
                  setImageFile(file);
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Choose File
              </button>
              {imageName ? <div className="mt-3 text-sm text-gray-700">Selected: {imageName}</div> : null}
              {imageError ? <div className="mt-2 text-sm text-rose-600">{imageError}</div> : null}
            </div>
            {imagePreview ? (
              <div className="mt-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="Game cover preview" className="mx-auto h-48 w-full max-w-2xl rounded-lg object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    if (imagePreview) URL.revokeObjectURL(imagePreview);
                    setImagePreview(null);
                    setImageName("");
                    setImageFile(null);
                    setImageError("");
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="mt-3 text-sm font-medium text-rose-600 hover:underline"
                >
                  Remove image
                </button>
              </div>
            ) : null}
          </div>
        </section>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Link
            href="/games"
            className="inline-flex items-center justify-center rounded-full border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Submitting..." : "Submit for Review"}
          </button>
        </div>
      </form>
    </div>
  );
}

