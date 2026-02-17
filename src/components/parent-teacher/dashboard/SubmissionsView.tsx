"use client";

interface SubmissionsViewProps {
  childId: string;
}

interface Submission {
  id: string;
  assessmentTitle: string;
  subject: string;
  submittedAt: string;
  score?: number;
  maxScore: number;
  status: "graded" | "pending-review";
  fileUrl?: string;
}

const dummySubmissions: Submission[] = [
  {
    id: "1",
    assessmentTitle: "Vowel Sounds Quiz",
    subject: "Literacy",
    submittedAt: "2025-12-10T14:30:00",
    score: 18,
    maxScore: 20,
    status: "graded",
  },
  {
    id: "2",
    assessmentTitle: "Addition and Subtraction",
    subject: "Numeracy",
    submittedAt: "2025-12-12T10:15:00",
    score: 45,
    maxScore: 50,
    status: "graded",
  },
  {
    id: "3",
    assessmentTitle: "Reading Comprehension",
    subject: "Literacy",
    submittedAt: "2025-12-07T16:45:00",
    score: 38,
    maxScore: 40,
    status: "graded",
  },
  {
    id: "4",
    assessmentTitle: "Science Experiment Report",
    subject: "Science",
    submittedAt: "2025-12-14T09:20:00",
    maxScore: 100,
    status: "pending-review",
  },
];

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const getStatusColor = (status: Submission["status"]) => {
  switch (status) {
    case "graded":
      return "bg-green-100 text-green-800 border-green-200";
    case "pending-review":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export default function SubmissionsView({ childId }: SubmissionsViewProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">
        Recent Submissions
      </h3>

      <div className="space-y-3">
        {dummySubmissions.map((submission) => (
          <div
            key={submission.id}
            className="border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 text-sm mb-1">
                  {submission.assessmentTitle}
                </h4>
                <p className="text-xs text-gray-600 mb-1">
                  {submission.subject}
                </p>
                <p className="text-xs text-gray-500">
                  Submitted: {formatDateTime(submission.submittedAt)}
                </p>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium border flex-shrink-0 ${getStatusColor(submission.status)}`}
              >
                {submission.status === "graded" ? "Graded" : "Pending Review"}
              </span>
            </div>

            {submission.status === "graded" && submission.score !== undefined && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">
                    Score:
                  </span>
                  <div className="text-right">
                    <span className="text-base font-bold text-gray-900">
                      {submission.score}/{submission.maxScore}
                    </span>
                    <span className="ml-2 text-xs text-gray-600">
                      ({Math.round((submission.score / submission.maxScore) * 100)}%)
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${
                      (submission.score / submission.maxScore) * 100 >= 80
                        ? "bg-green-500"
                        : (submission.score / submission.maxScore) * 100 >= 60
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${(submission.score / submission.maxScore) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {dummySubmissions.length === 0 && (
        <div className="text-center py-6">
          <p className="text-gray-600 text-sm">
            No submissions yet
          </p>
        </div>
      )}
    </div>
  );
}

