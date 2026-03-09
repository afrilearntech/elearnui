"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAccessibility } from '@/contexts/AccessibilityContext';

type PrimaryRole = "student" | "non-student";

type RoleCard = {
  id: string;
  title: string;
  description: string;
};

const primaryRoles: RoleCard[] = [
  {
    id: "student",
    title: "Student",
    description: "Access courses, complete assignments, and track your learning progress.",
  },
  {
    id: "non-student",
    title: "Non-Student",
    description: "Upload and manage learning materials and quizzes for all grade levels.",
  },
];

const nonStudentRoles: RoleCard[] = [
  {
    id: "content-manager",
    title: "Content Manager",
    description: "Review and approve uploaded subjects before publication.",
  },
  {
    id: "parent",
    title: "Parent",
    description: "Upload and manage learning materials and quizzes for all grade levels.",
  },
  {
    id: "administrator",
    title: "Administrator",
    description: "Review and approve uploaded subjects before publication.",
  },
  {
    id: "teacher",
    title: "Teacher",
    description: "Review and approve uploaded subjects before publication.",
  },
];

export default function SignInPage() {
  const router = useRouter();
  const { isEnabled, announce, playSound, speak } = useAccessibility();
  const [step, setStep] = useState<"primary" | "non-student">("primary");
  const [selectedPrimaryRole, setSelectedPrimaryRole] =
    useState<PrimaryRole>("student");
  const [selectedNonStudentRole, setSelectedNonStudentRole] = useState(
    nonStudentRoles[0].id
  );
  
  // Debounce ref to prevent rapid announcements
  const lastAnnouncementRef = useRef<number>(0);
  const DEBOUNCE_DELAY = 300; // 300ms between announcements

  // Auto-announce page content when accessibility is enabled - concise and clear
  useEffect(() => {
    if (!isEnabled) return;

    const timer = setTimeout(() => {
      const message = step === "primary"
        ? 'Sign in page. Choose your role: Student or Non-Student. ' +
          'Student is currently selected. ' +
          'Press Tab to navigate between options, Enter to select a role, or click Continue button.'
        : 'Non-Student role selection. ' +
          'Press Tab to navigate between roles, Enter to select, or click Continue.';
      
      // Use speak with interrupt to stop any ongoing speech
      speak(message, true); // Interrupt previous speech
    }, 1000);

    return () => clearTimeout(timer);
  }, [isEnabled, step, selectedPrimaryRole, speak]);

  // Keyboard navigation - using Tab for consistency (like homepage)
  // Note: Tab is handled by browser naturally, we just add Enter key support

  const handleContinue = () => {
    if (isEnabled) {
      playSound('click');
    }
    
    if (step === "primary") {
      if (selectedPrimaryRole === "student") {
        if (isEnabled) {
          speak('Going to login page.', true); // Short, interrupt
        }
        router.push("/login");
      } else {
        if (isEnabled) {
          speak('Showing non-student roles.', true); // Short, interrupt
        }
        setStep("non-student");
      }
    } else {
      if (selectedNonStudentRole === "administrator") {
        router.push("/admin/sign-in");
      } else if (selectedNonStudentRole === "content-manager") {
        router.push("/content/sign-in");
      } else if (selectedNonStudentRole === "parent") {
        router.push("/parent-teacher/sign-in/parent");
      } else if (selectedNonStudentRole === "teacher") {
        router.push("/parent-teacher/sign-in/teacher");
      } else {
        router.push("/content/sign-in");
      }
    }
  };

  const handleBack = () => {
    if (isEnabled) {
      playSound('navigation');
      speak('Going back.', true); // Short, interrupt
    }
    setStep("primary");
    setSelectedPrimaryRole("student");
  };

  const currentRoles = step === "primary" ? primaryRoles : nonStudentRoles;
  const selectedRoleId =
    step === "primary" ? selectedPrimaryRole : selectedNonStudentRole;

  const title =
    step === "primary" ? "Sign In as" : "Choose a Non-Student Role to continue";

  return (
    <main 
      id="main-content" 
      role="main" 
      className="min-h-screen bg-[#F7F9FC] flex items-center justify-center px-4 py-12"
      aria-label="Sign In Page - Choose Your Role"
    >
      <div className="w-full max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            {step === "non-student" && (
              <button
                type="button"
                onClick={handleBack}
                className="text-sm text-[#059669] font-semibold hover:text-[#047857]"
                style={{ fontFamily: "Andika, sans-serif" }}
                aria-label="Back button. Click to return to previous step and choose between Student or Non-Student."
                onFocus={() => {
                  if (isEnabled) {
                    speak('Back button. Click to return.', true); // Short, interrupt
                    playSound('navigation');
                  }
                }}
              >
                ← Back
              </button>
            )}
          </div>
          <h1
            id="page-title"
            className="text-3xl font-semibold text-[#0F172A] text-center flex-1"
            style={{ fontFamily: "Andika, sans-serif" }}
          >
            {title}
          </h1>
          <div className="w-16" />
        </div>

        <div
          className={`grid gap-6 ${
            step === "primary"
              ? "grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto"
              : "grid-cols-1 md:grid-cols-2 lg:grid-cols-2"
          }`}
        >
          {currentRoles.map((role) => {
            const isSelected = role.id === selectedRoleId;
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => {
                  if (step === "primary") {
                    setSelectedPrimaryRole(role.id as PrimaryRole);
                  } else {
                    setSelectedNonStudentRole(role.id);
                  }
                  if (isEnabled) {
                    speak(`${role.title} selected. Press Tab to go to Continue button, or click Continue.`, true); // Short, interrupt
                    playSound('click');
                  }
                }}
                aria-label={`${role.title} role. ${role.description}. ${isSelected ? 'Currently selected.' : 'Click to select this role.'}`}
                aria-pressed={isSelected}
                className={`relative rounded-[28px] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isSelected
                    ? "bg-linear-to-r from-[#1E40AF] to-[#059669] p-[2px] shadow-lg"
                    : "border border-[#E2E8F0] bg-white hover:border-[#059669]"
                }`}
                onFocus={() => {
                  if (isEnabled) {
                    const now = Date.now();
                    // Debounce rapid focus changes
                    if (now - lastAnnouncementRef.current < DEBOUNCE_DELAY) {
                      return;
                    }
                    lastAnnouncementRef.current = now;
                    
                    // Concise focus announcement - interrupt any ongoing speech
                    const message = isSelected 
                      ? `${role.title}, selected. Press Enter to confirm or Tab to continue.`
                      : `${role.title} role. ${role.description}. Press Enter to select, or Tab to continue.`;
                    speak(message, true); // Interrupt previous speech
                    playSound('navigation');
                  }
                }}
                onKeyDown={(e) => {
                  // Handle Enter key to select role
                  if (e.key === 'Enter' && isEnabled) {
                    e.preventDefault();
                    if (step === "primary") {
                      setSelectedPrimaryRole(role.id as PrimaryRole);
                    } else {
                      setSelectedNonStudentRole(role.id);
                    }
                    speak(`${role.title} selected. Press Tab to go to Continue button.`, true);
                    playSound('click');
                  }
                }}
              >
                <div
                  className={`rounded-[26px] bg-white h-full w-full px-8 py-10 flex flex-col items-center text-center gap-4 ${
                    isSelected ? "shadow-lg" : ""
                  }`}
                >
                  <span
                    className={`w-12 h-12 rounded-full flex items-center justify-center border ${
                      isSelected ? "border-[#10B981]" : "border-[#D1D5DB]"
                    }`}
                  >
                    <span className="text-[#059669] text-xl">📝</span>
                  </span>
                  <div>
                    <h2
                      className="text-[22px] font-semibold text-[#111827]"
                      style={{ fontFamily: "Andika, sans-serif" }}
                    >
                      {role.title}
                    </h2>
                    <p
                      className="text-base text-[#6B7280] mt-3"
                      style={{ fontFamily: "Andika, sans-serif" }}
                    >
                      {role.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-12 flex justify-center">
          <button
            type="button"
            onClick={() => {
              if (isEnabled) {
                playSound('click');
              }
              handleContinue();
            }}
            aria-label={`Continue button. Click to proceed with ${step === "primary" ? selectedPrimaryRole : selectedNonStudentRole} role selection.`}
            className="px-12 h-12 rounded-full bg-[#059669] text-white font-semibold shadow-lg hover:bg-[#047857] transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ fontFamily: "Andika, sans-serif" }}
            onFocus={() => {
              if (isEnabled) {
                const now = Date.now();
                // Debounce rapid focus changes
                if (now - lastAnnouncementRef.current < DEBOUNCE_DELAY) {
                  return;
                }
                lastAnnouncementRef.current = now;
                
                const selectedRole = step === "primary" 
                  ? (selectedPrimaryRole === "student" ? "Student" : "Non-Student")
                  : nonStudentRoles.find(r => r.id === selectedNonStudentRole)?.title || selectedNonStudentRole;
                const action = step === "primary" && selectedPrimaryRole === "student"
                  ? "Goes to login page."
                  : step === "primary"
                  ? "Shows non-student roles."
                  : "Redirects to login.";
                speak(`Continue button. ${selectedRole} selected. ${action} Press Enter or click to proceed.`, true); // Concise, interrupt
                playSound('navigation');
              }
            }}
          >
            Continue
          </button>
        </div>
      </div>
    </main>
  );
}

