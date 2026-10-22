"use client";

import { useEffect, useState } from "react";

import {
    createCourseDraft,
    getCourseDraft,
    saveCourseDraft,
} from "@/services/course-draft.service";

import type {
    CourseCreationState,
} from "@/types/course-creation.types";

import styles from "./CourseSetup.module.css";


/* =========================================================
   PROPS
========================================================= */

type CourseSetupProps = {
    tenant: string;
    role: string;
    courseId?: string;
    onBack: () => void;
    onNext: (courseId?: string) => void;
};


/* =========================================================
   DELIVERY MODE
========================================================= */

type DeliveryMode =
    | "onsite"
    | "online"
    | "hybrid"
    | "self_paced";


/* =========================================================
   COURSE TYPE
========================================================= */

type CourseType =
    | "course"
    | "program"
    | "workshop"
    | "bootcamp"
    | "learning_path";


/* =========================================================
   ACADEMIC COURSE CATEGORY
   University / College only.
========================================================= */

const ACADEMIC_COURSE_CATEGORY_OPTIONS = [
    "Core / Compulsory",
    "Major Core",
    "Major Elective",
    "Minor",
    "Open Elective",
    "Discipline Elective",
    "General Education",
    "Foundation",
    "Ability Enhancement",
    "Skill Enhancement",
    "Value-added",
    "Interdisciplinary",
    "Multidisciplinary",
    "Laboratory / Practical",
    "Project",
    "Capstone",
    "Internship",
    "Field Work",
    "Seminar",
    "Research",
    "Thesis / Dissertation",
    "Community Engagement",
    "Independent Study",
    "Other",
];

const CREDIT_FRAMEWORK_OPTIONS = [
    "Institutional Credit System",
    "National Credit Framework (NCrF) — India",
    "European Credit Transfer and Accumulation System (ECTS)",
    "US Semester Credit Hour",
    "US Quarter Credit Hour",
    "UK Credit / CATS",
    "Hong Kong QF Credit",
    "Australian Institution Credit Model",
    "New Zealand Institution Credit Model",
    "Canadian Institution Credit Model",
    "No Formal Credit / Non-credit",
    "Other / Institution Defined",
];

const ACCREDITATION_FRAMEWORK_OPTIONS = [
    "None / Not Applicable",
    "NBA — India",
    "NAAC — India",
    "ABET Engineering — United States / International",
    "ABET Computing — United States / International",
    "Washington Accord — International Engineering",
    "Sydney Accord — International Engineering Technology",
    "Dublin Accord — International Engineering Technician",
    "Professional / Statutory Body Framework",
    "Institutional Accreditation Framework",
    "Other / Institution Defined",
];

function getCountryName(
    countryCode: string
): string {

    try {
        const DisplayNames =
            (
                Intl as typeof Intl & {
                    DisplayNames?: new (
                        locales?: string | string[],
                        options?: {
                            type: "region";
                        }
                    ) => {
                        of: (
                            code: string
                        ) => string | undefined;
                    };
                }
            ).DisplayNames;

        if (DisplayNames) {
            return (
                new DisplayNames(
                    ["en"],
                    {
                        type: "region",
                    }
                ).of(countryCode) ??
                countryCode
            );
        }
    } catch {
        // Fall through to the ISO code when DisplayNames is unavailable.
    }

    return countryCode;
}

function getAcademicYearOptions(): string[] {

    const currentYear =
        new Date().getFullYear();

    const years: string[] = [];

    for (
        let year =
            currentYear - 5;
        year <=
            currentYear + 10;
        year += 1
    ) {
        years.push(
            `${year}-${String(
                (year + 1) % 100
            ).padStart(2, "0")}`
        );
    }

    return years;
}

function getTermOptions(
    pattern: string
): string[] {

    switch (pattern) {

        case "Semester":
            return [
                "Semester 1",
                "Semester 2",
                "Semester 3",
                "Semester 4",
                "Semester 5",
                "Semester 6",
                "Semester 7",
                "Semester 8",
                "Semester 9",
                "Semester 10",
                "Semester 11",
                "Semester 12",
            ];

        case "Trimester":
            return [
                "Trimester 1",
                "Trimester 2",
                "Trimester 3",
            ];

        case "Quarter":
            return [
                "Quarter 1",
                "Quarter 2",
                "Quarter 3",
                "Quarter 4",
            ];

        case "Annual":
            return [
                "Year 1",
                "Year 2",
                "Year 3",
                "Year 4",
                "Year 5",
                "Year 6",
            ];

        case "Block":
            return [
                "Block 1",
                "Block 2",
                "Block 3",
                "Block 4",
                "Block 5",
                "Block 6",
                "Block 7",
                "Block 8",
            ];

        case "Modular":
            return [
                "Module Period 1",
                "Module Period 2",
                "Module Period 3",
                "Module Period 4",
            ];

        case "Term":
            return [
                "Term 1",
                "Term 2",
                "Term 3",
                "Term 4",
            ];

        case "Custom":
            return [
                "Custom / Institution Defined",
            ];

        default:
            return [];
    }
}

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
   COURSE SETUP
========================================================= */

export default function CourseSetup({
    tenant,
    role,
    courseId,
    onBack,
    onNext,
}: CourseSetupProps) {

    /* =====================================================
       ACADEMIC TENANT
       University / College keeps its course-specific
       setup behavior without repeating Academic Configuration.
    ===================================================== */

    const normalizedTenant =
        normalizeTenant(
            tenant
        );

    const isAcademicTenant =
        normalizedTenant === "university" ||
        normalizedTenant === "college";


    /* =====================================================
       BASIC INFORMATION
    ===================================================== */

    const [
        courseTitle,
        setCourseTitle,
    ] = useState("");


    const [
        courseCode,
        setCourseCode,
    ] = useState("");


    const [
        description,
        setDescription,
    ] = useState("");

    const [
        shortName,
        setShortName,
    ] = useState("");

    const [
        targetAudience,
        setTargetAudience,
    ] = useState("");

    const [
        prerequisites,
        setPrerequisites,
    ] = useState("");

    const [
        businessObjective,
        setBusinessObjective,
    ] = useState("");

    const [
        category,
        setCategory,
    ] = useState("");

    const [
        language,
        setLanguage,
    ] = useState("English");

    const [
        estimatedLearningHours,
        setEstimatedLearningHours,
    ] = useState(0);


    const [
        courseType,
        setCourseType,
    ] = useState<CourseType>("course");


    /* =====================================================
       ACADEMIC MAPPING
       University / College only
    ===================================================== */


    const [
        audienceBatch,
        setAudienceBatch,
    ] = useState("");

    const [
        audienceSection,
        setAudienceSection,
    ] = useState("");



    /* =====================================================
       DELIVERY
    ===================================================== */

    const [
        deliveryMode,
        setDeliveryMode,
    ] = useState<DeliveryMode>("onsite");


    /* =====================================================
       DURATION
    ===================================================== */

    const [
        durationValue,
        setDurationValue,
    ] = useState(3);


    const [
        durationUnit,
        setDurationUnit,
    ] = useState<
        "days" | "weeks" | "months"
    >("months");


    /* =====================================================
       DATES
    ===================================================== */

    const [
        startDate,
        setStartDate,
    ] = useState("");


    const [
        endDate,
        setEndDate,
    ] = useState("");


    /* =====================================================
       VALIDATION
    ===================================================== */

    type FieldErrors = Partial<Record<
        | "courseTitle"
        | "courseCode"
        | "durationValue"
        | "endDate"
        | "save",
        string
    >>;

    const [
        fieldErrors,
        setFieldErrors,
    ] = useState<FieldErrors>({});

    function clearFieldError(
        field: keyof FieldErrors
    ) {
        setFieldErrors((current) => {
            if (!current[field]) {
                return current;
            }

            const next = { ...current };
            delete next[field];

            return next;
        });
    }

    function renderFieldError(
        field: keyof FieldErrors
    ) {
        const message = fieldErrors[field];

        if (!message) {
            return null;
        }

        return (
            <div
                className={styles.error}
                role="alert"
                style={{
                    marginTop: "8px",
                    padding: "8px 10px",
                }}
            >
                <span className={styles.errorIcon}>
                    !
                </span>

                <span>
                    {message}
                </span>
            </div>
        );
    }

    /* =====================================================
       LOAD EXISTING DRAFT

       Step 1 always reads from the same courseId draft.
       This prevents the form from resetting when the user
       returns from a later step.
    ===================================================== */

    useEffect(() => {
        /*
         * New course:
         * No courseId exists yet, so Step 1 remains blank.
         *
         * Existing draft:
         * Load the saved Step 1 values using the same Course ID.
         */
        if (!courseId?.trim()) {
            return;
        }

        const draft = getCourseDraft(courseId);

        if (!draft?.setup) {
            return;
        }

        const setup = draft.setup;

        setCourseTitle(
            setup.title ?? ""
        );

        setCourseCode(
            setup.code ?? ""
        );

        setShortName(
            setup.shortName ?? ""
        );

        setDescription(
            setup.description ?? ""
        );

        setTargetAudience(
            setup.targetAudience ?? ""
        );

        setPrerequisites(
            setup.prerequisites ?? ""
        );

        setBusinessObjective(
            setup.objectives ?? ""
        );

        setCategory(
            setup.category ?? ""
        );

        setLanguage(
            setup.language ?? "English"
        );

        setEstimatedLearningHours(
            typeof setup.estimatedDuration === "number"
                ? setup.estimatedDuration
                : 0
        );

        if (
            setup.type === "ACADEMIC" ||
            setup.type === "PROFESSIONAL" ||
            setup.type === "CORPORATE_TRAINING" ||
            setup.type === "BOOTCAMP" ||
            setup.type === "SKILL_PROGRAM" ||
            setup.type === "WORKSHOP" ||
            setup.type === "CERTIFICATION" ||
            setup.type === "PROGRAM" ||
            setup.type === "CUSTOM"
        ) {
            const typeMap: Record<string, CourseType> = {
                ACADEMIC: "course",
                PROFESSIONAL: "course",
                CORPORATE_TRAINING: "course",
                BOOTCAMP: "bootcamp",
                SKILL_PROGRAM: "program",
                WORKSHOP: "workshop",
                CERTIFICATION: "course",
                PROGRAM: "program",
                CUSTOM: "course",
            };

            setCourseType(
                typeMap[setup.type] ?? "course"
            );
        }

        if (
            setup.deliveryMode === "CLASSROOM" ||
            setup.deliveryMode === "ONLINE" ||
            setup.deliveryMode === "HYBRID" ||
            setup.deliveryMode === "SELF_PACED"
        ) {
            const deliveryMap: Record<
                string,
                DeliveryMode
            > = {
                CLASSROOM: "onsite",
                ONLINE: "online",
                HYBRID: "hybrid",
                SELF_PACED: "self_paced",
            };

            setDeliveryMode(
                deliveryMap[setup.deliveryMode] ?? "onsite"
            );
        }

        if (setup.estimatedDurationUnit) {
            const unitMap: Record<
                string,
                "days" | "weeks" | "months"
            > = {
                DAYS: "days",
                WEEKS: "weeks",
                MONTHS: "months",
                HOURS: "weeks",
                MINUTES: "days",
            };

            if (
                setup.estimatedDurationUnit === "DAYS" ||
                setup.estimatedDurationUnit === "WEEKS" ||
                setup.estimatedDurationUnit === "MONTHS"
            ) {
                setDurationUnit(
                    unitMap[
                        setup.estimatedDurationUnit
                    ]
                );
            }
        }

        setStartDate(
            setup.dates?.courseStartDate ??
                setup.dates?.enrollmentStartDate ??
                ""
        );

        setEndDate(
            setup.dates?.courseEndDate ??
                setup.dates?.enrollmentEndDate ??
                ""
        );



    }, [courseId, isAcademicTenant]);


    /* =====================================================
       SAVE & CONTINUE
    ===================================================== */

    function handleNext() {

        const nextErrors: FieldErrors = {};

        if (!courseTitle.trim()) {
            nextErrors.courseTitle =
                "Course title is required.";
        }

        if (!courseCode.trim()) {
            nextErrors.courseCode =
                "Course code is required.";
        }


        if (
            durationValue <= 0 ||
            !Number.isFinite(durationValue)
        ) {
            nextErrors.durationValue =
                "Duration must be greater than zero.";
        }

        if (
            startDate &&
            endDate &&
            endDate < startDate
        ) {
            nextErrors.endDate =
                "End date cannot be before the start date.";
        }

        if (Object.keys(nextErrors).length > 0) {
            setFieldErrors(nextErrors);
            return;
        }

        setFieldErrors({});


        /* -------------------------------------------------
           GET OR CREATE THE COURSE DRAFT

           New course:
           - opening Step 1 does NOT create or save a draft
           - validation above must pass first
           - courseId is empty until Save & Continue is clicked
           - create exactly one draft here
           - this is the first point at which the new course is saved

           Existing draft:
           - load the existing saved draft
           - update that same record
           - never create a second Course ID
        ------------------------------------------------- */

        let existingDraft =
            courseId
                ? getCourseDraft(courseId)
                : null;

        if (!existingDraft) {
            existingDraft =
                createCourseDraft(
                    tenant,
                    role
                );
        }

        if (!existingDraft?.courseId) {
            setFieldErrors({
                save: "Unable to create the course draft. Please try again.",
            });
            return;
        }

        /* -------------------------------------------------
           MAP UI VALUES TO COURSE CREATION TYPES
        ------------------------------------------------- */

        const courseTypeMap: Record<
            CourseType,
            "ACADEMIC" |
            "PROFESSIONAL" |
            "CORPORATE_TRAINING" |
            "BOOTCAMP" |
            "SKILL_PROGRAM" |
            "WORKSHOP" |
            "CERTIFICATION" |
            "PROGRAM" |
            "CUSTOM"
        > = {
            course: "PROFESSIONAL",
            program: "PROGRAM",
            workshop: "WORKSHOP",
            bootcamp: "BOOTCAMP",
            learning_path: "SKILL_PROGRAM",
        };

        const deliveryModeMap: Record<
            DeliveryMode,
            "CLASSROOM" |
            "ONLINE" |
            "HYBRID" |
            "SELF_PACED"
        > = {
            onsite: "CLASSROOM",
            online: "ONLINE",
            hybrid: "HYBRID",
            self_paced: "SELF_PACED",
        };

        /* -------------------------------------------------
           PRESERVE ALL EXISTING DRAFT DATA

           Only Step 1 data is replaced here.
           Structure, outcomes, team, delivery, enrollment,
           completion, validation, etc. are retained.
        ------------------------------------------------- */

        const estimatedDurationUnit:
            | "HOURS"
            | "DAYS"
            | "WEEKS"
            | "MONTHS"
            | "MINUTES" =
            estimatedLearningHours > 0
                ? "HOURS"
                : durationUnit === "days"
                    ? "DAYS"
                    : durationUnit === "weeks"
                        ? "WEEKS"
                        : "MONTHS";

        const updatedDraft: CourseCreationState = {
            ...existingDraft,

            courseId: existingDraft.courseId,
            tenant,
            role,

            setup: {
                ...existingDraft.setup,

                title:
                    courseTitle.trim(),

                code:
                    courseCode.trim(),

                shortName:
                    shortName.trim(),

                description:
                    description.trim(),

                objectives:
                    businessObjective.trim(),

                prerequisites:
                    prerequisites.trim(),

                targetAudience:
                    targetAudience.trim(),

                level:
                    existingDraft.setup?.level ??
                    "INTERMEDIATE",

                type:
                    isAcademicTenant &&
                    courseType === "course"
                        ? "ACADEMIC"
                        : courseTypeMap[courseType],

                deliveryMode:
                    deliveryModeMap[deliveryMode],

                category:
                    category.trim(),

                tags:
                    existingDraft.setup?.tags ?? [],

                ownerId:
                    existingDraft.setup?.ownerId ?? "",

                primaryInstructorId:
                    existingDraft.setup?.primaryInstructorId ?? "",

                instructorIds:
                    existingDraft.setup?.instructorIds ?? [],

                reviewerId:
                    existingDraft.setup?.reviewerId ?? "",

                approverId:
                    existingDraft.setup?.approverId ?? "",

                language:
                    language.trim(),

                supportedLanguages:
                    existingDraft.setup?.supportedLanguages ??
                    [language.trim()].filter(Boolean),

                estimatedDuration:
                    estimatedLearningHours > 0
                        ? estimatedLearningHours
                        : durationValue,

                estimatedDurationUnit,

                dates: {
                    ...existingDraft.setup?.dates,

                    enrollmentStartDate:
                        startDate ||
                        undefined,

                    enrollmentEndDate:
                        endDate ||
                        undefined,

                    courseStartDate:
                        startDate ||
                        undefined,

                    courseEndDate:
                        endDate ||
                        undefined,

                    noExpiryAccess:
                        existingDraft.setup?.dates
                            ?.noExpiryAccess ??
                        false,

                    timezone:
                        existingDraft.setup?.dates
                            ?.timezone ??
                        Intl.DateTimeFormat().resolvedOptions()
                            .timeZone,
                },

                branding:
                    existingDraft.setup?.branding ?? {},
            },


            /*
             * Preserve the wizard's highest progress.
             * Step 1 is completed only after this save succeeds.
             */
            currentStep:
                Math.max(
                    existingDraft.currentStep ?? 0,
                    1
                ),

            completedThroughStep:
                Math.max(
                    existingDraft.completedThroughStep ?? 0,
                    1
                ),

            updatedAt:
                new Date().toISOString(),
        };

        /* -------------------------------------------------
           SAVE INTO THE SAME DRAFT
        ------------------------------------------------- */

        const savedDraft =
            saveCourseDraft(
                updatedDraft
            );

        /* -------------------------------------------------
           MOVE TO NEXT STEP ONLY AFTER SAVE

           For a new course, this is the first point where
           the generated Course ID is handed to CourseWizard.
           For an existing draft, the same Course ID is reused.
        ------------------------------------------------- */

        onNext(
            savedDraft.courseId
        );

    }


    /* =====================================================
       RENDER
    ===================================================== */

    return (

        <div className={styles.container}>

            {/* =================================================
                STEP HEADER
            ================================================= */}

            <header
                className={styles.heading}
            >

                <div
                    className={styles.stepLabel}
                >

                    <span
                        className={styles.stepNumber}
                    >
                        1
                    </span>

                    <span>
                        Step 1
                    </span>

                </div>


                <h2>
                    {isAcademicTenant
                        ? "Course Setup"
                        : "Basic Setup"}
                </h2>


                <p>
                    {isAcademicTenant
                        ? "Define the course information, duration, and delivery settings."
                        : "Define the core information, duration, and delivery settings for the learning offering."}
                </p>

            </header>


            {/* =================================================
                COURSE INFORMATION
            ================================================= */}

            <section
                className={styles.card}
            >

                <div
                    className={
                        styles.sectionHeader
                    }
                >

                    <div>

                        <h3>
                            Course Information
                        </h3>

                        <p>
                            Enter the basic details
                            of the learning offering.
                        </p>

                    </div>

                </div>


                <div
                    className={styles.formGrid}
                >

                    {/* =================================================
                        COURSE TITLE
                    ================================================= */}

                    <div
                        className={`
                            ${styles.field}
                            ${styles.fullWidth}
                        `}
                    >

                        <label
                            htmlFor="courseTitle"
                        >
                            Course Title
                            <span className={styles.required}>
                                *
                            </span>
                        </label>


                        <input
                            id="courseTitle"
                            type="text"
                            value={courseTitle}
                            onChange={(event) => {
                                setCourseTitle(
                                    event.target.value
                                );
                                clearFieldError("courseTitle");
                            }}
                            placeholder="Enter course title"
                        />

                        {renderFieldError("courseTitle")}

                    </div>


                    {/* =================================================
                        COURSE CODE
                    ================================================= */}

                    <div
                        className={styles.field}
                    >

                        <label
                            htmlFor="courseCode"
                        >
                            Course Code
                            <span className={styles.required}>
                                *
                            </span>
                        </label>


                        <input
                            id="courseCode"
                            type="text"
                            value={courseCode}
                            onChange={(event) => {
                                setCourseCode(
                                    event.target.value
                                );
                                clearFieldError("courseCode");
                            }}
                            placeholder="Enter course code"
                        />

                        {renderFieldError("courseCode")}

                    </div>


                    {/* =================================================
                        LEARNING TYPE
                    ================================================= */}

                    <div
                        className={styles.field}
                    >

                        <label
                            htmlFor="courseType"
                        >
                            Learning Type
                        </label>


                        <select
                            id="courseType"
                            value={courseType}
                            onChange={(event) => {

                                const value =
                                    event.target.value;

                                if (
                                    value === "course" ||
                                    value === "program" ||
                                    value === "workshop" ||
                                    value === "bootcamp" ||
                                    value === "learning_path"
                                ) {

                                    setCourseType(
                                        value
                                    );

                                }

                            }}
                        >

                            <option value="course">
                                Course
                            </option>

                            <option value="program">
                                Program
                            </option>

                            <option value="workshop">
                                Workshop
                            </option>

                            <option value="bootcamp">
                                Bootcamp
                            </option>

                            <option value="learning_path">
                                Learning Path
                            </option>

                        </select>

                    </div>


                    {/* =================================================
                        DESCRIPTION
                    ================================================= */}

                    <div
                        className={`
                            ${styles.field}
                            ${styles.fullWidth}
                        `}
                    >

                        <label
                            htmlFor="description"
                        >
                            Description
                        </label>


                        <textarea
                            id="description"
                            value={description}
                            onChange={(event) =>
                                setDescription(
                                    event.target.value
                                )
                            }
                            placeholder="Briefly describe the learning offering"
                            rows={4}
                        />

                    </div>

                    <div
                        className={styles.field}
                    >
                        <label htmlFor="shortName">
                            Short Name
                        </label>

                        <input
                            id="shortName"
                            type="text"
                            value={shortName}
                            onChange={(event) =>
                                setShortName(
                                    event.target.value
                                )
                            }
                            placeholder="Enter short name"
                        />
                    </div>

                    <div
                        className={styles.field}
                    >
                        <label htmlFor="language">
                            Language
                        </label>

                        <input
                            id="language"
                            type="text"
                            value={language}
                            onChange={(event) =>
                                setLanguage(
                                    event.target.value
                                )
                            }
                            placeholder="English"
                        />
                    </div>

                    <div
                        className={`
                            ${styles.field}
                            ${styles.fullWidth}
                        `}
                    >
                        <label htmlFor="targetAudience">
                            Target Audience
                        </label>

                        <select
                            id="targetAudience"
                            value={targetAudience}
                            onChange={(event) =>
                                setTargetAudience(
                                    event.target.value
                                )
                            }
                        >
                            <option value="">
                                Select target audience
                            </option>
                            <option value="ALL_LEARNERS">
                                All Learners
                            </option>
                            <option value="ENROLLED_LEARNERS">
                                Enrolled Learners
                            </option>
                            <option value="SELECTED_BATCH">
                                Selected Batch
                            </option>
                            <option value="SELECTED_COHORT">
                                Selected Cohort
                            </option>
                            <option value="SELECTED_PROGRAMME">
                                Selected Programme
                            </option>
                            <option value="SELECTED_DEPARTMENT">
                                Selected Department
                            </option>
                            <option value="SELECTED_YEAR_OR_LEVEL">
                                Selected Year / Level
                            </option>
                            <option value="SELECTED_SECTION">
                                Selected Section
                            </option>
                            <option value="SPECIFIC_LEARNERS">
                                Specific Learners
                            </option>
                            <option value="OPEN_ENROLLMENT">
                                Open Enrollment
                            </option>
                        </select>
                    </div>

                    {isAcademicTenant &&
                        (targetAudience === "SELECTED_BATCH" ||
                            targetAudience === "SELECTED_SECTION") && (
                            <div className={styles.field}>
                                <label htmlFor="audienceBatch">
                                    Batch
                                </label>
                                <input
                                    id="audienceBatch"
                                    type="text"
                                    value={audienceBatch}
                                    onChange={(event) =>
                                        setAudienceBatch(event.target.value)
                                    }
                                    placeholder="Example: BE-CSE-2026"
                                />
                            </div>
                        )}

                    {isAcademicTenant &&
                        targetAudience === "SELECTED_SECTION" && (
                            <div className={styles.field}>
                                <label htmlFor="audienceSection">
                                    Section
                                </label>
                                <input
                                    id="audienceSection"
                                    type="text"
                                    value={audienceSection}
                                    onChange={(event) =>
                                        setAudienceSection(event.target.value)
                                    }
                                    placeholder="Example: Section A"
                                />
                            </div>
                        )}

                    <div
                        className={`
                            ${styles.field}
                            ${styles.fullWidth}
                        `}
                    >
                        <label htmlFor="prerequisites">
                            Prerequisites
                        </label>

                        <textarea
                            id="prerequisites"
                            value={prerequisites}
                            onChange={(event) =>
                                setPrerequisites(
                                    event.target.value
                                )
                            }
                            placeholder="Required knowledge or skills"
                            rows={3}
                        />
                    </div>

                    <div
                        className={`
                            ${styles.field}
                            ${styles.fullWidth}
                        `}
                    >
                        <label htmlFor="businessObjective">
                            Course Objective
                        </label>

                        <textarea
                            id="businessObjective"
                            value={businessObjective}
                            onChange={(event) =>
                                setBusinessObjective(
                                    event.target.value
                                )
                            }
                            placeholder="What business outcome should this course support?"
                            rows={3}
                        />
                    </div>

                    <div
                        className={styles.field}
                    >
                        <label htmlFor="category">
                            Course Category
                        </label>

                        {isAcademicTenant ? (
                            <select
                                id="category"
                                value={category}
                                onChange={(event) =>
                                    setCategory(
                                        event.target.value
                                    )
                                }
                            >
                                <option value="">
                                    Select course category
                                </option>

                                {ACADEMIC_COURSE_CATEGORY_OPTIONS.map(
                                    (option) => (
                                        <option
                                            key={option}
                                            value={option}
                                        >
                                            {option}
                                        </option>
                                    )
                                )}
                            </select>
                        ) : (
                            <input
                                id="category"
                                type="text"
                                value={category}
                                onChange={(event) =>
                                    setCategory(
                                        event.target.value
                                    )
                                }
                                placeholder="Business & Management"
                            />
                        )}
                    </div>

                </div>

            </section>




            {/* =================================================
                DURATION & DATES
            ================================================= */}

            <section
                className={styles.card}
            >

                <div
                    className={
                        styles.sectionHeader
                    }
                >

                    <div>

                        <h3>
                            Duration & Dates
                        </h3>

                        <p>
                            Define the duration and
                            schedule for the offering.
                        </p>

                    </div>

                </div>


                <div
                    className={styles.formGrid}
                >

                    {/* =================================================
                        DURATION
                    ================================================= */}

                    <div
                        className={styles.field}
                    >

                        <label
                            htmlFor="durationValue"
                        >
                            Duration
                            <span className={styles.required}>
                                *
                            </span>
                        </label>


                        <input
                            id="durationValue"
                            type="number"
                            min={1}
                            value={durationValue}
                            onChange={(event) => {
                                setDurationValue(
                                    Number(
                                        event.target.value
                                    )
                                );
                                clearFieldError("durationValue");
                            }}
                        />

                        {renderFieldError("durationValue")}

                    </div>


                    {/* =================================================
                        DURATION UNIT
                    ================================================= */}

                    <div
                        className={styles.field}
                    >

                        <label
                            htmlFor="estimatedLearningHours"
                        >
                            Estimated Learning Hours
                        </label>

                        <input
                            id="estimatedLearningHours"
                            type="number"
                            min={0}
                            step="0.5"
                            value={
                                estimatedLearningHours || ""
                            }
                            onChange={(event) =>
                                setEstimatedLearningHours(
                                    Number(
                                        event.target.value
                                    )
                                )
                            }
                            placeholder="24"
                        />

                    </div>


                    <div
                        className={styles.field}
                    >

                        <label
                            htmlFor="durationUnit"
                        >
                            Duration Unit
                        </label>


                        <select
                            id="durationUnit"
                            value={durationUnit}
                            onChange={(event) => {

                                const value =
                                    event.target.value;

                                if (
                                    value === "days" ||
                                    value === "weeks" ||
                                    value === "months"
                                ) {

                                    setDurationUnit(
                                        value
                                    );

                                }

                            }}
                        >

                            <option value="days">
                                Days
                            </option>

                            <option value="weeks">
                                Weeks
                            </option>

                            <option value="months">
                                Months
                            </option>

                        </select>

                    </div>


                    {/* =================================================
                        START DATE
                    ================================================= */}

                    <div
                        className={styles.field}
                    >

                        <label
                            htmlFor="startDate"
                        >
                            Start Date
                        </label>


                        <input
                            id="startDate"
                            type="date"
                            value={startDate}
                            onChange={(event) =>
                                setStartDate(
                                    event.target.value
                                )
                            }
                        />

                    </div>


                    {/* =================================================
                        END DATE
                    ================================================= */}

                    <div
                        className={styles.field}
                    >

                        <label
                            htmlFor="endDate"
                        >
                            End Date
                        </label>


                        <input
                            id="endDate"
                            type="date"
                            value={endDate}
                            min={
                                startDate ||
                                undefined
                            }
                            onChange={(event) => {
                                setEndDate(
                                    event.target.value
                                );
                                clearFieldError("endDate");
                            }}
                        />

                        {renderFieldError("endDate")}

                    </div>

                </div>

            </section>


            {/* =================================================
                DELIVERY MODE
            ================================================= */}

            <section
                className={styles.card}
            >

                <div
                    className={
                        styles.sectionHeader
                    }
                >

                    <div>

                        <h3>
                            Delivery Mode
                        </h3>

                        <p>
                            Select how the learning
                            experience will be delivered.
                        </p>

                    </div>

                </div>


                <div
                    className={styles.modeGrid}
                >

                    {/* =================================================
                        ON-SITE
                    ================================================= */}

                    <button
                        type="button"
                        className={
                            deliveryMode === "onsite"
                                ? styles.modeActive
                                : styles.mode
                        }
                        onClick={() =>
                            setDeliveryMode(
                                "onsite"
                            )
                        }
                    >

                        <span
                            className={styles.modeIcon}
                        >
                            O
                        </span>

                        <span
                            className={styles.modeText}
                        >

                            <strong>
                                On-site
                            </strong>

                            <span>
                                Physical classroom
                            </span>

                        </span>

                    </button>


                    {/* =================================================
                        ONLINE
                    ================================================= */}

                    <button
                        type="button"
                        className={
                            deliveryMode === "online"
                                ? styles.modeActive
                                : styles.mode
                        }
                        onClick={() =>
                            setDeliveryMode(
                                "online"
                            )
                        }
                    >

                        <span
                            className={styles.modeIcon}
                        >
                            O
                        </span>

                        <span
                            className={styles.modeText}
                        >

                            <strong>
                                Online
                            </strong>

                            <span>
                                Online instructor-led
                            </span>

                        </span>

                    </button>


                    {/* =================================================
                        HYBRID
                    ================================================= */}

                    <button
                        type="button"
                        className={
                            deliveryMode === "hybrid"
                                ? styles.modeActive
                                : styles.mode
                        }
                        onClick={() =>
                            setDeliveryMode(
                                "hybrid"
                            )
                        }
                    >

                        <span
                            className={styles.modeIcon}
                        >
                            H
                        </span>

                        <span
                            className={styles.modeText}
                        >

                            <strong>
                                Hybrid
                            </strong>

                            <span>
                                Online and on-site
                            </span>

                        </span>

                    </button>


                    {/* =================================================
                        SELF-PACED
                    ================================================= */}

                    <button
                        type="button"
                        className={
                            deliveryMode === "self_paced"
                                ? styles.modeActive
                                : styles.mode
                        }
                        onClick={() =>
                            setDeliveryMode(
                                "self_paced"
                            )
                        }
                    >

                        <span
                            className={styles.modeIcon}
                        >
                            S
                        </span>

                        <span
                            className={styles.modeText}
                        >

                            <strong>
                                Self-paced
                            </strong>

                            <span>
                                Learner-controlled schedule
                            </span>

                        </span>

                    </button>

                </div>

            </section>


            {/* =================================================
                ACTIONS
            ================================================= */}

            {renderFieldError("save")}

            <div
                className={styles.actions}
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
                    onClick={handleNext}
                >
                    Save & Continue
                </button>

            </div>

        </div>

    );

}
