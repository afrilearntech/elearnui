"use client";

import Link from "next/link";
import Image from "@/components/images/SafeImage";

const roles = [
  {
    id: "parent",
    title: "Parent",
    description: "Monitor your child's progress and support learning at home.",
    href: "/parent-teacher/sign-in/parent",
  },
  {
    id: "teacher",
    title: "Teacher",
    description: "Manage classes, lessons, assignments, and student progress.",
    href: "/parent-teacher/sign-in/teacher",
  },
] as const;

export default function ParentTeacherRoleSelectionPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-[700px] bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-[#1E40AF] to-[#059669] p-6 text-white text-center">
          <h1 className="text-2xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
            Choose Your Login
          </h1>
          <p className="text-sm mt-1 text-white/80" style={{ fontFamily: "Poppins, sans-serif" }}>
            Select your role to continue to your dedicated sign-in page.
          </p>
        </div>

        <div className="px-6 sm:px-8 py-8">
          <div className="flex justify-center mb-6">
            <Image
              src="/moe.png"
              alt="Ministry of Education Logo"
              width={80}
              height={80}
              className="rounded-full"
              priority
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roles.map((role) => (
              <Link
                key={role.id}
                href={role.href}
                className="rounded-2xl border border-gray-200 bg-white hover:border-[#059669] hover:shadow-md transition-all px-5 py-5"
              >
                <h2 className="text-lg font-semibold text-gray-900" style={{ fontFamily: "Poppins, sans-serif" }}>
                  {role.title}
                </h2>
                <p className="text-sm text-gray-600 mt-2" style={{ fontFamily: "Poppins, sans-serif" }}>
                  {role.description}
                </p>
                <p className="text-sm font-semibold text-[#059669] mt-4" style={{ fontFamily: "Poppins, sans-serif" }}>
                  Continue as {role.title} →
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

