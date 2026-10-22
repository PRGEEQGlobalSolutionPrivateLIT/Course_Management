import { Suspense } from "react";
import CourseCreateContent from "./CourseCreateContent";

export default function CreateCoursePage() {
  return (
    <Suspense fallback={<div>Loading course creation...</div>}>
      <CourseCreateContent />
    </Suspense>
  );
}
