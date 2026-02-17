"use client";

interface AssessmentTrackingProps {
  childId: string;
}

interface Assessment {
  id: string;
  title: string;
  subject: string;
  type: "quiz" | "assignment" | "exam" | "project";
  status: "completed" | "in-progress" | "pending";
  score?: number;
  maxScore: number;
  dueDate: string;
  completedDate?: string;
}

const dummyAssessments: Assessment[] = [
  {
    id: "1",
    title: "Vowel Sounds Quiz",
    subject: "Literacy",
    type: "quiz",
    status: "completed",
    score: 18,
    maxScore: 20,
    dueDate: "2025-12-15",
    completedDate: "2025-12-10",
  },
  {
    id: "2",
    title: "Addition and Subtraction",
    subject: "Numeracy",
    type: "assignment",
    status: "completed",
    score: 45,
    maxScore: 50,
    dueDate: "2025-12-18",
    completedDate: "2025-12-12",
  },
  {
    id: "3",
    title: "Science Experiment Report",
    subject: "Science",
    type: "project",
    status: "in-progress",
    maxScore: 100,
    dueDate: "2025-12-20",
  },
  {
    id: "4",
    title: "Mid-Term Exam",
    subject: "All Subjects",
    type: "exam",
    status: "pending",
    maxScore: 200,
    dueDate: "2025-12-25",
  },
  {
    id: "5",
    title: "Reading Comprehension",
    subject: "Literacy",
    type: "assignment",
    status: "completed",
    score: 38,
    maxScore: 40,
    dueDate: "2025-12-08",
    completedDate: "2025-12-07",
  },
];

const getTypeColor = (type: Assessment["type"]) => {
  switch (type) {
    case "quiz":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "assignment":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "exam":
      return "bg-red-100 text-red-800 border-red-200";
    case "project":
      return "bg-orange-100 text-orange-800 border-orange-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getStatusColor = (status: Assessment["status"]) => {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800 border-green-200";
    case "in-progress":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "pending":
      return "bg-gray-100 text-gray-800 border-gray-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export default function AssessmentTracking({ childId }: AssessmentTrackingProps) {
  const completedCount = dummyAssessments.filter((a) => a.status === "completed").length;
  const inProgressCount = dummyAssessments.filter((a) => a.status === "in-progress").length;
  const pendingCount = dummyAssessments.filter((a) => a.status === "pending").length;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">
          Assessment Tracking
        </h3>
        <div className="flex gap-3 text-xs">
          <div className="text-center">
            <p className="font-semibold text-green-600">
              {completedCount}
            </p>
            <p className="text-gray-600">
              Completed
            </p>
          </div>
          <div className="text-center">
            <p className="font-semibold text-yellow-600">
              {inProgressCount}
            </p>
            <p className="text-gray-600">
              In Progress
            </p>
          </div>
          <div className="text-center">
            <p className="font-semibold text-gray-600">
              {pendingCount}
            </p>
            <p className="text-gray-600">
              Pending
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {dummyAssessments.map((assessment) => (
          <div
            key={assessment.id}
            className="border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-gray-900 text-sm truncate">
                    {assessment.title}
                  </h4>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium border flex-shrink-0 ${getTypeColor(assessment.type)}`}
                  >
                    {assessment.type.charAt(0).toUpperCase() + assessment.type.slice(1)}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-1">
                  {assessment.subject}
                </p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                  <span>
                    Due: {formatDate(assessment.dueDate)}
                  </span>
                  {assessment.completedDate && (
                    <span>
                      Completed: {formatDate(assessment.completedDate)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {assessment.status === "completed" && assessment.score !== undefined && (
                  <div className="text-right">
                    <p className="text-base font-bold text-gray-900">
                      {assessment.score}/{assessment.maxScore}
                    </p>
                    <p className="text-xs text-gray-600">
                      {Math.round((assessment.score / assessment.maxScore) * 100)}%
                    </p>
                  </div>
                )}
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(assessment.status)}`}
                >
                  {assessment.status === "completed"
                    ? "Completed"
                    : assessment.status === "in-progress"
                    ? "In Progress"
                    : "Pending"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

