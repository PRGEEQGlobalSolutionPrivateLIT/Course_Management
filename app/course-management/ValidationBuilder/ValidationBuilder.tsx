"use client";

import { useEffect, useState } from "react";

import {
    getCourseDraft,
    saveCourseDraft,
} from "@/services/course-draft.service";

import styles from "./ValidationBuilder.module.css";


/* =========================================================
   PROPS
========================================================= */

type ValidationBuilderProps = {
    tenant: string;
    role: string;
    courseId: string;
    onBack: () => void;
    onNext: () => void;
};


/* =========================================================
   VALIDATION STATUS
========================================================= */

type ValidationStatus =
    | "pending"
    | "passed"
    | "warning"
    | "failed";


/* =========================================================
   VALIDATION ITEM
========================================================= */

type ValidationItem = {
    id: string;
    title: string;
    description: string;
    status: ValidationStatus;
};


function normalizeTenant(
    value?: string | null
): string {
    return String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/-/g, "_")
        .replace(/\s+/g, "_");
}


/* =========================================================
   COMPONENT
========================================================= */

export default function ValidationBuilder({
    tenant,
    role,
    courseId,
    onBack,
    onNext,
}: ValidationBuilderProps) {

    const normalizedTenant =
        normalizeTenant(tenant);

    const isUniversityOrCollege =
        normalizedTenant === "university" ||
        normalizedTenant === "college";

    const [
        isValidated,
        setIsValidated,
    ] = useState(false);


    const [
        items,
        setItems,
    ] = useState<ValidationItem[]>([

        {
            id: "course-details",

            title: "Course Details",

            description:
                "Verify that the required course information has been configured.",

            status: "pending",
        },

        {
            id: "outcomes",

            title: isUniversityOrCollege
                ? "Credits & Outcome Mapping"
                : "Outcomes & Skills",

            description:
                isUniversityOrCollege
                    ? "Verify credits, Course Outcomes, Programme Outcomes, and CO-to-PO/PSO mapping."
                    : "Verify that learning outcomes and skills are configured.",

            status: "pending",
        },

        {
            id: "structure",

            title: isUniversityOrCollege
                ? "Academic Learning Structure"
                : "Course Structure",

            description:
                isUniversityOrCollege
                    ? "Verify that the Module, Chapter, Unit, and Topic structure is configured."
                    : "Verify that the tenant-specific learning structure is valid.",

            status: "pending",
        },

        {
            id: "content",

            title: "Learning Content",

            description:
                "Verify that learning content is mapped to the saved learning structure.",

            status: "pending",
        },

        {
            id: "assessment",

            title: "Assessments",

            description:
                "Assessments are optional and are validated when configured.",

            status: "pending",
        },

        {
            id: "course-team",

            title: "Course Team",

            description:
                "Verify that trainers, faculty, mentors, or other responsible users are assigned.",

            status: "pending",
        },

        {
            id: "delivery",

            title: "Delivery Schedule",

            description:
                "Verify that the delivery schedule fits the configured course duration.",

            status: "pending",
        },

        {
            id: "time",

            title: "Time Allocation",

            description:
                "Verify that content duration does not exceed available learning time.",

            status: "pending",
        },

    ]);


    /* =====================================================
       LOAD SAVED VALIDATION

       Validation is derived from the current course draft.
       Previously saved validation state is restored when the
       user returns to Step 10.
    ===================================================== */

    useEffect(() => {
        if (!courseId) {
            return;
        }

        const draft =
            getCourseDraft(courseId);

        if (!draft) {
            return;
        }

        const savedValidation = (
            draft as typeof draft & {
                validation?: {
                    isValidated?: boolean;
                    items?: ValidationItem[];
                };
            }
        ).validation;

        if (!savedValidation) {
            return;
        }

        if (
            Array.isArray(
                savedValidation.items
            )
        ) {
            const restoredItems =
                savedValidation.items as ValidationItem[];

            setItems(
                isUniversityOrCollege
                    ? restoredItems.map(
                          (item) => {
                              if (item.id === "outcomes") {
                                  return {
                                      ...item,
                                      title:
                                          "Credits & Outcome Mapping",
                                      description:
                                          "Verify credits, Course Outcomes, Programme Outcomes, and CO-to-PO/PSO mapping.",
                                  };
                              }

                              if (item.id === "structure") {
                                  return {
                                      ...item,
                                      title:
                                          "Academic Learning Structure",
                                      description:
                                          "Verify that the Module, Chapter, Unit, and Topic structure is configured.",
                                  };
                              }

                              return item;
                          }
                      )
                    : restoredItems
            );
        }

        if (
            typeof savedValidation.isValidated ===
            "boolean"
        ) {
            setIsValidated(
                savedValidation.isValidated
            );
        }
    }, [
        courseId,
        isUniversityOrCollege,
    ]);


    /* =====================================================
       RUN VALIDATION
    ===================================================== */

    function runValidation() {
        if (!courseId) {
            return;
        }

        const draft =
            getCourseDraft(courseId);

        if (!draft) {
            console.error(
                "Course draft not found:",
                courseId
            );

            return;
        }

        /*
         * Validate the actual saved course draft rather than
         * marking every validation item as passed by default.
         *
         * These checks are frontend checks for now. They can
         * later be replaced or extended by backend validation
         * services without changing the draft structure.
         */
        const setup =
            draft.setup;

        const outcomes =
            Array.isArray(draft.outcomes)
                ? draft.outcomes
                : [];

        /*
         * University / College Step 2 does not save academic
         * outcomes into `draft.outcomes`.
         *
         * AcademicCreditsOutcomesBuilder saves the data under:
         * - academicCredits
         * - courseOutcomes
         * - programmeOutcomes
         * - programmeSpecificOutcomes
         * - outcomeMappings
         */
        const academicDraft =
            draft as typeof draft & {
                academicCredits?: {
                    totalCredits?: number;
                    lectureHours?: number;
                    tutorialHours?: number;
                    practicalHours?: number;
                    selfLearningHours?: number;
                    totalContactHours?: number;
                    totalLearningHours?: number;
                };
                courseOutcomes?: Array<{
                    id?: string;
                    code?: string;
                    statement?: string;
                    bloomLevel?: string;
                    targetAttainment?: number;
                }>;
                programmeOutcomes?: Array<{
                    id?: string;
                    code?: string;
                    statement?: string;
                }>;
                programmeSpecificOutcomes?: Array<{
                    id?: string;
                    code?: string;
                    statement?: string;
                }>;
                outcomeMappings?: Array<{
                    courseOutcomeId?: string;
                    targetOutcomeId?: string;
                    targetType?: "PO" | "PSO";
                    strength?: number;
                }>;
            };

        const structure =
            Array.isArray(
                (
                    draft as typeof draft & {
                        structure?: unknown[];
                    }
                ).structure
            )
                ? (
                    draft as typeof draft & {
                        structure?: unknown[];
                    }
                ).structure ?? []
                : [];

        const teamMembers =
            Array.isArray(
                (
                    draft as typeof draft & {
                        teamMembers?: unknown[];
                    }
                ).teamMembers
            )
                ? (
                    draft as typeof draft & {
                        teamMembers?: unknown[];
                    }
                ).teamMembers ?? []
                : [];

        const delivery =
            (
                draft as typeof draft & {
                    delivery?: {
                        deliveryMode?: string;
                        durationValue?: number;
                        durationUnit?: string;
                        startDate?: string;
                        startTime?: string;
                        endTime?: string;
                        timezone?: string;
                        workingDays?: string[];
                    };
                }
            ).delivery;

        const enrollment =
            (
                draft as typeof draft & {
                    enrollment?: {
                        mode?: string;
                        capacity?: number;
                        eligibility?: string;
                    };
                }
            ).enrollment;

        const completion =
            (
                draft as typeof draft & {
                    completion?: {
                        rules?: unknown[];
                        attendancePercentage?: number;
                        passingPercentage?: number;
                    };
                }
            ).completion;

        const hasCourseDetails =
            Boolean(
                setup?.title?.trim() &&
                setup?.code?.trim() &&
                setup?.description?.trim()
            );

        const hasAcademicCredits =
            Boolean(
                academicDraft.academicCredits &&
                typeof academicDraft
                    .academicCredits
                    .totalCredits === "number" &&
                academicDraft
                    .academicCredits
                    .totalCredits > 0
            );

        const hasAcademicCourseOutcomes =
            Array.isArray(
                academicDraft.courseOutcomes
            ) &&
            academicDraft.courseOutcomes.length > 0 &&
            academicDraft.courseOutcomes.every(
                (outcome) =>
                    Boolean(
                        outcome.statement?.trim()
                    ) &&
                    typeof outcome.targetAttainment ===
                        "number" &&
                    outcome.targetAttainment >= 0 &&
                    outcome.targetAttainment <= 100
            );

        const hasAcademicProgrammeOutcomes =
            Array.isArray(
                academicDraft.programmeOutcomes
            ) &&
            academicDraft.programmeOutcomes.length > 0 &&
            academicDraft.programmeOutcomes.every(
                (outcome) =>
                    Boolean(
                        outcome.statement?.trim()
                    )
            );

        const hasAcademicOutcomeMapping =
            Array.isArray(
                academicDraft.outcomeMappings
            ) &&
            academicDraft.outcomeMappings.some(
                (mapping) =>
                    typeof mapping.strength ===
                        "number" &&
                    mapping.strength > 0
            );

        const hasOutcomes =
            isUniversityOrCollege
                ? (
                    hasAcademicCredits &&
                    hasAcademicCourseOutcomes &&
                    hasAcademicProgrammeOutcomes &&
                    hasAcademicOutcomeMapping
                )
                : outcomes.length > 0;

        const hasStructure =
            structure.length > 0;

        /*
         * LearningStructureBuilder stores the course tree as:
         *
         * Course
         *   -> structure[]
         *      -> module
         *         -> learnings[]
         *            -> contents[]
         *            -> assessments[]
         *
         * Do not look for `children` here. The actual saved frontend
         * structure uses `learnings`, and each learning owns its
         * `contents` and optional `assessments`.
         */

        const hasContent =
            structure.some(
                (module) => {

                    if (
                        !module ||
                        typeof module !== "object"
                    ) {
                        return false;
                    }

                    const moduleRecord =
                        module as {
                            learnings?: unknown[];
                        };

                    if (
                        !Array.isArray(
                            moduleRecord.learnings
                        )
                    ) {
                        return false;
                    }

                    return moduleRecord.learnings.some(
                        (learning) => {

                            if (
                                !learning ||
                                typeof learning !== "object"
                            ) {
                                return false;
                            }

                            const learningRecord =
                                learning as {
                                    contents?: unknown[];
                                };

                            return (
                                Array.isArray(
                                    learningRecord.contents
                                ) &&
                                learningRecord.contents.length > 0
                            );
                        }
                    );
                }
            );

        /*
         * Assessments are optional.
         *
         * We still detect them when they exist so the validation
         * layer can understand the same saved structure used by
         * Learner View. Missing assessments must never create a
         * warning or block the course.
         */
        const hasAssessment =
            structure.some(
                (module) => {

                    if (
                        !module ||
                        typeof module !== "object"
                    ) {
                        return false;
                    }

                    const moduleRecord =
                        module as {
                            learnings?: unknown[];
                        };

                    if (
                        !Array.isArray(
                            moduleRecord.learnings
                        )
                    ) {
                        return false;
                    }

                    return moduleRecord.learnings.some(
                        (learning) => {

                            if (
                                !learning ||
                                typeof learning !== "object"
                            ) {
                                return false;
                            }

                            const learningRecord =
                                learning as {
                                    assessments?: unknown[];
                                };

                            return (
                                Array.isArray(
                                    learningRecord.assessments
                                ) &&
                                learningRecord.assessments.length > 0
                            );
                        }
                    );
                }
            );

        const hasTeam =
            teamMembers.length > 0;

        const hasDelivery =
            Boolean(
                delivery?.deliveryMode &&
                typeof delivery.durationValue ===
                    "number" &&
                delivery.durationValue > 0
            );

        const hasTimeAllocation =
            Boolean(
                setup?.estimatedDuration &&
                setup.estimatedDuration > 0
            );

        const updatedItems =
            items.map(
                (item) => {
                    let status: ValidationStatus =
                        "passed";

                    switch (item.id) {
                        case "course-details":
                            status =
                                hasCourseDetails
                                    ? "passed"
                                    : "failed";
                            break;

                        case "outcomes":
                            status =
                                hasOutcomes
                                    ? "passed"
                                    : "failed";
                            break;

                        case "structure":
                            status =
                                hasStructure
                                    ? "passed"
                                    : "failed";
                            break;

                        case "content":
                            status =
                                hasContent
                                    ? "passed"
                                    : "warning";
                            break;

                        case "assessment":
                            /*
                             * Assessments are optional.
                             * If they exist, they are valid and available
                             * in the same saved structure. If they do not
                             * exist, validation still passes.
                             */
                            status =
                                "passed";
                            break;

                        case "course-team":
                            status =
                                hasTeam
                                    ? "passed"
                                    : "failed";
                            break;

                        case "delivery":
                            status =
                                hasDelivery
                                    ? "passed"
                                    : "failed";
                            break;

                        case "time":
                            status =
                                hasTimeAllocation
                                    ? "passed"
                                    : "warning";
                            break;

                        default:
                            status =
                                "pending";
                    }

                    return {
                        ...item,
                        status,
                    };
                }
            );

        const hasFailed =
            updatedItems.some(
                (item) =>
                    item.status === "failed"
            );

        setItems(
            updatedItems
        );

        setIsValidated(
            !hasFailed
        );

        /*
         * Academic wizard has 9 steps:
         * 1 Setup
         * 2 Credits & Outcome Mapping
         * 3 Learning Structure
         * 4 Team
         * 5 Delivery
         * 6 Enrollment
         * 7 Completion
         * 8 Validation
         * 9 Review
         *
         * Non-academic progress values are intentionally preserved.
         */
        const validationStepIndex =
            isUniversityOrCollege
                ? 7
                : 10;

        const validationCompletedThrough =
            isUniversityOrCollege
                ? 8
                : 10;

        saveCourseDraft({
            ...draft,

            validation: {
                isValidated: !hasFailed,
                items: updatedItems,
            },

            /*
             * Validation is Step 10 in this wizard.
             * Never reduce the highest completed step.
             */
            currentStep:
                Math.max(
                    draft.currentStep ?? 0,
                    validationStepIndex
                ),

            completedThroughStep:
                Math.max(
                    draft.completedThroughStep ?? 0,
                    validationCompletedThrough
                ),

            updatedAt:
                new Date().toISOString(),
        });

        console.log(
            "Validation completed for course:",
            courseId
        );
    }


    /* =====================================================
       STATUS LABEL
    ===================================================== */

    function getStatusLabel(
        status: ValidationStatus
    ): string {

        switch (status) {

            case "passed":

                return "Passed";


            case "warning":

                return "Warning";


            case "failed":

                return "Failed";


            default:

                return "Pending";

        }

    }


    /* =====================================================
       STATUS CLASS
    ===================================================== */

    function getStatusClass(
        status: ValidationStatus
    ): string {

        switch (status) {

            case "passed":

                return styles.passed;


            case "warning":

                return styles.warning;


            case "failed":

                return styles.failed;


            default:

                return styles.pending;

        }

    }


    /* =====================================================
       RENDER
    ===================================================== */

    return (

        <div className={styles.container}>

            {/* =================================================
                HEADER
            ================================================= */}

            <div className={styles.header}>

                <div>

                    <span
                        className={
                            styles.eyebrow
                        }
                    >
                        {isUniversityOrCollege
                            ? "Step 8"
                            : "Step 10"}
                    </span>


                    <h2>
                        Course Validation
                    </h2>


                    <p>
                        Validate the course
                        configuration before final
                        review and publishing.
                    </p>

                </div>

            </div>


            {/* =================================================
                CONTEXT
            ================================================= */}

            <div
                className={
                    styles.contextCard
                }
            >

                <div>

                    <span>
                        Course ID
                    </span>

                    <strong>
                        {courseId}
                    </strong>

                </div>


                <div>

                    <span>
                        Tenant
                    </span>

                    <strong>
                        {tenant}
                    </strong>

                </div>


                <div>

                    <span>
                        Actor
                    </span>

                    <strong>
                        {role}
                    </strong>

                </div>


                <div>

                    <span>
                        Validation
                    </span>

                    <strong>
                        {isValidated
                            ? "Completed"
                            : "Not Run"}
                    </strong>

                </div>

            </div>


            {/* =================================================
                VALIDATION LIST
            ================================================= */}

            <div
                className={
                    styles.validationCard
                }
            >

                <div
                    className={
                        styles.sectionHeader
                    }
                >

                    <div>

                        <h3>
                            Validation Checks
                        </h3>


                        <p>
                            Review all required configuration checks.
                            Optional assessments do not block validation.
                        </p>

                    </div>


                    <button
                        type="button"
                        className={
                            styles.validateButton
                        }
                        onClick={
                            runValidation
                        }
                    >
                        {isValidated
                            ? "Run Again"
                            : "Run Validation"}
                    </button>

                </div>


                <div
                    className={
                        styles.validationList
                    }
                >

                    {items.map(
                        (item) => (

                            <div
                                key={item.id}
                                className={
                                    styles.validationItem
                                }
                            >

                                <div
                                    className={
                                        styles.checkIcon
                                    }
                                >

                                    {item.status ===
                                    "passed"

                                        ? "✓"

                                        : item.status ===
                                          "failed"

                                            ? "!"

                                            : "•"}

                                </div>


                                <div
                                    className={
                                        styles.validationInfo
                                    }
                                >

                                    <h4>
                                        {item.title}
                                    </h4>


                                    <p>
                                        {
                                            item.description
                                        }
                                    </p>

                                </div>


                                <div
                                    className={`
                                        ${styles.status}
                                        ${getStatusClass(
                                            item.status
                                        )}
                                    `}
                                >

                                    {getStatusLabel(
                                        item.status
                                    )}

                                </div>

                            </div>

                        )
                    )}

                </div>

            </div>


            {/* =================================================
                VALIDATION SUMMARY
            ================================================= */}

            <div
                className={
                    styles.summaryCard
                }
            >

                <div>

                    <span>
                        Checks
                    </span>

                    <strong>
                        {items.length}
                    </strong>

                </div>


                <div>

                    <span>
                        Passed
                    </span>

                    <strong>

                        {
                            items.filter(
                                (item) =>
                                    item.status ===
                                    "passed"
                            ).length
                        }

                    </strong>

                </div>


                <div>

                    <span>
                        Warnings
                    </span>

                    <strong>

                        {
                            items.filter(
                                (item) =>
                                    item.status ===
                                    "warning"
                            ).length
                        }

                    </strong>

                </div>


                <div>

                    <span>
                        Failed
                    </span>

                    <strong>

                        {
                            items.filter(
                                (item) =>
                                    item.status ===
                                    "failed"
                            ).length
                        }

                    </strong>

                </div>

            </div>


            {/* =================================================
                NAVIGATION
            ================================================= */}

            <div
                className={
                    styles.actions
                }
            >

                <button
                    type="button"
                    className={
                        styles.backButton
                    }
                    onClick={onBack}
                >
                    Back
                </button>


                <button
                    type="button"
                    className={
                        styles.nextButton
                    }
                    disabled={
                        !isValidated
                    }
                    onClick={() => {
                        const hasFailedItem =
                            items.some(
                                (item) =>
                                    item.status ===
                                    "failed"
                            );

                        if (
                            !isValidated ||
                            hasFailedItem
                        ) {
                            return;
                        }

                        const draft =
                            getCourseDraft(courseId);

                        if (!draft) {
                            return;
                        }

                        saveCourseDraft({
                            ...draft,

                            validation: {
                                isValidated: true,
                                items,
                            },

                            currentStep:
                                Math.max(
                                    draft.currentStep ?? 0,
                                    isUniversityOrCollege
                                        ? 8
                                        : 10
                                ),

                            completedThroughStep:
                                Math.max(
                                    draft.completedThroughStep ?? 0,
                                    isUniversityOrCollege
                                        ? 8
                                        : 10
                                ),

                            updatedAt:
                                new Date().toISOString(),
                        });

                        onNext();
                    }}
                >
                    Continue to Review
                </button>

            </div>

        </div>

    );

}