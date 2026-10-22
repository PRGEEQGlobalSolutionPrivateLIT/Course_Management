"use client";

import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    useSearchParams,
} from "next/navigation";

import CourseWizard from "../CourseWizard/CourseWizard";

import {
    createCourseDraft,
    getCourseDraft,
} from "@/services/course-draft.service";

import type {
    CourseCreationState,
} from "@/types/course-creation.types";

import CourseHeader from "@/components/CourseHeader/CourseHeader";

import styles from "./page.module.css";

/* =========================================================
   USER SESSION
========================================================= */

interface UserSession {
    id: string;
    name: string;
    tenant: string;
    tenantName: string;
    role: string;
    roleName: string;
}

/* =========================================================
   NAVIGATION TYPES
========================================================= */

interface NavigationItem {
    label: string;
    path: string;
}

interface TenantNavigation {
    dashboard: NavigationItem;
    courseManagement: NavigationItem;
    createCourse: NavigationItem;
    coursePlural: NavigationItem;
    draftCourses: NavigationItem;
    review: NavigationItem;
    bulkUpload: NavigationItem;
    academicConfiguration: NavigationItem;
    publishedCourses: NavigationItem;
    permissions: NavigationItem;
    logs: NavigationItem;
}

/* =========================================================
   TENANT NAVIGATION
========================================================= */

function getTenantNavigation(
    tenant: string
): TenantNavigation {

    const normalizedTenant =
        tenant
            .trim()
            .toLowerCase()
            .replace(/-/g, "_")
            .replace(/\s+/g, "_");

    /*
     * =========================================================
     * UNIVERSITY / COLLEGE
     *
     * Keep the academic tenant routes explicit here so the
     * Course Management sidebar always resolves to the existing
     * App Router pages under /course-management.
     *
     * No other tenant routes are changed.
     * =========================================================
     */

    if (
        normalizedTenant === "university" ||
        normalizedTenant === "college"
    ) {

        return {
            dashboard: {
                label: "Dashboard",
                path: "/dashboard",
            },

            courseManagement: {
                label: "Course Management",
                path: "/course-management/dashboard",
            },

            createCourse: {
                label: "Create Course",
                path: "/course-management/create",
            },

            coursePlural: {
                label: "Courses",
                path: "/course-management/trainings_page",
            },

            draftCourses: {
                label: "Draft Courses",
                path: "/course-management/draft-courses",
            },

            review: {
                label: "Review",
                path: "/course-management/review",
            },

            bulkUpload: {
                label: "Bulk Upload",
                path: "/course-management/bulk-upload",
            },

            academicConfiguration: {
                label: "Academic Configuration",
                path: "/course-management/academic-configuration",
            },

            publishedCourses: {
                label: "Published Courses",
                path: "/course-management/trainings",
            },

            permissions: {
                label: "Permissions",
                path: "/course-management/permissions",
            },

            logs: {
                label: "Logs",
                path: "/course-management/logs",
            },
        };
    }

    let management =
        "Course Management";

    let item =
        "Courses";

    let create =
        "Create Course";

    let draft =
        "Draft Courses";

    let published =
        "Published Courses";

    if (
        normalizedTenant === "corporate" ||
        normalizedTenant === "corporate_training"
    ) {

        management =
            "Training Management";

        item =
            "Trainings";

        create =
            "Create Training";

        draft =
            "Draft Trainings";

        published =
            "Published Trainings";

    } else if (
        normalizedTenant === "skill_academy" ||
        normalizedTenant === "skillacademy"
    ) {

        management =
            "Academy Management";

        item =
            "Programs";

        create =
            "Create Program";

        draft =
            "Draft Programs";

        published =
            "Published Programs";

    } else if (
        normalizedTenant === "bootcamp" ||
        normalizedTenant === "bootcamps"
    ) {

        management =
            "Bootcamp Management";

        item =
            "Bootcamps";

        create =
            "Create Bootcamp";

        draft =
            "Draft Bootcamps";

        published =
            "Published Bootcamps";

    } else if (
        normalizedTenant === "ngo" ||
        normalizedTenant === "non_profit" ||
        normalizedTenant === "nonprofit"
    ) {

        management =
            "Training Management";

        item =
            "Trainings";

        create =
            "Create Training";

        draft =
            "Draft Trainings";

        published =
            "Published Trainings";

    } else if (
        normalizedTenant === "government" ||
        normalizedTenant === "govt" ||
        normalizedTenant === "government_training"
    ) {

        management =
            "Training Management";

        item =
            "Trainings";

        create =
            "Create Training";

        draft =
            "Draft Trainings";

        published =
            "Published Trainings";
    }

    return {

        dashboard: {
            label: "Dashboard",
            path: "/dashboard",
        },

        courseManagement: {
            label: management,
            path: "/course-management/dashboard",
        },

        createCourse: {
            label: create,
            path: "/course-management/create",
        },

        coursePlural: {
            label: item,
            path: "/course-management/trainings_page",
        },

        draftCourses: {
            label: draft,
            path: "/course-management/draft-courses",
        },

        review: {
            label: "Review",
            path: "/course-management/review",
        },

        bulkUpload: {
            label: "Bulk Upload",
            path: "/course-management/bulk-upload",
        },

        academicConfiguration: {
            label: "Academic Configuration",
            path: "/course-management/academic-configuration",
        },

        publishedCourses: {
            label: published,
            path: "/course-management/trainings",
        },

        permissions: {
            label: "Permissions",
            path: "/course-management/permissions",
        },

        logs: {
            label: "Logs",
            path: "/course-management/logs",
        },
    };
}

/* =========================================================
   SIDEBAR ITEMS
========================================================= */

type SidebarPermission =
    | "view"
    | "create"
    | "draft"
    | "review"
    | "bulkUpload"
    | "academicConfiguration"
    | "published"
    | "permissions"
    | "logs";

function normalizeRole(
    role?: string | null
): "admin" | "coordinator" | "faculty" {

    const value =
        String(role ?? "")
            .trim()
            .toLowerCase()
            .replace(/-/g, "_")
            .replace(/\s+/g, "_");

    if (
        value.includes("admin") ||
        value.includes("manager") ||
        value.includes("organization_admin") ||
        value.includes("institute_admin")
    ) {
        return "admin";
    }

    if (
        value.includes("coordinator")
    ) {
        return "coordinator";
    }

    return "faculty";
}

function getStoredPermissions():
    Record<string, unknown> | null {

    if (
        typeof window === "undefined"
    ) {
        return null;
    }

    for (
        const key of [
            "course_management_permissions",
            "coursePermissions",
            "permissions",
        ]
    ) {

        try {

            const raw =
                localStorage.getItem(
                    key
                );

            if (!raw) {
                continue;
            }

            const parsed =
                JSON.parse(
                    raw
                );

            if (
                parsed &&
                typeof parsed === "object"
            ) {

                return parsed as
                    Record<string, unknown>;
            }

        } catch {

            // Ignore invalid permission data.
        }
    }

    return null;
}

function readPermission(
    permissions:
        Record<string, unknown> | null,
    aliases:
        string[]
): boolean | undefined {

    if (!permissions) {
        return undefined;
    }

    for (
        const key of aliases
    ) {

        const value =
            permissions[key];

        if (
            typeof value === "boolean"
        ) {
            return value;
        }

        if (
            value &&
            typeof value === "object" &&
            "enabled" in value &&
            typeof (
                value as {
                    enabled?: unknown;
                }
            ).enabled === "boolean"
        ) {

            return Boolean(
                (
                    value as {
                        enabled: boolean;
                    }
                ).enabled
            );
        }
    }

    return undefined;
}

function hasSidebarPermission(
    role?: string | null,
    permission?: SidebarPermission,
    permissions:
        Record<string, unknown> | null = null
): boolean {

    if (!permission) {
        return false;
    }

    const normalizedRole =
        normalizeRole(
            role
        );

    if (
        normalizedRole === "admin"
    ) {
        return true;
    }

    const aliases:
        Record<
            SidebarPermission,
            string[]
        > = {

        view: [
            "viewCourses",
            "viewTrainings",
            "viewPrograms",
            "courses.view",
            "trainings.view",
        ],

        create: [
            "createCourse",
            "createTraining",
            "createProgram",
            "courses.create",
            "trainings.create",
        ],

        draft: [
            "viewDraftCourses",
            "viewDraftTrainings",
            "draftCourses",
            "draftTrainings",
            "courses.draft",
            "trainings.draft",
        ],

        review: [
            "review",
            "reviewCourses",
            "reviewTrainings",
            "courses.review",
            "trainings.review",
        ],

        bulkUpload: [
            "bulkUpload",
            "bulkUploadCourses",
            "courses.bulkUpload",
        ],

        academicConfiguration: [
            "academicConfiguration",
            "manageAcademicConfiguration",
            "courses.academicConfiguration",
        ],

        published: [
            "viewPublishedCourses",
            "viewPublishedTrainings",
            "publishedCourses",
            "publishedTrainings",
            "courses.published",
            "trainings.published",
        ],

        permissions: [
            "managePermissions",
            "permissions",
            "courseManagement.permissions",
        ],

        logs: [
            "viewLogs",
            "logs",
            "courseManagement.logs",
        ],
    };

    const explicit =
        readPermission(
            permissions,
            aliases[permission]
        );

    if (
        typeof explicit === "boolean"
    ) {
        return explicit;
    }

    if (
        permission === "permissions" ||
        permission === "logs"
    ) {
        return false;
    }

    return true;
}

function getSidebarItems(
    tenant?: string | null,
    role?: string | null
) {

    const normalizedTenant =
        String(
            tenant ?? ""
        )
            .trim()
            .toLowerCase()
            .replace(/-/g, "_")
            .replace(/\s+/g, "_");

    const isAcademicTenant =
        normalizedTenant === "university" ||
        normalizedTenant === "college";

    const navigation =
        getTenantNavigation(
            String(
                tenant ?? ""
            )
        );

    const permissions =
        getStoredPermissions();

    /*
     * University / College only:
     * - Review is removed from the Course Management sidebar.
     * - Bulk Upload is added.
     * - Academic Configuration is added.
     *
     * All other tenants keep their existing sidebar exactly as before.
     */

    const items: Array<{
        id: string;
        navigation: NavigationItem;
        permission: SidebarPermission;
    }> = isAcademicTenant
        ? [
              {
                  id: "dashboard",
                  navigation:
                      navigation.dashboard,
                  permission: "view",
              },

              {
                  id: "courses",
                  navigation:
                      navigation.coursePlural,
                  permission: "view",
              },

              {
                  id: "create",
                  navigation:
                      navigation.createCourse,
                  permission: "create",
              },

              {
                  id: "drafts",
                  navigation:
                      navigation.draftCourses,
                  permission: "draft",
              },

              {
                  id: "bulk-upload",
                  navigation:
                      navigation.bulkUpload,
                  permission: "bulkUpload",
              },

              {
                  id: "published",
                  navigation:
                      navigation.publishedCourses,
                  permission: "published",
              },

              {
                  id: "academic-configuration",
                  navigation:
                      navigation.academicConfiguration,
                  permission: "academicConfiguration",
              },

              {
                  id: "permissions",
                  navigation:
                      navigation.permissions,
                  permission: "permissions",
              },

              {
                  id: "logs",
                  navigation:
                      navigation.logs,
                  permission: "logs",
              },
          ]
        : [
              {
                  id: "dashboard",
                  navigation:
                      navigation.dashboard,
                  permission: "view",
              },

              {
                  id: "courses",
                  navigation:
                      navigation.coursePlural,
                  permission: "view",
              },

              {
                  id: "create",
                  navigation:
                      navigation.createCourse,
                  permission: "create",
              },

              {
                  id: "drafts",
                  navigation:
                      navigation.draftCourses,
                  permission: "draft",
              },

              {
                  id: "bulk-upload",
                  navigation:
                      navigation.bulkUpload,
                  permission: "bulkUpload",
              },

              {
                  id: "review",
                  navigation:
                      navigation.review,
                  permission: "review",
              },

              {
                  id: "published",
                  navigation:
                      navigation.publishedCourses,
                  permission: "published",
              },

              {
                  id: "permissions",
                  navigation:
                      navigation.permissions,
                  permission: "permissions",
              },

              {
                  id: "logs",
                  navigation:
                      navigation.logs,
                  permission: "logs",
              },
          ];

    return items.filter(
        (item) =>
            hasSidebarPermission(
                role,
                item.permission,
                permissions
            )
    );
}


/* =========================================================
   UNIVERSITY / COLLEGE — COURSE CREATION ACADEMIC CONTEXT
========================================================= */

const ACADEMIC_SETUP_STORAGE_KEY =
    "neurolxp_academic_setup_records";

const PROGRAMME_SETUP_STORAGE_KEY =
    "neurolxp_programme_setup_records";

const CURRICULUM_VERSION_STORAGE_KEY =
    "neurolxp_curriculum_version_records";

const COURSE_CREATION_ACADEMIC_CONTEXT_KEY =
    "neurolxp_course_creation_academic_context";

const ACADEMIC_CONFIGURATION_SCHEMA_VERSION =
    2;

type AcademicSetupMaster = {
    id: string;
    schemaVersion?: number;
    academicYearName?: string;
    sessionName?: string;
    schoolName?: string;
    departmentName?: string;
    termSystem?: string;
    academicPeriodName?: string;
    qualificationFramework?: string;
    creditFramework?: string;
    regulatoryFramework?: string;
    accreditationFramework?: string;
    academicCalendar?: string;
    status?: string;
};

type ProgrammeSetupMaster = {
    id: string;
    schemaVersion?: number;
    programmeId?: string;
    academicSetupId: string;
    programmeName?: string;
    programmeShortName?: string;
    programmeCode?: string;
    programmeLevel?: string;
    programmeType?: string;
    facultySchool?: string;
    department?: string;
    durationValue?: string;
    durationType?: string;
    totalSemesters?: string;
    totalCredits?: string;
    minimumCreditsRequired?: string;
    maximumCreditsAllowed?: string;
    creditSystem?: string;
    startAcademicYear?: string;
    defaultAcademicSession?: string;
    currentApplicableBatch?: string;
    qualificationLevel?: string;
    outcomeFramework?: string;
    programmeOutcomes?: string;
    programmeSpecificOutcomes?: string;
    status?: string;
};

type CurriculumVersionMaster = {
    id: string;
    schemaVersion?: number;
    curriculumVersionId?: string;
    programmeId: string;
    academicSetupId?: string;
    programmeName?: string;
    programmeCode?: string;
    programmeLevel?: string;
    curriculumName?: string;
    curriculumCode?: string;
    versionName?: string;
    versionLabel?: string;
    regulationName?: string;
    syllabusVersion?: string;
    applicableAdmissionBatch?: string;
    applicableSession?: string;
    academicYearFrom?: string;
    effectiveFromDate?: string;
    totalProgrammeCredits?: string;
    totalAcademicPeriods?: string;
    creditSystem?: string;
    gradingSystem?: string;
    status?: string;
};

type CourseCreationAcademicContext = {
    academicSetupId: string;
    programmeId: string;
    curriculumVersionId: string;

    academicSetup: AcademicSetupMaster;
    programme: ProgrammeSetupMaster;
    curriculum: CurriculumVersionMaster;
};

function normalizeTenantValue(
    tenant?: string | null
) {
    return String(
        tenant ?? ""
    )
        .trim()
        .toLowerCase()
        .replace(/-/g, "_")
        .replace(/\s+/g, "_");
}

function isUniversityOrCollege(
    tenant?: string | null
) {
    const normalized =
        normalizeTenantValue(
            tenant
        );

    return (
        normalized ===
            "university" ||
        normalized ===
            "college"
    );
}

function readMasterRecords<T>(
    key: string
): T[] {

    if (
        typeof window ===
        "undefined"
    ) {
        return [];
    }

    try {

        const raw =
            localStorage.getItem(
                key
            );

        if (!raw) {
            return [];
        }

        const parsed =
            JSON.parse(
                raw
            );

        return Array.isArray(
            parsed
        )
            ? parsed as T[]
            : [];

    } catch {

        return [];
    }
}


function normalizeMasterIdentifier(
    value?: string | null
): string {

    return String(
        value ?? ""
    )
        .trim()
        .toLowerCase();
}

function identifiersMatch(
    left?: string | null,
    right?: string | null
): boolean {

    const normalizedLeft =
        normalizeMasterIdentifier(
            left
        );

    const normalizedRight =
        normalizeMasterIdentifier(
            right
        );

    return Boolean(
        normalizedLeft &&
        normalizedRight &&
        normalizedLeft ===
            normalizedRight
    );
}

/* =========================================================
   CREATE COURSE PAGE
========================================================= */

export default function CreateCoursePage() {

    const searchParams =
        useSearchParams();

    /*
     * New course:
     *
     * /course-management/create
     *
     * Existing draft:
     *
     * /course-management/create?courseId=CRS-XXXX
     */

    const courseId =
        searchParams.get(
            "courseId"
        );

    const [
        creationState,
        setCreationState,
    ] =
        useState<
            CourseCreationState | null
        >(
            null
        );

    const [
        user,
        setUser,
    ] =
        useState<
            UserSession | null
        >(
            null
        );

    const [
        isSavedDraft,
        setIsSavedDraft,
    ] =
        useState<boolean>(
            false
        );

    const [
        error,
        setError,
    ] =
        useState<string>(
            ""
        );

    /*
     * University / College only:
     * Course creation does not begin until a reusable
     * Academic Setup, Programme and Curriculum Version are selected.
     *
     * Other tenants never use this gate.
     */
    const [
        academicSetups,
        setAcademicSetups,
    ] =
        useState<
            AcademicSetupMaster[]
        >(
            []
        );

    const [
        programmeSetups,
        setProgrammeSetups,
    ] =
        useState<
            ProgrammeSetupMaster[]
        >(
            []
        );

    const [
        curriculumVersions,
        setCurriculumVersions,
    ] =
        useState<
            CurriculumVersionMaster[]
        >(
            []
        );

    const [
        selectedAcademicSetupId,
        setSelectedAcademicSetupId,
    ] =
        useState(
            ""
        );

    const [
        selectedProgrammeId,
        setSelectedProgrammeId,
    ] =
        useState(
            ""
        );

    const [
        selectedCurriculumVersionId,
        setSelectedCurriculumVersionId,
    ] =
        useState(
            ""
        );

    const [
        academicContextConfirmed,
        setAcademicContextConfirmed,
    ] =
        useState(
            false
        );

    const [
        academicContextError,
        setAcademicContextError,
    ] =
        useState(
            ""
        );

    /* =====================================================
       INITIALIZE / RESUME COURSE
    ===================================================== */

    useEffect(() => {

        const storedUser =
            localStorage.getItem(
                "user"
            );

        if (!storedUser) {

            window.location.href =
                "/login";

            return;
        }

        try {

            const parsedUser =
                JSON.parse(
                    storedUser
                ) as UserSession;

            if (
                !parsedUser.tenant ||
                !parsedUser.role
            ) {

                setError(
                    "Your account configuration is incomplete."
                );

                return;
            }

            setUser(
                parsedUser
            );

            if (
                isUniversityOrCollege(
                    parsedUser.tenant
                )
            ) {

                const academicRecords =
                    readMasterRecords<
                        AcademicSetupMaster
                    >(
                        ACADEMIC_SETUP_STORAGE_KEY
                    )
                        .filter(
                            (
                                record
                            ) =>
                                (
                                    record.schemaVersion ===
                                        undefined ||
                                    record.schemaVersion ===
                                        ACADEMIC_CONFIGURATION_SCHEMA_VERSION
                                ) &&
                                (
                                    record.status ===
                                        "Active" ||
                                    record.status ===
                                        "Locked"
                                )
                        );

                const programmeRecords =
                    readMasterRecords<
                        ProgrammeSetupMaster
                    >(
                        PROGRAMME_SETUP_STORAGE_KEY
                    )
                        .filter(
                            (
                                record
                            ) =>
                                (
                                    record.schemaVersion ===
                                        undefined ||
                                    record.schemaVersion ===
                                        ACADEMIC_CONFIGURATION_SCHEMA_VERSION
                                ) &&
                                (
                                    record.status ===
                                        "Active" ||
                                    record.status ===
                                        "Locked"
                                )
                        );

                const curriculumRecords =
                    readMasterRecords<
                        CurriculumVersionMaster
                    >(
                        CURRICULUM_VERSION_STORAGE_KEY
                    )
                        .filter(
                            (
                                record
                            ) =>
                                (
                                    record.schemaVersion ===
                                        undefined ||
                                    record.schemaVersion ===
                                        ACADEMIC_CONFIGURATION_SCHEMA_VERSION
                                ) &&
                                (
                                    record.status ===
                                        "Active" ||
                                    record.status ===
                                        "Locked"
                                )
                        );

                setAcademicSetups(
                    academicRecords
                );

                setProgrammeSetups(
                    programmeRecords
                );

                setCurriculumVersions(
                    curriculumRecords
                );

                /*
                 * Do not auto-restore an Academic / Programme /
                 * Curriculum selection for a NEW course.
                 *
                 * Every new University / College course must explicitly
                 * select all three master records before the wizard opens.
                 */
                if (!courseId) {
                    sessionStorage.removeItem(
                        COURSE_CREATION_ACADEMIC_CONTEXT_KEY
                    );
                }
            }

            /* =================================================
               EXISTING SAVED DRAFT
            ================================================= */

            if (courseId) {

                const existingDraft =
                    getCourseDraft(
                        courseId
                    );

                if (!existingDraft) {

                    setError(
                        "The requested draft could not be found."
                    );

                    return;
                }

                /*
                 * Prevent access to a different
                 * tenant's draft.
                 */

                if (
                    existingDraft.tenant !==
                    parsedUser.tenant
                ) {

                    setError(
                        "You do not have access to this draft."
                    );

                    return;
                }

                setCreationState(
                    existingDraft
                );

                /*
                 * This course already exists
                 * as a persisted draft.
                 */

                setIsSavedDraft(
                    true
                );

                return;
            }

            /* =================================================
               NEW COURSE

               IMPORTANT:

               Opening the Create Course page must NOT persist a
               draft.

               Step 1 remains an unsaved working state until the
               user completes the required fields and clicks
               Save & Continue.

               CourseSetup is responsible for creating and saving
               the real draft after Step 1 validation succeeds.
            ================================================= */

            const newCourse =
                createCourseDraft(
                    parsedUser.tenant,
                    parsedUser.role
                );

            /*
             * Keep only an in-memory working state here.
             *
             * createCourseDraft() supplies the default setup shape,
             * but this page intentionally clears its generated ID
             * and DOES NOT call saveCourseDraft().
             *
             * Therefore:
             *
             * - simply opening Create Course creates no localStorage
             *   draft record;
             * - leaving Step 1 creates no draft;
             * - failed Step 1 validation creates no draft;
             * - the first persisted draft is created only by
             *   CourseSetup after Save & Continue succeeds.
             */

            const unsavedCourse:
                CourseCreationState = {
                    ...newCourse,
                    courseId: "",
                    currentStep: 0,
                    completedThroughStep: 0,
                };

            setCreationState(
                unsavedCourse
            );

            setIsSavedDraft(
                false
            );

        } catch {

            setError(
                "Unable to initialize course creation."
            );
        }

    }, [courseId]);

    /* =====================================================
       TENANT NAVIGATION
    ===================================================== */

    const navigation =
        getTenantNavigation(
            user?.tenant || ""
        );


    /* =====================================================
       UNIVERSITY / COLLEGE — MASTER SELECTION GATE
    ===================================================== */

    const isAcademicTenant =
        isUniversityOrCollege(
            user?.tenant
        );

    const selectedAcademicSetup =
        useMemo(
            () =>
                academicSetups.find(
                    (
                        record
                    ) =>
                        record.id ===
                        selectedAcademicSetupId
                ) ??
                null,
            [
                academicSetups,
                selectedAcademicSetupId,
            ]
        );

    const availableProgrammes =
        useMemo(
            () =>
                selectedAcademicSetupId
                    ? programmeSetups.filter(
                          (
                              record
                          ) =>
                              identifiersMatch(
                                  record.academicSetupId,
                                  selectedAcademicSetupId
                              )
                      )
                    : [],
            [
                programmeSetups,
                selectedAcademicSetupId,
            ]
        );

    const selectedProgramme =
        useMemo(
            () =>
                availableProgrammes.find(
                    (
                        record
                    ) =>
                        identifiersMatch(
                            record.id,
                            selectedProgrammeId
                        ) ||
                        identifiersMatch(
                            record.programmeId,
                            selectedProgrammeId
                        )
                ) ??
                null,
            [
                availableProgrammes,
                selectedProgrammeId,
            ]
        );

    const availableCurriculumVersions =
        useMemo(
            () => {

                if (
                    !selectedProgramme
                ) {
                    return [];
                }

                const programmeRecordId =
                    selectedProgramme.id;

                const stableProgrammeId =
                    selectedProgramme.programmeId ||
                    "";

                const programmeCode =
                    selectedProgramme.programmeCode ||
                    "";

                const programmeName =
                    selectedProgramme.programmeName ||
                    "";

                return curriculumVersions.filter(
                    (
                        record
                    ) => {

                        /*
                         * Current Academic Configuration stores
                         * CurriculumVersion.programmeId using the
                         * Programme Setup record ID.
                         *
                         * Some previously created records may instead
                         * contain the stable programmeId. Support both
                         * so existing and newly created curricula appear.
                         */
                        const directIdMatch =
                            identifiersMatch(
                                record.programmeId,
                                programmeRecordId
                            ) ||
                            identifiersMatch(
                                record.programmeId,
                                stableProgrammeId
                            );

                        /*
                         * Compatibility fallback for older records:
                         * if the parent ID format changed, match the
                         * inherited programme identity saved with the
                         * curriculum.
                         */
                        const identityMatch =
                            (
                                identifiersMatch(
                                    record.programmeCode,
                                    programmeCode
                                ) ||
                                identifiersMatch(
                                    record.programmeName,
                                    programmeName
                                )
                            ) &&
                            (
                                !record.academicSetupId ||
                                identifiersMatch(
                                    record.academicSetupId,
                                    selectedProgramme.academicSetupId
                                )
                            );

                        return (
                            directIdMatch ||
                            identityMatch
                        );
                    }
                );
            },
            [
                curriculumVersions,
                selectedProgramme,
            ]
        );

    const selectedCurriculumVersion =
        useMemo(
            () =>
                availableCurriculumVersions.find(
                    (
                        record
                    ) =>
                        identifiersMatch(
                            record.id,
                            selectedCurriculumVersionId
                        ) ||
                        identifiersMatch(
                            record.curriculumVersionId,
                            selectedCurriculumVersionId
                        )
                ) ??
                null,
            [
                availableCurriculumVersions,
                selectedCurriculumVersionId,
            ]
        );

    function handleAcademicSetupSelection(
        value: string
    ) {

        setSelectedAcademicSetupId(
            value
        );

        setSelectedProgrammeId(
            ""
        );

        setSelectedCurriculumVersionId(
            ""
        );

        setAcademicContextConfirmed(
            false
        );

        setAcademicContextError(
            ""
        );

        sessionStorage.removeItem(
            COURSE_CREATION_ACADEMIC_CONTEXT_KEY
        );
    }

    function handleProgrammeSelection(
        value: string
    ) {

        setSelectedProgrammeId(
            value
        );

        setSelectedCurriculumVersionId(
            ""
        );

        setAcademicContextConfirmed(
            false
        );

        setAcademicContextError(
            ""
        );

        sessionStorage.removeItem(
            COURSE_CREATION_ACADEMIC_CONTEXT_KEY
        );
    }

    function handleCurriculumSelection(
        value: string
    ) {

        setSelectedCurriculumVersionId(
            value
        );

        setAcademicContextConfirmed(
            false
        );

        setAcademicContextError(
            ""
        );

        sessionStorage.removeItem(
            COURSE_CREATION_ACADEMIC_CONTEXT_KEY
        );
    }

    function startAcademicCourseCreation() {

        if (
            !selectedAcademicSetup ||
            !selectedProgramme ||
            !selectedCurriculumVersion
        ) {

            setAcademicContextError(
                "Select Academic Setup, Programme and Curriculum Version before starting course creation."
            );

            return;
        }

        const context:
            CourseCreationAcademicContext = {

                academicSetupId:
                    selectedAcademicSetup.id,

                programmeId:
                    selectedProgramme.programmeId ||
                    selectedProgramme.id,

                curriculumVersionId:
                    selectedCurriculumVersion.curriculumVersionId ||
                    selectedCurriculumVersion.id,

                academicSetup:
                    selectedAcademicSetup,

                programme:
                    selectedProgramme,

                curriculum:
                    selectedCurriculumVersion,
            };

        sessionStorage.setItem(
            COURSE_CREATION_ACADEMIC_CONTEXT_KEY,
            JSON.stringify(
                context
            )
        );

        setAcademicContextConfirmed(
            true
        );

        setAcademicContextError(
            ""
        );
    }

    /* =====================================================
       ERROR STATE
    ===================================================== */

    if (error) {

        return (

            <div
                className={
                    styles.page
                }
            >

                <aside
                    className={
                        styles.sidebar
                    }
                >

                    <Sidebar
                        activeItem="create"
                        tenant={
                            user?.tenant
                        }
                        role={
                            user?.role
                        }
                    />

                </aside>

                <main
                    className={
                        styles.main
                    }
                >

                    <CourseHeader />

                    <div
                        className={
                            styles.stateArea
                        }
                    >

                        <div
                            className={
                                styles.errorCard
                            }
                        >

                            <div
                                className={
                                    styles.errorIcon
                                }
                            >
                                !
                            </div>

                            <div
                                className={
                                    styles.stateContent
                                }
                            >

                                <h1>
                                    Unable to Create
                                </h1>

                                <p>
                                    {error}
                                </p>

                            </div>

                            <button
                                type="button"
                                className={
                                    styles.backButton
                                }
                                onClick={() => {

                                    window.location.href =
                                        navigation
                                            .courseManagement
                                            .path;

                                }}
                            >
                                Back
                            </button>

                        </div>

                    </div>

                </main>

            </div>
        );
    }

    /* =====================================================
       LOADING STATE
    ===================================================== */

    if (
        !user ||
        !creationState
    ) {

        return (

            <div
                className={
                    styles.page
                }
            >

                <aside
                    className={
                        styles.sidebar
                    }
                >

                    <Sidebar
                        activeItem="create"
                        tenant={
                            user?.tenant
                        }
                        role={
                            user?.role
                        }
                    />

                </aside>

                <main
                    className={
                        styles.main
                    }
                >

                    <CourseHeader />

                    <div
                        className={
                            styles.stateArea
                        }
                    >

                        <div
                            className={
                                styles.loadingCard
                            }
                        >

                            <div
                                className={
                                    styles.spinner
                                }
                            />

                            <div
                                className={
                                    styles.stateContent
                                }
                            >

                                <h2>
                                    {
                                        courseId
                                            ? "Loading draft"
                                            : "Preparing course creation"
                                    }
                                </h2>

                                <p>
                                    Please wait...
                                </p>

                            </div>

                        </div>

                    </div>

                </main>

            </div>
        );
    }

    /* =====================================================
       MAIN PAGE
    ===================================================== */

    return (

        <div
            className={
                styles.page
            }
        >

            {/* =================================================
                COURSE MANAGEMENT SIDEBAR
            ================================================= */}

            <aside
                className={
                    styles.sidebar
                }
            >

                <Sidebar
                    activeItem="create"
                    tenant={
                        creationState.tenant
                    }
                    role={
                        creationState.role
                    }
                />

            </aside>

            {/* =================================================
                MAIN CONTENT
            ================================================= */}

            <main
                className={
                    styles.main
                }
            >

                {/* =================================================
                    SHARED TOP HEADER
                ================================================= */}

                <CourseHeader />

                <div
                    className={
                        styles.content
                    }
                >

                    {/* =================================================
                        BREADCRUMBS
                    ================================================= */}

                    <nav
                        className={
                            styles.breadcrumbs
                        }
                        aria-label="Breadcrumb"
                    >

                        <button
                            type="button"
                            onClick={() => {

                                window.location.href =
                                    navigation
                                        .dashboard
                                        .path;

                            }}
                        >
                            {
                                navigation
                                    .dashboard
                                    .label
                            }
                        </button>

                        <span>
                            /
                        </span>

                        <button
                            type="button"
                            onClick={() => {

                                window.location.href =
                                    navigation
                                        .courseManagement
                                        .path;

                            }}
                        >
                            {
                                navigation
                                    .courseManagement
                                    .label
                            }
                        </button>

                        <span>
                            /
                        </span>

                        <strong>
                            {
                                navigation
                                    .createCourse
                                    .label
                            }
                        </strong>

                    </nav>

                    {/* =================================================
                        PAGE HEADER
                    ================================================= */}

                    <header
                        className={
                            styles.pageHeader
                        }
                    >

                        <div
                            className={
                                styles.titleBlock
                            }
                        >

                            <span
                                className={
                                    styles.eyebrow
                                }
                            >
                                COURSE CREATION
                            </span>

                            <h1>
                                {
                                    navigation
                                        .createCourse
                                        .label
                                }
                            </h1>

                            <p>
                                Build your learning
                                offering step by step.
                            </p>

                        </div>

                        {/* =================================================
                            COURSE ID + SAVE STATUS
                        ================================================= */}

                        <div
                            className={
                                styles.courseIdCard
                            }
                        >

                            <span
                                className={
                                    styles.courseIdLabel
                                }
                            >
                                COURSE ID
                            </span>

                            <strong
                                className={
                                    styles.courseIdValue
                                }
                            >
                                {
                                    creationState.courseId ||
                                    "Not generated yet"
                                }
                            </strong>

                            <div
                                className={`
                                    ${styles.draftIndicator}
                                    ${
                                        isSavedDraft
                                            ? styles.savedStatus
                                            : styles.unsavedStatus
                                    }
                                `}
                            >

                                <span />

                                {
                                    isSavedDraft
                                        ? "Draft"
                                        : "Not Saved"
                                }

                            </div>

                        </div>

                    </header>

                    {/* =================================================
                        COURSE WIZARD
                    ================================================= */}

                    <section
                        className={
                            styles.wizard
                        }
                    >

                        {isAcademicTenant &&
                        !courseId &&
                        !academicContextConfirmed ? (

                            <div
                                style={{
                                    background:
                                        "#dfe6e9",
                                    borderRadius:
                                        "20px",
                                    padding:
                                        "24px",
                                    boxShadow:
                                        "6px 6px 12px #c6c9cf, -6px -6px 12px #ffffff",
                                }}
                            >

                                <div
                                    style={{
                                        marginBottom:
                                            "22px",
                                    }}
                                >
                                    <span
                                        style={{
                                            display:
                                                "inline-block",
                                            marginBottom:
                                                "8px",
                                            fontSize:
                                                "11px",
                                            fontWeight:
                                                800,
                                            letterSpacing:
                                                "0.12em",
                                            color:
                                                "#687386",
                                        }}
                                    >
                                        ACADEMIC CONTEXT REQUIRED
                                    </span>

                                    <h2
                                        style={{
                                            margin:
                                                "0 0 8px",
                                            color:
                                                "#2a354f",
                                        }}
                                    >
                                        Select Required Academic Configuration
                                    </h2>

                                    <p
                                        style={{
                                            margin:
                                                0,
                                            color:
                                                "#687386",
                                            lineHeight:
                                                1.6,
                                        }}
                                    >
                                        Before creating a new course, select the Academic Setup, Programme and Curriculum Version already created in Academic Configuration. Course creation remains locked until all three are selected.
                                    </p>
                                </div>

                                {academicSetups.length ===
                                0 ? (

                                    <div
                                        style={{
                                            padding:
                                                "18px",
                                            borderRadius:
                                                "14px",
                                            background:
                                                "#dfe6e9",
                                            boxShadow:
                                                "inset 3px 3px 7px #c6c9cf, inset -3px -3px 7px #ffffff",
                                        }}
                                    >
                                        <strong
                                            style={{
                                                color:
                                                    "#2a354f",
                                            }}
                                        >
                                            No completed Academic Setup is available.
                                        </strong>

                                        <p
                                            style={{
                                                margin:
                                                    "7px 0 14px",
                                                color:
                                                    "#687386",
                                            }}
                                        >
                                            Complete Academic Setup, Programme Setup and Curriculum Version in Academic Configuration first.
                                        </p>

                                        <button
                                            type="button"
                                            className={
                                                styles.backButton
                                            }
                                            onClick={() => {
                                                window.location.href =
                                                    navigation
                                                        .academicConfiguration
                                                        .path;
                                            }}
                                        >
                                            Open Academic Configuration
                                        </button>
                                    </div>

                                ) : (

                                    <>
                                        <div
                                            style={{
                                                display:
                                                    "grid",
                                                gridTemplateColumns:
                                                    "repeat(auto-fit, minmax(240px, 1fr))",
                                                gap:
                                                    "18px",
                                            }}
                                        >

                                            <label
                                                style={{
                                                    display:
                                                        "grid",
                                                    gap:
                                                        "7px",
                                                    color:
                                                        "#2a354f",
                                                    fontSize:
                                                        "13px",
                                                    fontWeight:
                                                        700,
                                                }}
                                            >
                                                Academic Setup *

                                                <select
                                                    value={
                                                        selectedAcademicSetupId
                                                    }
                                                    onChange={(event) =>
                                                        handleAcademicSetupSelection(
                                                            event.target.value
                                                        )
                                                    }
                                                    style={{
                                                        minHeight:
                                                            "44px",
                                                        border:
                                                            "none",
                                                        outline:
                                                            "none",
                                                        borderRadius:
                                                            "12px",
                                                        padding:
                                                            "0 12px",
                                                        background:
                                                            "#dfe6e9",
                                                        color:
                                                            "#2a354f",
                                                        boxShadow:
                                                            "inset 3px 3px 7px #c6c9cf, inset -3px -3px 7px #ffffff",
                                                    }}
                                                >
                                                    <option value="">
                                                        Select Academic Setup
                                                    </option>

                                                    {academicSetups.map(
                                                        (
                                                            record
                                                        ) => (
                                                            <option
                                                                key={
                                                                    record.id
                                                                }
                                                                value={
                                                                    record.id
                                                                }
                                                            >
                                                                {`${record.academicYearName || "Academic Year"} · ${record.sessionName || "Session"} · ${record.schoolName || "School"} · ${record.departmentName || "Department"}`}
                                                            </option>
                                                        )
                                                    )}
                                                </select>
                                            </label>

                                            <label
                                                style={{
                                                    display:
                                                        "grid",
                                                    gap:
                                                        "7px",
                                                    color:
                                                        "#2a354f",
                                                    fontSize:
                                                        "13px",
                                                    fontWeight:
                                                        700,
                                                }}
                                            >
                                                Programme *

                                                <select
                                                    value={
                                                        selectedProgrammeId
                                                    }
                                                    disabled={
                                                        !selectedAcademicSetupId
                                                    }
                                                    onChange={(event) =>
                                                        handleProgrammeSelection(
                                                            event.target.value
                                                        )
                                                    }
                                                    style={{
                                                        minHeight:
                                                            "44px",
                                                        border:
                                                            "none",
                                                        outline:
                                                            "none",
                                                        borderRadius:
                                                            "12px",
                                                        padding:
                                                            "0 12px",
                                                        background:
                                                            "#dfe6e9",
                                                        color:
                                                            "#2a354f",
                                                        opacity:
                                                            selectedAcademicSetupId
                                                                ? 1
                                                                : 0.55,
                                                        boxShadow:
                                                            "inset 3px 3px 7px #c6c9cf, inset -3px -3px 7px #ffffff",
                                                    }}
                                                >
                                                    <option value="">
                                                        {selectedAcademicSetupId
                                                            ? "Select Programme"
                                                            : "Select Academic Setup first"}
                                                    </option>

                                                    {availableProgrammes.map(
                                                        (
                                                            record
                                                        ) => (
                                                            <option
                                                                key={
                                                                    record.id
                                                                }
                                                                value={
                                                                    record.id
                                                                }
                                                            >
                                                                {`${record.programmeName || "Programme"} · ${record.programmeCode || "Code"} · ${record.programmeLevel || "Level"}`}
                                                            </option>
                                                        )
                                                    )}
                                                </select>
                                            </label>

                                            <label
                                                style={{
                                                    display:
                                                        "grid",
                                                    gap:
                                                        "7px",
                                                    color:
                                                        "#2a354f",
                                                    fontSize:
                                                        "13px",
                                                    fontWeight:
                                                        700,
                                                }}
                                            >
                                                Curriculum Version *

                                                <select
                                                    value={
                                                        selectedCurriculumVersionId
                                                    }
                                                    disabled={
                                                        !selectedProgrammeId
                                                    }
                                                    onChange={(event) =>
                                                        handleCurriculumSelection(
                                                            event.target.value
                                                        )
                                                    }
                                                    style={{
                                                        minHeight:
                                                            "44px",
                                                        border:
                                                            "none",
                                                        outline:
                                                            "none",
                                                        borderRadius:
                                                            "12px",
                                                        padding:
                                                            "0 12px",
                                                        background:
                                                            "#dfe6e9",
                                                        color:
                                                            "#2a354f",
                                                        opacity:
                                                            selectedProgrammeId
                                                                ? 1
                                                                : 0.55,
                                                        boxShadow:
                                                            "inset 3px 3px 7px #c6c9cf, inset -3px -3px 7px #ffffff",
                                                    }}
                                                >
                                                    <option value="">
                                                        {selectedProgrammeId
                                                            ? "Select Curriculum Version"
                                                            : "Select Programme first"}
                                                    </option>

                                                    {availableCurriculumVersions.map(
                                                        (
                                                            record
                                                        ) => (
                                                            <option
                                                                key={
                                                                    record.id
                                                                }
                                                                value={
                                                                    record.id
                                                                }
                                                            >
                                                                {`${record.curriculumName || "Curriculum"} · ${record.versionName || record.versionLabel || "Version"} · ${record.regulationName || "Regulation"}`}
                                                            </option>
                                                        )
                                                    )}
                                                </select>
                                            </label>

                                        </div>

                                        {academicContextError && (
                                            <div
                                                role="alert"
                                                style={{
                                                    marginTop:
                                                        "16px",
                                                    color:
                                                        "#a33838",
                                                    fontSize:
                                                        "13px",
                                                    fontWeight:
                                                        700,
                                                }}
                                            >
                                                {
                                                    academicContextError
                                                }
                                            </div>
                                        )}

                                        <div
                                            style={{
                                                display:
                                                    "flex",
                                                justifyContent:
                                                    "flex-end",
                                                marginTop:
                                                    "22px",
                                            }}
                                        >
                                            <button
                                                type="button"
                                                className={
                                                    styles.backButton
                                                }
                                                disabled={
                                                    !selectedAcademicSetup ||
                                                    !selectedProgramme ||
                                                    !selectedCurriculumVersion
                                                }
                                                onClick={
                                                    startAcademicCourseCreation
                                                }
                                            >
                                                Start Course Creation
                                            </button>
                                        </div>
                                    </>
                                )}

                            </div>

                        ) : (

                            <CourseWizard

                                tenant={
                                    creationState
                                        .tenant
                                }

                                role={
                                    creationState
                                        .role
                                }

                                courseId={
                                    creationState
                                        .courseId
                                }

                                initialStep={
                                    creationState
                                        .currentStep
                                }

                            />

                        )}

                    </section>

                </div>

            </main>

        </div>
    );
}


/* =========================================================
   SIDEBAR
========================================================= */

function Sidebar({
    activeItem,
    tenant,
    role,
}: {
    activeItem: string;
    tenant?: string;
    role?: string;
}) {

    const sidebarItems =
        getSidebarItems(
            tenant || "",
            role || ""
        );

    return (

        <div
            className={
                styles.sidebarInner
            }
        >

            {/* =================================================
                BRAND
            ================================================= */}

            <div
                className={
                    styles.brand
                }
            >

                <div
                    className={
                        styles.brandIcon
                    }
                >
                    N
                </div>

                <div
                    className={
                        styles.brandText
                    }
                >

                    <strong>
                        NeuroLXP
                    </strong>

                    <span>
                        Learning Platform
                    </span>

                </div>

            </div>

            {/* =================================================
                NAVIGATION
            ================================================= */}

            <nav
                className={
                    styles.navigation
                }
            >

                <span
                    className={
                        styles.navigationTitle
                    }
                >
                    COURSE MANAGEMENT
                </span>

                {
                    sidebarItems.map(
                        (item) => {

                            const isActive =
                                item.id ===
                                activeItem;

                            return (

                                <button
                                    key={
                                        item.id
                                    }
                                    type="button"
                                    className={`
                                        ${styles.navItem}
                                        ${
                                            isActive
                                                ? styles.navActive
                                                : ""
                                        }
                                    `}
                                    onClick={() => {

                                        window.location.href =
                                            item
                                                .navigation
                                                .path;

                                    }}
                                >

                                    <span
                                        className={
                                            styles.navIcon
                                        }
                                    >
                                        {
                                            getNavIcon(
                                                item.id
                                            )
                                        }
                                    </span>

                                    <span
                                        className={
                                            styles.navLabel
                                        }
                                    >
                                        {
                                            item
                                                .navigation
                                                .label
                                        }
                                    </span>

                                </button>
                            );
                        }
                    )
                }

            </nav>

            {/* =================================================
                SIDEBAR FOOTER
            ================================================= */}

            <div
                className={
                    styles.sidebarFooter
                }
            >

                <span>
                    {
                        getTenantNavigation(
                            tenant || ""
                        ).courseManagement.label
                    }
                </span>

                <small>
                    NeuroLXP Platform
                </small>

            </div>

        </div>
    );
}

/* =========================================================
   NAVIGATION ICONS
========================================================= */

function getNavIcon(
    id: string
): string {

    switch (id) {

        case "dashboard":
            return "⌂";

        case "courses":
            return "▣";

        case "create":
            return "+";

        case "drafts":
            return "□";

        case "review":
            return "✓";

        case "bulk-upload":
            return "⇧";

        case "academic-configuration":
            return "⚙";

        case "published":
            return "◉";

        case "permissions":
            return "⚿";

        case "logs":
            return "▤";

        default:
            return "•";
    }
}