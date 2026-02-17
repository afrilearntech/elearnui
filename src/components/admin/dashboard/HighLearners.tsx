"use client";

interface HighLearner {
  student_id: number;
  name: string;
  subtitle: string;
}

interface HighLearnersProps {
  learners: HighLearner[];
}

export default function HighLearners({ learners }: HighLearnersProps) {
  const getInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">High Learners</h2>
      {learners.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">No high learners data available</p>
        </div>
      ) : (
      <div className="space-y-4">
          {learners.map((learner) => (
            <div key={learner.student_id} className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#059669] to-[#1E40AF] flex items-center justify-center text-white font-semibold">
                {getInitials(learner.name)}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{learner.name}</p>
                <p className="text-sm text-gray-600">{learner.subtitle}</p>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}

