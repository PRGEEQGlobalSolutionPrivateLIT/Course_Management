export type CourseStatus =
    | "DRAFT"
    | "UNDER_REVIEW"
    | "REVISION_REQUIRED"
    | "APPROVED"
    | "PUBLISHED"
    | "UNPUBLISHED"
    | "ARCHIVED"
    | "DELETED";

export type DeliveryMode =
    | "CLASSROOM"
    | "ONLINE"
    | "HYBRID"
    | "SELF_PACED"
    | "BLENDED"
    | "COHORT"
    | "FIELD"
    | "OFFLINE_FIRST";

export type CourseType =
    | "ACADEMIC"
    | "PROFESSIONAL"
    | "CORPORATE_TRAINING"
    | "BOOTCAMP"
    | "SKILL_PROGRAM"
    | "WORKSHOP"
    | "CERTIFICATION"
    | "PROGRAM"
    | "CUSTOM";

/* =========================================================
   BLOOM LEVEL
========================================================= */

export type BloomLevel =
    | "REMEMBER"
    | "UNDERSTAND"
    | "APPLY"
    | "ANALYZE"
    | "EVALUATE"
    | "CREATE";

/* =========================================================
   OUTCOME MAPPING
========================================================= */

export type OutcomeMappingStrength =
    | 0
    | 1
    | 2
    | 3;

export type OutcomeTargetType =
    | "PO"
    | "PSO";

/* =========================================================
   COURSE OUTCOME
========================================================= */

export interface CourseOutcome {
    id: string;

    code: string;

    statement: string;

    bloomLevel: BloomLevel;

    targetAttainment: number;
}

/* =========================================================
   PROGRAMME OUTCOME
========================================================= */

export interface ProgrammeOutcome {
    id: string;

    code: string;

    statement: string;
}

/* =========================================================
   PROGRAMME-SPECIFIC OUTCOME
========================================================= */

export interface ProgrammeSpecificOutcome {
    id: string;

    code: string;

    statement: string;
}

/* =========================================================
   CO → PO / PSO MAPPING
========================================================= */

export interface OutcomeMapping {
    id: string;

    courseOutcomeId: string;

    targetOutcomeId: string;

    targetType: OutcomeTargetType;

    strength: OutcomeMappingStrength;
}

/* =========================================================
   ACADEMIC CREDIT STRUCTURE
========================================================= */

export interface AcademicCreditStructure {
    totalCredits?: number;

    lectureHours?: number;

    tutorialHours?: number;

    practicalHours?: number;

    selfLearningHours?: number;

    totalContactHours?: number;

    totalLearningHours?: number;

    hoursPerCredit?: number;

    calculatedNotionalHours?: number;

    creditUnitLabel?: string;
}

/* =========================================================
   COURSE BRANDING
========================================================= */

export interface CourseBranding {
    thumbnailUrl?: string;

    thumbnailAltText?: string;

    bannerUrl?: string;

    bannerAltText?: string;
}

/* =========================================================
   COURSE DATES
========================================================= */

export interface CourseDates {
    enrollmentStartDate?: string;

    enrollmentEndDate?: string;

    courseStartDate?: string;

    courseEndDate?: string;

    learnerAccessDuration?: number;

    learnerAccessDurationUnit?:
        | "DAYS"
        | "WEEKS"
        | "MONTHS";

    noExpiryAccess: boolean;

    timezone: string;
}

/* =========================================================
   COURSE SETUP
========================================================= */

export interface CourseSetupData {
    title: string;

    code: string;

    shortName: string;

    description: string;

    objectives: string;

    prerequisites: string;

    targetAudience: string;

    level: string;

    type: CourseType | "";

    deliveryMode: DeliveryMode | "";

    category: string;

    tags: string[];

    department: string;

    ownerId: string;

    primaryInstructorId: string;

    instructorIds: string[];

    reviewerId: string;

    approverId: string;

    language: string;

    supportedLanguages: string[];

    estimatedDuration: number;

    estimatedDurationUnit:
        | "MINUTES"
        | "HOURS"
        | "DAYS"
        | "WEEKS"
        | "MONTHS";

    credits?: number;

    passingScore?: number;

    enrollmentCapacity?: number;

    waitingListEnabled: boolean;

    dates: CourseDates;

    branding: CourseBranding;
}

/* =========================================================
   COURSE CREATION STATE
========================================================= */

/**
 * Complete state of a course while it is being created.
 *
 * courseId:
 * Generated once when course creation starts.
 *
 * The same courseId must be used for every wizard step
 * until the course is published.
 *
 * status:
 * Remains DRAFT while the course is being created.
 *
 * It changes to PUBLISHED only through the final publish
 * action.
 *
 * currentStep:
 * Zero-based wizard step index currently visible.
 *
 * Example:
 *
 * 0 = Step 1
 * 1 = Step 2
 * 2 = Step 3
 *
 * completedThroughStep:
 * Number of successfully completed steps.
 *
 * Example:
 *
 * 0 = nothing completed
 * 1 = Step 1 completed
 * 2 = Steps 1 and 2 completed
 *
 * completedThroughStep must never decrease when the user
 * navigates back to an earlier step.
 */

export interface CourseCreationState {
    courseId: string;

    tenant: string;

    role: string;

    status: CourseStatus;

    currentStep: number;

    completedThroughStep: number;

    /* =====================================================
       STEP 1 — COURSE SETUP
    ===================================================== */

    setup: CourseSetupData;

    /**
     * Academic mapping data from Course Setup.
     *
     * Kept flexible because this data can differ depending
     * on institution, programme and qualification framework.
     */
    academic?: Record<string, unknown>;

    /* =====================================================
       STEP 2 — CREDITS + CO + PO + PSO + MAPPING
    ===================================================== */

    academicCredits?: AcademicCreditStructure;

    courseOutcomes?: CourseOutcome[];

    programmeOutcomes?: ProgrammeOutcome[];

    programmeSpecificOutcomes?: ProgrammeSpecificOutcome[];

    outcomeMappings?: OutcomeMapping[];

    /* =====================================================
       EXISTING / OTHER COURSE CREATION DATA
    ===================================================== */

    outcomes?: unknown[];

    structure?: unknown[];

    content?: unknown[];

    assessments?: unknown[];

    courseTeam?: unknown;

    delivery?: unknown;

    enrollment?: unknown;

    completion?: unknown;

    validation?: unknown;

    review?: unknown;

    /* =====================================================
       AUDIT / LIFECYCLE
    ===================================================== */

    createdAt: string;

    updatedAt: string;

    publishedAt?: string;
}