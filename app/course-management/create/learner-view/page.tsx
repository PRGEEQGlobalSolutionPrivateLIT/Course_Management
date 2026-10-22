import { Suspense } from "react";
import LearnerViewContent from "./LearnerViewContent";

export default function LearnerViewPage() {
  return (
    <Suspense fallback={<div>Loading learner view...</div>}>
      <LearnerViewContent />
    </Suspense>
  );
}
