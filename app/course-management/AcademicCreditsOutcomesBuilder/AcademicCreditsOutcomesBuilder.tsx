"use client";

import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    getCourseDraft,
    saveCourseDraft,
} from "@/services/course-draft.service";

import type {
    CourseCreationState,
} from "@/types/course-creation.types";

import styles from "./AcademicCreditsOutcomesBuilder.module.css";


type AcademicCreditsOutcomesBuilderProps = {
    tenant: string;
    role: string;
    courseId: string;
    onBack: () => void;
    onNext: (courseId?: string) => void;
};


type BloomLevel =
    | "REMEMBER"
    | "UNDERSTAND"
    | "APPLY"
    | "ANALYZE"
    | "EVALUATE"
    | "CREATE";

type CourseOutcome = {
    id: string;
    code: string;
    statement: string;
    bloomLevel: BloomLevel;
    targetAttainment: number;
};

type ProgrammeOutcome = {
    id: string;
    code: string;
    statement: string;
};

type ProgrammeSpecificOutcome = {
    id: string;
    code: string;
    statement: string;
};

type OutcomeTargetType = "PO" | "PSO";
type OutcomeMappingStrength = 0 | 1 | 2 | 3;

type OutcomeMapping = {
    id: string;
    courseOutcomeId: string;
    targetOutcomeId: string;
    targetType: OutcomeTargetType;
    strength: OutcomeMappingStrength;
};

type AcademicCreditStructure = {
    lectureHours: number;
    tutorialHours: number;
    practicalHours: number;
    selfLearningHours: number;
    totalCredits: number;
    totalContactHours?: number;
    totalLearningHours?: number;
    hoursPerCredit?: number;
    calculatedNotionalHours?: number;
    creditUnitLabel?: string;
};

type AcademicMappingData = {
    qualificationFrameworkId?: string;
    creditFramework?: string;
    programmeName?: string;
    programmeCode?: string;
    curriculumName?: string;
    curriculumVersion?: string;
    specialization?: string;
};

type AcademicStep2Draft =
    CourseCreationState & {
        academic?: AcademicMappingData;
        academicCredits?: AcademicCreditStructure;
        courseOutcomes?: CourseOutcome[];
        programmeOutcomes?: ProgrammeOutcome[];
        programmeSpecificOutcomes?: ProgrammeSpecificOutcome[];
        outcomeMappings?: OutcomeMapping[];
    };

type CreditRule = {
    creditLabel: string;
    hoursPerCredit?: number;
};

type FieldErrors = {
    totalCredits?: string;
    contactHours?: string;
    courseOutcomes?: string;
    programmeOutcomes?: string;
    mapping?: string;
    save?: string;
    outcomes?: Record<
        string,
        {
            statement?: string;
            targetAttainment?: string;
        }
    >;
};

const BLOOM_LEVELS: {
    value: BloomLevel;
    label: string;
}[] = [
    { value: "REMEMBER", label: "Remember" },
    { value: "UNDERSTAND", label: "Understand" },
    { value: "APPLY", label: "Apply" },
    { value: "ANALYZE", label: "Analyze" },
    { value: "EVALUATE", label: "Evaluate" },
    { value: "CREATE", label: "Create" },
];

const CREDIT_RULES: Record<string, CreditRule> = {
    "new-zealand-nzqcf": {
        creditLabel: "NZQCF Credits",
        hoursPerCredit: 10,
    },
};

function normalizeTenant(value?: string | null): string {
    return String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/-/g, "_")
        .replace(/\s+/g, "_");
}

function getCreditLabel(
    qualificationFrameworkId: string,
    creditFramework: string
): string {
    const directRule =
        CREDIT_RULES[qualificationFrameworkId];

    if (directRule?.creditLabel) {
        return directRule.creditLabel;
    }

    const normalized =
        creditFramework.trim().toLowerCase();

    if (normalized.includes("ects")) {
        return "ECTS Credits";
    }

    if (normalized.includes("us semester credit")) {
        return "Semester Credits";
    }

    if (normalized.includes("us quarter credit")) {
        return "Quarter Credits";
    }

    if (normalized.includes("scqf")) {
        return "SCQF Credit Points";
    }

    if (normalized.includes("hong kong")) {
        return "QF Credits";
    }

    return "Course Credits";
}

function createOutcome(index: number): CourseOutcome {
    return {
        id: `co-${Date.now()}-${index}-${Math.random()
            .toString(36)
            .slice(2, 8)}`,
        code: `CO${index + 1}`,
        statement: "",
        bloomLevel: "APPLY",
        targetAttainment: 70,
    };
}

function createProgrammeOutcome(
    index: number
): ProgrammeOutcome {
    return {
        id: `po-${Date.now()}-${index}-${Math.random()
            .toString(36)
            .slice(2, 8)}`,
        code: `PO${index + 1}`,
        statement: "",
    };
}

function createProgrammeSpecificOutcome(
    index: number
): ProgrammeSpecificOutcome {
    return {
        id: `pso-${Date.now()}-${index}-${Math.random()
            .toString(36)
            .slice(2, 8)}`,
        code: `PSO${index + 1}`,
        statement: "",
    };
}

function safeNumber(value: unknown): number {
    const numeric = Number(value);
    return Number.isFinite(numeric)
        ? numeric
        : 0;
}

function mappingId(
    courseOutcomeId: string,
    targetType: OutcomeTargetType,
    targetOutcomeId: string
): string {
    return `${courseOutcomeId}-${targetType}-${targetOutcomeId}`;
}

export default function AcademicCreditsOutcomesBuilder({
    tenant,
    role,
    courseId,
    onBack,
    onNext,
}: AcademicCreditsOutcomesBuilderProps) {
    const normalizedTenant =
        normalizeTenant(tenant);

    const isAcademicTenant =
        normalizedTenant === "university" ||
        normalizedTenant === "college";

    const [
        academicMapping,
        setAcademicMapping,
    ] = useState<AcademicMappingData>({});

    const [lectureHours, setLectureHours] =
        useState<number>(0);
    const [tutorialHours, setTutorialHours] =
        useState<number>(0);
    const [practicalHours, setPracticalHours] =
        useState<number>(0);
    const [selfLearningHours, setSelfLearningHours] =
        useState<number>(0);
    const [totalCredits, setTotalCredits] =
        useState<number>(0);

    const [
        courseOutcomes,
        setCourseOutcomes,
    ] = useState<CourseOutcome[]>([
        createOutcome(0),
    ]);

    const [
        programmeOutcomes,
        setProgrammeOutcomes,
    ] = useState<ProgrammeOutcome[]>([]);

    const [
        programmeSpecificOutcomes,
        setProgrammeSpecificOutcomes,
    ] = useState<ProgrammeSpecificOutcome[]>([]);

    const [
        outcomeMappings,
        setOutcomeMappings,
    ] = useState<OutcomeMapping[]>([]);

    const [
        fieldErrors,
        setFieldErrors,
    ] = useState<FieldErrors>({});

    useEffect(() => {
        if (!courseId?.trim()) {
            return;
        }

        const existingDraft =
            getCourseDraft(
                courseId
            ) as AcademicStep2Draft | null;

        if (!existingDraft) {
            return;
        }

        if (isAcademicTenant) {
            setAcademicMapping(
                existingDraft.academic ?? {}
            );
        }

        const credits =
            existingDraft.academicCredits;

        if (credits) {
            setLectureHours(
                safeNumber(credits.lectureHours)
            );
            setTutorialHours(
                safeNumber(credits.tutorialHours)
            );
            setPracticalHours(
                safeNumber(credits.practicalHours)
            );
            setSelfLearningHours(
                safeNumber(credits.selfLearningHours)
            );
            setTotalCredits(
                safeNumber(credits.totalCredits)
            );
        }

        if (
            Array.isArray(
                existingDraft.courseOutcomes
            ) &&
            existingDraft.courseOutcomes.length > 0
        ) {
            setCourseOutcomes(
                existingDraft.courseOutcomes.map(
                    (outcome, index) => ({
                        id:
                            outcome.id ||
                            `co-saved-${index}`,
                        code:
                            outcome.code ||
                            `CO${index + 1}`,
                        statement:
                            outcome.statement || "",
                        bloomLevel:
                            outcome.bloomLevel ||
                            "APPLY",
                        targetAttainment:
                            safeNumber(
                                outcome.targetAttainment
                            ) || 70,
                    })
                )
            );
        }

        if (
            Array.isArray(
                existingDraft.programmeOutcomes
            )
        ) {
            setProgrammeOutcomes(
                existingDraft.programmeOutcomes.map(
                    (outcome, index) => ({
                        id:
                            outcome.id ||
                            `po-saved-${index}`,
                        code:
                            outcome.code ||
                            `PO${index + 1}`,
                        statement:
                            outcome.statement || "",
                    })
                )
            );
        }

        if (
            Array.isArray(
                existingDraft.programmeSpecificOutcomes
            )
        ) {
            setProgrammeSpecificOutcomes(
                existingDraft.programmeSpecificOutcomes.map(
                    (outcome, index) => ({
                        id:
                            outcome.id ||
                            `pso-saved-${index}`,
                        code:
                            outcome.code ||
                            `PSO${index + 1}`,
                        statement:
                            outcome.statement || "",
                    })
                )
            );
        }

        if (
            Array.isArray(
                existingDraft.outcomeMappings
            )
        ) {
            setOutcomeMappings(
                existingDraft.outcomeMappings
            );
        }
    }, [
        courseId,
        isAcademicTenant,
    ]);

    const totalContactHours =
        useMemo(
            () =>
                Math.max(0, lectureHours) +
                Math.max(0, tutorialHours) +
                Math.max(0, practicalHours),
            [
                lectureHours,
                tutorialHours,
                practicalHours,
            ]
        );

    const totalLearningHours =
        useMemo(
            () =>
                totalContactHours +
                Math.max(
                    0,
                    selfLearningHours
                ),
            [
                totalContactHours,
                selfLearningHours,
            ]
        );

    const frameworkCreditRule =
        useMemo(
            () => {
                if (!isAcademicTenant) {
                    return undefined;
                }

                const frameworkId =
                    academicMapping
                        .qualificationFrameworkId ??
                    "";

                return CREDIT_RULES[
                    frameworkId
                ];
            },
            [
                academicMapping
                    .qualificationFrameworkId,
                isAcademicTenant,
            ]
        );

    const creditUnitLabel =
        useMemo(
            () => {
                if (!isAcademicTenant) {
                    return "Total Credits";
                }

                return getCreditLabel(
                    academicMapping
                        .qualificationFrameworkId ??
                        "",
                    academicMapping
                        .creditFramework ??
                        ""
                );
            },
            [
                academicMapping
                    .creditFramework,
                academicMapping
                    .qualificationFrameworkId,
                isAcademicTenant,
            ]
        );

    const calculatedNotionalHours =
        useMemo(
            () => {
                if (
                    !isAcademicTenant ||
                    !frameworkCreditRule
                        ?.hoursPerCredit ||
                    totalCredits <= 0
                ) {
                    return 0;
                }

                return (
                    totalCredits *
                    frameworkCreditRule
                        .hoursPerCredit
                );
            },
            [
                frameworkCreditRule,
                isAcademicTenant,
                totalCredits,
            ]
        );

    const mappedCOCount =
        useMemo(
            () =>
                courseOutcomes.filter(
                    (co) =>
                        outcomeMappings.some(
                            (mapping) =>
                                mapping.courseOutcomeId ===
                                    co.id &&
                                mapping.strength > 0
                        )
                ).length,
            [
                courseOutcomes,
                outcomeMappings,
            ]
        );

    const mappedPOCount =
        useMemo(
            () =>
                programmeOutcomes.filter(
                    (po) =>
                        outcomeMappings.some(
                            (mapping) =>
                                mapping.targetType ===
                                    "PO" &&
                                mapping.targetOutcomeId ===
                                    po.id &&
                                mapping.strength > 0
                        )
                ).length,
            [
                programmeOutcomes,
                outcomeMappings,
            ]
        );

    const mappedPSOCount =
        useMemo(
            () =>
                programmeSpecificOutcomes.filter(
                    (pso) =>
                        outcomeMappings.some(
                            (mapping) =>
                                mapping.targetType ===
                                    "PSO" &&
                                mapping.targetOutcomeId ===
                                    pso.id &&
                                mapping.strength > 0
                        )
                ).length,
            [
                programmeSpecificOutcomes,
                outcomeMappings,
            ]
        );

    function clearFieldError(
        field: keyof Omit<
            FieldErrors,
            "outcomes"
        >
    ) {
        setFieldErrors(
            (current) => {
                if (!current[field]) {
                    return current;
                }

                const next = {
                    ...current,
                };

                delete next[field];

                return next;
            }
        );
    }

    function clearOutcomeError(
        outcomeId: string,
        field:
            | "statement"
            | "targetAttainment"
    ) {
        setFieldErrors(
            (current) => {
                const outcomeErrors =
                    current.outcomes?.[
                        outcomeId
                    ];

                if (
                    !outcomeErrors?.[
                        field
                    ]
                ) {
                    return current;
                }

                const nextOutcomes = {
                    ...(current.outcomes ??
                        {}),
                };

                const nextOutcomeError = {
                    ...outcomeErrors,
                };

                delete nextOutcomeError[
                    field
                ];

                if (
                    Object.keys(
                        nextOutcomeError
                    ).length === 0
                ) {
                    delete nextOutcomes[
                        outcomeId
                    ];
                } else {
                    nextOutcomes[
                        outcomeId
                    ] =
                        nextOutcomeError;
                }

                return {
                    ...current,
                    outcomes:
                        nextOutcomes,
                };
            }
        );
    }

    function updateOutcome(
        id: string,
        patch: Partial<CourseOutcome>
    ) {
        setCourseOutcomes(
            (current) =>
                current.map(
                    (outcome) =>
                        outcome.id === id
                            ? {
                                  ...outcome,
                                  ...patch,
                              }
                            : outcome
                )
        );
    }

    function addOutcome() {
        setCourseOutcomes(
            (current) => [
                ...current,
                createOutcome(
                    current.length
                ),
            ]
        );

        clearFieldError(
            "courseOutcomes"
        );
    }

    function removeOutcome(
        id: string
    ) {
        setCourseOutcomes(
            (current) => {
                if (
                    current.length <= 1
                ) {
                    return current;
                }

                const filtered =
                    current.filter(
                        (outcome) =>
                            outcome.id !== id
                    );

                return filtered.map(
                    (outcome, index) => ({
                        ...outcome,
                        code:
                            `CO${index + 1}`,
                    })
                );
            }
        );

        setOutcomeMappings(
            (current) =>
                current.filter(
                    (mapping) =>
                        mapping.courseOutcomeId !==
                        id
                )
        );
    }

    function addProgrammeOutcome() {
        setProgrammeOutcomes(
            (current) => [
                ...current,
                createProgrammeOutcome(
                    current.length
                ),
            ]
        );

        clearFieldError(
            "programmeOutcomes"
        );
    }

    function updateProgrammeOutcome(
        id: string,
        statement: string
    ) {
        setProgrammeOutcomes(
            (current) =>
                current.map(
                    (outcome) =>
                        outcome.id === id
                            ? {
                                  ...outcome,
                                  statement,
                              }
                            : outcome
                )
        );
    }

    function removeProgrammeOutcome(
        id: string
    ) {
        setProgrammeOutcomes(
            (current) =>
                current
                    .filter(
                        (outcome) =>
                            outcome.id !== id
                    )
                    .map(
                        (outcome, index) => ({
                            ...outcome,
                            code:
                                `PO${index + 1}`,
                        })
                    )
        );

        setOutcomeMappings(
            (current) =>
                current.filter(
                    (mapping) =>
                        !(
                            mapping.targetType ===
                                "PO" &&
                            mapping.targetOutcomeId ===
                                id
                        )
                )
        );
    }

    function addProgrammeSpecificOutcome() {
        setProgrammeSpecificOutcomes(
            (current) => [
                ...current,
                createProgrammeSpecificOutcome(
                    current.length
                ),
            ]
        );
    }

    function updateProgrammeSpecificOutcome(
        id: string,
        statement: string
    ) {
        setProgrammeSpecificOutcomes(
            (current) =>
                current.map(
                    (outcome) =>
                        outcome.id === id
                            ? {
                                  ...outcome,
                                  statement,
                              }
                            : outcome
                )
        );
    }

    function removeProgrammeSpecificOutcome(
        id: string
    ) {
        setProgrammeSpecificOutcomes(
            (current) =>
                current
                    .filter(
                        (outcome) =>
                            outcome.id !== id
                    )
                    .map(
                        (outcome, index) => ({
                            ...outcome,
                            code:
                                `PSO${index + 1}`,
                        })
                    )
        );

        setOutcomeMappings(
            (current) =>
                current.filter(
                    (mapping) =>
                        !(
                            mapping.targetType ===
                                "PSO" &&
                            mapping.targetOutcomeId ===
                                id
                        )
                )
        );
    }

    function getMappingStrength(
        courseOutcomeId: string,
        targetType: OutcomeTargetType,
        targetOutcomeId: string
    ): OutcomeMappingStrength {
        return (
            outcomeMappings.find(
                (mapping) =>
                    mapping.courseOutcomeId ===
                        courseOutcomeId &&
                    mapping.targetType ===
                        targetType &&
                    mapping.targetOutcomeId ===
                        targetOutcomeId
            )?.strength ?? 0
        );
    }

    function setMappingStrength(
        courseOutcomeId: string,
        targetType: OutcomeTargetType,
        targetOutcomeId: string,
        strength: OutcomeMappingStrength
    ) {
        const id =
            mappingId(
                courseOutcomeId,
                targetType,
                targetOutcomeId
            );

        setOutcomeMappings(
            (current) => {
                const filtered =
                    current.filter(
                        (mapping) =>
                            mapping.id !== id &&
                            !(
                                mapping.courseOutcomeId ===
                                    courseOutcomeId &&
                                mapping.targetType ===
                                    targetType &&
                                mapping.targetOutcomeId ===
                                    targetOutcomeId
                            )
                    );

                if (strength === 0) {
                    return filtered;
                }

                return [
                    ...filtered,
                    {
                        id,
                        courseOutcomeId,
                        targetOutcomeId,
                        targetType,
                        strength,
                    },
                ];
            }
        );

        clearFieldError(
            "mapping"
        );
    }

    function validate(): boolean {
        const nextErrors:
            FieldErrors = {
                outcomes: {},
            };

        const creditValues = [
            lectureHours,
            tutorialHours,
            practicalHours,
            selfLearningHours,
            totalCredits,
        ];

        if (
            creditValues.some(
                (value) =>
                    !Number.isFinite(value) ||
                    value < 0
            )
        ) {
            nextErrors.totalCredits =
                "Credit and hour values cannot be negative.";
        }

        if (totalCredits <= 0) {
            nextErrors.totalCredits =
                "Total credits must be greater than zero.";
        }

        if (
            totalContactHours <= 0
        ) {
            nextErrors.contactHours =
                "Enter at least one lecture, tutorial, or practical hour.";
        }

        if (
            courseOutcomes.length === 0
        ) {
            nextErrors.courseOutcomes =
                "At least one Course Outcome is required.";
        }

        for (
            let index = 0;
            index < courseOutcomes.length;
            index += 1
        ) {
            const outcome =
                courseOutcomes[index];

            const outcomeErrors: {
                statement?: string;
                targetAttainment?: string;
            } = {};

            if (
                !outcome.statement.trim()
            ) {
                outcomeErrors.statement =
                    `${outcome.code || `CO${index + 1}`} statement is required.`;
            }

            if (
                !Number.isFinite(
                    outcome.targetAttainment
                ) ||
                outcome.targetAttainment < 0 ||
                outcome.targetAttainment > 100
            ) {
                outcomeErrors.targetAttainment =
                    "Target attainment must be between 0 and 100.";
            }

            if (
                Object.keys(
                    outcomeErrors
                ).length > 0
            ) {
                nextErrors.outcomes![
                    outcome.id
                ] = outcomeErrors;
            }
        }

        if (
            programmeOutcomes.length === 0
        ) {
            nextErrors.programmeOutcomes =
                "Add or load at least one Programme Outcome before mapping.";
        } else if (
            programmeOutcomes.some(
                (outcome) =>
                    !outcome.statement.trim()
            )
        ) {
            nextErrors.programmeOutcomes =
                "Complete all Programme Outcome statements.";
        }

        if (
            programmeSpecificOutcomes.some(
                (outcome) =>
                    !outcome.statement.trim()
            )
        ) {
            nextErrors.programmeOutcomes =
                "Complete all Programme-Specific Outcome statements.";
        }

        if (
            programmeOutcomes.length > 0 &&
            courseOutcomes.length > 0 &&
            !outcomeMappings.some(
                (mapping) =>
                    mapping.strength > 0
            )
        ) {
            nextErrors.mapping =
                "Map at least one Course Outcome to a PO or PSO.";
        }

        if (
            nextErrors.outcomes &&
            Object.keys(
                nextErrors.outcomes
            ).length === 0
        ) {
            delete nextErrors.outcomes;
        }

        const hasErrors =
            Object.keys(
                nextErrors
            ).length > 0;

        setFieldErrors(
            nextErrors
        );

        return !hasErrors;
    }

    function handleNext() {
        if (!validate()) {
            return;
        }

        if (!courseId?.trim()) {
            setFieldErrors({
                save:
                    "Course draft is not available. Save Step 1 first.",
            });
            return;
        }

        const existingDraft =
            getCourseDraft(
                courseId
            ) as AcademicStep2Draft | null;

        if (!existingDraft) {
            setFieldErrors({
                save:
                    "Course draft could not be found.",
            });
            return;
        }

        const cleanedPOs =
            programmeOutcomes.map(
                (outcome, index) => ({
                    ...outcome,
                    code:
                        `PO${index + 1}`,
                    statement:
                        outcome.statement.trim(),
                })
            );

        const cleanedPSOs =
            programmeSpecificOutcomes.map(
                (outcome, index) => ({
                    ...outcome,
                    code:
                        `PSO${index + 1}`,
                    statement:
                        outcome.statement.trim(),
                })
            );

        const validTargetIds =
            new Set([
                ...cleanedPOs.map(
                    (outcome) =>
                        `PO:${outcome.id}`
                ),
                ...cleanedPSOs.map(
                    (outcome) =>
                        `PSO:${outcome.id}`
                ),
            ]);

        const validCOIds =
            new Set(
                courseOutcomes.map(
                    (outcome) =>
                        outcome.id
                )
            );

        const updatedDraft:
            AcademicStep2Draft = {
                ...existingDraft,

                tenant,
                role,

                academicCredits: {
                    lectureHours,
                    tutorialHours,
                    practicalHours,
                    selfLearningHours,
                    totalCredits,
                    totalContactHours,
                    totalLearningHours,

                    ...(isAcademicTenant &&
                    frameworkCreditRule
                        ?.hoursPerCredit
                        ? {
                              hoursPerCredit:
                                  frameworkCreditRule
                                      .hoursPerCredit,
                              calculatedNotionalHours,
                              creditUnitLabel,
                          }
                        : {}),
                },

                courseOutcomes:
                    courseOutcomes.map(
                        (outcome, index) => ({
                            ...outcome,
                            code:
                                `CO${index + 1}`,
                            statement:
                                outcome.statement.trim(),
                        })
                    ),

                programmeOutcomes:
                    cleanedPOs,

                programmeSpecificOutcomes:
                    cleanedPSOs,

                outcomeMappings:
                    outcomeMappings.filter(
                        (mapping) =>
                            mapping.strength > 0 &&
                            validCOIds.has(
                                mapping.courseOutcomeId
                            ) &&
                            validTargetIds.has(
                                `${mapping.targetType}:${mapping.targetOutcomeId}`
                            )
                    ),

                currentStep:
                    Math.max(
                        existingDraft.currentStep ??
                            0,
                        1
                    ),

                completedThroughStep:
                    Math.max(
                        existingDraft.completedThroughStep ??
                            0,
                        2
                    ),

                updatedAt:
                    new Date().toISOString(),
            };

        const savedDraft =
            saveCourseDraft(
                updatedDraft as CourseCreationState
            );

        onNext(
            savedDraft.courseId
        );
    }

    const matrixCellStyle = {
        minWidth: 78,
        padding: "8px",
        textAlign: "center" as const,
        borderBottom:
            "1px solid rgba(104,115,134,0.16)",
    };

    const matrixHeaderStyle = {
        ...matrixCellStyle,
        fontWeight: 700,
        color: "#2a354f",
        background:
            "rgba(255,255,255,0.35)",
    };

    return (
        <div
            className={
                styles.container
            }
        >
            <header
                className={
                    styles.heading
                }
            >
                <div
                    className={
                        styles.stepLabel
                    }
                >
                    <span
                        className={
                            styles.stepNumber
                        }
                    >
                        2
                    </span>
                    <span>
                        Step 2
                    </span>
                </div>

                <h2>
                    Credits & Outcome Mapping
                </h2>

                <p>
                    Define the credit structure,
                    Course Outcomes, Programme Outcomes,
                    Programme-Specific Outcomes and
                    CO-to-PO/PSO alignment in one place.
                </p>
            </header>

            <section
                className={
                    styles.card
                }
            >
                <div
                    className={
                        styles.sectionHeader
                    }
                >
                    <div>
                        <h3>
                            Credit Structure
                        </h3>
                        <p>
                            Capture the approved course
                            credits and learning workload.
                        </p>
                    </div>
                </div>

                <div
                    className={
                        styles.formGrid
                    }
                >
                    <div
                        className={
                            styles.field
                        }
                    >
                        <label
                            htmlFor="totalCredits"
                        >
                            {creditUnitLabel}
                            <span
                                className={
                                    styles.required
                                }
                            >
                                *
                            </span>
                        </label>

                        <input
                            id="totalCredits"
                            type="number"
                            min={0}
                            step="0.5"
                            value={
                                totalCredits
                            }
                            onChange={(
                                event
                            ) => {
                                setTotalCredits(
                                    safeNumber(
                                        event.target.value
                                    )
                                );
                                clearFieldError(
                                    "totalCredits"
                                );
                            }}
                        />

                        {fieldErrors
                            .totalCredits && (
                            <div
                                className={
                                    styles.error
                                }
                                role="alert"
                            >
                                {
                                    fieldErrors
                                        .totalCredits
                                }
                            </div>
                        )}
                    </div>

                    <div
                        className={
                            styles.field
                        }
                    >
                        <label
                            htmlFor="lectureHours"
                        >
                            Lecture Hours
                        </label>
                        <input
                            id="lectureHours"
                            type="number"
                            min={0}
                            step="0.5"
                            value={
                                lectureHours
                            }
                            onChange={(
                                event
                            ) => {
                                setLectureHours(
                                    safeNumber(
                                        event.target.value
                                    )
                                );
                                clearFieldError(
                                    "contactHours"
                                );
                            }}
                        />
                    </div>

                    <div
                        className={
                            styles.field
                        }
                    >
                        <label
                            htmlFor="tutorialHours"
                        >
                            Tutorial Hours
                        </label>
                        <input
                            id="tutorialHours"
                            type="number"
                            min={0}
                            step="0.5"
                            value={
                                tutorialHours
                            }
                            onChange={(
                                event
                            ) => {
                                setTutorialHours(
                                    safeNumber(
                                        event.target.value
                                    )
                                );
                                clearFieldError(
                                    "contactHours"
                                );
                            }}
                        />
                    </div>

                    <div
                        className={
                            styles.field
                        }
                    >
                        <label
                            htmlFor="practicalHours"
                        >
                            Practical / Lab Hours
                        </label>
                        <input
                            id="practicalHours"
                            type="number"
                            min={0}
                            step="0.5"
                            value={
                                practicalHours
                            }
                            onChange={(
                                event
                            ) => {
                                setPracticalHours(
                                    safeNumber(
                                        event.target.value
                                    )
                                );
                                clearFieldError(
                                    "contactHours"
                                );
                            }}
                        />
                    </div>

                    <div
                        className={
                            styles.field
                        }
                    >
                        <label
                            htmlFor="selfLearningHours"
                        >
                            Self-Learning Hours
                        </label>
                        <input
                            id="selfLearningHours"
                            type="number"
                            min={0}
                            step="0.5"
                            value={
                                selfLearningHours
                            }
                            onChange={(
                                event
                            ) =>
                                setSelfLearningHours(
                                    safeNumber(
                                        event.target.value
                                    )
                                )
                            }
                        />
                    </div>

                    <div
                        className={
                            styles.field
                        }
                    >
                        <label>
                            Total Contact Hours
                        </label>
                        <input
                            type="number"
                            value={
                                totalContactHours
                            }
                            readOnly
                            aria-readonly="true"
                        />

                        {fieldErrors
                            .contactHours && (
                            <div
                                className={
                                    styles.error
                                }
                                role="alert"
                            >
                                {
                                    fieldErrors
                                        .contactHours
                                }
                            </div>
                        )}
                    </div>

                    <div
                        className={
                            styles.field
                        }
                    >
                        <label>
                            Total Learning Hours
                        </label>
                        <input
                            type="number"
                            value={
                                totalLearningHours
                            }
                            readOnly
                            aria-readonly="true"
                        />
                    </div>

                    {isAcademicTenant &&
                        frameworkCreditRule
                            ?.hoursPerCredit && (
                        <>
                            <div
                                className={
                                    styles.field
                                }
                            >
                                <label>
                                    Hours per Credit
                                </label>
                                <input
                                    type="number"
                                    value={
                                        frameworkCreditRule
                                            .hoursPerCredit
                                    }
                                    readOnly
                                    aria-readonly="true"
                                />
                            </div>

                            <div
                                className={
                                    styles.field
                                }
                            >
                                <label>
                                    Calculated Notional Hours
                                </label>
                                <input
                                    type="number"
                                    value={
                                        calculatedNotionalHours
                                    }
                                    readOnly
                                    aria-readonly="true"
                                />
                            </div>
                        </>
                    )}
                </div>
            </section>

            <section
                className={
                    styles.card
                }
            >
                <div
                    className={
                        styles.sectionHeader
                    }
                >
                    <div>
                        <h3>
                            Course Outcomes (CO)
                        </h3>
                        <p>
                            Define measurable Course Outcomes
                            with Bloom&apos;s level and target
                            attainment.
                        </p>
                    </div>

                    <button
                        type="button"
                        className={
                            styles.addButton
                        }
                        onClick={
                            addOutcome
                        }
                    >
                        + Add CO
                    </button>
                </div>

                {fieldErrors
                    .courseOutcomes && (
                    <div
                        className={
                            styles.error
                        }
                        role="alert"
                    >
                        {
                            fieldErrors
                                .courseOutcomes
                        }
                    </div>
                )}

                <div
                    className={
                        styles.outcomeList
                    }
                >
                    {courseOutcomes.map(
                        (
                            outcome,
                            index
                        ) => (
                            <div
                                key={
                                    outcome.id
                                }
                                className={
                                    styles.outcomeCard
                                }
                            >
                                <div
                                    className={
                                        styles.outcomeHeader
                                    }
                                >
                                    <strong>
                                        {`CO${index + 1}`}
                                    </strong>

                                    <button
                                        type="button"
                                        className={
                                            styles.removeButton
                                        }
                                        disabled={
                                            courseOutcomes.length <=
                                            1
                                        }
                                        onClick={() =>
                                            removeOutcome(
                                                outcome.id
                                            )
                                        }
                                    >
                                        Remove
                                    </button>
                                </div>

                                <div
                                    className={
                                        styles.outcomeGrid
                                    }
                                >
                                    <div
                                        className={`${styles.field} ${styles.statementField}`}
                                    >
                                        <label
                                            htmlFor={`statement-${outcome.id}`}
                                        >
                                            Course Outcome (CO) Statement
                                            <span
                                                className={
                                                    styles.required
                                                }
                                            >
                                                *
                                            </span>
                                        </label>

                                        <textarea
                                            id={`statement-${outcome.id}`}
                                            rows={3}
                                            value={
                                                outcome.statement
                                            }
                                            onChange={(
                                                event
                                            ) => {
                                                updateOutcome(
                                                    outcome.id,
                                                    {
                                                        statement:
                                                            event.target.value,
                                                    }
                                                );
                                                clearOutcomeError(
                                                    outcome.id,
                                                    "statement"
                                                );
                                            }}
                                            placeholder="Example: Apply appropriate data structures to solve computational problems."
                                        />

                                        {fieldErrors
                                            .outcomes?.[
                                                outcome.id
                                            ]?.statement && (
                                            <div
                                                className={
                                                    styles.error
                                                }
                                                role="alert"
                                            >
                                                {
                                                    fieldErrors
                                                        .outcomes?.[
                                                            outcome.id
                                                        ]?.statement
                                                }
                                            </div>
                                        )}
                                    </div>

                                    <div
                                        className={
                                            styles.field
                                        }
                                    >
                                        <label
                                            htmlFor={`bloom-${outcome.id}`}
                                        >
                                            Bloom&apos;s Level
                                        </label>

                                        <select
                                            id={`bloom-${outcome.id}`}
                                            value={
                                                outcome.bloomLevel
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                updateOutcome(
                                                    outcome.id,
                                                    {
                                                        bloomLevel:
                                                            event.target.value as BloomLevel,
                                                    }
                                                )
                                            }
                                        >
                                            {BLOOM_LEVELS.map(
                                                (
                                                    level
                                                ) => (
                                                    <option
                                                        key={
                                                            level.value
                                                        }
                                                        value={
                                                            level.value
                                                        }
                                                    >
                                                        {
                                                            level.label
                                                        }
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </div>

                                    <div
                                        className={
                                            styles.field
                                        }
                                    >
                                        <label
                                            htmlFor={`target-${outcome.id}`}
                                        >
                                            Target Attainment (%)
                                        </label>

                                        <input
                                            id={`target-${outcome.id}`}
                                            type="number"
                                            min={0}
                                            max={100}
                                            value={
                                                outcome.targetAttainment
                                            }
                                            onChange={(
                                                event
                                            ) => {
                                                updateOutcome(
                                                    outcome.id,
                                                    {
                                                        targetAttainment:
                                                            safeNumber(
                                                                event.target.value
                                                            ),
                                                    }
                                                );
                                                clearOutcomeError(
                                                    outcome.id,
                                                    "targetAttainment"
                                                );
                                            }}
                                        />

                                        {fieldErrors
                                            .outcomes?.[
                                                outcome.id
                                            ]?.targetAttainment && (
                                            <div
                                                className={
                                                    styles.error
                                                }
                                                role="alert"
                                            >
                                                {
                                                    fieldErrors
                                                        .outcomes?.[
                                                            outcome.id
                                                        ]?.targetAttainment
                                                }
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    )}
                </div>
            </section>

            <section
                className={
                    styles.card
                }
            >
                <div
                    className={
                        styles.sectionHeader
                    }
                >
                    <div>
                        <h3>
                            Programme Outcomes (PO)
                        </h3>
                        <p>
                            These should normally be loaded
                            from the selected Programme /
                            Curriculum Master. Manual entry is
                            available here for prototype testing.
                        </p>
                    </div>

                    <button
                        type="button"
                        className={
                            styles.addButton
                        }
                        onClick={
                            addProgrammeOutcome
                        }
                    >
                        + Add PO
                    </button>
                </div>

                {fieldErrors
                    .programmeOutcomes && (
                    <div
                        className={
                            styles.error
                        }
                        role="alert"
                    >
                        {
                            fieldErrors
                                .programmeOutcomes
                        }
                    </div>
                )}

                <div
                    className={
                        styles.outcomeList
                    }
                >
                    {programmeOutcomes.length ===
                    0 ? (
                        <p>
                            No Programme Outcomes are available.
                            Add PO records for testing. When the
                            Programme Master is connected, these
                            values should be loaded automatically.
                        </p>
                    ) : (
                        programmeOutcomes.map(
                            (
                                outcome,
                                index
                            ) => (
                                <div
                                    key={
                                        outcome.id
                                    }
                                    className={
                                        styles.outcomeCard
                                    }
                                >
                                    <div
                                        className={
                                            styles.outcomeHeader
                                        }
                                    >
                                        <strong>
                                            {`PO${index + 1}`}
                                        </strong>

                                        <button
                                            type="button"
                                            className={
                                                styles.removeButton
                                            }
                                            onClick={() =>
                                                removeProgrammeOutcome(
                                                    outcome.id
                                                )
                                            }
                                        >
                                            Remove
                                        </button>
                                    </div>

                                    <div
                                        className={
                                            styles.field
                                        }
                                    >
                                        <label
                                            htmlFor={`po-${outcome.id}`}
                                        >
                                            Programme Outcome Statement
                                        </label>
                                        <textarea
                                            id={`po-${outcome.id}`}
                                            rows={3}
                                            value={
                                                outcome.statement
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                updateProgrammeOutcome(
                                                    outcome.id,
                                                    event.target.value
                                                )
                                            }
                                            placeholder="Example: Apply engineering knowledge to solve complex computing problems."
                                        />
                                    </div>
                                </div>
                            )
                        )
                    )}
                </div>
            </section>

            <section
                className={
                    styles.card
                }
            >
                <div
                    className={
                        styles.sectionHeader
                    }
                >
                    <div>
                        <h3>
                            Programme-Specific Outcomes (PSO)
                        </h3>
                        <p>
                            Capture specialization-specific
                            outcomes. These should also come
                            from Programme / Curriculum Master
                            when master-data integration is ready.
                        </p>
                    </div>

                    <button
                        type="button"
                        className={
                            styles.addButton
                        }
                        onClick={
                            addProgrammeSpecificOutcome
                        }
                    >
                        + Add PSO
                    </button>
                </div>

                <div
                    className={
                        styles.outcomeList
                    }
                >
                    {programmeSpecificOutcomes.length ===
                    0 ? (
                        <p>
                            No PSO is currently defined.
                            PSO is optional where the selected
                            programme does not use specialization
                            outcomes.
                        </p>
                    ) : (
                        programmeSpecificOutcomes.map(
                            (
                                outcome,
                                index
                            ) => (
                                <div
                                    key={
                                        outcome.id
                                    }
                                    className={
                                        styles.outcomeCard
                                    }
                                >
                                    <div
                                        className={
                                            styles.outcomeHeader
                                        }
                                    >
                                        <strong>
                                            {`PSO${index + 1}`}
                                        </strong>

                                        <button
                                            type="button"
                                            className={
                                                styles.removeButton
                                            }
                                            onClick={() =>
                                                removeProgrammeSpecificOutcome(
                                                    outcome.id
                                                )
                                            }
                                        >
                                            Remove
                                        </button>
                                    </div>

                                    <div
                                        className={
                                            styles.field
                                        }
                                    >
                                        <label
                                            htmlFor={`pso-${outcome.id}`}
                                        >
                                            Programme-Specific Outcome Statement
                                        </label>
                                        <textarea
                                            id={`pso-${outcome.id}`}
                                            rows={3}
                                            value={
                                                outcome.statement
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                updateProgrammeSpecificOutcome(
                                                    outcome.id,
                                                    event.target.value
                                                )
                                            }
                                            placeholder="Example: Design and develop intelligent software solutions using modern computing technologies."
                                        />
                                    </div>
                                </div>
                            )
                        )
                    )}
                </div>
            </section>

            <section
                className={
                    styles.card
                }
            >
                <div
                    className={
                        styles.sectionHeader
                    }
                >
                    <div>
                        <h3>
                            CO → PO / PSO Mapping
                        </h3>
                        <p>
                            Select contribution strength:
                            0 = No Mapping, 1 = Low,
                            2 = Medium, 3 = High.
                        </p>
                    </div>
                </div>

                {fieldErrors.mapping && (
                    <div
                        className={
                            styles.error
                        }
                        role="alert"
                    >
                        {
                            fieldErrors.mapping
                        }
                    </div>
                )}

                {programmeOutcomes.length ===
                    0 &&
                programmeSpecificOutcomes.length ===
                    0 ? (
                    <p>
                        Add or load PO / PSO records to
                        enable outcome mapping.
                    </p>
                ) : (
                    <div
                        style={{
                            width:
                                "100%",
                            overflowX:
                                "auto",
                        }}
                    >
                        <table
                            style={{
                                width:
                                    "100%",
                                borderCollapse:
                                    "collapse",
                                fontSize:
                                    13,
                            }}
                        >
                            <thead>
                                <tr>
                                    <th
                                        style={
                                            matrixHeaderStyle
                                        }
                                    >
                                        CO
                                    </th>

                                    {programmeOutcomes.map(
                                        (po) => (
                                            <th
                                                key={
                                                    po.id
                                                }
                                                style={
                                                    matrixHeaderStyle
                                                }
                                                title={
                                                    po.statement
                                                }
                                            >
                                                {
                                                    po.code
                                                }
                                            </th>
                                        )
                                    )}

                                    {programmeSpecificOutcomes.map(
                                        (pso) => (
                                            <th
                                                key={
                                                    pso.id
                                                }
                                                style={
                                                    matrixHeaderStyle
                                                }
                                                title={
                                                    pso.statement
                                                }
                                            >
                                                {
                                                    pso.code
                                                }
                                            </th>
                                        )
                                    )}
                                </tr>
                            </thead>

                            <tbody>
                                {courseOutcomes.map(
                                    (co) => (
                                        <tr
                                            key={
                                                co.id
                                            }
                                        >
                                            <td
                                                style={{
                                                    ...matrixCellStyle,
                                                    textAlign:
                                                        "left",
                                                    fontWeight:
                                                        700,
                                                    color:
                                                        "#2a354f",
                                                }}
                                                title={
                                                    co.statement
                                                }
                                            >
                                                {
                                                    co.code
                                                }
                                            </td>

                                            {programmeOutcomes.map(
                                                (po) => (
                                                    <td
                                                        key={
                                                            po.id
                                                        }
                                                        style={
                                                            matrixCellStyle
                                                        }
                                                    >
                                                        <select
                                                            aria-label={`${co.code} to ${po.code} mapping strength`}
                                                            value={
                                                                getMappingStrength(
                                                                    co.id,
                                                                    "PO",
                                                                    po.id
                                                                )
                                                            }
                                                            onChange={(
                                                                event
                                                            ) =>
                                                                setMappingStrength(
                                                                    co.id,
                                                                    "PO",
                                                                    po.id,
                                                                    Number(
                                                                        event.target.value
                                                                    ) as OutcomeMappingStrength
                                                                )
                                                            }
                                                        >
                                                            <option value={0}>
                                                                0
                                                            </option>
                                                            <option value={1}>
                                                                1
                                                            </option>
                                                            <option value={2}>
                                                                2
                                                            </option>
                                                            <option value={3}>
                                                                3
                                                            </option>
                                                        </select>
                                                    </td>
                                                )
                                            )}

                                            {programmeSpecificOutcomes.map(
                                                (pso) => (
                                                    <td
                                                        key={
                                                            pso.id
                                                        }
                                                        style={
                                                            matrixCellStyle
                                                        }
                                                    >
                                                        <select
                                                            aria-label={`${co.code} to ${pso.code} mapping strength`}
                                                            value={
                                                                getMappingStrength(
                                                                    co.id,
                                                                    "PSO",
                                                                    pso.id
                                                                )
                                                            }
                                                            onChange={(
                                                                event
                                                            ) =>
                                                                setMappingStrength(
                                                                    co.id,
                                                                    "PSO",
                                                                    pso.id,
                                                                    Number(
                                                                        event.target.value
                                                                    ) as OutcomeMappingStrength
                                                                )
                                                            }
                                                        >
                                                            <option value={0}>
                                                                0
                                                            </option>
                                                            <option value={1}>
                                                                1
                                                            </option>
                                                            <option value={2}>
                                                                2
                                                            </option>
                                                            <option value={3}>
                                                                3
                                                            </option>
                                                        </select>
                                                    </td>
                                                )
                                            )}
                                        </tr>
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <section
                className={
                    styles.card
                }
            >
                <div
                    className={
                        styles.sectionHeader
                    }
                >
                    <div>
                        <h3>
                            Outcome Coverage Summary
                        </h3>
                        <p>
                            Quick validation of CO, PO and PSO
                            alignment before continuing.
                        </p>
                    </div>
                </div>

                <div
                    className={
                        styles.formGrid
                    }
                >
                    <div
                        className={
                            styles.field
                        }
                    >
                        <label>
                            Course Outcomes
                        </label>
                        <input
                            value={
                                courseOutcomes.length
                            }
                            readOnly
                        />
                    </div>

                    <div
                        className={
                            styles.field
                        }
                    >
                        <label>
                            COs with Mapping
                        </label>
                        <input
                            value={
                                mappedCOCount
                            }
                            readOnly
                        />
                    </div>

                    <div
                        className={
                            styles.field
                        }
                    >
                        <label>
                            Programme Outcomes
                        </label>
                        <input
                            value={
                                programmeOutcomes.length
                            }
                            readOnly
                        />
                    </div>

                    <div
                        className={
                            styles.field
                        }
                    >
                        <label>
                            POs Covered
                        </label>
                        <input
                            value={
                                mappedPOCount
                            }
                            readOnly
                        />
                    </div>

                    <div
                        className={
                            styles.field
                        }
                    >
                        <label>
                            Programme-Specific Outcomes
                        </label>
                        <input
                            value={
                                programmeSpecificOutcomes.length
                            }
                            readOnly
                        />
                    </div>

                    <div
                        className={
                            styles.field
                        }
                    >
                        <label>
                            PSOs Covered
                        </label>
                        <input
                            value={
                                mappedPSOCount
                            }
                            readOnly
                        />
                    </div>
                </div>
            </section>

            {fieldErrors.save && (
                <div
                    className={
                        styles.error
                    }
                    role="alert"
                >
                    {
                        fieldErrors.save
                    }
                </div>
            )}

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
                    onClick={
                        onBack
                    }
                >
                    Back
                </button>

                <button
                    type="button"
                    className={
                        styles.nextButton
                    }
                    onClick={
                        handleNext
                    }
                >
                    Save & Continue
                </button>
            </div>
        </div>
    );
}
