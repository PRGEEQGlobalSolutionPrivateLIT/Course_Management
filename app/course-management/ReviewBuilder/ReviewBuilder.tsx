"use client";

import styles from "./ReviewBuilder.module.css";

import {
    getCourseDraft,
    publishCourseDraft,
} from "@/services/course-draft.service";


/* =========================================================
   PROPS
========================================================= */

type ReviewBuilderProps = {
    courseId: string;
    onBack: () => void;
    onLearnerView: () => void;
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


function hasArrayItems(
    value: unknown
): boolean {
    return Array.isArray(value) &&
        value.length > 0;
}


function hasObjectData(
    value: unknown
): boolean {
    return Boolean(
        value &&
        typeof value === "object" &&
        Object.keys(
            value as Record<
                string,
                unknown
            >
        ).length > 0
    );
}


/* =========================================================
   COMPONENT
========================================================= */

export default function ReviewBuilder({
    courseId,
    onBack,
    onLearnerView,
}: ReviewBuilderProps) {

    const reviewDraft =
        getCourseDraft(
            courseId
        );

    const normalizedTenant =
        normalizeTenant(
            reviewDraft?.tenant
        );

    const isUniversityOrCollege =
        normalizedTenant === "university" ||
        normalizedTenant === "college";

    const academicDraft =
        reviewDraft as
            | (typeof reviewDraft & {
                  academic?: unknown;
                  academicCredits?: unknown;
                  courseOutcomes?: unknown[];
                  programmeOutcomes?: unknown[];
                  programmeSpecificOutcomes?: unknown[];
                  outcomeMappings?: unknown[];
                  structure?: unknown[];
                  teamMembers?: unknown[];
                  courseTeam?: unknown;
                  delivery?: unknown;
                  enrollment?: unknown;
                  completion?: unknown;
                  validation?: unknown;
              })
            | null;

    const academicSetupComplete =
        !isUniversityOrCollege ||
        Boolean(
            academicDraft?.setup?.title?.trim()
        );

    const academicOutcomeComplete =
        !isUniversityOrCollege ||
        (
            hasObjectData(
                academicDraft?.academicCredits
            ) &&
            hasArrayItems(
                academicDraft?.courseOutcomes
            ) &&
            hasArrayItems(
                academicDraft?.programmeOutcomes
            ) &&
            hasArrayItems(
                academicDraft?.outcomeMappings
            )
        );

    const academicStructureComplete =
        !isUniversityOrCollege ||
        hasArrayItems(
            academicDraft?.structure
        );

    /*
     * Content and Assessments remain optional in the current
     * Review page, exactly as before. They therefore do not block
     * University / College publishing.
     */
    const academicTeamComplete =
        !isUniversityOrCollege ||
        hasArrayItems(
            academicDraft?.teamMembers
        ) ||
        hasObjectData(
            academicDraft?.courseTeam
        );

    const academicDeliveryComplete =
        !isUniversityOrCollege ||
        hasObjectData(
            academicDraft?.delivery
        );

    const academicEnrollmentComplete =
        !isUniversityOrCollege ||
        hasObjectData(
            academicDraft?.enrollment
        );

    const academicCompletionComplete =
        !isUniversityOrCollege ||
        hasObjectData(
            academicDraft?.completion
        );

    const academicValidationComplete =
        !isUniversityOrCollege ||
        hasObjectData(
            academicDraft?.validation
        ) ||
        (
            typeof reviewDraft?.currentStep ===
                "number" &&
            reviewDraft.currentStep >= 8
        );

    const universityRequiredChecks = [
        academicSetupComplete,
        academicOutcomeComplete,
        academicStructureComplete,
        academicTeamComplete,
        academicDeliveryComplete,
        academicEnrollmentComplete,
        academicCompletionComplete,
        academicValidationComplete,
    ];

    const universityReviewPassed =
        universityRequiredChecks.every(
            Boolean
        );


    /* =====================================================
       PUBLISH
    ===================================================== */

    function handlePublish() {

        /*
         * Publish the SAME complete course record that has moved
         * through the Course Wizard.
         *
         * Nothing is copied into a second course object.
         * The same courseId and all saved course data are retained.
         */
        const draft =
            getCourseDraft(
                courseId
            );

        if (!draft) {

            window.alert(
                "Unable to publish this course because the saved course data could not be found."
            );

            return;
        }

        /*
         * University / College:
         * do not allow Publish when even one required review
         * section is incomplete / failed.
         *
         * Other tenants continue through the existing logic below.
         */
        if (
            isUniversityOrCollege &&
            !universityReviewPassed
        ) {
            window.alert(
                "Publishing is blocked because one or more required University / College course sections have failed review. Complete every required section before publishing."
            );

            return;
        }

        /*
         * Validation is Step 8 (zero-based index 7).
         *
         * The Course Wizard moves the saved progress to Review
         * (index 8) only after Validation has been completed and
         * Continue has been used.
         *
         * Therefore currentStep >= 8 confirms that the saved course
         * has passed through Validation and reached Review.
         */
        const validationCompleted =
            typeof draft.currentStep ===
                "number" &&
            draft.currentStep >= 8;

        if (!validationCompleted) {

            window.alert(
                "Complete and verify the Validation step before publishing this course."
            );

            return;
        }

        /*
         * Existing service:
         *
         * - retains the same courseId
         * - retains the complete saved course data
         * - changes status to PUBLISHED
         * - persists the same record back to localStorage
         *
         * The Trainings / Published Trainings page already reads
         * PUBLISHED course-draft records, so no second storage format
         * is required.
         */
        publishCourseDraft(
            draft
        );

        /*
         * After successful publishing, open the Published Trainings
         * page. The newly published full course record will now be
         * available there automatically.
         */
        window.location.href =
            "/course-management/trainings";

    }


    return (

        <div className={styles.container}>

            {/* =================================================
                HEADER
            ================================================= */}

            <div className={styles.header}>

                <div>

                    <span className={styles.eyebrow}>
                        {isUniversityOrCollege
                            ? "Step 9"
                            : "Step 11"}
                    </span>

                    <h2>
                        Review & Publish
                    </h2>

                    <p>
                        {isUniversityOrCollege
                            ? (
                                <>
                                    Review the complete academic
                                    course configuration before
                                    publishing.
                                </>
                            )
                            : (
                                <>
                                    Review the complete learning
                                    program configuration before
                                    publishing.
                                </>
                            )}
                    </p>

                </div>

            </div>


            {/* =================================================
                CONTEXT
            ================================================= */}

            <div className={styles.contextCard}>

                <div>

                    <span>
                        Course ID
                    </span>

                    <strong>
                        {courseId}
                    </strong>

                </div>

                <div className={styles.contextAction}>

                    <button
                        type="button"
                        className={styles.learnerViewButton}
                        onClick={onLearnerView}
                    >
                        Learner View
                    </button>

                </div>

            </div>


            {/* =================================================
                REVIEW SECTIONS
            ================================================= */}

            <div className={styles.reviewCard}>

                <div className={styles.sectionHeader}>

                    <h3>
                        Course Configuration
                    </h3>

                    <span
                        className={
                            isUniversityOrCollege &&
                            !universityReviewPassed
                                ? styles.incomplete
                                : styles.ready
                        }
                    >
                        {isUniversityOrCollege
                            ? (
                                universityReviewPassed
                                    ? "Ready for Review"
                                    : "Review Failed"
                            )
                            : "Ready for Review"}
                    </span>

                </div>


                <div className={styles.reviewList}>

                    {/* =========================================
                        BASIC SETUP
                    ========================================= */}

                    <div className={styles.reviewItem}>

                        <div>

                            <h4>
                                {isUniversityOrCollege
                                    ? "Academic Course Setup"
                                    : "Basic Setup"}
                            </h4>

                            <p>
                                {isUniversityOrCollege
                                    ? (
                                        <>
                                            Programme, curriculum,
                                            academic period, course
                                            information, dates, and
                                            delivery mode
                                        </>
                                    )
                                    : (
                                        <>
                                            Course information,
                                            duration, dates, and
                                            delivery mode
                                        </>
                                    )}
                            </p>

                        </div>

                        <span
                            className={
                                isUniversityOrCollege &&
                                !academicSetupComplete
                                    ? styles.incomplete
                                    : styles.complete
                            }
                        >
                            {isUniversityOrCollege
                                ? (
                                    academicSetupComplete
                                        ? "Complete"
                                        : "Failed"
                                )
                                : "Complete"}
                        </span>

                    </div>


                    {/* =========================================
                        OUTCOMES
                    ========================================= */}

                    <div className={styles.reviewItem}>

                        <div>

                            <h4>
                                {isUniversityOrCollege
                                    ? "Credits & Outcome Mapping"
                                    : "Outcomes & Skills"}
                            </h4>

                            <p>
                                {isUniversityOrCollege
                                    ? (
                                        <>
                                            Credit structure, COs,
                                            POs, PSOs, and CO-to-PO/PSO
                                            mapping
                                        </>
                                    )
                                    : (
                                        <>
                                            Learning outcomes,
                                            competencies, and skills
                                        </>
                                    )}
                            </p>

                        </div>

                        <span
                            className={
                                isUniversityOrCollege &&
                                !academicOutcomeComplete
                                    ? styles.incomplete
                                    : styles.complete
                            }
                        >
                            {isUniversityOrCollege
                                ? (
                                    academicOutcomeComplete
                                        ? "Complete"
                                        : "Failed"
                                )
                                : "Complete"}
                        </span>

                    </div>


                    {/* =========================================
                        STRUCTURE
                    ========================================= */}

                    <div className={styles.reviewItem}>

                        <div>

                            <h4>
                                {isUniversityOrCollege
                                    ? "Academic Learning Structure"
                                    : "Course Structure"}
                            </h4>

                            <p>
                                {isUniversityOrCollege
                                    ? (
                                        <>
                                            Module, Chapter, Unit,
                                            and Topic hierarchy
                                        </>
                                    )
                                    : (
                                        <>
                                            Tenant-specific learning
                                            hierarchy and structure
                                        </>
                                    )}
                            </p>

                        </div>

                        <span
                            className={
                                isUniversityOrCollege &&
                                !academicStructureComplete
                                    ? styles.incomplete
                                    : styles.complete
                            }
                        >
                            {isUniversityOrCollege
                                ? (
                                    academicStructureComplete
                                        ? "Complete"
                                        : "Failed"
                                )
                                : "Complete"}
                        </span>

                    </div>


                    {/* =========================================
                        CONTENT
                    ========================================= */}

                    <div className={styles.reviewItem}>

                        <div>

                            <h4>
                                Learning Content
                            </h4>

                            <p>
                                {isUniversityOrCollege
                                    ? (
                                        <>
                                            Academic content and
                                            resources mapped to
                                            topics in the course
                                            structure
                                        </>
                                    )
                                    : (
                                        <>
                                            Content and learning
                                            resources mapped to the
                                            course structure
                                        </>
                                    )}
                            </p>

                        </div>

                        <span className={styles.complete}>
                            Complete
                        </span>

                    </div>


                    {/* =========================================
                        ASSESSMENTS
                    ========================================= */}

                    <div className={styles.reviewItem}>

                        <div>

                            <h4>
                                Assessments
                            </h4>

                            <p>
                                Optional assessments and evaluation
                                requirements
                            </p>

                        </div>

                        <span className={styles.incomplete}>
                            Optional
                        </span>

                    </div>


                    {/* =========================================
                        COURSE TEAM
                    ========================================= */}

                    <div className={styles.reviewItem}>

                        <div>

                            <h4>
                                Course Team
                            </h4>

                            <p>
                                {isUniversityOrCollege
                                    ? (
                                        <>
                                            Faculty, coordinators,
                                            mentors, reviewers, and
                                            responsible academic users
                                        </>
                                    )
                                    : (
                                        <>
                                            Faculty, trainers, mentors,
                                            or responsible users
                                        </>
                                    )}
                            </p>

                        </div>

                        <span
                            className={
                                isUniversityOrCollege &&
                                !academicTeamComplete
                                    ? styles.incomplete
                                    : styles.complete
                            }
                        >
                            {isUniversityOrCollege
                                ? (
                                    academicTeamComplete
                                        ? "Complete"
                                        : "Failed"
                                )
                                : "Complete"}
                        </span>

                    </div>


                    {/* =========================================
                        DELIVERY
                    ========================================= */}

                    <div className={styles.reviewItem}>

                        <div>

                            <h4>
                                Delivery Plan
                            </h4>

                            <p>
                                {isUniversityOrCollege
                                    ? (
                                        <>
                                            Academic schedule,
                                            sessions, teaching hours,
                                            and delivery mapping
                                        </>
                                    )
                                    : (
                                        <>
                                            Duration, schedule, sessions,
                                            time allocation, and delivery
                                            mapping
                                        </>
                                    )}
                            </p>

                        </div>

                        <span
                            className={
                                isUniversityOrCollege &&
                                !academicDeliveryComplete
                                    ? styles.incomplete
                                    : styles.complete
                            }
                        >
                            {isUniversityOrCollege
                                ? (
                                    academicDeliveryComplete
                                        ? "Complete"
                                        : "Failed"
                                )
                                : "Complete"}
                        </span>

                    </div>


                    {/* =========================================
                        ENROLLMENT
                    ========================================= */}

                    <div className={styles.reviewItem}>

                        <div>

                            <h4>
                                Enrollment
                            </h4>

                            <p>
                                {isUniversityOrCollege
                                    ? (
                                        <>
                                            Student eligibility,
                                            batch or section enrollment,
                                            and access configuration
                                        </>
                                    )
                                    : (
                                        <>
                                            Learner eligibility and
                                            enrollment configuration
                                        </>
                                    )}
                            </p>

                        </div>

                        <span
                            className={
                                isUniversityOrCollege &&
                                !academicEnrollmentComplete
                                    ? styles.incomplete
                                    : styles.complete
                            }
                        >
                            {isUniversityOrCollege
                                ? (
                                    academicEnrollmentComplete
                                        ? "Complete"
                                        : "Failed"
                                )
                                : "Complete"}
                        </span>

                    </div>


                    {/* =========================================
                        COMPLETION
                    ========================================= */}

                    <div className={styles.reviewItem}>

                        <div>

                            <h4>
                                Completion Rules
                            </h4>

                            <p>
                                {isUniversityOrCollege
                                    ? (
                                        <>
                                            Academic completion,
                                            attendance, assessment,
                                            and passing requirements
                                        </>
                                    )
                                    : (
                                        <>
                                            Completion, attendance,
                                            and assessment requirements
                                        </>
                                    )}
                            </p>

                        </div>

                        <span
                            className={
                                isUniversityOrCollege &&
                                !academicCompletionComplete
                                    ? styles.incomplete
                                    : styles.complete
                            }
                        >
                            {isUniversityOrCollege
                                ? (
                                    academicCompletionComplete
                                        ? "Complete"
                                        : "Failed"
                                )
                                : "Complete"}
                        </span>

                    </div>


                    {/* =========================================
                        VALIDATION
                    ========================================= */}

                    <div className={styles.reviewItem}>

                        <div>

                            <h4>
                                Validation
                            </h4>

                            <p>
                                {isUniversityOrCollege
                                    ? (
                                        <>
                                            Academic course,
                                            outcome, structure, and
                                            schedule validation
                                        </>
                                    )
                                    : (
                                        <>
                                            Course configuration and
                                            schedule validation
                                        </>
                                    )}
                            </p>

                        </div>

                        <span
                            className={
                                isUniversityOrCollege &&
                                !academicValidationComplete
                                    ? styles.incomplete
                                    : styles.complete
                            }
                        >
                            {isUniversityOrCollege
                                ? (
                                    academicValidationComplete
                                        ? "Complete"
                                        : "Failed"
                                )
                                : "Complete"}
                        </span>

                    </div>

                </div>

            </div>


            {/* =================================================
                PUBLISH INFORMATION
            ================================================= */}

            <div className={styles.publishCard}>

                <div className={styles.publishIcon}>
                    ✓
                </div>

                <div>

                    <h3>
                        {isUniversityOrCollege
                            ? (
                                universityReviewPassed
                                    ? "Ready to Publish"
                                    : "Not Ready to Publish"
                            )
                            : "Ready to Publish"}
                    </h3>

                    <p>
                        {isUniversityOrCollege
                            ? (
                                universityReviewPassed
                                    ? (
                                        <>
                                            The academic course configuration
                                            has completed the review workflow.
                                            Publishing will make the course
                                            available according to its configured
                                            student enrollment and delivery
                                            settings.
                                        </>
                                    )
                                    : (
                                        <>
                                            One or more required academic
                                            course sections have failed review.
                                            Complete all failed sections before
                                            publishing the course.
                                        </>
                                    )
                            )
                            : (
                                <>
                                    The course configuration has
                                    completed the review workflow.
                                    Publishing will make the learning
                                    program available according to
                                    its configured enrollment and
                                    delivery settings.
                                </>
                            )}
                    </p>

                </div>

            </div>


            {/* =================================================
                ACTIONS
            ================================================= */}

            <div className={styles.actions}>

                <button
                    type="button"
                    className={styles.backButton}
                    onClick={onBack}
                >
                    Back
                </button>


                <button
                    type="button"
                    className={styles.publishButton}
                    onClick={handlePublish}
                    disabled={
                        isUniversityOrCollege &&
                        !universityReviewPassed
                    }
                >
                    Publish Course
                </button>

            </div>

        </div>

    );

}