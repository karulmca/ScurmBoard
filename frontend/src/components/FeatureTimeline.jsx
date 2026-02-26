import React from "react";
import EpicFeatureTimeline from "./EpicFeatureTimeline.jsx";

/**
 * FeatureTimeline — shows Features (and their child Stories/Tasks) on a timeline.
 */
export default function FeatureTimeline({ workItems }) {
  // Reuse the Timeline component, scoped to Feature + Story
  return (
    <EpicFeatureTimeline
      workItems={workItems}
      types={["Feature", "Story", "Task"]}
    />
  );
}
