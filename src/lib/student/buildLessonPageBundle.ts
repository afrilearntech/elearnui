import type { LessonDetail, LessonListItem } from "@/lib/api/lessons";

export type LessonResourceTab = "video" | "audio" | "pdf" | "ppt" | "doc";

export type LessonPageBundle = {
  lesson: LessonDetail;
  availableResources: {
    video?: string;
    audio?: string;
    pdf?: string;
    ppt?: string;
    doc?: string;
  };
  allLessons: LessonListItem[];
  nextLessonId: number | null;
  firstResourceTab: LessonResourceTab | null;
};

export function buildLessonPageBundle(
  lessonData: LessonDetail,
  allLessonsData: LessonListItem[],
  lessonId: string,
): LessonPageBundle {
  const resources: LessonPageBundle["availableResources"] = {};
  const lessonType = lessonData.type?.toUpperCase()?.trim() || "";

  if (lessonData.resource) {
    if (lessonType === "VIDEO") {
      resources.video = lessonData.resource;
    } else if (lessonType === "AUDIO") {
      resources.audio = lessonData.resource;
    } else if (lessonType === "PDF") {
      resources.pdf = lessonData.resource;
    } else if (lessonType === "PPT" || lessonType === "POWERPOINT") {
      resources.ppt = lessonData.resource;
    } else if (lessonType === "DOC" || lessonType === "DOCX" || lessonType === "DOCUMENT") {
      resources.doc = lessonData.resource;
    }
  }

  const sameTitleLessons = allLessonsData.filter(
    (l) =>
      l.status === "APPROVED" &&
      l.title.toLowerCase().trim() === lessonData.title.toLowerCase().trim() &&
      l.id !== lessonData.id,
  );

  sameTitleLessons.forEach((l) => {
    const type = l.type?.toUpperCase()?.trim() || "";
    if (l.resource) {
      if (type === "VIDEO" && !resources.video) resources.video = l.resource;
      else if (type === "AUDIO" && !resources.audio) resources.audio = l.resource;
      else if (type === "PDF" && !resources.pdf) resources.pdf = l.resource;
      else if ((type === "PPT" || type === "POWERPOINT") && !resources.ppt) resources.ppt = l.resource;
      else if ((type === "DOC" || type === "DOCX" || type === "DOCUMENT") && !resources.doc) resources.doc = l.resource;
    }
  });

  const firstKey = Object.keys(resources)[0] as LessonResourceTab | undefined;
  const firstResourceTab = firstKey ?? null;

  const approvedLessons = allLessonsData
    .filter((l) => l.status === "APPROVED")
    .sort((a, b) => a.id - b.id);

  const currentIndex = approvedLessons.findIndex((l) => l.id === parseInt(lessonId, 10));
  const nextLessonId =
    currentIndex >= 0 && currentIndex < approvedLessons.length - 1
      ? approvedLessons[currentIndex + 1].id
      : null;

  return {
    lesson: lessonData,
    availableResources: resources,
    allLessons: approvedLessons,
    nextLessonId,
    firstResourceTab,
  };
}
