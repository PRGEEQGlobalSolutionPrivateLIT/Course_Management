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

import {
    GLOBAL_ACADEMIC_COUNTRIES,
    GLOBAL_ACADEMIC_FRAMEWORKS,
    type AcademicFramework,
} from "@/config/global-academic-frameworks";

import styles from "./AcademicOutcomeMappingBuilder.module.css";


type AcademicOutcomeMappingBuilderProps = {
    tenant: string;
    role: string;
    courseId: string;
    onBack: () => void;
    onNext: (courseId?: string) => void;
};


type StoredCourseOutcome = {
    id?: string;
    code?: string;
    statement?: string;
    bloomLevel?: string;
    targetAttainment?: number;
};


type ProgrammeOutcome = {
    id: string;
    code: string;
    title: string;
    description: string;
    type:
        | "PROGRAMME_OUTCOME"
        | "PROGRAMME_SPECIFIC_OUTCOME"
        | "STUDENT_OUTCOME"
        | "GRADUATE_ATTRIBUTE"
        | "LEVEL_DESCRIPTOR"
        | "COMPETENCY"
        | "INSTITUTIONAL_OUTCOME";
};


type MappingStrength =
    | 0
    | 1
    | 2
    | 3;


type OutcomeMappingCell = {
    courseOutcomeId: string;
    targetOutcomeId: string;
    strength: MappingStrength;
    justification: string;
};


type AcademicFrameworkMappingState = {
    countryCode: string;
    frameworkType: string;
    frameworkId: string;
    frameworkVersion: string;
    frameworkLevelId: string;
    programmeName: string;
    outcomeSetName: string;
    mappingScale: "0_3";
    targetOutcomes: ProgrammeOutcome[];
    mappings: OutcomeMappingCell[];
};


type AcademicMappingDraft =
    CourseCreationState & {
        courseOutcomes?: StoredCourseOutcome[];
        academic?: {
            academicYear?: string;
            programmeName?: string;
            programmeCode?: string;
            regulation?: string;
            curriculumName?: string;
            curriculumVersion?: string;
            semester?: string;
        };
        academicFrameworkMapping?:
            AcademicFrameworkMappingState;
    };


const DEFAULT_NBA_OUTCOMES:
    ProgrammeOutcome[] = [
    {
        id: "PO1",
        code: "PO1",
        title: "Engineering Knowledge",
        description:
            "Apply knowledge appropriate to the discipline and programme.",
        type:
            "PROGRAMME_OUTCOME",
    },
    {
        id: "PO2",
        code: "PO2",
        title: "Problem Analysis",
        description:
            "Identify, formulate, research, and analyze complex problems.",
        type:
            "PROGRAMME_OUTCOME",
    },
    {
        id: "PO3",
        code: "PO3",
        title: "Design / Development of Solutions",
        description:
            "Design solutions that meet specified needs and constraints.",
        type:
            "PROGRAMME_OUTCOME",
    },
    {
        id: "PO4",
        code: "PO4",
        title: "Investigation",
        description:
            "Use research-based knowledge and methods for investigation.",
        type:
            "PROGRAMME_OUTCOME",
    },
    {
        id: "PO5",
        code: "PO5",
        title: "Modern Tool Usage",
        description:
            "Select and apply appropriate modern tools and techniques.",
        type:
            "PROGRAMME_OUTCOME",
    },
    {
        id: "PO6",
        code: "PO6",
        title: "Professional and Societal Context",
        description:
            "Apply contextual reasoning to professional and societal responsibilities.",
        type:
            "PROGRAMME_OUTCOME",
    },
    {
        id: "PO7",
        code: "PO7",
        title: "Environment and Sustainability",
        description:
            "Understand sustainability and environmental impact.",
        type:
            "PROGRAMME_OUTCOME",
    },
    {
        id: "PO8",
        code: "PO8",
        title: "Ethics",
        description:
            "Apply ethical principles and professional responsibilities.",
        type:
            "PROGRAMME_OUTCOME",
    },
    {
        id: "PO9",
        code: "PO9",
        title: "Individual and Team Work",
        description:
            "Function effectively individually and in diverse teams.",
        type:
            "PROGRAMME_OUTCOME",
    },
    {
        id: "PO10",
        code: "PO10",
        title: "Communication",
        description:
            "Communicate effectively with professional and wider audiences.",
        type:
            "PROGRAMME_OUTCOME",
    },
    {
        id: "PO11",
        code: "PO11",
        title: "Project Management",
        description:
            "Apply management principles in multidisciplinary environments.",
        type:
            "PROGRAMME_OUTCOME",
    },
    {
        id: "PO12",
        code: "PO12",
        title: "Life-long Learning",
        description:
            "Recognize and pursue independent, continuous learning.",
        type:
            "PROGRAMME_OUTCOME",
    },
];


const ABET_ENGINEERING_OUTCOMES:
    ProgrammeOutcome[] =
    Array.from(
        {
            length: 7,
        },
        (_, index) => ({
            id:
                `ABET-SO-${index + 1}`,

            code:
                `SO${index + 1}`,

            title:
                `Student Outcome ${index + 1}`,

            description:
                "Institution-approved ABET student outcome. Configure the current approved wording in master data.",

            type:
                "STUDENT_OUTCOME",
        })
    );


const EQF_DOMAINS:
    ProgrammeOutcome[] = [
    {
        id: "EQF-K",
        code: "K",
        title: "Knowledge",
        description:
            "Framework knowledge descriptor for the selected EQF level.",
        type:
            "LEVEL_DESCRIPTOR",
    },
    {
        id: "EQF-S",
        code: "S",
        title: "Skills",
        description:
            "Framework skills descriptor for the selected EQF level.",
        type:
            "LEVEL_DESCRIPTOR",
    },
    {
        id: "EQF-RA",
        code: "R&A",
        title: "Responsibility and Autonomy",
        description:
            "Framework responsibility and autonomy descriptor for the selected EQF level.",
        type:
            "LEVEL_DESCRIPTOR",
    },
];


const AQF_DOMAINS:
    ProgrammeOutcome[] = [
    {
        id: "AQF-K",
        code: "K",
        title: "Knowledge",
        description:
            "Knowledge descriptor aligned to the selected AQF level.",
        type:
            "LEVEL_DESCRIPTOR",
    },
    {
        id: "AQF-S",
        code: "S",
        title: "Skills",
        description:
            "Skills descriptor aligned to the selected AQF level.",
        type:
            "LEVEL_DESCRIPTOR",
    },
    {
        id: "AQF-A",
        code: "A",
        title: "Application of Knowledge and Skills",
        description:
            "Application descriptor aligned to the selected AQF level.",
        type:
            "LEVEL_DESCRIPTOR",
    },
];


function getDefaultTargets(
    framework?: AcademicFramework
): ProgrammeOutcome[] {

    if (!framework) {
        return [];
    }

    if (
        framework.id ===
        "india-nba"
    ) {
        return DEFAULT_NBA_OUTCOMES;
    }

    if (
        framework.id ===
        "usa-abet-engineering" ||
        framework.id ===
        "usa-abet-computing"
    ) {
        return ABET_ENGINEERING_OUTCOMES;
    }

    if (
        framework.id ===
        "eu-eqf"
    ) {
        return EQF_DOMAINS;
    }

    if (
        framework.id ===
        "australia-aqf"
    ) {
        return AQF_DOMAINS;
    }

    /*
     * Other global frameworks are intentionally loaded as configurable
     * master data. The user can add the programme's approved outcome set
     * below instead of hard-coding potentially outdated official wording.
     */
    return [];
}


function newTargetOutcome(
    index: number
): ProgrammeOutcome {

    return {
        id:
            `TARGET-${Date.now()}-${index}`,

        code:
            `O${index + 1}`,

        title:
            "",

        description:
            "",

        type:
            "PROGRAMME_OUTCOME",
    };
}


export default function AcademicOutcomeMappingBuilder({
    tenant,
    role,
    courseId,
    onBack,
    onNext,
}: AcademicOutcomeMappingBuilderProps) {

    const [
        courseOutcomes,
        setCourseOutcomes,
    ] =
        useState<StoredCourseOutcome[]>(
            []
        );


    const [
        countryCode,
        setCountryCode,
    ] =
        useState<string>("");


    const [
        frameworkType,
        setFrameworkType,
    ] =
        useState<string>("");


    const [
        frameworkId,
        setFrameworkId,
    ] =
        useState<string>("");


    const [
        frameworkVersion,
        setFrameworkVersion,
    ] =
        useState<string>("");


    const [
        frameworkLevelId,
        setFrameworkLevelId,
    ] =
        useState<string>("");


    const [
        programmeName,
        setProgrammeName,
    ] =
        useState<string>("");


    const [
        outcomeSetName,
        setOutcomeSetName,
    ] =
        useState<string>("");


    const [
        targetOutcomes,
        setTargetOutcomes,
    ] =
        useState<ProgrammeOutcome[]>(
            []
        );


    const [
        mappings,
        setMappings,
    ] =
        useState<OutcomeMappingCell[]>(
            []
        );


    const [
        error,
        setError,
    ] =
        useState<string>("");


    const countryFrameworks =
        useMemo(
            () =>
                GLOBAL_ACADEMIC_FRAMEWORKS.filter(
                    (framework) =>
                        !countryCode ||
                        framework.countryCode ===
                            countryCode
                ),
            [
                countryCode,
            ]
        );


    const availableFrameworkTypes =
        useMemo(
            () =>
                Array.from(
                    new Set(
                        countryFrameworks.map(
                            (framework) =>
                                framework.frameworkType
                        )
                    )
                ),
            [
                countryFrameworks,
            ]
        );


    const filteredFrameworks =
        useMemo(
            () =>
                countryFrameworks.filter(
                    (framework) =>
                        !frameworkType ||
                        framework.frameworkType ===
                            frameworkType
                ),
            [
                countryFrameworks,
                frameworkType,
            ]
        );


    const selectedFramework =
        useMemo(
            () =>
                GLOBAL_ACADEMIC_FRAMEWORKS.find(
                    (framework) =>
                        framework.id ===
                        frameworkId
                ),
            [
                frameworkId,
            ]
        );


    useEffect(() => {

        if (!courseId?.trim()) {
            return;
        }

        const draft =
            getCourseDraft(
                courseId
            ) as AcademicMappingDraft | null;

        if (!draft) {
            return;
        }

        setCourseOutcomes(
            Array.isArray(
                draft.courseOutcomes
            )
                ? draft.courseOutcomes
                : []
        );

        setProgrammeName(
            draft.academic?.programmeName ??
                ""
        );

        const saved =
            draft.academicFrameworkMapping;

        if (!saved) {
            return;
        }

        setCountryCode(
            saved.countryCode ??
                ""
        );

        setFrameworkType(
            saved.frameworkType ??
                ""
        );

        setFrameworkId(
            saved.frameworkId ??
                ""
        );

        setFrameworkVersion(
            saved.frameworkVersion ??
                ""
        );

        setFrameworkLevelId(
            saved.frameworkLevelId ??
                ""
        );

        setProgrammeName(
            saved.programmeName ||
                draft.academic?.programmeName ||
                ""
        );

        setOutcomeSetName(
            saved.outcomeSetName ??
                ""
        );

        setTargetOutcomes(
            Array.isArray(
                saved.targetOutcomes
            )
                ? saved.targetOutcomes
                : []
        );

        setMappings(
            Array.isArray(
                saved.mappings
            )
                ? saved.mappings
                : []
        );

    }, [
        courseId,
    ]);


    function handleCountryChange(
        value: string
    ) {

        setCountryCode(
            value
        );

        setFrameworkType(
            ""
        );

        setFrameworkId(
            ""
        );

        setFrameworkVersion(
            ""
        );

        setFrameworkLevelId(
            ""
        );

        setTargetOutcomes(
            []
        );

        setMappings(
            []
        );
    }


    function handleFrameworkChange(
        value: string
    ) {

        setFrameworkId(
            value
        );

        setFrameworkLevelId(
            ""
        );

        const framework =
            GLOBAL_ACADEMIC_FRAMEWORKS.find(
                (item) =>
                    item.id ===
                    value
            );

        setFrameworkVersion(
            framework?.version ??
                ""
        );

        setOutcomeSetName(
            framework
                ? `${framework.shortName} Outcome Set`
                : ""
        );

        const defaults =
            getDefaultTargets(
                framework
            );

        setTargetOutcomes(
            defaults
        );

        setMappings(
            []
        );
    }


    function updateTargetOutcome(
        id: string,
        patch: Partial<ProgrammeOutcome>
    ) {

        setTargetOutcomes(
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


    function addTargetOutcome() {

        setTargetOutcomes(
            (current) => [
                ...current,
                newTargetOutcome(
                    current.length
                ),
            ]
        );
    }


    function removeTargetOutcome(
        id: string
    ) {

        setTargetOutcomes(
            (current) =>
                current.filter(
                    (outcome) =>
                        outcome.id !== id
                )
        );

        setMappings(
            (current) =>
                current.filter(
                    (mapping) =>
                        mapping.targetOutcomeId !==
                        id
                )
        );
    }


    function getMapping(
        courseOutcomeId: string,
        targetOutcomeId: string
    ): OutcomeMappingCell | undefined {

        return mappings.find(
            (mapping) =>
                mapping.courseOutcomeId ===
                    courseOutcomeId &&
                mapping.targetOutcomeId ===
                    targetOutcomeId
        );
    }


    function setMappingStrength(
        courseOutcomeId: string,
        targetOutcomeId: string,
        strength: MappingStrength
    ) {

        setMappings(
            (current) => {

                const existing =
                    current.find(
                        (mapping) =>
                            mapping.courseOutcomeId ===
                                courseOutcomeId &&
                            mapping.targetOutcomeId ===
                                targetOutcomeId
                    );

                if (existing) {

                    return current.map(
                        (mapping) =>
                            mapping === existing
                                ? {
                                      ...mapping,
                                      strength,
                                  }
                                : mapping
                    );
                }

                return [
                    ...current,
                    {
                        courseOutcomeId,
                        targetOutcomeId,
                        strength,
                        justification:
                            "",
                    },
                ];
            }
        );
    }


    function validate(): boolean {

        setError(
            ""
        );

        if (
            courseOutcomes.length ===
            0
        ) {

            setError(
                "No Course Outcomes were found. Complete Step 2 before continuing."
            );

            return false;
        }

        if (!countryCode) {

            setError(
                "Select a country / region."
            );

            return false;
        }

        if (!frameworkType) {

            setError(
                "Select a framework type."
            );

            return false;
        }

        if (!frameworkId) {

            setError(
                "Select an academic framework."
            );

            return false;
        }

        if (
            selectedFramework?.levels?.length &&
            !frameworkLevelId
        ) {

            setError(
                "Select the applicable framework level."
            );

            return false;
        }

        if (
            targetOutcomes.length ===
            0
        ) {

            setError(
                "Add or load at least one programme/framework outcome."
            );

            return false;
        }

        const incompleteOutcome =
            targetOutcomes.find(
                (outcome) =>
                    !outcome.code.trim() ||
                    !outcome.title.trim()
            );

        if (incompleteOutcome) {

            setError(
                "Every target outcome must have a code and title."
            );

            return false;
        }

        const hasAtLeastOneMapping =
            mappings.some(
                (mapping) =>
                    mapping.strength >
                    0
            );

        if (!hasAtLeastOneMapping) {

            setError(
                "Create at least one CO-to-outcome mapping before continuing."
            );

            return false;
        }

        return true;
    }


    function handleNext() {

        if (!validate()) {
            return;
        }

        const draft =
            getCourseDraft(
                courseId
            ) as AcademicMappingDraft | null;

        if (!draft) {

            setError(
                "Course draft could not be found."
            );

            return;
        }

        const updatedDraft:
            AcademicMappingDraft = {
                ...draft,

                tenant,
                role,

                academicFrameworkMapping: {
                    countryCode,
                    frameworkType,
                    frameworkId,

                    frameworkVersion:
                        frameworkVersion.trim(),

                    frameworkLevelId,

                    programmeName:
                        programmeName.trim(),

                    outcomeSetName:
                        outcomeSetName.trim(),

                    mappingScale:
                        "0_3",

                    targetOutcomes:
                        targetOutcomes.map(
                            (outcome) => ({
                                ...outcome,
                                code:
                                    outcome.code.trim(),
                                title:
                                    outcome.title.trim(),
                                description:
                                    outcome.description.trim(),
                            })
                        ),

                    mappings,
                },

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
                    Step 3
                </div>

                <h2>
                    Global Outcome Framework & CO Mapping
                </h2>

                <p>
                    Select the applicable global, national,
                    accreditation, or institutional framework
                    and map the Course Outcomes created in Step 2.
                </p>

            </header>


            {error && (

                <div
                    className={
                        styles.error
                    }
                    role="alert"
                >
                    {error}
                </div>

            )}


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
                            Framework Configuration
                        </h3>

                        <p>
                            Dropdown values are driven by the
                            global academic framework registry.
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
                            Country / Region *
                        </label>

                        <select
                            value={
                                countryCode
                            }
                            onChange={(
                                event
                            ) =>
                                handleCountryChange(
                                    event.target.value
                                )
                            }
                        >
                            <option value="">
                                Select country / region
                            </option>

                            {GLOBAL_ACADEMIC_COUNTRIES.map(
                                (country) => (
                                    <option
                                        key={
                                            country.code
                                        }
                                        value={
                                            country.code
                                        }
                                    >
                                        {
                                            country.name
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
                        <label>
                            Framework Type *
                        </label>

                        <select
                            value={
                                frameworkType
                            }
                            disabled={
                                !countryCode
                            }
                            onChange={(
                                event
                            ) => {

                                setFrameworkType(
                                    event.target.value
                                );

                                setFrameworkId(
                                    ""
                                );

                                setFrameworkVersion(
                                    ""
                                );

                                setFrameworkLevelId(
                                    ""
                                );

                                setTargetOutcomes(
                                    []
                                );

                                setMappings(
                                    []
                                );

                            }}
                        >
                            <option value="">
                                Select framework type
                            </option>

                            {availableFrameworkTypes.map(
                                (type) => (
                                    <option
                                        key={
                                            type
                                        }
                                        value={
                                            type
                                        }
                                    >
                                        {
                                            type
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
                        <label>
                            Framework *
                        </label>

                        <select
                            value={
                                frameworkId
                            }
                            disabled={
                                !frameworkType
                            }
                            onChange={(
                                event
                            ) =>
                                handleFrameworkChange(
                                    event.target.value
                                )
                            }
                        >
                            <option value="">
                                Select framework
                            </option>

                            {filteredFrameworks.map(
                                (framework) => (
                                    <option
                                        key={
                                            framework.id
                                        }
                                        value={
                                            framework.id
                                        }
                                    >
                                        {framework.shortName}
                                        {" — "}
                                        {framework.name}
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
                        <label>
                            Framework Version
                        </label>

                        <input
                            value={
                                frameworkVersion
                            }
                            onChange={(
                                event
                            ) =>
                                setFrameworkVersion(
                                    event.target.value
                                )
                            }
                            placeholder="Current / institutional version"
                        />
                    </div>


                    <div
                        className={
                            styles.field
                        }
                    >
                        <label>
                            Framework Level
                            {
                                selectedFramework?.levels?.length
                                    ? " *"
                                    : ""
                            }
                        </label>

                        <select
                            value={
                                frameworkLevelId
                            }
                            disabled={
                                !selectedFramework?.levels?.length
                            }
                            onChange={(
                                event
                            ) =>
                                setFrameworkLevelId(
                                    event.target.value
                                )
                            }
                        >
                            <option value="">
                                {
                                    selectedFramework?.levels?.length
                                        ? "Select level"
                                        : "Not applicable"
                                }
                            </option>

                            {selectedFramework?.levels?.map(
                                (level) => (
                                    <option
                                        key={
                                            level.id
                                        }
                                        value={
                                            level.id
                                        }
                                    >
                                        {
                                            level.name
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
                        <label>
                            Programme
                        </label>

                        <input
                            value={
                                programmeName
                            }
                            readOnly
                            placeholder="Loaded from Step 1"
                        />
                    </div>


                    <div
                        className={
                            styles.field
                        }
                    >
                        <label>
                            Outcome Set Name
                        </label>

                        <input
                            value={
                                outcomeSetName
                            }
                            onChange={(
                                event
                            ) =>
                                setOutcomeSetName(
                                    event.target.value
                                )
                            }
                            placeholder="Example: B.Tech CSE PO Set V1"
                        />
                    </div>


                    <div
                        className={
                            styles.field
                        }
                    >
                        <label>
                            Mapping Scale
                        </label>

                        <input
                            value="0 None · 1 Low · 2 Moderate · 3 Strong"
                            readOnly
                        />
                    </div>

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
                            Programme / Framework Outcomes
                        </h3>

                        <p>
                            Load framework defaults where available,
                            or configure the institution&apos;s approved
                            PO, PSO, Student Outcome, Graduate Attribute,
                            descriptor, or competency set.
                        </p>
                    </div>


                    <button
                        type="button"
                        className={
                            styles.addButton
                        }
                        onClick={
                            addTargetOutcome
                        }
                    >
                        + Add Outcome
                    </button>

                </div>


                {targetOutcomes.length ===
                0 ? (

                    <div
                        className={
                            styles.emptyState
                        }
                    >
                        Select a framework, then add the
                        programme&apos;s approved outcome set.
                    </div>

                ) : (

                    <div
                        className={
                            styles.targetList
                        }
                    >

                        {targetOutcomes.map(
                            (
                                outcome
                            ) => (

                                <div
                                    key={
                                        outcome.id
                                    }
                                    className={
                                        styles.targetRow
                                    }
                                >

                                    <input
                                        className={
                                            styles.codeInput
                                        }
                                        value={
                                            outcome.code
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            updateTargetOutcome(
                                                outcome.id,
                                                {
                                                    code:
                                                        event.target.value,
                                                }
                                            )
                                        }
                                        aria-label="Outcome code"
                                    />

                                    <input
                                        value={
                                            outcome.title
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            updateTargetOutcome(
                                                outcome.id,
                                                {
                                                    title:
                                                        event.target.value,
                                                }
                                            )
                                        }
                                        placeholder="Outcome title"
                                    />

                                    <select
                                        value={
                                            outcome.type
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            updateTargetOutcome(
                                                outcome.id,
                                                {
                                                    type:
                                                        event.target.value as ProgrammeOutcome["type"],
                                                }
                                            )
                                        }
                                    >
                                        <option value="PROGRAMME_OUTCOME">
                                            Programme Outcome
                                        </option>
                                        <option value="PROGRAMME_SPECIFIC_OUTCOME">
                                            Programme Specific Outcome
                                        </option>
                                        <option value="STUDENT_OUTCOME">
                                            Student Outcome
                                        </option>
                                        <option value="GRADUATE_ATTRIBUTE">
                                            Graduate Attribute
                                        </option>
                                        <option value="LEVEL_DESCRIPTOR">
                                            Level Descriptor
                                        </option>
                                        <option value="COMPETENCY">
                                            Competency
                                        </option>
                                        <option value="INSTITUTIONAL_OUTCOME">
                                            Institutional Outcome
                                        </option>
                                    </select>

                                    <button
                                        type="button"
                                        className={
                                            styles.removeButton
                                        }
                                        onClick={() =>
                                            removeTargetOutcome(
                                                outcome.id
                                            )
                                        }
                                    >
                                        Remove
                                    </button>

                                </div>

                            )
                        )}

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
                            CO Mapping Matrix
                        </h3>

                        <p>
                            Map every Course Outcome to the
                            selected programme/framework outcomes.
                        </p>
                    </div>
                </div>


                {
                    courseOutcomes.length ===
                        0 ||
                    targetOutcomes.length ===
                        0 ? (

                        <div
                            className={
                                styles.emptyState
                            }
                        >
                            Course Outcomes from Step 2 and
                            target outcomes are required before
                            the matrix can be displayed.
                        </div>

                    ) : (

                        <div
                            className={
                                styles.matrixScroll
                            }
                        >

                            <table
                                className={
                                    styles.matrix
                                }
                            >

                                <thead>
                                    <tr>
                                        <th>
                                            Course Outcome
                                        </th>

                                        {targetOutcomes.map(
                                            (outcome) => (
                                                <th
                                                    key={
                                                        outcome.id
                                                    }
                                                    title={
                                                        outcome.title
                                                    }
                                                >
                                                    {
                                                        outcome.code
                                                    }
                                                </th>
                                            )
                                        )}
                                    </tr>
                                </thead>


                                <tbody>

                                    {courseOutcomes.map(
                                        (
                                            courseOutcome,
                                            index
                                        ) => {

                                            const coId =
                                                courseOutcome.id ||
                                                courseOutcome.code ||
                                                `CO${index + 1}`;

                                            return (
                                                <tr
                                                    key={
                                                        coId
                                                    }
                                                >
                                                    <th>
                                                        <strong>
                                                            {
                                                                courseOutcome.code ||
                                                                `CO${index + 1}`
                                                            }
                                                        </strong>

                                                        <span>
                                                            {
                                                                courseOutcome.statement ||
                                                                ""
                                                            }
                                                        </span>
                                                    </th>

                                                    {targetOutcomes.map(
                                                        (
                                                            target
                                                        ) => {

                                                            const mapping =
                                                                getMapping(
                                                                    coId,
                                                                    target.id
                                                                );

                                                            return (
                                                                <td
                                                                    key={
                                                                        target.id
                                                                    }
                                                                >
                                                                    <select
                                                                        value={
                                                                            mapping?.strength ??
                                                                            0
                                                                        }
                                                                        onChange={(
                                                                            event
                                                                        ) =>
                                                                            setMappingStrength(
                                                                                coId,
                                                                                target.id,
                                                                                Number(
                                                                                    event.target.value
                                                                                ) as MappingStrength
                                                                            )
                                                                        }
                                                                        aria-label={`${courseOutcome.code || `CO${index + 1}`} to ${target.code}`}
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
                                                            );
                                                        }
                                                    )}

                                                </tr>
                                            );
                                        }
                                    )}

                                </tbody>

                            </table>

                        </div>

                    )
                }


                <div
                    className={
                        styles.legend
                    }
                >
                    <span>
                        0 = Not Mapped
                    </span>
                    <span>
                        1 = Low
                    </span>
                    <span>
                        2 = Moderate
                    </span>
                    <span>
                        3 = Strong
                    </span>
                </div>

            </section>


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
