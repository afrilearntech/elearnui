import toast from "react-hot-toast";

interface ToastOptions {
  duration?: number;
  icon?: string;
}

const DEFAULT_SUCCESS_DURATION = 3500;
const DEFAULT_ERROR_DURATION = 4500;
const DEFAULT_INFO_DURATION = 3500;
const DEDUPE_WINDOW_MS = 1200;

const lastShownAt = new Map<string, number>();

function shouldSkipToast(type: "success" | "error" | "info", message: string) {
  const key = `${type}:${message.trim().toLowerCase()}`;
  const now = Date.now();
  const last = lastShownAt.get(key) ?? 0;

  if (now - last < DEDUPE_WINDOW_MS) {
    return true;
  }

  lastShownAt.set(key, now);
  return false;
}

function getToastDuration(requested: number | undefined, fallback: number) {
  if (typeof requested !== "number") return fallback;
  return Math.min(Math.max(requested, 1500), 8000);
}

const baseStyle = {
  padding: "16px 20px",
  borderRadius: "12px",
  fontSize: "14px",
  fontWeight: "500",
  fontFamily: "Andika, sans-serif",
  width: "auto",
  minWidth: "280px",
  maxWidth: "min(400px, 90vw)",
} as const;

export const showSuccessToast = (message: string, options?: ToastOptions) => {
  if (shouldSkipToast("success", message)) return;

  return toast.success(message, {
    duration: getToastDuration(options?.duration, DEFAULT_SUCCESS_DURATION),
    position: "top-right",
    style: {
      ...baseStyle,
      background: "#10B981",
      color: "#FFFFFF",
      boxShadow:
        "0 10px 25px -5px rgba(16, 185, 129, 0.3), 0 8px 10px -6px rgba(16, 185, 129, 0.2)",
    },
    iconTheme: {
      primary: "#FFFFFF",
      secondary: "#10B981",
    },
  });
};

export const showErrorToast = (message: string, options?: ToastOptions) => {
  if (shouldSkipToast("error", message)) return;

  return toast.error(message, {
    duration: getToastDuration(options?.duration, DEFAULT_ERROR_DURATION),
    position: "top-right",
    style: {
      ...baseStyle,
      background: "#EF4444",
      color: "#FFFFFF",
      boxShadow:
        "0 10px 25px -5px rgba(239, 68, 68, 0.3), 0 8px 10px -6px rgba(239, 68, 68, 0.2)",
    },
    iconTheme: {
      primary: "#FFFFFF",
      secondary: "#EF4444",
    },
  });
};

export const showInfoToast = (message: string, options?: ToastOptions) => {
  if (shouldSkipToast("info", message)) return;

  return toast(message, {
    duration: getToastDuration(options?.duration, DEFAULT_INFO_DURATION),
    position: "top-right",
    style: {
      ...baseStyle,
      background: "#3B82F6",
      color: "#FFFFFF",
      boxShadow:
        "0 10px 25px -5px rgba(59, 130, 246, 0.3), 0 8px 10px -6px rgba(59, 130, 246, 0.2)",
    },
    iconTheme: {
      primary: "#FFFFFF",
      secondary: "#3B82F6",
    },
  });
};

export const formatErrorMessage = (error: string): string => {
  const errorMappings: Record<string, string> = {
    email: "Please check your email address and try again.",
    password: "Password must be at least 6 characters long.",
    phone: "Please enter a valid phone number.",
    name: "Please enter your full name.",
    confirm_password: "Passwords do not match. Please try again.",
    network: "Network error. Please check your connection and try again.",
    server: "Server error. Please try again later.",
    unauthorized: "You are not authorized to perform this action.",
    "not found": "The requested resource was not found.",
  };

  const lowerError = error.toLowerCase();

  for (const [key, message] of Object.entries(errorMappings)) {
    if (lowerError.includes(key)) {
      return message;
    }
  }

  if (error.length > 100) {
    return "An error occurred. Please check your input and try again.";
  }

  return error;
};
