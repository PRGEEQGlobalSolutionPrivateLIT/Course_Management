"use client";

import {
    useEffect,
    useMemo,
    useState,
    type ChangeEvent,
} from "react";

import CourseHeader from "@/components/CourseHeader/CourseHeader";

import layoutStyles from "../create/page.module.css";
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
   NAVIGATION
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

function getTenantNavigation(
    tenant: string
): TenantNavigation {

    const normalizedTenant =
        tenant
            .trim()
            .toLowerCase()
            .replace(/-/g, "_")
            .replace(/\s+/g, "_");

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
   SIDEBAR PERMISSIONS
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
   ACADEMIC CONFIGURATION
========================================================= */

const ACADEMIC_SETUP_STORAGE_KEY =
    "neurolxp_academic_setup_records";

const ACTIVE_ACADEMIC_SETUP_KEY =
    "neurolxp_active_academic_setup_id";

const PROGRAMME_SETUP_STORAGE_KEY =
    "neurolxp_programme_setup_records";

const CURRICULUM_VERSION_STORAGE_KEY =
    "neurolxp_curriculum_version_records";

const ACADEMIC_CONFIGURATION_SCHEMA_VERSION =
    2;

type SetupStatus =
    | "Draft"
    | "Active"
    | "Locked"
    | "Archived";

type ConfigurationStep =
    | "academic"
    | "programme"
    | "curriculum";

type AcademicSetupRecord = {
    id: string;
    schemaVersion: number;

    countryOrJurisdiction: string;

    academicYearName: string;
    academicYearCode: string;

    sessionName: string;
    sessionCode: string;

    schoolName: string;
    departmentName: string;

    termSystem: string;
    academicPeriodName: string;
    academicPeriodNumber: string;

    qualificationFramework: string;
    qualificationFrameworkLevel: string;

    creditFramework: string;

    regulatoryFramework: string;
    accreditationFramework: string;

    academicCalendar: string;

    customQualificationFramework: string;
    customCreditFramework: string;
    customRegulatoryFramework: string;

    status: SetupStatus;

    createdAt: string;
    updatedAt: string;
};

type FieldErrors = Partial<
    Record<
        | "countryOrJurisdiction"
        | "academicYearName"
        | "sessionName"
        | "schoolName"
        | "departmentName"
        | "termSystem"
        | "academicPeriodName"
        | "academicPeriodNumber"
        | "qualificationFramework"
        | "creditFramework"
        | "academicCalendar",
        string
    >
>;

type ProgrammeStatus =
    | "Draft"
    | "Active"
    | "Locked"
    | "Archived";

type ProgrammeSetupRecord = {
    id: string;
    schemaVersion: number;

    programmeId: string;
    academicSetupId: string;

    programmeName: string;
    programmeShortName: string;
    programmeCode: string;
    programmeDescription: string;

    programmeLevel: string;
    programmeType: string;
    programmeMode: string;

    facultySchool: string;
    department: string;

    durationValue: string;
    durationType: string;
    totalSemesters: string;
    termSystem: string;

    currentApplicableBatch: string;
    startAcademicYear: string;
    defaultAcademicSession: string;

    totalCredits: string;
    minimumCreditsRequired: string;
    maximumCreditsAllowed: string;
    creditSystem: string;

    awardName: string;
    qualificationLevel: string;
    qualificationType: string;

    entryQualification: string;
    admissionMode: string;
    mediumOfInstruction: string;
    deliveryMode: string;

    programmeOwner: string;
    programmeCoordinator: string;

    outcomeFramework: string;
    programmeOutcomes: string;
    programmeSpecificOutcomes: string;
    graduateAttributes: string;
    skillsCompetencies: string;

    status: ProgrammeStatus;

    createdAt: string;
    updatedAt: string;
};

type ProgrammeFieldErrors = Partial<
    Record<
        | "academicSetupId"
        | "programmeName"
        | "programmeShortName"
        | "programmeCode"
        | "programmeLevel"
        | "programmeType"
        | "durationValue"
        | "durationType"
        | "totalSemesters"
        | "totalCredits"
        | "minimumCreditsRequired"
        | "awardName"
        | "qualificationType"
        | "entryQualification"
        | "mediumOfInstruction"
        | "deliveryMode"
        | "outcomeFramework",
        string
    >
>;

type CurriculumVersionStatus =
    | "Draft"
    | "Active"
    | "Locked"
    | "Archived";

type CurriculumVersionRecord = {
    id: string;
    schemaVersion: number;

    curriculumVersionId: string;

    programmeId: string;
    academicSetupId: string;

    programmeName: string;
    programmeCode: string;
    programmeLevel: string;
    school: string;
    department: string;

    curriculumName: string;
    curriculumCode: string;

    academicYearFrom: string;
    academicYearTo: string;
    applicableAdmissionBatch: string;
    applicableSession: string;

    versionName: string;
    versionLabel: string;
    regulationName: string;
    syllabusVersion: string;
    versionDescription: string;

    effectiveFromDate: string;
    effectiveToDate: string;

    changeType: string;
    impactArea: string;
    affectedAcademicPeriods: string;
    changeSummary: string;
    reasonForRevision: string;
    revisionNotes: string;

    previousVersion: string;
    migrationRequired: string;
    migrationStatus: string;

    programmeDuration: string;
    academicStructure: string;

    qualificationFramework: string;
    regulatoryFramework: string;
    accreditationFramework: string;
    academicCalendar: string;

    totalProgrammeCredits: string;
    totalAcademicPeriods: string;
    creditSystem: string;
    gradingSystem: string;
    minimumCreditsRequired: string;
    maximumCreditsAllowed: string;

    approvalStatus: string;
    approvalReferenceNumber: string;

    status: CurriculumVersionStatus;

    createdAt: string;
    updatedAt: string;
    approvedAt: string;
};

type CurriculumFieldErrors = Partial<
    Record<
        | "programmeId"
        | "curriculumName"
        | "academicYearFrom"
        | "applicableAdmissionBatch"
        | "applicableSession"
        | "versionName"
        | "effectiveFromDate"
        | "changeType"
        | "changeSummary"
        | "reasonForRevision"
        | "totalProgrammeCredits"
        | "totalAcademicPeriods"
        | "creditSystem"
        | "gradingSystem",
        string
    >
>;

/* =========================================================
   GLOBAL FRAMEWORK MODEL
========================================================= */

type FrameworkSet = {
    qualification: string[];
    credit: string[];
    regulatory: string[];
    accreditation: string[];
};

const frameworkByJurisdiction:
    Record<string, FrameworkSet> = {

    India: {
        qualification: [
            "National Higher Education Qualifications Framework (NHEQF)",
            "National Credit Framework (NCrF)",
            "National Skills Qualifications Framework (NSQF)",
            "Institution-defined qualification framework",
        ],
        credit: [
            "National Credit Framework (NCrF)",
            "UGC Curriculum and Credit Framework",
            "Choice Based Credit System (CBCS)",
            "AICTE credit framework",
            "Institution-defined credit system",
        ],
        regulatory: [
            "University Grants Commission (UGC)",
            "All India Council for Technical Education (AICTE)",
            "National Council for Teacher Education (NCTE)",
            "Other statutory / professional council",
            "Institutional regulatory framework",
        ],
        accreditation: [
            "National Assessment and Accreditation Council (NAAC)",
            "National Board of Accreditation (NBA)",
            "Other professional accreditation",
            "Institutional quality assurance framework",
        ],
    },

    "United States": {
        qualification: [
            "US degree / credential level framework",
            "Institution-defined qualification levels",
        ],
        credit: [
            "Semester Credit Hours",
            "Quarter Credit Hours",
            "Institution-defined credit system",
        ],
        regulatory: [
            "State / federal regulatory context",
            "Institutional regulatory framework",
        ],
        accreditation: [
            "Institutional accreditation",
            "Programmatic / professional accreditation",
            "ABET",
            "AACSB",
            "Other recognized accreditation",
        ],
    },

    "United Kingdom": {
        qualification: [
            "Framework for Higher Education Qualifications (FHEQ)",
            "Regulated Qualifications Framework (RQF)",
            "Scottish Credit and Qualifications Framework (SCQF)",
            "Credit and Qualifications Framework for Wales (CQFW)",
        ],
        credit: [
            "UK Credit Accumulation and Transfer Scheme (CATS)",
            "SCQF Credit Points",
            "Institution-defined credit system",
        ],
        regulatory: [
            "Office for Students / UK regulatory context",
            "National / devolved administration regulator",
            "Institutional regulatory framework",
        ],
        accreditation: [
            "Professional, Statutory and Regulatory Body accreditation",
            "Quality assurance / institutional review framework",
            "Institution-defined quality framework",
        ],
    },

    "European Higher Education Area": {
        qualification: [
            "Qualifications Framework for the European Higher Education Area (QF-EHEA)",
            "European Qualifications Framework (EQF)",
            "National Qualifications Framework aligned to EQF / QF-EHEA",
        ],
        credit: [
            "European Credit Transfer and Accumulation System (ECTS)",
            "National credit system",
        ],
        regulatory: [
            "National higher education regulator",
            "European / national regulatory context",
            "Institutional regulatory framework",
        ],
        accreditation: [
            "National quality assurance / accreditation agency",
            "European Standards and Guidelines (ESG) aligned quality assurance",
            "Programmatic / professional accreditation",
        ],
    },

    Australia: {
        qualification: [
            "Australian Qualifications Framework (AQF)",
            "Institution-defined qualification framework",
        ],
        credit: [
            "Australian institution credit points",
            "Equivalent Full-Time Student Load aligned credit",
            "Institution-defined credit system",
        ],
        regulatory: [
            "Tertiary Education Quality and Standards Agency (TEQSA)",
            "Australian Skills Quality Authority (ASQA)",
            "Institutional regulatory framework",
        ],
        accreditation: [
            "TEQSA / Higher Education Standards Framework alignment",
            "Professional accreditation",
            "Institutional quality assurance framework",
        ],
    },

    "New Zealand": {
        qualification: [
            "New Zealand Qualifications and Credentials Framework (NZQCF)",
            "Institution-defined qualification framework",
        ],
        credit: [
            "NZQCF credit system",
            "Institution-defined credit system",
        ],
        regulatory: [
            "New Zealand Qualifications Authority (NZQA)",
            "Universities New Zealand / relevant quality body",
            "Institutional regulatory framework",
        ],
        accreditation: [
            "NZQA quality assurance",
            "Academic Quality Agency / university quality assurance",
            "Professional accreditation",
        ],
    },

    Canada: {
        qualification: [
            "Provincial / territorial qualifications framework",
            "Canadian Degree Qualifications Framework reference",
            "Institution-defined qualification framework",
        ],
        credit: [
            "Semester Credit Hours",
            "Course Credit Units",
            "Institution-defined credit system",
        ],
        regulatory: [
            "Provincial / territorial higher education authority",
            "Institutional regulatory framework",
        ],
        accreditation: [
            "Provincial quality assurance",
            "Programmatic / professional accreditation",
            "Institutional quality assurance framework",
        ],
    },

    Singapore: {
        qualification: [
            "Singapore Qualifications Framework / national qualification reference",
            "Skills Framework / credential level reference",
            "Institution-defined qualification framework",
        ],
        credit: [
            "Academic Units / Modular Credits",
            "Credit Units",
            "Institution-defined credit system",
        ],
        regulatory: [
            "Ministry of Education / relevant regulator",
            "SkillsFuture Singapore / relevant authority",
            "Institutional regulatory framework",
        ],
        accreditation: [
            "National / institutional quality assurance",
            "Professional accreditation",
        ],
    },

    Malaysia: {
        qualification: [
            "Malaysian Qualifications Framework (MQF)",
            "Institution-defined qualification framework",
        ],
        credit: [
            "MQF credit system",
            "Institution-defined credit system",
        ],
        regulatory: [
            "Malaysian Qualifications Agency (MQA)",
            "Ministry / relevant regulatory authority",
        ],
        accreditation: [
            "MQA accreditation",
            "Professional accreditation",
        ],
    },

    "United Arab Emirates": {
        qualification: [
            "UAE Qualifications Framework / QFEmirates",
            "Institution-defined qualification framework",
        ],
        credit: [
            "Credit Hours",
            "Institution-defined credit system",
        ],
        regulatory: [
            "Commission for Academic Accreditation / relevant authority",
            "Emirate-specific education authority",
            "Institutional regulatory framework",
        ],
        accreditation: [
            "Commission for Academic Accreditation",
            "International / professional accreditation",
        ],
    },

    "Saudi Arabia": {
        qualification: [
            "Saudi Qualifications Framework / national qualification reference",
            "Institution-defined qualification framework",
        ],
        credit: [
            "Credit Hours",
            "Institution-defined credit system",
        ],
        regulatory: [
            "Ministry of Education / relevant national authority",
            "Institutional regulatory framework",
        ],
        accreditation: [
            "Education and Training Evaluation Commission / NCAAA",
            "Professional / international accreditation",
        ],
    },

    "South Africa": {
        qualification: [
            "National Qualifications Framework (NQF)",
            "Higher Education Qualifications Sub-Framework (HEQSF)",
        ],
        credit: [
            "South African NQF credit system",
            "Institution-defined credit system",
        ],
        regulatory: [
            "Council on Higher Education (CHE)",
            "South African Qualifications Authority (SAQA)",
            "Department of Higher Education and Training",
        ],
        accreditation: [
            "Higher Education Quality Committee / CHE",
            "Professional accreditation",
        ],
    },

    Japan: {
        qualification: [
            "Japanese national higher education qualification structure",
            "Institution-defined qualification framework",
        ],
        credit: [
            "Japanese university credit system",
            "Institution-defined credit system",
        ],
        regulatory: [
            "Ministry of Education, Culture, Sports, Science and Technology (MEXT)",
            "Institutional regulatory framework",
        ],
        accreditation: [
            "Certified Evaluation and Accreditation agency",
            "Professional accreditation",
        ],
    },

    "South Korea": {
        qualification: [
            "Korean Qualifications Framework / national qualification reference",
            "Institution-defined qualification framework",
        ],
        credit: [
            "Korean university credit system",
            "Institution-defined credit system",
        ],
        regulatory: [
            "Ministry of Education / relevant authority",
            "Institutional regulatory framework",
        ],
        accreditation: [
            "Institutional / programmatic accreditation",
            "Professional accreditation",
        ],
    },

    "Other / Institution Defined": {
        qualification: [
            "Custom / institution-defined qualification framework",
        ],
        credit: [
            "Custom / institution-defined credit framework",
        ],
        regulatory: [
            "Custom / institution-defined regulatory framework",
        ],
        accreditation: [
            "Custom / institution-defined accreditation framework",
        ],
    },
};

const countryOrJurisdictionOptions = [
    "",
    ...Object.keys(
        frameworkByJurisdiction
    ),
];

const academicYearOptions = [
    "",
    "2025 - 26",
    "2026 - 27",
    "2027 - 28",
    "2028 - 29",
    "2029 - 30",
    "2030 - 31",
    "Custom / Institution Defined",
];

const sessionOptions = [
    "",
    "Academic Session",
    "Fall / Autumn",
    "Spring",
    "Summer",
    "Odd Semester",
    "Even Semester",
    "Trimester I",
    "Trimester II",
    "Trimester III",
    "Quarter I",
    "Quarter II",
    "Quarter III",
    "Quarter IV",
    "Annual Session",
    "Custom / Institution Defined",
];

const schoolDepartmentMap:
    Record<string, string[]> = {

    "School of Engineering": [
        "Computer Science and Engineering",
        "Information Technology",
        "Electronics and Communication Engineering",
        "Electrical and Electronics Engineering",
        "Mechanical Engineering",
        "Civil Engineering",
        "Artificial Intelligence and Data Science",
    ],

    "School of Computer Applications": [
        "Computer Applications",
        "Software Development",
        "Cloud Computing",
        "Data Science",
        "Cyber Security",
    ],

    "School of Management": [
        "Business Administration",
        "Finance",
        "Human Resource Management",
        "Marketing",
        "Business Analytics",
    ],

    "School of Science": [
        "Physics",
        "Chemistry",
        "Mathematics",
        "Statistics",
        "Computer Science",
        "Biotechnology",
    ],

    "School of Humanities": [
        "English",
        "Psychology",
        "Sociology",
        "Economics",
        "Social Work",
    ],

    "School of Health Sciences": [
        "Medicine",
        "Nursing",
        "Pharmacy",
        "Public Health",
        "Allied Health Sciences",
    ],

    "School of Law": [
        "Law",
        "Legal Studies",
    ],

    "School of Education": [
        "Education",
        "Teacher Education",
    ],

    Other: [
        "Other",
    ],
};

const termSystemOptions = [
    "",
    "Semester",
    "Trimester",
    "Quarter",
    "Annual",
    "Block",
    "Modular",
    "Term-based",
    "Custom / Institution Defined",
];

const academicPeriodOptions = [
    "",
    "Semester I",
    "Semester II",
    "Semester III",
    "Semester IV",
    "Semester V",
    "Semester VI",
    "Semester VII",
    "Semester VIII",
    "Trimester I",
    "Trimester II",
    "Trimester III",
    "Quarter I",
    "Quarter II",
    "Quarter III",
    "Quarter IV",
    "Annual",
    "Custom / Institution Defined",
];

const academicPeriodNumberOptions = [
    "",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "11",
    "12",
];

const academicCalendarOptions = [
    "",
    "Annual Academic Calendar",
    "Semester Academic Calendar",
    "Trimester Academic Calendar",
    "Quarter Academic Calendar",
    "Block / Modular Calendar",
    "Rolling Academic Calendar",
    "Institution Defined Calendar",
];


const programmeLevelOptions = [
    "",
    "Foundation / Preparatory",
    "Certificate",
    "Diploma",
    "Associate / Short Cycle",
    "Undergraduate / Bachelor",
    "Postgraduate / Master",
    "Doctoral",
    "Postdoctoral / Advanced Research",
    "Professional / Regulated Qualification",
    "Other / Institution Defined",
];

const programmeTypeOptions = [
    "",
    "Degree",
    "Diploma",
    "Certificate",
    "Professional Programme",
    "Integrated Programme",
    "Honours Programme",
    "Research Programme",
    "Vocational / Technical Programme",
    "Micro-credential Pathway",
    "Other / Institution Defined",
];

const programmeModeOptions = [
    "",
    "Regular / Full-time",
    "Part-time",
    "Online",
    "Blended / Hybrid",
    "Distance",
    "Work-integrated",
    "Apprenticeship",
    "Other / Institution Defined",
];

const durationTypeOptions = [
    "",
    "Weeks",
    "Months",
    "Semesters",
    "Trimesters",
    "Quarters",
    "Years",
];

const qualificationTypeOptions = [
    "",
    "Academic",
    "Professional",
    "Technical / Vocational",
    "Research",
    "Integrated",
    "Other / Institution Defined",
];

const admissionModeOptions = [
    "",
    "Merit",
    "Entrance Examination",
    "Open Admission",
    "Institution Selection",
    "Government / Central Allocation",
    "Employer Sponsored",
    "Recognition of Prior Learning",
    "Other / Institution Defined",
];

const mediumOptions = [
    "",
    "English",
    "Local / National Language",
    "Bilingual",
    "Multilingual",
    "Other / Institution Defined",
];

const deliveryModeOptions = [
    "",
    "On Campus",
    "Online",
    "Blended / Hybrid",
    "Distance",
    "Workplace / Industry",
    "Multi-campus",
    "Other / Institution Defined",
];

const outcomeFrameworkOptions = [
    "",
    "Outcome-Based Education (OBE)",
    "Programme Outcomes / Graduate Outcomes",
    "Competency-Based Education",
    "Professional Competency Framework",
    "Institution-defined Outcome Framework",
];

const curriculumChangeTypeOptions = [
    "",
    "New / Initial Version",
    "Minor Revision",
    "Major Revision",
    "Credit Change",
    "Regulation Change",
    "Outcome Framework Change",
    "Academic Structure Change",
    "Other",
];

const curriculumImpactAreaOptions = [
    "",
    "Courses",
    "Credits",
    "Academic Periods",
    "CO-PO / Outcome Mapping",
    "Assessment",
    "Syllabus / Learning Structure",
    "Programme Outcomes",
    "All Areas",
    "Other",
];

const gradingSystemOptions = [
    "",
    "Letter Grade",
    "Percentage",
    "GPA",
    "CGPA",
    "Pass / Fail",
    "Competency Based",
    "Mixed / Institution Defined",
];

const migrationStatusOptions = [
    "",
    "Not Required",
    "Planned",
    "In Progress",
    "Completed",
];

const yesNoOptions = [
    "",
    "Yes",
    "No",
];

/* =========================================================
   HELPERS
========================================================= */

function createAcademicSetupId() {
    return `ACADEMIC-${Date.now()}`;
}

function createEmptyAcademicSetup():
    AcademicSetupRecord {

    return {
        id: "",
        schemaVersion:
            ACADEMIC_CONFIGURATION_SCHEMA_VERSION,

        countryOrJurisdiction: "",

        academicYearName: "",
        academicYearCode: "",

        sessionName: "",
        sessionCode: "",

        schoolName: "",
        departmentName: "",

        termSystem: "Semester",
        academicPeriodName: "",
        academicPeriodNumber: "",

        qualificationFramework: "",
        qualificationFrameworkLevel: "",

        creditFramework: "",

        regulatoryFramework: "",
        accreditationFramework: "",

        academicCalendar: "",

        customQualificationFramework: "",
        customCreditFramework: "",
        customRegulatoryFramework: "",

        status: "Draft",

        createdAt: "",
        updatedAt: "",
    };
}

function loadAcademicSetups():
    AcademicSetupRecord[] {

    if (
        typeof window === "undefined"
    ) {
        return [];
    }

    try {

        const raw =
            localStorage.getItem(
                ACADEMIC_SETUP_STORAGE_KEY
            );

        if (!raw) {
            return [];
        }

        const parsed =
            JSON.parse(
                raw
            );

        if (
            !Array.isArray(
                parsed
            )
        ) {
            return [];
        }

        return parsed.filter(
            (
                record
            ) =>
                record &&
                typeof record ===
                    "object" &&
                (
                    record as {
                        schemaVersion?: number;
                    }
                ).schemaVersion ===
                    ACADEMIC_CONFIGURATION_SCHEMA_VERSION
        ) as AcademicSetupRecord[];

    } catch {

        return [];
    }
}


function createProgrammeRecordId() {
    return `PROGRAMME-REC-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 7)
        .toUpperCase()}`;
}

function createProgrammeId() {
    return `PRG-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 6)
        .toUpperCase()}`;
}

function createEmptyProgrammeSetup():
    ProgrammeSetupRecord {

    return {
        id: "",
        schemaVersion:
            ACADEMIC_CONFIGURATION_SCHEMA_VERSION,

        programmeId: "",
        academicSetupId: "",

        programmeName: "",
        programmeShortName: "",
        programmeCode: "",
        programmeDescription: "",

        programmeLevel: "",
        programmeType: "",
        programmeMode: "Regular / Full-time",

        facultySchool: "",
        department: "",

        durationValue: "",
        durationType: "Years",
        totalSemesters: "",
        termSystem: "",

        currentApplicableBatch: "",
        startAcademicYear: "",
        defaultAcademicSession: "",

        totalCredits: "",
        minimumCreditsRequired: "",
        maximumCreditsAllowed: "",
        creditSystem: "",

        awardName: "",
        qualificationLevel: "",
        qualificationType: "",

        entryQualification: "",
        admissionMode: "",
        mediumOfInstruction: "",
        deliveryMode: "",

        programmeOwner: "",
        programmeCoordinator: "",

        outcomeFramework: "",
        programmeOutcomes: "",
        programmeSpecificOutcomes: "",
        graduateAttributes: "",
        skillsCompetencies: "",

        status: "Draft",

        createdAt: "",
        updatedAt: "",
    };
}

function loadProgrammeSetups():
    ProgrammeSetupRecord[] {

    if (
        typeof window === "undefined"
    ) {
        return [];
    }

    try {

        const raw =
            localStorage.getItem(
                PROGRAMME_SETUP_STORAGE_KEY
            );

        if (!raw) {
            return [];
        }

        const parsed =
            JSON.parse(
                raw
            );

        if (
            !Array.isArray(
                parsed
            )
        ) {
            return [];
        }

        return parsed.filter(
            (
                record
            ) =>
                record &&
                typeof record ===
                    "object" &&
                (
                    record as {
                        schemaVersion?: number;
                    }
                ).schemaVersion ===
                    ACADEMIC_CONFIGURATION_SCHEMA_VERSION
        ) as ProgrammeSetupRecord[];

    } catch {

        return [];
    }
}

function buildProgrammeCode(
    shortName: string,
    name: string
) {

    const source =
        shortName.trim() ||
        name.trim();

    if (!source) {
        return "";
    }

    return source
        .toUpperCase()
        .replace(
            /[^A-Z0-9]+/g,
            "-"
        )
        .replace(
            /^-+|-+$/g,
            ""
        )
        .slice(
            0,
            24
        );
}


function createCurriculumRecordId() {
    return `CURRICULUM-REC-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 7)
        .toUpperCase()}`;
}

function createCurriculumVersionId() {
    return `CV-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 6)
        .toUpperCase()}`;
}

function createCurriculumCode(
    programmeCode: string,
    versionName: string
) {

    const source =
        `${programmeCode}-${versionName}`
            .trim();

    if (!source) {
        return "";
    }

    return source
        .toUpperCase()
        .replace(
            /[^A-Z0-9]+/g,
            "-"
        )
        .replace(
            /^-+|-+$/g,
            ""
        )
        .slice(
            0,
            40
        );
}

function createEmptyCurriculumVersion():
    CurriculumVersionRecord {

    return {
        id: "",
        schemaVersion:
            ACADEMIC_CONFIGURATION_SCHEMA_VERSION,

        curriculumVersionId: "",

        programmeId: "",
        academicSetupId: "",

        programmeName: "",
        programmeCode: "",
        programmeLevel: "",
        school: "",
        department: "",

        curriculumName: "",
        curriculumCode: "",

        academicYearFrom: "",
        academicYearTo: "",
        applicableAdmissionBatch: "",
        applicableSession: "",

        versionName: "",
        versionLabel: "",
        regulationName: "",
        syllabusVersion: "",
        versionDescription: "",

        effectiveFromDate: "",
        effectiveToDate: "",

        changeType: "",
        impactArea: "",
        affectedAcademicPeriods: "",
        changeSummary: "",
        reasonForRevision: "",
        revisionNotes: "",

        previousVersion: "",
        migrationRequired: "No",
        migrationStatus: "Not Required",

        programmeDuration: "",
        academicStructure: "",

        qualificationFramework: "",
        regulatoryFramework: "",
        accreditationFramework: "",
        academicCalendar: "",

        totalProgrammeCredits: "",
        totalAcademicPeriods: "",
        creditSystem: "",
        gradingSystem: "",
        minimumCreditsRequired: "",
        maximumCreditsAllowed: "",

        approvalStatus: "Draft",
        approvalReferenceNumber: "",

        status: "Draft",

        createdAt: "",
        updatedAt: "",
        approvedAt: "",
    };
}

function loadCurriculumVersions():
    CurriculumVersionRecord[] {

    if (
        typeof window === "undefined"
    ) {
        return [];
    }

    try {

        const raw =
            localStorage.getItem(
                CURRICULUM_VERSION_STORAGE_KEY
            );

        if (!raw) {
            return [];
        }

        const parsed =
            JSON.parse(
                raw
            );

        if (
            !Array.isArray(
                parsed
            )
        ) {
            return [];
        }

        return parsed.filter(
            (
                record
            ) =>
                record &&
                typeof record ===
                    "object" &&
                (
                    record as {
                        schemaVersion?: number;
                    }
                ).schemaVersion ===
                    ACADEMIC_CONFIGURATION_SCHEMA_VERSION
        ) as CurriculumVersionRecord[];

    } catch {

        return [];
    }
}

/* =========================================================
   PAGE
========================================================= */

export default function AcademicConfigurationPage() {

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
        error,
        setError,
    ] =
        useState(
            ""
        );

    const [
        activeStep,
        setActiveStep,
    ] =
        useState<
            ConfigurationStep
        >(
            "academic"
        );

    const [
        academicSetups,
        setAcademicSetups,
    ] =
        useState<
            AcademicSetupRecord[]
        >(
            []
        );

    const [
        programmeRecords,
        setProgrammeRecords,
    ] =
        useState<
            ProgrammeSetupRecord[]
        >(
            []
        );

    const [
        programmeForm,
        setProgrammeForm,
    ] =
        useState<
            ProgrammeSetupRecord
        >(
            createEmptyProgrammeSetup()
        );

    const [
        programmeFieldErrors,
        setProgrammeFieldErrors,
    ] =
        useState<
            ProgrammeFieldErrors
        >(
            {}
        );

    const [
        curriculumRecords,
        setCurriculumRecords,
    ] =
        useState<
            CurriculumVersionRecord[]
        >(
            []
        );

    const [
        curriculumForm,
        setCurriculumForm,
    ] =
        useState<
            CurriculumVersionRecord
        >(
            createEmptyCurriculumVersion()
        );

    const [
        curriculumFieldErrors,
        setCurriculumFieldErrors,
    ] =
        useState<
            CurriculumFieldErrors
        >(
            {}
        );

    const [
        form,
        setForm,
    ] =
        useState<
            AcademicSetupRecord
        >(
            createEmptyAcademicSetup()
        );

    const [
        fieldErrors,
        setFieldErrors,
    ] =
        useState<
            FieldErrors
        >(
            {}
        );

    const [
        message,
        setMessage,
    ] =
        useState(
            ""
        );

    /* =====================================================
       SESSION + MASTER DATA
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

            const records =
                loadAcademicSetups();

            setAcademicSetups(
                records
            );

            setProgrammeRecords(
                loadProgrammeSetups()
            );

            setCurriculumRecords(
                loadCurriculumVersions()
            );

            /*
             * Academic Configuration always starts as a fresh
             * Academic Setup form. Existing completed records
             * remain in the records table and become selectable
             * mappings in Programme Setup.
             */
            setForm(
                createEmptyAcademicSetup()
            );

            setProgrammeForm(
                createEmptyProgrammeSetup()
            );

            setCurriculumForm(
                createEmptyCurriculumVersion()
            );

        } catch {

            setError(
                "Unable to load Academic Configuration."
            );
        }

    }, []);

    /* =====================================================
       NAVIGATION
    ===================================================== */

    const navigation =
        getTenantNavigation(
            user?.tenant ||
            ""
        );

    /* =====================================================
       STEP COMPLETION
    ===================================================== */

    const activeAcademicSetup =
        useMemo(
            () =>
                academicSetups.find(
                    (
                        record
                    ) =>
                        record.status ===
                        "Active"
                ) ??
                null,
            [
                academicSetups,
            ]
        );

    const academicComplete =
        Boolean(
            activeAcademicSetup
        );

    const usableAcademicSetups =
        useMemo(
            () =>
                academicSetups.filter(
                    (
                        record
                    ) =>
                        record.status ===
                            "Active" ||
                        record.status ===
                            "Locked"
                ),
            [
                academicSetups,
            ]
        );

    const activeProgramme =
        useMemo(
            () =>
                programmeRecords.find(
                    (
                        record
                    ) =>
                        record.status ===
                        "Active"
                ) ??
                null,
            [
                programmeRecords,
            ]
        );

    const programmeComplete =
        Boolean(
            activeProgramme
        );

    const usableProgrammeRecords =
        useMemo(
            () =>
                programmeRecords.filter(
                    (
                        record
                    ) =>
                        record.status ===
                            "Active" ||
                        record.status ===
                            "Locked"
                ),
            [
                programmeRecords,
            ]
        );

    const activeCurriculumVersion =
        useMemo(
            () =>
                curriculumRecords.find(
                    (
                        record
                    ) =>
                        record.status ===
                        "Active"
                ) ??
                null,
            [
                curriculumRecords,
            ]
        );

    const curriculumComplete =
        Boolean(
            activeCurriculumVersion
        );

    const canOpenProgramme =
        usableAcademicSetups.length >
        0;

    const canOpenCurriculum =
        usableProgrammeRecords.length >
        0;

    /* =====================================================
       GLOBAL FRAMEWORK DERIVATION
    ===================================================== */

    const selectedFrameworks =
        form.countryOrJurisdiction
            ? frameworkByJurisdiction[
                  form.countryOrJurisdiction
              ]
            : undefined;

    const qualificationFrameworkOptions =
        selectedFrameworks
            ? [
                  "",
                  ...selectedFrameworks
                      .qualification,
              ]
            : [
                  "",
              ];

    const creditFrameworkOptions =
        selectedFrameworks
            ? [
                  "",
                  ...selectedFrameworks
                      .credit,
              ]
            : [
                  "",
              ];

    const regulatoryFrameworkOptions =
        selectedFrameworks
            ? [
                  "",
                  ...selectedFrameworks
                      .regulatory,
              ]
            : [
                  "",
              ];

    const accreditationFrameworkOptions =
        selectedFrameworks
            ? [
                  "",
                  ...selectedFrameworks
                      .accreditation,
              ]
            : [
                  "",
              ];

    const departmentOptions =
        useMemo(
            () =>
                form.schoolName
                    ? schoolDepartmentMap[
                          form.schoolName
                      ] ??
                      [
                          "Other",
                      ]
                    : [],
            [
                form.schoolName,
            ]
        );

    const isCustomQualification =
        form.qualificationFramework
            .toLowerCase()
            .includes(
                "custom"
            ) ||
        form.qualificationFramework
            .toLowerCase()
            .includes(
                "institution-defined"
            );

    const isCustomCredit =
        form.creditFramework
            .toLowerCase()
            .includes(
                "custom"
            ) ||
        form.creditFramework
            .toLowerCase()
            .includes(
                "institution-defined"
            );

    const isCustomRegulatory =
        form.regulatoryFramework
            .toLowerCase()
            .includes(
                "custom"
            ) ||
        form.regulatoryFramework
            .toLowerCase()
            .includes(
                "institutional regulatory"
            );

    /* =====================================================
       UPDATE
    ===================================================== */

    function handleChange(
        event:
            ChangeEvent<
                HTMLInputElement |
                HTMLSelectElement
            >
    ) {

        const {
            name,
            value,
        } =
            event.target;

        setForm(
            (
                current
            ) => ({
                ...current,

                [name]:
                    value,

                ...(name ===
                "academicYearName"
                    ? {
                          academicYearCode:
                              value
                                  .toUpperCase()
                                  .replace(
                                      /\s+/g,
                                      ""
                                  )
                                  .replace(
                                      /[^A-Z0-9]+/g,
                                      "-"
                                  )
                                  .replace(
                                      /^-+|-+$/g,
                                      ""
                                  ),
                      }
                    : {}),

                ...(name ===
                "sessionName"
                    ? {
                          sessionCode:
                              value
                                  .toUpperCase()
                                  .replace(
                                      /[^A-Z0-9]+/g,
                                      "-"
                                  )
                                  .replace(
                                      /^-+|-+$/g,
                                      ""
                                  ),
                      }
                    : {}),

                ...(name ===
                "schoolName"
                    ? {
                          departmentName:
                              "",
                      }
                    : {}),

                ...(name ===
                "countryOrJurisdiction"
                    ? {
                          qualificationFramework:
                              "",
                          qualificationFrameworkLevel:
                              "",
                          creditFramework:
                              "",
                          regulatoryFramework:
                              "",
                          accreditationFramework:
                              "",
                          customQualificationFramework:
                              "",
                          customCreditFramework:
                              "",
                          customRegulatoryFramework:
                              "",
                      }
                    : {}),
            })
        );

        if (
            name in
            fieldErrors
        ) {

            setFieldErrors(
                (
                    current
                ) => {

                    const next = {
                        ...current,
                    };

                    delete next[
                        name as keyof FieldErrors
                    ];

                    return next;
                }
            );
        }

        setMessage(
            ""
        );
    }

    /* =====================================================
       VALIDATION
    ===================================================== */

    function validateAcademicSetup():
        boolean {

        const errors:
            FieldErrors = {};

        if (
            !form.countryOrJurisdiction
                .trim()
        ) {
            errors.countryOrJurisdiction =
                "Country / jurisdiction is required.";
        }

        if (
            !form.academicYearName
                .trim()
        ) {
            errors.academicYearName =
                "Academic year is required.";
        }

        if (
            !form.sessionName
                .trim()
        ) {
            errors.sessionName =
                "Academic session is required.";
        }

        if (
            !form.schoolName
                .trim()
        ) {
            errors.schoolName =
                "School / faculty is required.";
        }

        if (
            !form.departmentName
                .trim()
        ) {
            errors.departmentName =
                "Department is required.";
        }

        if (
            !form.termSystem
                .trim()
        ) {
            errors.termSystem =
                "Academic term system is required.";
        }

        if (
            !form.academicPeriodName
                .trim()
        ) {
            errors.academicPeriodName =
                "Academic period is required.";
        }

        if (
            !form.academicPeriodNumber
                .trim()
        ) {
            errors.academicPeriodNumber =
                "Academic period number is required.";
        }

        if (
            !form.qualificationFramework
                .trim()
        ) {
            errors.qualificationFramework =
                "Qualification framework is required.";
        }

        if (
            !form.creditFramework
                .trim()
        ) {
            errors.creditFramework =
                "Credit framework is required.";
        }

        if (
            !form.academicCalendar
                .trim()
        ) {
            errors.academicCalendar =
                "Academic calendar is required.";
        }

        setFieldErrors(
            errors
        );

        return (
            Object.keys(
                errors
            ).length ===
            0
        );
    }

    /* =====================================================
       SAVE
    ===================================================== */

    function saveAcademicSetup(
        nextStatus:
            SetupStatus
    ): boolean {

        if (
            !validateAcademicSetup()
        ) {

            setMessage(
                "Complete the required Academic Setup fields before continuing."
            );

            return false;
        }

        const now =
            new Date()
                .toISOString();

        const id =
            form.id ||
            createAcademicSetupId();

        const record:
            AcademicSetupRecord = {
                ...form,

                id,
                schemaVersion:
                    ACADEMIC_CONFIGURATION_SCHEMA_VERSION,

                status:
                    nextStatus,

                createdAt:
                    form.createdAt ||
                    now,

                updatedAt:
                    now,
            };

        let nextRecords =
            [
                ...academicSetups,
            ];

        if (
            nextStatus ===
            "Active"
        ) {

            nextRecords =
                nextRecords.map(
                    (
                        item
                    ) =>
                        item.status ===
                            "Active" &&
                        item.id !==
                            id
                            ? {
                                  ...item,
                                  status:
                                      "Locked",
                                  updatedAt:
                                      now,
                              }
                            : item
                );
        }

        const index =
            nextRecords
                .findIndex(
                    (
                        item
                    ) =>
                        item.id ===
                        id
                );

        if (
            index >= 0
        ) {

            nextRecords[
                index
            ] =
                record;

        } else {

            nextRecords.unshift(
                record
            );
        }

        localStorage.setItem(
            ACADEMIC_SETUP_STORAGE_KEY,
            JSON.stringify(
                nextRecords
            )
        );

        if (
            nextStatus ===
            "Active"
        ) {

            localStorage.setItem(
                ACTIVE_ACADEMIC_SETUP_KEY,
                id
            );
        }

        setAcademicSetups(
            nextRecords
        );

        setForm(
            record
        );

        setMessage(
            nextStatus ===
            "Active"
                ? "Academic Setup completed and activated. Programme Setup is now unlocked."
                : "Academic Setup saved as draft."
        );

        return true;
    }

    function handleAcademicSaveAndContinue() {

        const saved =
            saveAcademicSetup(
                "Active"
            );

        if (
            !saved
        ) {
            return;
        }

        /*
         * Whether this is a brand-new setup or an existing setup
         * opened through Edit, Save & Continue must always advance
         * to Programme Setup.
         *
         * Programme mapping is intentionally left blank so the user
         * explicitly selects which Academic Setup the programme belongs to.
         */
        setProgrammeForm(
            createEmptyProgrammeSetup()
        );

        setProgrammeFieldErrors(
            {}
        );

        setMessage(
            "Academic Setup saved. Select the Academic Setup mapping for Programme Setup."
        );

        setActiveStep(
            "programme"
        );

        window.scrollTo(
            {
                top: 0,
                behavior:
                    "smooth",
            }
        );
    }

    /* =====================================================
       PROGRAMME SETUP
    ===================================================== */

    const selectedProgrammeAcademicSetup =
        useMemo(
            () =>
                usableAcademicSetups.find(
                    (
                        record
                    ) =>
                        record.id ===
                        programmeForm.academicSetupId
                ) ??
                null,
            [
                usableAcademicSetups,
                programmeForm.academicSetupId,
            ]
        );

    const isAcademicContextSelected =
        Boolean(
            selectedProgrammeAcademicSetup
        );

    function handleProgrammeAcademicSetupChange(
        event:
            ChangeEvent<
                HTMLSelectElement
            >
    ) {

        const academicSetupId =
            event.target.value;

        const setup =
            usableAcademicSetups.find(
                (
                    item
                ) =>
                    item.id ===
                    academicSetupId
            ) ??
            null;

        setProgrammeFieldErrors(
            {}
        );

        setProgrammeForm(
            (
                current
            ) => ({
                ...createEmptyProgrammeSetup(),

                id:
                    current.id,
                programmeId:
                    current.programmeId,

                academicSetupId,

                facultySchool:
                    setup?.schoolName ||
                    "",
                department:
                    setup?.departmentName ||
                    "",

                termSystem:
                    setup?.termSystem ||
                    "",

                startAcademicYear:
                    setup?.academicYearName ||
                    "",

                defaultAcademicSession:
                    setup?.sessionName ||
                    "",

                creditSystem:
                    setup?.creditFramework ||
                    "",

                qualificationLevel:
                    setup?.qualificationFrameworkLevel ||
                    "",

                status:
                    current.status ||
                    "Draft",

                createdAt:
                    current.createdAt,
                updatedAt:
                    current.updatedAt,
            })
        );

        setMessage(
            setup
                ? "Academic Setup selected. Programme fields are now enabled."
                : "Select an Academic Setup context to enable Programme Setup."
        );
    }

    function handleProgrammeChange(
        event:
            ChangeEvent<
                HTMLInputElement |
                HTMLSelectElement
            >
    ) {

        const {
            name,
            value,
        } =
            event.target;

        setProgrammeForm(
            (
                current
            ) => {

                const next:
                    ProgrammeSetupRecord = {
                        ...current,
                        [name]:
                            value,
                    } as ProgrammeSetupRecord;

                if (
                    name ===
                        "programmeName" ||
                    name ===
                        "programmeShortName"
                ) {

                    next.programmeCode =
                        buildProgrammeCode(
                            name ===
                                "programmeShortName"
                                ? value
                                : next.programmeShortName,
                            name ===
                                "programmeName"
                                ? value
                                : next.programmeName
                        );
                }

                return next;
            }
        );

        if (
            name in
            programmeFieldErrors
        ) {

            setProgrammeFieldErrors(
                (
                    current
                ) => {

                    const next = {
                        ...current,
                    };

                    delete next[
                        name as keyof ProgrammeFieldErrors
                    ];

                    return next;
                }
            );
        }

        setMessage(
            ""
        );
    }

    function validateProgrammeSetup():
        boolean {

        const errors:
            ProgrammeFieldErrors = {};

        const required:
            Array<
                [
                    keyof ProgrammeFieldErrors,
                    string,
                    string
                ]
            > = [
                [
                    "academicSetupId",
                    programmeForm.academicSetupId,
                    "Academic Setup mapping is required.",
                ],
                [
                    "programmeName",
                    programmeForm.programmeName,
                    "Programme name is required.",
                ],
                [
                    "programmeShortName",
                    programmeForm.programmeShortName,
                    "Programme short name is required.",
                ],
                [
                    "programmeCode",
                    programmeForm.programmeCode,
                    "Programme code is required.",
                ],
                [
                    "programmeLevel",
                    programmeForm.programmeLevel,
                    "Programme level is required.",
                ],
                [
                    "programmeType",
                    programmeForm.programmeType,
                    "Programme type is required.",
                ],
                [
                    "durationValue",
                    programmeForm.durationValue,
                    "Duration is required.",
                ],
                [
                    "durationType",
                    programmeForm.durationType,
                    "Duration type is required.",
                ],
                [
                    "totalSemesters",
                    programmeForm.totalSemesters,
                    "Total academic periods are required.",
                ],
                [
                    "totalCredits",
                    programmeForm.totalCredits,
                    "Total programme credits are required.",
                ],
                [
                    "minimumCreditsRequired",
                    programmeForm.minimumCreditsRequired,
                    "Minimum credits are required.",
                ],
                [
                    "awardName",
                    programmeForm.awardName,
                    "Award / qualification name is required.",
                ],
                [
                    "qualificationType",
                    programmeForm.qualificationType,
                    "Qualification type is required.",
                ],
                [
                    "entryQualification",
                    programmeForm.entryQualification,
                    "Entry qualification is required.",
                ],
                [
                    "mediumOfInstruction",
                    programmeForm.mediumOfInstruction,
                    "Medium of instruction is required.",
                ],
                [
                    "deliveryMode",
                    programmeForm.deliveryMode,
                    "Delivery mode is required.",
                ],
                [
                    "outcomeFramework",
                    programmeForm.outcomeFramework,
                    "Outcome framework is required.",
                ],
            ];

        required.forEach(
            (
                [
                    key,
                    value,
                    errorMessage,
                ]
            ) => {

                if (
                    !String(
                        value
                    ).trim()
                ) {
                    errors[
                        key
                    ] =
                        errorMessage;
                }
            }
        );

        setProgrammeFieldErrors(
            errors
        );

        return (
            Object.keys(
                errors
            ).length ===
            0
        );
    }

    function saveProgrammeSetup(
        nextStatus:
            ProgrammeStatus
    ): boolean {

        if (
            !isAcademicContextSelected
        ) {

            setProgrammeFieldErrors(
                {
                    academicSetupId:
                        "Select a completed Academic Setup before continuing.",
                }
            );

            setMessage(
                "Select an Academic Setup context to enable and save Programme Setup."
            );

            return false;
        }

        if (
            !validateProgrammeSetup()
        ) {

            setMessage(
                "Complete the required Programme Setup fields before continuing."
            );

            return false;
        }

        const now =
            new Date()
                .toISOString();

        const id =
            programmeForm.id ||
            createProgrammeRecordId();

        const programmeId =
            programmeForm.programmeId ||
            createProgrammeId();

        const record:
            ProgrammeSetupRecord = {
                ...programmeForm,

                id,
                programmeId,

                schemaVersion:
                    ACADEMIC_CONFIGURATION_SCHEMA_VERSION,

                status:
                    nextStatus,

                createdAt:
                    programmeForm.createdAt ||
                    now,

                updatedAt:
                    now,
            };

        let nextRecords =
            [
                ...programmeRecords,
            ];

        if (
            nextStatus ===
            "Active"
        ) {

            nextRecords =
                nextRecords.map(
                    (
                        item
                    ) =>
                        item.status ===
                            "Active" &&
                        item.id !==
                            id
                            ? {
                                  ...item,
                                  status:
                                      "Locked",
                                  updatedAt:
                                      now,
                              }
                            : item
                );
        }

        const index =
            nextRecords.findIndex(
                (
                    item
                ) =>
                    item.id ===
                    id
            );

        if (
            index >= 0
        ) {

            nextRecords[
                index
            ] =
                record;

        } else {

            nextRecords.unshift(
                record
            );
        }

        localStorage.setItem(
            PROGRAMME_SETUP_STORAGE_KEY,
            JSON.stringify(
                nextRecords
            )
        );

        setProgrammeRecords(
            nextRecords
        );

        setProgrammeForm(
            record
        );

        setMessage(
            nextStatus ===
            "Active"
                ? "Programme Setup completed and activated. Curriculum Version is now unlocked."
                : "Programme Setup saved as draft."
        );

        return true;
    }

    function handleProgrammeSaveAndContinue() {

        const saved =
            saveProgrammeSetup(
                "Active"
            );

        if (
            !saved
        ) {
            return;
        }

        /*
         * Save & Continue must move forward for both newly-created
         * Programme records and existing records opened through Edit.
         */
        setCurriculumForm(
            createEmptyCurriculumVersion()
        );

        setCurriculumFieldErrors(
            {}
        );

        setMessage(
            "Programme Setup saved. Select the Programme mapping for Curriculum Version."
        );

        setActiveStep(
            "curriculum"
        );

        window.scrollTo(
            {
                top: 0,
                behavior:
                    "smooth",
            }
        );
    }

    function startNewAcademicSetup() {

        setForm(
            createEmptyAcademicSetup()
        );

        setFieldErrors(
            {}
        );

        setMessage(
            "New Academic Setup ready."
        );

        setActiveStep(
            "academic"
        );

        window.scrollTo(
            {
                top: 0,
                behavior:
                    "smooth",
            }
        );
    }

    function startNewProgrammeSetup() {

        setProgrammeForm(
            createEmptyProgrammeSetup()
        );

        setProgrammeFieldErrors(
            {}
        );

        setMessage(
            "Select the Academic Setup mapping for the new programme."
        );

        setActiveStep(
            "programme"
        );

        window.scrollTo(
            {
                top: 0,
                behavior:
                    "smooth",
            }
        );
    }

    /* =====================================================
       CURRICULUM VERSION
    ===================================================== */

    const selectedCurriculumProgramme =
        useMemo(
            () =>
                usableProgrammeRecords.find(
                    (
                        record
                    ) =>
                        record.id ===
                        curriculumForm.programmeId
                ) ??
                null,
            [
                usableProgrammeRecords,
                curriculumForm.programmeId,
            ]
        );

    const selectedCurriculumAcademicSetup =
        useMemo(
            () =>
                selectedCurriculumProgramme
                    ? academicSetups.find(
                          (
                              setup
                          ) =>
                              setup.id ===
                              selectedCurriculumProgramme.academicSetupId
                      ) ??
                      null
                    : null,
            [
                selectedCurriculumProgramme,
                academicSetups,
            ]
        );

    const isProgrammeSelectedForCurriculum =
        Boolean(
            selectedCurriculumProgramme
        );

    function handleCurriculumProgrammeChange(
        event:
            ChangeEvent<
                HTMLSelectElement
            >
    ) {

        const programmeId =
            event.target.value;

        const programme =
            usableProgrammeRecords.find(
                (
                    record
                ) =>
                    record.id ===
                    programmeId
            ) ??
            null;

        if (
            !programme
        ) {

            setCurriculumForm(
                createEmptyCurriculumVersion()
            );

            setCurriculumFieldErrors(
                {}
            );

            setMessage(
                "Select a completed Programme Setup to enable Curriculum Version fields."
            );

            return;
        }

        const academicSetup =
            academicSetups.find(
                (
                    setup
                ) =>
                    setup.id ===
                    programme.academicSetupId
            ) ??
            null;

        setCurriculumForm(
            (
                current
            ) => ({
                ...createEmptyCurriculumVersion(),

                id:
                    current.id,
                curriculumVersionId:
                    current.curriculumVersionId,

                programmeId:
                    programme.id,
                academicSetupId:
                    programme.academicSetupId,

                programmeName:
                    programme.programmeName,
                programmeCode:
                    programme.programmeCode,
                programmeLevel:
                    programme.programmeLevel,

                school:
                    programme.facultySchool,
                department:
                    programme.department,

                curriculumName:
                    `${programme.programmeName} Curriculum`,

                academicYearFrom:
                    programme.startAcademicYear ||
                    academicSetup?.academicYearName ||
                    "",

                applicableAdmissionBatch:
                    programme.currentApplicableBatch ||
                    "",

                applicableSession:
                    programme.defaultAcademicSession ||
                    academicSetup?.sessionName ||
                    "",

                programmeDuration:
                    `${programme.durationValue} ${programme.durationType}`
                        .trim(),

                academicStructure:
                    programme.termSystem,

                qualificationFramework:
                    academicSetup?.qualificationFramework ||
                    "",

                regulatoryFramework:
                    academicSetup?.regulatoryFramework ||
                    "",

                accreditationFramework:
                    academicSetup?.accreditationFramework ||
                    "",

                academicCalendar:
                    academicSetup?.academicCalendar ||
                    "",

                totalProgrammeCredits:
                    programme.totalCredits,

                totalAcademicPeriods:
                    programme.totalSemesters,

                creditSystem:
                    programme.creditSystem,

                minimumCreditsRequired:
                    programme.minimumCreditsRequired,

                maximumCreditsAllowed:
                    programme.maximumCreditsAllowed,

                status:
                    current.status ||
                    "Draft",

                createdAt:
                    current.createdAt,
                updatedAt:
                    current.updatedAt,
                approvedAt:
                    current.approvedAt,
            })
        );

        setCurriculumFieldErrors(
            {}
        );

        setMessage(
            "Programme selected. Curriculum Version fields are now enabled."
        );
    }

    function handleCurriculumChange(
        event:
            ChangeEvent<
                HTMLInputElement |
                HTMLSelectElement
            >
    ) {

        const {
            name,
            value,
        } =
            event.target;

        setCurriculumForm(
            (
                current
            ) => {

                const next:
                    CurriculumVersionRecord = {
                        ...current,
                        [name]:
                            value,
                    } as CurriculumVersionRecord;

                if (
                    name ===
                        "versionName" ||
                    name ===
                        "curriculumName"
                ) {

                    next.curriculumCode =
                        createCurriculumCode(
                            next.programmeCode,
                            next.versionName ||
                            next.curriculumName
                        );
                }

                if (
                    name ===
                    "migrationRequired"
                ) {

                    next.migrationStatus =
                        value ===
                        "Yes"
                            ? (
                                  next.migrationStatus ===
                                  "Not Required"
                                      ? "Planned"
                                      : next.migrationStatus
                              )
                            : "Not Required";
                }

                return next;
            }
        );

        if (
            name in
            curriculumFieldErrors
        ) {

            setCurriculumFieldErrors(
                (
                    current
                ) => {

                    const next = {
                        ...current,
                    };

                    delete next[
                        name as keyof CurriculumFieldErrors
                    ];

                    return next;
                }
            );
        }

        setMessage(
            ""
        );
    }

    function validateCurriculumVersion():
        boolean {

        const errors:
            CurriculumFieldErrors = {};

        const required:
            Array<
                [
                    keyof CurriculumFieldErrors,
                    string,
                    string
                ]
            > = [
                [
                    "programmeId",
                    curriculumForm.programmeId,
                    "Programme mapping is required.",
                ],
                [
                    "curriculumName",
                    curriculumForm.curriculumName,
                    "Curriculum name is required.",
                ],
                [
                    "academicYearFrom",
                    curriculumForm.academicYearFrom,
                    "Academic year is required.",
                ],
                [
                    "applicableAdmissionBatch",
                    curriculumForm.applicableAdmissionBatch,
                    "Applicable admission batch is required.",
                ],
                [
                    "applicableSession",
                    curriculumForm.applicableSession,
                    "Applicable session is required.",
                ],
                [
                    "versionName",
                    curriculumForm.versionName,
                    "Version name is required.",
                ],
                [
                    "effectiveFromDate",
                    curriculumForm.effectiveFromDate,
                    "Effective from date is required.",
                ],
                [
                    "changeType",
                    curriculumForm.changeType,
                    "Change type is required.",
                ],
                [
                    "changeSummary",
                    curriculumForm.changeSummary,
                    "Change summary is required.",
                ],
                [
                    "reasonForRevision",
                    curriculumForm.reasonForRevision,
                    "Reason / purpose is required.",
                ],
                [
                    "totalProgrammeCredits",
                    curriculumForm.totalProgrammeCredits,
                    "Total programme credits are required.",
                ],
                [
                    "totalAcademicPeriods",
                    curriculumForm.totalAcademicPeriods,
                    "Total academic periods are required.",
                ],
                [
                    "creditSystem",
                    curriculumForm.creditSystem,
                    "Credit system is required.",
                ],
                [
                    "gradingSystem",
                    curriculumForm.gradingSystem,
                    "Grading system is required.",
                ],
            ];

        required.forEach(
            (
                [
                    key,
                    value,
                    errorMessage,
                ]
            ) => {

                if (
                    !String(
                        value
                    ).trim()
                ) {

                    errors[
                        key
                    ] =
                        errorMessage;
                }
            }
        );

        setCurriculumFieldErrors(
            errors
        );

        return (
            Object.keys(
                errors
            ).length ===
            0
        );
    }

    function saveCurriculumVersion(
        nextStatus:
            CurriculumVersionStatus
    ): boolean {

        if (
            !isProgrammeSelectedForCurriculum
        ) {

            setCurriculumFieldErrors(
                {
                    programmeId:
                        "Select a completed Programme Setup before continuing.",
                }
            );

            setMessage(
                "Select a Programme Setup record to enable and save Curriculum Version."
            );

            return false;
        }

        if (
            !validateCurriculumVersion()
        ) {

            setMessage(
                "Complete the required Curriculum Version fields before continuing."
            );

            return false;
        }

        const now =
            new Date()
                .toISOString();

        const id =
            curriculumForm.id ||
            createCurriculumRecordId();

        const curriculumVersionId =
            curriculumForm.curriculumVersionId ||
            createCurriculumVersionId();

        const record:
            CurriculumVersionRecord = {
                ...curriculumForm,

                id,
                curriculumVersionId,

                schemaVersion:
                    ACADEMIC_CONFIGURATION_SCHEMA_VERSION,

                curriculumCode:
                    curriculumForm.curriculumCode ||
                    createCurriculumCode(
                        curriculumForm.programmeCode,
                        curriculumForm.versionName ||
                        curriculumForm.curriculumName
                    ),

                status:
                    nextStatus,

                approvalStatus:
                    nextStatus ===
                    "Active"
                        ? "Approved"
                        : curriculumForm.approvalStatus ||
                          "Draft",

                createdAt:
                    curriculumForm.createdAt ||
                    now,

                updatedAt:
                    now,

                approvedAt:
                    nextStatus ===
                    "Active"
                        ? curriculumForm.approvedAt ||
                          now
                        : curriculumForm.approvedAt,
            };

        let nextRecords =
            [
                ...curriculumRecords,
            ];

        if (
            nextStatus ===
            "Active"
        ) {

            nextRecords =
                nextRecords.map(
                    (
                        item
                    ) =>
                        item.programmeId ===
                            record.programmeId &&
                        item.id !==
                            record.id &&
                        item.status ===
                            "Active"
                            ? {
                                  ...item,
                                  status:
                                      "Locked",
                                  updatedAt:
                                      now,
                              }
                            : item
                );
        }

        const index =
            nextRecords.findIndex(
                (
                    item
                ) =>
                    item.id ===
                    record.id
            );

        if (
            index >=
            0
        ) {

            nextRecords[
                index
            ] =
                record;

        } else {

            nextRecords.unshift(
                record
            );
        }

        localStorage.setItem(
            CURRICULUM_VERSION_STORAGE_KEY,
            JSON.stringify(
                nextRecords
            )
        );

        setCurriculumRecords(
            nextRecords
        );

        setCurriculumForm(
            record
        );

        setMessage(
            nextStatus ===
            "Active"
                ? "Curriculum Version completed and activated. Academic Configuration is complete."
                : "Curriculum Version saved as draft."
        );

        return true;
    }

    function handleCurriculumComplete() {

        saveCurriculumVersion(
            "Active"
        );
    }

    function startNewCurriculumVersion() {

        setCurriculumForm(
            createEmptyCurriculumVersion()
        );

        setCurriculumFieldErrors(
            {}
        );

        setMessage(
            "Select the Programme mapping for the new Curriculum Version."
        );

        setActiveStep(
            "curriculum"
        );

        window.scrollTo(
            {
                top: 0,
                behavior:
                    "smooth",
            }
        );
    }

    /* =====================================================
       STEP NAVIGATION
    ===================================================== */

    function openStep(
        step:
            ConfigurationStep
    ) {

        if (
            step ===
            "academic"
        ) {

            setActiveStep(
                "academic"
            );

            return;
        }

        if (
            step ===
            "programme"
        ) {

            if (
                !canOpenProgramme
            ) {

                setMessage(
                    "Complete and activate Academic Setup before opening Programme Setup."
                );

                return;
            }

            setActiveStep(
                "programme"
            );

            return;
        }

        if (
            !canOpenCurriculum
        ) {

            setMessage(
                "Complete Programme Setup before opening Curriculum Version."
            );

            return;
        }

        setActiveStep(
            "curriculum"
        );
    }

    /* =====================================================
       ERROR
    ===================================================== */

    if (
        error
    ) {

        return (
            <div
                className={
                    layoutStyles.page
                }
            >

                <aside
                    className={
                        layoutStyles.sidebar
                    }
                >
                    <Sidebar
                        activeItem="academic-configuration"
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
                        layoutStyles.main
                    }
                >

                    <CourseHeader />

                    <div
                        className={
                            layoutStyles.stateArea
                        }
                    >
                        <div
                            className={
                                layoutStyles.errorCard
                            }
                        >
                            <div
                                className={
                                    layoutStyles.errorIcon
                                }
                            >
                                !
                            </div>

                            <div
                                className={
                                    layoutStyles.stateContent
                                }
                            >
                                <h1>
                                    Unable to Load
                                </h1>

                                <p>
                                    {error}
                                </p>
                            </div>
                        </div>
                    </div>

                </main>
            </div>
        );
    }

    /* =====================================================
       LOADING
    ===================================================== */

    if (
        !user
    ) {

        return (
            <div
                className={
                    layoutStyles.page
                }
            >

                <aside
                    className={
                        layoutStyles.sidebar
                    }
                >
                    <Sidebar
                        activeItem="academic-configuration"
                    />
                </aside>

                <main
                    className={
                        layoutStyles.main
                    }
                >

                    <CourseHeader />

                    <div
                        className={
                            layoutStyles.stateArea
                        }
                    >
                        <div
                            className={
                                layoutStyles.loadingCard
                            }
                        >
                            <div
                                className={
                                    layoutStyles.spinner
                                }
                            />

                            <div
                                className={
                                    layoutStyles.stateContent
                                }
                            >
                                <h2>
                                    Loading Academic Configuration
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
       PAGE
    ===================================================== */

    return (
        <div
            className={
                layoutStyles.page
            }
        >

            {/* =================================================
                COURSE MANAGEMENT SIDEBAR
            ================================================= */}

            <aside
                className={
                    layoutStyles.sidebar
                }
            >

                <Sidebar
                    activeItem="academic-configuration"
                    tenant={
                        user.tenant
                    }
                    role={
                        user.role
                    }
                />

            </aside>

            {/* =================================================
                MAIN
            ================================================= */}

            <main
                className={
                    layoutStyles.main
                }
            >

                <CourseHeader />

                <div
                    className={
                        layoutStyles.content
                    }
                >

                    {/* =========================================
                        BREADCRUMBS
                    ========================================== */}

                    <nav
                        className={
                            layoutStyles.breadcrumbs
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
                            Academic Configuration
                        </strong>

                    </nav>

                    {/* =========================================
                        PAGE HEADER
                    ========================================== */}

                    <header
                        className={
                            layoutStyles.pageHeader
                        }
                    >

                        <div
                            className={
                                layoutStyles.titleBlock
                            }
                        >

                            <span
                                className={
                                    layoutStyles.eyebrow
                                }
                            >
                                UNIVERSITY / COLLEGE
                            </span>

                            <h1>
                                Academic Configuration
                            </h1>

                            <p>
                                Create reusable academic, programme and curriculum master data for course creation and bulk upload.
                            </p>

                        </div>

                    </header>

                    {/* =========================================
                        TOP CONFIGURATION STEPS
                    ========================================== */}

                    <section
                        className={
                            styles.stepper
                        }
                    >

                        <StepButton
                            number="1"
                            title="Academic Setup"
                            subtitle={
                                academicComplete
                                    ? "Completed"
                                    : "Required first"
                            }
                            active={
                                activeStep ===
                                "academic"
                            }
                            complete={
                                academicComplete
                            }
                            locked={
                                false
                            }
                            onClick={() =>
                                openStep(
                                    "academic"
                                )
                            }
                        />

                        <StepButton
                            number="2"
                            title="Programme Setup"
                            subtitle={
                                !canOpenProgramme
                                    ? "Locked"
                                    : programmeComplete
                                        ? "Completed"
                                        : "Ready"
                            }
                            active={
                                activeStep ===
                                "programme"
                            }
                            complete={
                                programmeComplete
                            }
                            locked={
                                !canOpenProgramme
                            }
                            onClick={() =>
                                openStep(
                                    "programme"
                                )
                            }
                        />

                        <StepButton
                            number="3"
                            title="Curriculum Version"
                            subtitle={
                                !canOpenCurriculum
                                    ? "Locked"
                                    : "Ready"
                            }
                            active={
                                activeStep ===
                                "curriculum"
                            }
                            complete={
                                curriculumComplete
                            }
                            locked={
                                !canOpenCurriculum
                            }
                            onClick={() =>
                                openStep(
                                    "curriculum"
                                )
                            }
                        />

                    </section>

                    {message && (
                        <div
                            className={
                                styles.message
                            }
                            role="status"
                        >
                            {message}
                        </div>
                    )}

                    {/* =========================================
                        STEP 1
                    ========================================== */}

                    {activeStep ===
                        "academic" && (

                        <>
                            <section
                                className={
                                    styles.card
                                }
                            >

                                <div
                                    className={
                                        styles.cardHeader
                                    }
                                >

                                    <div>
                                        <span
                                            className={
                                                styles.sectionIndex
                                            }
                                        >
                                            STEP 1
                                        </span>

                                        <h2>
                                            Academic Setup
                                        </h2>

                                        <p>
                                            Define the institution's reusable academic context and choose frameworks according to its country or jurisdiction.
                                        </p>
                                    </div>

                                    <span
                                        className={`${styles.statusBadge} ${
                                            form.status ===
                                            "Active"
                                                ? styles.statusActive
                                                : styles.statusDraft
                                        }`}
                                    >
                                        {
                                            form.status
                                        }
                                    </span>

                                </div>

                                {/* =================================
                                    A. ACADEMIC CONTEXT
                                ================================== */}

                                <FormSection
                                    title="A. Academic Context"
                                    description="Define the academic year, session and organizational context."
                                >

                                    <FieldSelect
                                        label="Country / Jurisdiction"
                                        name="countryOrJurisdiction"
                                        value={
                                            form.countryOrJurisdiction
                                        }
                                        options={
                                            countryOrJurisdictionOptions
                                        }
                                        required
                                        error={
                                            fieldErrors.countryOrJurisdiction
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    />

                                    <FieldSelect
                                        label="Academic Year"
                                        name="academicYearName"
                                        value={
                                            form.academicYearName
                                        }
                                        options={
                                            academicYearOptions
                                        }
                                        required
                                        error={
                                            fieldErrors.academicYearName
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    />

                                    <FieldInput
                                        label="Academic Year Code"
                                        name="academicYearCode"
                                        value={
                                            form.academicYearCode
                                        }
                                        readOnly
                                        onChange={
                                            handleChange
                                        }
                                    />

                                    <FieldSelect
                                        label="Academic Session"
                                        name="sessionName"
                                        value={
                                            form.sessionName
                                        }
                                        options={
                                            sessionOptions
                                        }
                                        required
                                        error={
                                            fieldErrors.sessionName
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    />

                                    <FieldInput
                                        label="Session Code"
                                        name="sessionCode"
                                        value={
                                            form.sessionCode
                                        }
                                        readOnly
                                        onChange={
                                            handleChange
                                        }
                                    />

                                    <FieldSelect
                                        label="School / Faculty"
                                        name="schoolName"
                                        value={
                                            form.schoolName
                                        }
                                        options={[
                                            "",
                                            ...Object.keys(
                                                schoolDepartmentMap
                                            ),
                                        ]}
                                        required
                                        error={
                                            fieldErrors.schoolName
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    />

                                    <FieldSelect
                                        label="Department"
                                        name="departmentName"
                                        value={
                                            form.departmentName
                                        }
                                        options={[
                                            "",
                                            ...departmentOptions,
                                        ]}
                                        required
                                        disabled={
                                            !form.schoolName
                                        }
                                        error={
                                            fieldErrors.departmentName
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    />

                                </FormSection>

                                {/* =================================
                                    B. ACADEMIC PERIOD
                                ================================== */}

                                <FormSection
                                    title="B. Academic Period Structure"
                                    description="Define how the institution organizes semesters, trimesters, quarters or other academic periods."
                                >

                                    <FieldSelect
                                        label="Term System"
                                        name="termSystem"
                                        value={
                                            form.termSystem
                                        }
                                        options={
                                            termSystemOptions
                                        }
                                        required
                                        error={
                                            fieldErrors.termSystem
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    />

                                    <FieldSelect
                                        label="Academic Period"
                                        name="academicPeriodName"
                                        value={
                                            form.academicPeriodName
                                        }
                                        options={
                                            academicPeriodOptions
                                        }
                                        required
                                        error={
                                            fieldErrors.academicPeriodName
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    />

                                    <FieldSelect
                                        label="Academic Period Number"
                                        name="academicPeriodNumber"
                                        value={
                                            form.academicPeriodNumber
                                        }
                                        options={
                                            academicPeriodNumberOptions
                                        }
                                        required
                                        error={
                                            fieldErrors.academicPeriodNumber
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    />

                                    <FieldSelect
                                        label="Academic Calendar"
                                        name="academicCalendar"
                                        value={
                                            form.academicCalendar
                                        }
                                        options={
                                            academicCalendarOptions
                                        }
                                        required
                                        error={
                                            fieldErrors.academicCalendar
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    />

                                </FormSection>

                                {/* =================================
                                    C. GLOBAL FRAMEWORKS
                                ================================== */}

                                <FormSection
                                    title="C. Qualification & Credit Framework"
                                    description="Framework options are filtered by the selected country or jurisdiction."
                                >

                                    <FieldSelect
                                        label="Qualification Framework"
                                        name="qualificationFramework"
                                        value={
                                            form.qualificationFramework
                                        }
                                        options={
                                            qualificationFrameworkOptions
                                        }
                                        required
                                        disabled={
                                            !form.countryOrJurisdiction
                                        }
                                        error={
                                            fieldErrors.qualificationFramework
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    />

                                    <FieldInput
                                        label="Qualification Framework Level"
                                        name="qualificationFrameworkLevel"
                                        value={
                                            form.qualificationFrameworkLevel
                                        }
                                        placeholder="Example: Level 6, Level 7, Bachelor level"
                                        onChange={
                                            handleChange
                                        }
                                    />

                                    {isCustomQualification && (
                                        <FieldInput
                                            label="Custom Qualification Framework"
                                            name="customQualificationFramework"
                                            value={
                                                form.customQualificationFramework
                                            }
                                            placeholder="Enter institution / national framework"
                                            onChange={
                                                handleChange
                                            }
                                        />
                                    )}

                                    <FieldSelect
                                        label="Credit Framework"
                                        name="creditFramework"
                                        value={
                                            form.creditFramework
                                        }
                                        options={
                                            creditFrameworkOptions
                                        }
                                        required
                                        disabled={
                                            !form.countryOrJurisdiction
                                        }
                                        error={
                                            fieldErrors.creditFramework
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    />

                                    {isCustomCredit && (
                                        <FieldInput
                                            label="Custom Credit Framework"
                                            name="customCreditFramework"
                                            value={
                                                form.customCreditFramework
                                            }
                                            placeholder="Enter the institution-defined credit model"
                                            onChange={
                                                handleChange
                                            }
                                        />
                                    )}

                                </FormSection>

                                {/* =================================
                                    D. REGULATION + ACCREDITATION
                                ================================== */}

                                <FormSection
                                    title="D. Regulatory & Accreditation Context"
                                    description="Capture the external or institutional quality and regulatory context applicable to this academic setup."
                                >

                                    <FieldSelect
                                        label="Regulatory Framework"
                                        name="regulatoryFramework"
                                        value={
                                            form.regulatoryFramework
                                        }
                                        options={
                                            regulatoryFrameworkOptions
                                        }
                                        disabled={
                                            !form.countryOrJurisdiction
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    />

                                    {isCustomRegulatory && (
                                        <FieldInput
                                            label="Custom Regulatory Framework"
                                            name="customRegulatoryFramework"
                                            value={
                                                form.customRegulatoryFramework
                                            }
                                            placeholder="Enter regulatory authority / framework"
                                            onChange={
                                                handleChange
                                            }
                                        />
                                    )}

                                    <FieldSelect
                                        label="Accreditation / Quality Framework"
                                        name="accreditationFramework"
                                        value={
                                            form.accreditationFramework
                                        }
                                        options={
                                            accreditationFrameworkOptions
                                        }
                                        disabled={
                                            !form.countryOrJurisdiction
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    />

                                </FormSection>

                                <div
                                    className={
                                        styles.actions
                                    }
                                >

                                    <button
                                        type="button"
                                        className={
                                            styles.secondaryButton
                                        }
                                        onClick={
                                            startNewAcademicSetup
                                        }
                                    >
                                        New Academic Setup
                                    </button>

                                    <button
                                        type="button"
                                        className={
                                            styles.secondaryButton
                                        }
                                        onClick={() =>
                                            saveAcademicSetup(
                                                "Draft"
                                            )
                                        }
                                    >
                                        Save Draft
                                    </button>

                                    <button
                                        type="button"
                                        className={
                                            styles.primaryButton
                                        }
                                        onClick={
                                            handleAcademicSaveAndContinue
                                        }
                                    >
                                        Save & Continue
                                    </button>

                                </div>

                            </section>

                            {/* =============================
                                RECORDS
                            ============================== */}

                            <section
                                className={
                                    styles.recordsCard
                                }
                            >

                                <div
                                    className={
                                        styles.recordsHeader
                                    }
                                >

                                    <div>
                                        <h3>
                                            Academic Setup Records
                                        </h3>

                                        <span>
                                            {
                                                academicSetups.length
                                            }{" "}
                                            record
                                            {
                                                academicSetups.length ===
                                                1
                                                    ? ""
                                                    : "s"
                                            }
                                        </span>
                                    </div>

                                </div>

                                {academicSetups.length ===
                                0 ? (

                                    <div
                                        className={
                                            styles.emptyState
                                        }
                                    >
                                        No Academic Setup records have been created yet.
                                    </div>

                                ) : (

                                    <div
                                        className={
                                            styles.tableWrap
                                        }
                                    >

                                        <table
                                            className={
                                                styles.table
                                            }
                                        >

                                            <thead>
                                                <tr>
                                                    <th>
                                                        Country
                                                    </th>
                                                    <th>
                                                        Academic Year
                                                    </th>
                                                    <th>
                                                        Session
                                                    </th>
                                                    <th>
                                                        School
                                                    </th>
                                                    <th>
                                                        Department
                                                    </th>
                                                    <th>
                                                        Framework
                                                    </th>
                                                    <th>
                                                        Status
                                                    </th>
                                                    <th>
                                                        Action
                                                    </th>
                                                </tr>
                                            </thead>

                                            <tbody>

                                                {academicSetups.map(
                                                    (
                                                        record
                                                    ) => (

                                                        <tr
                                                            key={
                                                                record.id
                                                            }
                                                        >

                                                            <td>
                                                                {
                                                                    record.countryOrJurisdiction
                                                                }
                                                            </td>

                                                            <td>
                                                                {
                                                                    record.academicYearName
                                                                }
                                                            </td>

                                                            <td>
                                                                {
                                                                    record.sessionName
                                                                }
                                                            </td>

                                                            <td>
                                                                {
                                                                    record.schoolName
                                                                }
                                                            </td>

                                                            <td>
                                                                {
                                                                    record.departmentName
                                                                }
                                                            </td>

                                                            <td>
                                                                {
                                                                    record.qualificationFramework
                                                                }
                                                            </td>

                                                            <td>
                                                                <span
                                                                    className={`${styles.statusBadge} ${
                                                                        record.status ===
                                                                        "Active"
                                                                            ? styles.statusActive
                                                                            : styles.statusDraft
                                                                    }`}
                                                                >
                                                                    {
                                                                        record.status
                                                                    }
                                                                </span>
                                                            </td>

                                                            <td>
                                                                <button
                                                                    type="button"
                                                                    className={
                                                                        styles.tableButton
                                                                    }
                                                                    onClick={() => {

                                                                        setForm(
                                                                            record
                                                                        );

                                                                        setActiveStep(
                                                                            "academic"
                                                                        );

                                                                        setMessage(
                                                                            "Editing selected Academic Setup. Save & Continue will open Programme Setup."
                                                                        );

                                                                        window.scrollTo(
                                                                            {
                                                                                top: 0,
                                                                                behavior:
                                                                                    "smooth",
                                                                            }
                                                                        );
                                                                    }}
                                                                >
                                                                    Edit
                                                                </button>
                                                            </td>

                                                        </tr>
                                                    )
                                                )}

                                            </tbody>

                                        </table>

                                    </div>
                                )}

                            </section>
                        </>
                    )}

                    {/* =========================================
                        STEP 2 — PROGRAMME SETUP
                    ========================================== */}

                    {activeStep ===
                        "programme" && (

                        <>
                            <section
                                className={
                                    styles.card
                                }
                            >

                                <div
                                    className={
                                        styles.cardHeader
                                    }
                                >

                                    <div>
                                        <span
                                            className={
                                                styles.sectionIndex
                                            }
                                        >
                                            STEP 2
                                        </span>

                                        <h2>
                                            Programme Setup
                                        </h2>

                                        <p>
                                            First select which completed Academic Setup this programme belongs to. The remaining programme fields stay disabled until an Academic Setup mapping is selected.
                                        </p>
                                    </div>

                                    <span
                                        className={`${styles.statusBadge} ${
                                            programmeForm.status ===
                                            "Active"
                                                ? styles.statusActive
                                                : styles.statusDraft
                                        }`}
                                    >
                                        {
                                            programmeForm.status
                                        }
                                    </span>

                                </div>

                                <FormSection
                                    title="A. Academic Setup Mapping"
                                    description="Select one of the Academic Setup records created in Step 1. Academic context is inherited automatically."
                                >

                                    <ProgrammeSelect
                                        label="Academic Setup Context"
                                        name="academicSetupId"
                                        value={
                                            programmeForm.academicSetupId
                                        }
                                        options={
                                            usableAcademicSetups.map(
                                                (
                                                    setup
                                                ) => ({
                                                    value:
                                                        setup.id,
                                                    label:
                                                        `${setup.academicYearName || "Academic Year"} · ${setup.sessionName || "Session"} · ${setup.schoolName || "School"} · ${setup.departmentName || "Department"} · ${setup.status}`,
                                                })
                                            )
                                        }
                                        required
                                        error={
                                            programmeFieldErrors.academicSetupId
                                        }
                                        onChange={
                                            handleProgrammeAcademicSetupChange
                                        }
                                    />

                                    <ProgrammeInput
                                        label="Inherited Academic Context"
                                        name="startAcademicYear"
                                        value={
                                            selectedProgrammeAcademicSetup
                                                ? `${selectedProgrammeAcademicSetup.academicYearName} · ${selectedProgrammeAcademicSetup.sessionName} · ${selectedProgrammeAcademicSetup.academicPeriodName}`
                                                : "Select an Academic Setup context"
                                        }
                                        readOnly
                                        onChange={
                                            handleProgrammeChange
                                        }
                                    />

                                    <ProgrammeInput
                                        label="Inherited School / Faculty"
                                        name="facultySchool"
                                        value={
                                            programmeForm.facultySchool
                                        }
                                        readOnly
                                        onChange={
                                            handleProgrammeChange
                                        }
                                    />

                                    <ProgrammeInput
                                        label="Inherited Department"
                                        name="department"
                                        value={
                                            programmeForm.department
                                        }
                                        readOnly
                                        onChange={
                                            handleProgrammeChange
                                        }
                                    />

                                    <ProgrammeInput
                                        label="Inherited Term System"
                                        name="termSystem"
                                        value={
                                            programmeForm.termSystem
                                        }
                                        readOnly
                                        onChange={
                                            handleProgrammeChange
                                        }
                                    />

                                    <ProgrammeInput
                                        label="Inherited Credit Framework"
                                        name="creditSystem"
                                        value={
                                            programmeForm.creditSystem
                                        }
                                        readOnly
                                        onChange={
                                            handleProgrammeChange
                                        }
                                    />

                                </FormSection>

                                {!isAcademicContextSelected && (
                                    <div
                                        className={
                                            styles.message
                                        }
                                    >
                                        Select an Academic Setup context above to enable the remaining Programme Setup fields.
                                    </div>
                                )}

                                <fieldset
                                    disabled={
                                        !isAcademicContextSelected
                                    }
                                    style={{
                                        border:
                                            0,
                                        padding:
                                            0,
                                        margin:
                                            0,
                                        minWidth:
                                            0,
                                    }}
                                >

                                    <FormSection
                                        title="B. Programme Identity"
                                        description="Create the programme master that Curriculum Version and Course Creation will reuse."
                                    >

                                        <ProgrammeInput
                                            label="Programme Name"
                                            name="programmeName"
                                            value={
                                                programmeForm.programmeName
                                            }
                                            required
                                            placeholder="Example: Bachelor of Technology in Computer Science"
                                            error={
                                                programmeFieldErrors.programmeName
                                            }
                                            onChange={
                                                handleProgrammeChange
                                            }
                                        />

                                        <ProgrammeInput
                                            label="Programme Short Name"
                                            name="programmeShortName"
                                            value={
                                                programmeForm.programmeShortName
                                            }
                                            required
                                            placeholder="Example: B.Tech CSE"
                                            error={
                                                programmeFieldErrors.programmeShortName
                                            }
                                            onChange={
                                                handleProgrammeChange
                                            }
                                        />

                                        <ProgrammeInput
                                            label="Programme Code"
                                            name="programmeCode"
                                            value={
                                                programmeForm.programmeCode
                                            }
                                            required
                                            readOnly
                                            error={
                                                programmeFieldErrors.programmeCode
                                            }
                                            onChange={
                                                handleProgrammeChange
                                            }
                                        />

                                        <ProgrammeInput
                                            label="Programme Description"
                                            name="programmeDescription"
                                            value={
                                                programmeForm.programmeDescription
                                            }
                                            placeholder="Short description of the programme"
                                            onChange={
                                                handleProgrammeChange
                                            }
                                        />

                                        <ProgrammeSelect
                                            label="Programme Level"
                                            name="programmeLevel"
                                            value={
                                                programmeForm.programmeLevel
                                            }
                                            options={
                                                programmeLevelOptions
                                                    .filter(
                                                        Boolean
                                                    )
                                                    .map(
                                                        (
                                                            option
                                                        ) => ({
                                                            value:
                                                                option,
                                                            label:
                                                                option,
                                                        })
                                                    )
                                            }
                                            required
                                            error={
                                                programmeFieldErrors.programmeLevel
                                            }
                                            onChange={
                                                handleProgrammeChange
                                            }
                                        />

                                        <ProgrammeSelect
                                            label="Programme Type"
                                            name="programmeType"
                                            value={
                                                programmeForm.programmeType
                                            }
                                            options={
                                                programmeTypeOptions
                                                    .filter(
                                                        Boolean
                                                    )
                                                    .map(
                                                        (
                                                            option
                                                        ) => ({
                                                            value:
                                                                option,
                                                            label:
                                                                option,
                                                        })
                                                    )
                                            }
                                            required
                                            error={
                                                programmeFieldErrors.programmeType
                                            }
                                            onChange={
                                                handleProgrammeChange
                                            }
                                        />

                                        <ProgrammeSelect
                                            label="Programme Mode"
                                            name="programmeMode"
                                            value={
                                                programmeForm.programmeMode
                                            }
                                            options={
                                                programmeModeOptions
                                                    .filter(
                                                        Boolean
                                                    )
                                                    .map(
                                                        (
                                                            option
                                                        ) => ({
                                                            value:
                                                                option,
                                                            label:
                                                                option,
                                                        })
                                                    )
                                            }
                                            onChange={
                                                handleProgrammeChange
                                            }
                                        />

                                    </FormSection>

                                    <FormSection
                                        title="C. Duration & Academic Structure"
                                        description="Define programme duration and applicable academic context."
                                    >

                                        <ProgrammeInput
                                            label="Duration Value"
                                            name="durationValue"
                                            value={
                                                programmeForm.durationValue
                                            }
                                            required
                                            placeholder="Example: 4"
                                            error={
                                                programmeFieldErrors.durationValue
                                            }
                                            onChange={
                                                handleProgrammeChange
                                            }
                                        />

                                        <ProgrammeSelect
                                            label="Duration Type"
                                            name="durationType"
                                            value={
                                                programmeForm.durationType
                                            }
                                            options={
                                                durationTypeOptions
                                                    .filter(
                                                        Boolean
                                                    )
                                                    .map(
                                                        (
                                                            option
                                                        ) => ({
                                                            value:
                                                                option,
                                                            label:
                                                                option,
                                                        })
                                                    )
                                            }
                                            required
                                            error={
                                                programmeFieldErrors.durationType
                                            }
                                            onChange={
                                                handleProgrammeChange
                                            }
                                        />

                                        <ProgrammeInput
                                            label="Total Academic Periods"
                                            name="totalSemesters"
                                            value={
                                                programmeForm.totalSemesters
                                            }
                                            required
                                            placeholder="Example: 8"
                                            error={
                                                programmeFieldErrors.totalSemesters
                                            }
                                            onChange={
                                                handleProgrammeChange
                                            }
                                        />

                                        <ProgrammeInput
                                            label="Applicable Admission Batch"
                                            name="currentApplicableBatch"
                                            value={
                                                programmeForm.currentApplicableBatch
                                            }
                                            placeholder="Example: 2026 Admission Batch"
                                            onChange={
                                                handleProgrammeChange
                                            }
                                        />

                                        <ProgrammeInput
                                            label="Start Academic Year"
                                            name="startAcademicYear"
                                            value={
                                                programmeForm.startAcademicYear
                                            }
                                            readOnly
                                            onChange={
                                                handleProgrammeChange
                                            }
                                        />

                                        <ProgrammeInput
                                            label="Default Academic Session"
                                            name="defaultAcademicSession"
                                            value={
                                                programmeForm.defaultAcademicSession
                                            }
                                            readOnly
                                            onChange={
                                                handleProgrammeChange
                                            }
                                        />

                                    </FormSection>

                                    <FormSection
                                        title="D. Credit & Qualification Requirements"
                                        description="Set programme credits and the qualification awarded on completion."
                                    >

                                        <ProgrammeInput
                                            label="Total Programme Credits"
                                            name="totalCredits"
                                            value={
                                                programmeForm.totalCredits
                                            }
                                            required
                                            placeholder="Example: 160"
                                            error={
                                                programmeFieldErrors.totalCredits
                                            }
                                            onChange={
                                                handleProgrammeChange
                                            }
                                        />

                                        <ProgrammeInput
                                            label="Minimum Credits Required"
                                            name="minimumCreditsRequired"
                                            value={
                                                programmeForm.minimumCreditsRequired
                                            }
                                            required
                                            placeholder="Example: 160"
                                            error={
                                                programmeFieldErrors.minimumCreditsRequired
                                            }
                                            onChange={
                                                handleProgrammeChange
                                            }
                                        />

                                        <ProgrammeInput
                                            label="Maximum Credits Allowed"
                                            name="maximumCreditsAllowed"
                                            value={
                                                programmeForm.maximumCreditsAllowed
                                            }
                                            placeholder="Optional"
                                            onChange={
                                                handleProgrammeChange
                                            }
                                        />

                                        <ProgrammeInput
                                            label="Credit System"
                                            name="creditSystem"
                                            value={
                                                programmeForm.creditSystem
                                            }
                                            readOnly
                                            onChange={
                                                handleProgrammeChange
                                            }
                                        />

                                        <ProgrammeInput
                                            label="Award / Qualification Name"
                                            name="awardName"
                                            value={
                                                programmeForm.awardName
                                            }
                                            required
                                            placeholder="Example: Bachelor of Technology"
                                            error={
                                                programmeFieldErrors.awardName
                                            }
                                            onChange={
                                                handleProgrammeChange
                                            }
                                        />

                                        <ProgrammeInput
                                            label="Qualification Level"
                                            name="qualificationLevel"
                                            value={
                                                programmeForm.qualificationLevel
                                            }
                                            placeholder="Example: Level 6 / Bachelor level"
                                            onChange={
                                                handleProgrammeChange
                                            }
                                        />

                                        <ProgrammeSelect
                                            label="Qualification Type"
                                            name="qualificationType"
                                            value={
                                                programmeForm.qualificationType
                                            }
                                            options={
                                                qualificationTypeOptions
                                                    .filter(
                                                        Boolean
                                                    )
                                                    .map(
                                                        (
                                                            option
                                                        ) => ({
                                                            value:
                                                                option,
                                                            label:
                                                                option,
                                                        })
                                                    )
                                            }
                                            required
                                            error={
                                                programmeFieldErrors.qualificationType
                                            }
                                            onChange={
                                                handleProgrammeChange
                                            }
                                        />

                                    </FormSection>

                                    <FormSection
                                        title="E. Admission & Delivery"
                                        description="Define entry requirements, delivery method and programme ownership."
                                    >

                                        <ProgrammeInput
                                            label="Entry Qualification"
                                            name="entryQualification"
                                            value={
                                                programmeForm.entryQualification
                                            }
                                            required
                                            placeholder="Example: Upper secondary / Grade 12 / equivalent"
                                            error={
                                                programmeFieldErrors.entryQualification
                                            }
                                            onChange={
                                                handleProgrammeChange
                                            }
                                        />

                                        <ProgrammeSelect
                                            label="Admission Mode"
                                            name="admissionMode"
                                            value={
                                                programmeForm.admissionMode
                                            }
                                            options={
                                                admissionModeOptions
                                                    .filter(
                                                        Boolean
                                                    )
                                                    .map(
                                                        (
                                                            option
                                                        ) => ({
                                                            value:
                                                                option,
                                                            label:
                                                                option,
                                                        })
                                                    )
                                            }
                                            onChange={
                                                handleProgrammeChange
                                            }
                                        />

                                        <ProgrammeSelect
                                            label="Medium of Instruction"
                                            name="mediumOfInstruction"
                                            value={
                                                programmeForm.mediumOfInstruction
                                            }
                                            options={
                                                mediumOptions
                                                    .filter(
                                                        Boolean
                                                    )
                                                    .map(
                                                        (
                                                            option
                                                        ) => ({
                                                            value:
                                                                option,
                                                            label:
                                                                option,
                                                        })
                                                    )
                                            }
                                            required
                                            error={
                                                programmeFieldErrors.mediumOfInstruction
                                            }
                                            onChange={
                                                handleProgrammeChange
                                            }
                                        />

                                        <ProgrammeSelect
                                            label="Delivery Mode"
                                            name="deliveryMode"
                                            value={
                                                programmeForm.deliveryMode
                                            }
                                            options={
                                                deliveryModeOptions
                                                    .filter(
                                                        Boolean
                                                    )
                                                    .map(
                                                        (
                                                            option
                                                        ) => ({
                                                            value:
                                                                option,
                                                            label:
                                                                option,
                                                        })
                                                    )
                                            }
                                            required
                                            error={
                                                programmeFieldErrors.deliveryMode
                                            }
                                            onChange={
                                                handleProgrammeChange
                                            }
                                        />

                                        <ProgrammeInput
                                            label="Programme Owner"
                                            name="programmeOwner"
                                            value={
                                                programmeForm.programmeOwner
                                            }
                                            placeholder="School / Dean / Head"
                                            onChange={
                                                handleProgrammeChange
                                            }
                                        />

                                        <ProgrammeInput
                                            label="Programme Coordinator"
                                            name="programmeCoordinator"
                                            value={
                                                programmeForm.programmeCoordinator
                                            }
                                            placeholder="Coordinator name / role"
                                            onChange={
                                                handleProgrammeChange
                                            }
                                        />

                                    </FormSection>

                                    <FormSection
                                        title="F. Programme Outcome Framework"
                                        description="Define programme-level outcomes that Course Outcomes will map to later."
                                    >

                                        <ProgrammeSelect
                                            label="Outcome Framework"
                                            name="outcomeFramework"
                                            value={
                                                programmeForm.outcomeFramework
                                            }
                                            options={
                                                outcomeFrameworkOptions
                                                    .filter(
                                                        Boolean
                                                    )
                                                    .map(
                                                        (
                                                            option
                                                        ) => ({
                                                            value:
                                                                option,
                                                            label:
                                                                option,
                                                        })
                                                    )
                                            }
                                            required
                                            error={
                                                programmeFieldErrors.outcomeFramework
                                            }
                                            onChange={
                                                handleProgrammeChange
                                            }
                                        />

                                        <ProgrammeInput
                                            label="Programme Outcomes (PO / Graduate Outcomes)"
                                            name="programmeOutcomes"
                                            value={
                                                programmeForm.programmeOutcomes
                                            }
                                            placeholder="Separate outcomes with semicolons"
                                            onChange={
                                                handleProgrammeChange
                                            }
                                        />

                                        <ProgrammeInput
                                            label="Programme Specific Outcomes (PSO)"
                                            name="programmeSpecificOutcomes"
                                            value={
                                                programmeForm.programmeSpecificOutcomes
                                            }
                                            placeholder="Optional; separate outcomes with semicolons"
                                            onChange={
                                                handleProgrammeChange
                                            }
                                        />

                                        <ProgrammeInput
                                            label="Graduate Attributes"
                                            name="graduateAttributes"
                                            value={
                                                programmeForm.graduateAttributes
                                            }
                                            placeholder="Optional; separate attributes with semicolons"
                                            onChange={
                                                handleProgrammeChange
                                            }
                                        />

                                        <ProgrammeInput
                                            label="Skills / Competencies"
                                            name="skillsCompetencies"
                                            value={
                                                programmeForm.skillsCompetencies
                                            }
                                            placeholder="Optional; separate competencies with semicolons"
                                            onChange={
                                                handleProgrammeChange
                                            }
                                        />

                                    </FormSection>

                                </fieldset>

                                <div
                                    className={
                                        styles.actions
                                    }
                                >

                                    <button
                                        type="button"
                                        className={
                                            styles.secondaryButton
                                        }
                                        onClick={
                                            startNewProgrammeSetup
                                        }
                                    >
                                        New Programme
                                    </button>

                                    <button
                                        type="button"
                                        className={
                                            styles.secondaryButton
                                        }
                                        disabled={
                                            !isAcademicContextSelected
                                        }
                                        onClick={() =>
                                            saveProgrammeSetup(
                                                "Draft"
                                            )
                                        }
                                    >
                                        Save Draft
                                    </button>

                                    <button
                                        type="button"
                                        className={
                                            styles.primaryButton
                                        }
                                        disabled={
                                            !isAcademicContextSelected
                                        }
                                        onClick={
                                            handleProgrammeSaveAndContinue
                                        }
                                    >
                                        Save & Continue
                                    </button>

                                </div>

                            </section>

                            <section
                                className={
                                    styles.recordsCard
                                }
                            >

                                <div
                                    className={
                                        styles.recordsHeader
                                    }
                                >
                                    <div>
                                        <h3>
                                            Programme Setup Records
                                        </h3>

                                        <span>
                                            {
                                                programmeRecords.length
                                            }{" "}
                                            record
                                            {
                                                programmeRecords.length ===
                                                1
                                                    ? ""
                                                    : "s"
                                            }
                                        </span>
                                    </div>
                                </div>

                                {programmeRecords.length ===
                                0 ? (
                                    <div
                                        className={
                                            styles.emptyState
                                        }
                                    >
                                        No Programme Setup records have been created yet.
                                    </div>
                                ) : (
                                    <div
                                        className={
                                            styles.tableWrap
                                        }
                                    >
                                        <table
                                            className={
                                                styles.table
                                            }
                                        >
                                            <thead>
                                                <tr>
                                                    <th>Programme</th>
                                                    <th>Code</th>
                                                    <th>Academic Mapping</th>
                                                    <th>Level</th>
                                                    <th>Department</th>
                                                    <th>Credits</th>
                                                    <th>Status</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {programmeRecords.map(
                                                    (
                                                        record
                                                    ) => {
                                                        const mappedAcademic =
                                                            academicSetups.find(
                                                                (
                                                                    setup
                                                                ) =>
                                                                    setup.id ===
                                                                    record.academicSetupId
                                                            );

                                                        return (
                                                            <tr
                                                                key={
                                                                    record.id
                                                                }
                                                            >
                                                                <td>
                                                                    {
                                                                        record.programmeName
                                                                    }
                                                                </td>
                                                                <td>
                                                                    {
                                                                        record.programmeCode
                                                                    }
                                                                </td>
                                                                <td>
                                                                    {
                                                                        mappedAcademic
                                                                            ? `${mappedAcademic.academicYearName} · ${mappedAcademic.sessionName}`
                                                                            : "Academic mapping unavailable"
                                                                    }
                                                                </td>
                                                                <td>
                                                                    {
                                                                        record.programmeLevel
                                                                    }
                                                                </td>
                                                                <td>
                                                                    {
                                                                        record.department
                                                                    }
                                                                </td>
                                                                <td>
                                                                    {
                                                                        record.totalCredits
                                                                    }
                                                                </td>
                                                                <td>
                                                                    <span
                                                                        className={`${styles.statusBadge} ${
                                                                            record.status ===
                                                                            "Active"
                                                                                ? styles.statusActive
                                                                                : styles.statusDraft
                                                                        }`}
                                                                    >
                                                                        {
                                                                            record.status
                                                                        }
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    <button
                                                                        type="button"
                                                                        className={
                                                                            styles.tableButton
                                                                        }
                                                                        onClick={() => {
                                                                            setProgrammeForm(
                                                                                record
                                                                            );
                                                                            setProgrammeFieldErrors(
                                                                                {}
                                                                            );
                                                                            setActiveStep(
                                                                                "programme"
                                                                            );
                                                                            setMessage(
                                                                                "Editing selected Programme Setup. Save & Continue will open Curriculum Version."
                                                                            );
                                                                            window.scrollTo(
                                                                                {
                                                                                    top: 0,
                                                                                    behavior:
                                                                                        "smooth",
                                                                                }
                                                                            );
                                                                        }}
                                                                    >
                                                                        Edit
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    }
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                            </section>
                        </>
                    )}

                    {/* =========================================
                        STEP 3 — CURRICULUM VERSION
                    ========================================== */}

                    {activeStep ===
                        "curriculum" && (

                        <>
                            <section
                                className={
                                    styles.card
                                }
                            >

                                <div
                                    className={
                                        styles.cardHeader
                                    }
                                >

                                    <div>
                                        <span
                                            className={
                                                styles.sectionIndex
                                            }
                                        >
                                            STEP 3
                                        </span>

                                        <h2>
                                            Curriculum Version
                                        </h2>

                                        <p>
                                            Select a completed Programme Setup first. The programme and academic context are inherited automatically, and the remaining curriculum fields stay disabled until the mapping is selected.
                                        </p>
                                    </div>

                                    <span
                                        className={`${styles.statusBadge} ${
                                            curriculumForm.status ===
                                            "Active"
                                                ? styles.statusActive
                                                : styles.statusDraft
                                        }`}
                                    >
                                        {
                                            curriculumForm.status
                                        }
                                    </span>

                                </div>

                                <FormSection
                                    title="A. Programme Mapping"
                                    description="Select the completed Programme Setup to which this curriculum version belongs."
                                >

                                    <CurriculumSelect
                                        label="Programme Setup"
                                        name="programmeId"
                                        value={
                                            curriculumForm.programmeId
                                        }
                                        options={
                                            usableProgrammeRecords.map(
                                                (
                                                    programme
                                                ) => ({
                                                    value:
                                                        programme.id,
                                                    label:
                                                        `${programme.programmeName || "Programme"} · ${programme.programmeCode || "Code"} · ${programme.programmeLevel || "Level"} · ${programme.status}`,
                                                })
                                            )
                                        }
                                        required
                                        error={
                                            curriculumFieldErrors.programmeId
                                        }
                                        onChange={
                                            handleCurriculumProgrammeChange
                                        }
                                    />

                                    <CurriculumInput
                                        label="Programme Code"
                                        name="programmeCode"
                                        value={
                                            curriculumForm.programmeCode
                                        }
                                        readOnly
                                        onChange={
                                            handleCurriculumChange
                                        }
                                    />

                                    <CurriculumInput
                                        label="Programme Level"
                                        name="programmeLevel"
                                        value={
                                            curriculumForm.programmeLevel
                                        }
                                        readOnly
                                        onChange={
                                            handleCurriculumChange
                                        }
                                    />

                                    <CurriculumInput
                                        label="School / Faculty"
                                        name="school"
                                        value={
                                            curriculumForm.school
                                        }
                                        readOnly
                                        onChange={
                                            handleCurriculumChange
                                        }
                                    />

                                    <CurriculumInput
                                        label="Department"
                                        name="department"
                                        value={
                                            curriculumForm.department
                                        }
                                        readOnly
                                        onChange={
                                            handleCurriculumChange
                                        }
                                    />

                                    <CurriculumInput
                                        label="Inherited Academic Setup"
                                        name="academicSetupId"
                                        value={
                                            selectedCurriculumAcademicSetup
                                                ? `${selectedCurriculumAcademicSetup.academicYearName} · ${selectedCurriculumAcademicSetup.sessionName} · ${selectedCurriculumAcademicSetup.academicPeriodName}`
                                                : "Select a Programme Setup"
                                        }
                                        readOnly
                                        onChange={
                                            handleCurriculumChange
                                        }
                                    />

                                </FormSection>

                                {!isProgrammeSelectedForCurriculum && (
                                    <div
                                        className={
                                            styles.message
                                        }
                                    >
                                        Select a Programme Setup record above to enable the remaining Curriculum Version fields.
                                    </div>
                                )}

                                <fieldset
                                    disabled={
                                        !isProgrammeSelectedForCurriculum
                                    }
                                    style={{
                                        border:
                                            0,
                                        padding:
                                            0,
                                        margin:
                                            0,
                                        minWidth:
                                            0,
                                    }}
                                >

                                    <FormSection
                                        title="B. Curriculum & Version Identity"
                                        description="Create the curriculum master/version identity for the selected programme."
                                    >

                                        <CurriculumInput
                                            label="Curriculum Name"
                                            name="curriculumName"
                                            value={
                                                curriculumForm.curriculumName
                                            }
                                            required
                                            error={
                                                curriculumFieldErrors.curriculumName
                                            }
                                            placeholder="Example: B.Tech CSE 2026 Curriculum"
                                            onChange={
                                                handleCurriculumChange
                                            }
                                        />

                                        <CurriculumInput
                                            label="Curriculum Code"
                                            name="curriculumCode"
                                            value={
                                                curriculumForm.curriculumCode
                                            }
                                            readOnly
                                            onChange={
                                                handleCurriculumChange
                                            }
                                        />

                                        <CurriculumInput
                                            label="Version Name"
                                            name="versionName"
                                            value={
                                                curriculumForm.versionName
                                            }
                                            required
                                            error={
                                                curriculumFieldErrors.versionName
                                            }
                                            placeholder="Example: Curriculum Version 1"
                                            onChange={
                                                handleCurriculumChange
                                            }
                                        />

                                        <CurriculumInput
                                            label="Version Label"
                                            name="versionLabel"
                                            value={
                                                curriculumForm.versionLabel
                                            }
                                            placeholder="Example: Regulation 2026"
                                            onChange={
                                                handleCurriculumChange
                                            }
                                        />

                                        <CurriculumInput
                                            label="Regulation Name / Code"
                                            name="regulationName"
                                            value={
                                                curriculumForm.regulationName
                                            }
                                            placeholder="Example: R2026"
                                            onChange={
                                                handleCurriculumChange
                                            }
                                        />

                                        <CurriculumInput
                                            label="Syllabus Version"
                                            name="syllabusVersion"
                                            value={
                                                curriculumForm.syllabusVersion
                                            }
                                            placeholder="Example: Syllabus V1"
                                            onChange={
                                                handleCurriculumChange
                                            }
                                        />

                                        <CurriculumInput
                                            label="Version Description"
                                            name="versionDescription"
                                            value={
                                                curriculumForm.versionDescription
                                            }
                                            placeholder="Describe this curriculum version"
                                            onChange={
                                                handleCurriculumChange
                                            }
                                        />

                                    </FormSection>

                                    <FormSection
                                        title="C. Applicability & Effective Period"
                                        description="Define the admission batch, academic session and validity period for this curriculum version."
                                    >

                                        <CurriculumInput
                                            label="Academic Year From"
                                            name="academicYearFrom"
                                            value={
                                                curriculumForm.academicYearFrom
                                            }
                                            required
                                            error={
                                                curriculumFieldErrors.academicYearFrom
                                            }
                                            onChange={
                                                handleCurriculumChange
                                            }
                                        />

                                        <CurriculumInput
                                            label="Academic Year To"
                                            name="academicYearTo"
                                            value={
                                                curriculumForm.academicYearTo
                                            }
                                            placeholder="Optional"
                                            onChange={
                                                handleCurriculumChange
                                            }
                                        />

                                        <CurriculumInput
                                            label="Applicable Admission Batch"
                                            name="applicableAdmissionBatch"
                                            value={
                                                curriculumForm.applicableAdmissionBatch
                                            }
                                            required
                                            error={
                                                curriculumFieldErrors.applicableAdmissionBatch
                                            }
                                            placeholder="Example: 2026 Admission Batch"
                                            onChange={
                                                handleCurriculumChange
                                            }
                                        />

                                        <CurriculumInput
                                            label="Applicable Session"
                                            name="applicableSession"
                                            value={
                                                curriculumForm.applicableSession
                                            }
                                            required
                                            error={
                                                curriculumFieldErrors.applicableSession
                                            }
                                            onChange={
                                                handleCurriculumChange
                                            }
                                        />

                                        <CurriculumInput
                                            label="Effective From Date"
                                            name="effectiveFromDate"
                                            value={
                                                curriculumForm.effectiveFromDate
                                            }
                                            type="date"
                                            required
                                            error={
                                                curriculumFieldErrors.effectiveFromDate
                                            }
                                            onChange={
                                                handleCurriculumChange
                                            }
                                        />

                                        <CurriculumInput
                                            label="Effective To Date"
                                            name="effectiveToDate"
                                            value={
                                                curriculumForm.effectiveToDate
                                            }
                                            type="date"
                                            onChange={
                                                handleCurriculumChange
                                            }
                                        />

                                    </FormSection>

                                    <FormSection
                                        title="D. Revision & Change Control"
                                        description="Record why the version exists and what academic areas are affected."
                                    >

                                        <CurriculumSelect
                                            label="Change Type"
                                            name="changeType"
                                            value={
                                                curriculumForm.changeType
                                            }
                                            options={
                                                curriculumChangeTypeOptions
                                                    .filter(
                                                        Boolean
                                                    )
                                                    .map(
                                                        (
                                                            option
                                                        ) => ({
                                                            value:
                                                                option,
                                                            label:
                                                                option,
                                                        })
                                                    )
                                            }
                                            required
                                            error={
                                                curriculumFieldErrors.changeType
                                            }
                                            onChange={
                                                handleCurriculumChange
                                            }
                                        />

                                        <CurriculumSelect
                                            label="Impact Area"
                                            name="impactArea"
                                            value={
                                                curriculumForm.impactArea
                                            }
                                            options={
                                                curriculumImpactAreaOptions
                                                    .filter(
                                                        Boolean
                                                    )
                                                    .map(
                                                        (
                                                            option
                                                        ) => ({
                                                            value:
                                                                option,
                                                            label:
                                                                option,
                                                        })
                                                    )
                                            }
                                            onChange={
                                                handleCurriculumChange
                                            }
                                        />

                                        <CurriculumInput
                                            label="Affected Academic Periods"
                                            name="affectedAcademicPeriods"
                                            value={
                                                curriculumForm.affectedAcademicPeriods
                                            }
                                            placeholder="Example: Semesters III to VI"
                                            onChange={
                                                handleCurriculumChange
                                            }
                                        />

                                        <CurriculumInput
                                            label="Change Summary"
                                            name="changeSummary"
                                            value={
                                                curriculumForm.changeSummary
                                            }
                                            required
                                            error={
                                                curriculumFieldErrors.changeSummary
                                            }
                                            placeholder="Summarize the changes introduced"
                                            onChange={
                                                handleCurriculumChange
                                            }
                                        />

                                        <CurriculumInput
                                            label="Reason / Purpose"
                                            name="reasonForRevision"
                                            value={
                                                curriculumForm.reasonForRevision
                                            }
                                            required
                                            error={
                                                curriculumFieldErrors.reasonForRevision
                                            }
                                            placeholder="Reason for new curriculum or revision"
                                            onChange={
                                                handleCurriculumChange
                                            }
                                        />

                                        <CurriculumInput
                                            label="Revision Notes"
                                            name="revisionNotes"
                                            value={
                                                curriculumForm.revisionNotes
                                            }
                                            placeholder="Optional notes"
                                            onChange={
                                                handleCurriculumChange
                                            }
                                        />

                                        <CurriculumInput
                                            label="Previous Version"
                                            name="previousVersion"
                                            value={
                                                curriculumForm.previousVersion
                                            }
                                            placeholder="Optional previous version ID / label"
                                            onChange={
                                                handleCurriculumChange
                                            }
                                        />

                                        <CurriculumSelect
                                            label="Migration Required"
                                            name="migrationRequired"
                                            value={
                                                curriculumForm.migrationRequired
                                            }
                                            options={
                                                yesNoOptions
                                                    .filter(
                                                        Boolean
                                                    )
                                                    .map(
                                                        (
                                                            option
                                                        ) => ({
                                                            value:
                                                                option,
                                                            label:
                                                                option,
                                                        })
                                                    )
                                            }
                                            onChange={
                                                handleCurriculumChange
                                            }
                                        />

                                        <CurriculumSelect
                                            label="Migration Status"
                                            name="migrationStatus"
                                            value={
                                                curriculumForm.migrationStatus
                                            }
                                            disabled={
                                                curriculumForm.migrationRequired !==
                                                "Yes"
                                            }
                                            options={
                                                migrationStatusOptions
                                                    .filter(
                                                        Boolean
                                                    )
                                                    .map(
                                                        (
                                                            option
                                                        ) => ({
                                                            value:
                                                                option,
                                                            label:
                                                                option,
                                                        })
                                                    )
                                            }
                                            onChange={
                                                handleCurriculumChange
                                            }
                                        />

                                    </FormSection>

                                    <FormSection
                                        title="E. Inherited Academic & Programme Framework"
                                        description="These values come from the selected Programme and its Academic Setup."
                                    >

                                        <CurriculumInput
                                            label="Programme Duration"
                                            name="programmeDuration"
                                            value={
                                                curriculumForm.programmeDuration
                                            }
                                            readOnly
                                            onChange={
                                                handleCurriculumChange
                                            }
                                        />

                                        <CurriculumInput
                                            label="Academic Structure"
                                            name="academicStructure"
                                            value={
                                                curriculumForm.academicStructure
                                            }
                                            readOnly
                                            onChange={
                                                handleCurriculumChange
                                            }
                                        />

                                        <CurriculumInput
                                            label="Qualification Framework"
                                            name="qualificationFramework"
                                            value={
                                                curriculumForm.qualificationFramework
                                            }
                                            readOnly
                                            onChange={
                                                handleCurriculumChange
                                            }
                                        />

                                        <CurriculumInput
                                            label="Regulatory Framework"
                                            name="regulatoryFramework"
                                            value={
                                                curriculumForm.regulatoryFramework
                                            }
                                            readOnly
                                            onChange={
                                                handleCurriculumChange
                                            }
                                        />

                                        <CurriculumInput
                                            label="Accreditation / Quality Framework"
                                            name="accreditationFramework"
                                            value={
                                                curriculumForm.accreditationFramework
                                            }
                                            readOnly
                                            onChange={
                                                handleCurriculumChange
                                            }
                                        />

                                        <CurriculumInput
                                            label="Academic Calendar"
                                            name="academicCalendar"
                                            value={
                                                curriculumForm.academicCalendar
                                            }
                                            readOnly
                                            onChange={
                                                handleCurriculumChange
                                            }
                                        />

                                    </FormSection>

                                    <FormSection
                                        title="F. Credits & Grading"
                                        description="Programme credit values are inherited; define the grading system used by this curriculum."
                                    >

                                        <CurriculumInput
                                            label="Total Programme Credits"
                                            name="totalProgrammeCredits"
                                            value={
                                                curriculumForm.totalProgrammeCredits
                                            }
                                            required
                                            readOnly
                                            error={
                                                curriculumFieldErrors.totalProgrammeCredits
                                            }
                                            onChange={
                                                handleCurriculumChange
                                            }
                                        />

                                        <CurriculumInput
                                            label="Total Academic Periods"
                                            name="totalAcademicPeriods"
                                            value={
                                                curriculumForm.totalAcademicPeriods
                                            }
                                            required
                                            readOnly
                                            error={
                                                curriculumFieldErrors.totalAcademicPeriods
                                            }
                                            onChange={
                                                handleCurriculumChange
                                            }
                                        />

                                        <CurriculumInput
                                            label="Credit System"
                                            name="creditSystem"
                                            value={
                                                curriculumForm.creditSystem
                                            }
                                            required
                                            readOnly
                                            error={
                                                curriculumFieldErrors.creditSystem
                                            }
                                            onChange={
                                                handleCurriculumChange
                                            }
                                        />

                                        <CurriculumInput
                                            label="Minimum Credits Required"
                                            name="minimumCreditsRequired"
                                            value={
                                                curriculumForm.minimumCreditsRequired
                                            }
                                            readOnly
                                            onChange={
                                                handleCurriculumChange
                                            }
                                        />

                                        <CurriculumInput
                                            label="Maximum Credits Allowed"
                                            name="maximumCreditsAllowed"
                                            value={
                                                curriculumForm.maximumCreditsAllowed
                                            }
                                            readOnly
                                            onChange={
                                                handleCurriculumChange
                                            }
                                        />

                                        <CurriculumSelect
                                            label="Grading System"
                                            name="gradingSystem"
                                            value={
                                                curriculumForm.gradingSystem
                                            }
                                            options={
                                                gradingSystemOptions
                                                    .filter(
                                                        Boolean
                                                    )
                                                    .map(
                                                        (
                                                            option
                                                        ) => ({
                                                            value:
                                                                option,
                                                            label:
                                                                option,
                                                        })
                                                    )
                                            }
                                            required
                                            error={
                                                curriculumFieldErrors.gradingSystem
                                            }
                                            onChange={
                                                handleCurriculumChange
                                            }
                                        />

                                    </FormSection>

                                    <FormSection
                                        title="G. Approval Reference"
                                        description="Capture optional approval references for audit and governance."
                                    >

                                        <CurriculumInput
                                            label="Approval Status"
                                            name="approvalStatus"
                                            value={
                                                curriculumForm.approvalStatus
                                            }
                                            readOnly
                                            onChange={
                                                handleCurriculumChange
                                            }
                                        />

                                        <CurriculumInput
                                            label="Approval Reference Number"
                                            name="approvalReferenceNumber"
                                            value={
                                                curriculumForm.approvalReferenceNumber
                                            }
                                            placeholder="Optional approval / committee reference"
                                            onChange={
                                                handleCurriculumChange
                                            }
                                        />

                                    </FormSection>

                                </fieldset>

                                <div
                                    className={
                                        styles.actions
                                    }
                                >

                                    <button
                                        type="button"
                                        className={
                                            styles.secondaryButton
                                        }
                                        onClick={
                                            startNewCurriculumVersion
                                        }
                                    >
                                        New Curriculum Version
                                    </button>

                                    <button
                                        type="button"
                                        className={
                                            styles.secondaryButton
                                        }
                                        disabled={
                                            !isProgrammeSelectedForCurriculum
                                        }
                                        onClick={() =>
                                            saveCurriculumVersion(
                                                "Draft"
                                            )
                                        }
                                    >
                                        Save Draft
                                    </button>

                                    <button
                                        type="button"
                                        className={
                                            styles.primaryButton
                                        }
                                        disabled={
                                            !isProgrammeSelectedForCurriculum
                                        }
                                        onClick={
                                            handleCurriculumComplete
                                        }
                                    >
                                        Complete Academic Configuration
                                    </button>

                                </div>

                            </section>

                            <section
                                className={
                                    styles.recordsCard
                                }
                            >

                                <div
                                    className={
                                        styles.recordsHeader
                                    }
                                >
                                    <div>
                                        <h3>
                                            Curriculum Version Records
                                        </h3>

                                        <span>
                                            {
                                                curriculumRecords.length
                                            }{" "}
                                            record
                                            {
                                                curriculumRecords.length ===
                                                1
                                                    ? ""
                                                    : "s"
                                            }
                                        </span>
                                    </div>
                                </div>

                                {curriculumRecords.length ===
                                0 ? (
                                    <div
                                        className={
                                            styles.emptyState
                                        }
                                    >
                                        No Curriculum Version records have been created yet.
                                    </div>
                                ) : (
                                    <div
                                        className={
                                            styles.tableWrap
                                        }
                                    >
                                        <table
                                            className={
                                                styles.table
                                            }
                                        >
                                            <thead>
                                                <tr>
                                                    <th>Curriculum</th>
                                                    <th>Programme</th>
                                                    <th>Version</th>
                                                    <th>Regulation</th>
                                                    <th>Batch / Session</th>
                                                    <th>Credits</th>
                                                    <th>Status</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {curriculumRecords.map(
                                                    (
                                                        record
                                                    ) => (
                                                        <tr
                                                            key={
                                                                record.id
                                                            }
                                                        >
                                                            <td>
                                                                {
                                                                    record.curriculumName
                                                                }
                                                            </td>
                                                            <td>
                                                                {
                                                                    record.programmeName
                                                                }
                                                            </td>
                                                            <td>
                                                                {
                                                                    record.versionName
                                                                }
                                                            </td>
                                                            <td>
                                                                {
                                                                    record.regulationName ||
                                                                    "-"
                                                                }
                                                            </td>
                                                            <td>
                                                                {
                                                                    `${record.applicableAdmissionBatch || "-"} · ${record.applicableSession || "-"}`
                                                                }
                                                            </td>
                                                            <td>
                                                                {
                                                                    record.totalProgrammeCredits
                                                                }
                                                            </td>
                                                            <td>
                                                                <span
                                                                    className={`${styles.statusBadge} ${
                                                                        record.status ===
                                                                        "Active"
                                                                            ? styles.statusActive
                                                                            : styles.statusDraft
                                                                    }`}
                                                                >
                                                                    {
                                                                        record.status
                                                                    }
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <button
                                                                    type="button"
                                                                    className={
                                                                        styles.tableButton
                                                                    }
                                                                    onClick={() => {
                                                                        setCurriculumForm(
                                                                            record
                                                                        );
                                                                        setCurriculumFieldErrors(
                                                                            {}
                                                                        );
                                                                        setActiveStep(
                                                                            "curriculum"
                                                                        );
                                                                        setMessage(
                                                                            "Editing selected Curriculum Version."
                                                                        );
                                                                        window.scrollTo(
                                                                            {
                                                                                top: 0,
                                                                                behavior:
                                                                                    "smooth",
                                                                            }
                                                                        );
                                                                    }}
                                                                >
                                                                    Edit
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    )
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                            </section>
                        </>
                    )}

                </div>

            </main>

        </div>
    );
}

/* =========================================================
   FORM SECTION
========================================================= */

function FormSection({
    title,
    description,
    children,
}: {
    title: string;
    description: string;
    children:
        React.ReactNode;
}) {

    return (
        <section
            className={
                styles.formSection
            }
        >

            <div
                className={
                    styles.formSectionHeader
                }
            >
                <h3>
                    {title}
                </h3>

                <p>
                    {description}
                </p>
            </div>

            <div
                className={
                    styles.formGrid
                }
            >
                {children}
            </div>

        </section>
    );
}

/* =========================================================
   STEP BUTTON
========================================================= */

function StepButton({
    number,
    title,
    subtitle,
    active,
    complete,
    locked,
    onClick,
}: {
    number: string;
    title: string;
    subtitle: string;
    active: boolean;
    complete: boolean;
    locked: boolean;
    onClick: () => void;
}) {

    return (
        <button
            type="button"
            className={`${styles.stepButton} ${
                active
                    ? styles.stepActive
                    : ""
            } ${
                locked
                    ? styles.stepLocked
                    : ""
            }`}
            aria-disabled={
                locked
            }
            onClick={
                onClick
            }
        >

            <span
                className={
                    styles.stepNumber
                }
            >
                {number}
            </span>

            <span
                className={
                    styles.stepText
                }
            >
                <strong>
                    {title}
                </strong>

                <small>
                    {subtitle}
                </small>
            </span>

            {complete && (
                <b
                    className={
                        styles.completeMark
                    }
                >
                    ✓
                </b>
            )}

            {locked && (
                <b
                    className={
                        styles.lockMark
                    }
                >
                    🔒
                </b>
            )}

        </button>
    );
}

/* =========================================================
   FIELD INPUT
========================================================= */

type FieldInputProps = {
    label: string;
    name:
        keyof AcademicSetupRecord;
    value: string;
    required?: boolean;
    readOnly?: boolean;
    placeholder?: string;
    error?: string;
    onChange:
        (
            event:
                ChangeEvent<
                    HTMLInputElement
                >
        ) => void;
};

function FieldInput({
    label,
    name,
    value,
    required = false,
    readOnly = false,
    placeholder,
    error,
    onChange,
}: FieldInputProps) {

    return (
        <label
            className={
                styles.field
            }
        >

            <span>
                {label}

                {required && (
                    <b>
                        *
                    </b>
                )}
            </span>

            <input
                type="text"
                name={
                    name
                }
                value={
                    value
                }
                readOnly={
                    readOnly
                }
                placeholder={
                    placeholder
                }
                onChange={
                    onChange
                }
            />

            {error && (
                <small
                    className={
                        styles.fieldError
                    }
                >
                    {error}
                </small>
            )}

        </label>
    );
}

/* =========================================================
   FIELD SELECT
========================================================= */

type FieldSelectProps = {
    label: string;
    name:
        keyof AcademicSetupRecord;
    value: string;
    options: string[];
    required?: boolean;
    disabled?: boolean;
    error?: string;
    onChange:
        (
            event:
                ChangeEvent<
                    HTMLSelectElement
                >
        ) => void;
};

function FieldSelect({
    label,
    name,
    value,
    options,
    required = false,
    disabled = false,
    error,
    onChange,
}: FieldSelectProps) {

    return (
        <label
            className={
                styles.field
            }
        >

            <span>
                {label}

                {required && (
                    <b>
                        *
                    </b>
                )}
            </span>

            <select
                name={
                    name
                }
                value={
                    value
                }
                disabled={
                    disabled
                }
                onChange={
                    onChange
                }
            >

                {options.map(
                    (
                        option
                    ) => (

                        <option
                            key={
                                option ||
                                "__empty"
                            }
                            value={
                                option
                            }
                        >
                            {
                                option ||
                                "Select"
                            }
                        </option>
                    )
                )}

            </select>

            {error && (
                <small
                    className={
                        styles.fieldError
                    }
                >
                    {error}
                </small>
            )}

        </label>
    );
}


/* =========================================================
   PROGRAMME FIELD COMPONENTS
========================================================= */

type ProgrammeInputProps = {
    label: string;
    name:
        keyof ProgrammeSetupRecord;
    value: string;
    required?: boolean;
    readOnly?: boolean;
    placeholder?: string;
    error?: string;
    onChange:
        (
            event:
                ChangeEvent<
                    HTMLInputElement
                >
        ) => void;
};

function ProgrammeInput({
    label,
    name,
    value,
    required = false,
    readOnly = false,
    placeholder,
    error,
    onChange,
}: ProgrammeInputProps) {

    return (
        <label
            className={
                styles.field
            }
        >
            <span>
                {label}

                {required && (
                    <b>
                        *
                    </b>
                )}
            </span>

            <input
                type="text"
                name={
                    name
                }
                value={
                    value
                }
                readOnly={
                    readOnly
                }
                placeholder={
                    placeholder
                }
                onChange={
                    onChange
                }
            />

            {error && (
                <small
                    className={
                        styles.fieldError
                    }
                >
                    {error}
                </small>
            )}
        </label>
    );
}

type ProgrammeSelectProps = {
    label: string;
    name:
        keyof ProgrammeSetupRecord;
    value: string;
    options: Array<{
        value: string;
        label: string;
    }>;
    required?: boolean;
    disabled?: boolean;
    error?: string;
    onChange:
        (
            event:
                ChangeEvent<
                    HTMLSelectElement
                >
        ) => void;
};

function ProgrammeSelect({
    label,
    name,
    value,
    options,
    required = false,
    disabled = false,
    error,
    onChange,
}: ProgrammeSelectProps) {

    return (
        <label
            className={
                styles.field
            }
        >
            <span>
                {label}

                {required && (
                    <b>
                        *
                    </b>
                )}
            </span>

            <select
                name={
                    name
                }
                value={
                    value
                }
                disabled={
                    disabled
                }
                onChange={
                    onChange
                }
            >
                <option
                    value=""
                >
                    Select
                </option>

                {options.map(
                    (
                        option
                    ) => (
                        <option
                            key={
                                option.value
                            }
                            value={
                                option.value
                            }
                        >
                            {
                                option.label
                            }
                        </option>
                    )
                )}
            </select>

            {error && (
                <small
                    className={
                        styles.fieldError
                    }
                >
                    {error}
                </small>
            )}
        </label>
    );
}


/* =========================================================
   CURRICULUM FIELD COMPONENTS
========================================================= */

type CurriculumInputProps = {
    label: string;
    name:
        keyof CurriculumVersionRecord;
    value: string;
    type?: string;
    required?: boolean;
    readOnly?: boolean;
    placeholder?: string;
    error?: string;
    onChange:
        (
            event:
                ChangeEvent<
                    HTMLInputElement
                >
        ) => void;
};

function CurriculumInput({
    label,
    name,
    value,
    type = "text",
    required = false,
    readOnly = false,
    placeholder,
    error,
    onChange,
}: CurriculumInputProps) {

    return (
        <label
            className={
                styles.field
            }
        >
            <span>
                {label}

                {required && (
                    <b>
                        *
                    </b>
                )}
            </span>

            <input
                type={
                    type
                }
                name={
                    name
                }
                value={
                    value
                }
                readOnly={
                    readOnly
                }
                placeholder={
                    placeholder
                }
                onChange={
                    onChange
                }
            />

            {error && (
                <small
                    className={
                        styles.fieldError
                    }
                >
                    {error}
                </small>
            )}
        </label>
    );
}

type CurriculumSelectProps = {
    label: string;
    name:
        keyof CurriculumVersionRecord;
    value: string;
    options: Array<{
        value: string;
        label: string;
    }>;
    required?: boolean;
    disabled?: boolean;
    error?: string;
    onChange:
        (
            event:
                ChangeEvent<
                    HTMLSelectElement
                >
        ) => void;
};

function CurriculumSelect({
    label,
    name,
    value,
    options,
    required = false,
    disabled = false,
    error,
    onChange,
}: CurriculumSelectProps) {

    return (
        <label
            className={
                styles.field
            }
        >
            <span>
                {label}

                {required && (
                    <b>
                        *
                    </b>
                )}
            </span>

            <select
                name={
                    name
                }
                value={
                    value
                }
                disabled={
                    disabled
                }
                onChange={
                    onChange
                }
            >
                <option
                    value=""
                >
                    Select
                </option>

                {options.map(
                    (
                        option
                    ) => (
                        <option
                            key={
                                option.value
                            }
                            value={
                                option.value
                            }
                        >
                            {
                                option.label
                            }
                        </option>
                    )
                )}
            </select>

            {error && (
                <small
                    className={
                        styles.fieldError
                    }
                >
                    {error}
                </small>
            )}
        </label>
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
            tenant ||
            "",
            role ||
            ""
        );

    return (
        <div
            className={
                layoutStyles.sidebarInner
            }
        >

            <div
                className={
                    layoutStyles.brand
                }
            >

                <div
                    className={
                        layoutStyles.brandIcon
                    }
                >
                    N
                </div>

                <div
                    className={
                        layoutStyles.brandText
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

            <nav
                className={
                    layoutStyles.navigation
                }
            >

                <span
                    className={
                        layoutStyles.navigationTitle
                    }
                >
                    COURSE MANAGEMENT
                </span>

                {sidebarItems.map(
                    (
                        item
                    ) => {

                        const isActive =
                            item.id ===
                            activeItem;

                        return (
                            <button
                                key={
                                    item.id
                                }
                                type="button"
                                className={`${layoutStyles.navItem} ${
                                    isActive
                                        ? layoutStyles.navActive
                                        : ""
                                }`}
                                onClick={() => {

                                    window.location.href =
                                        item
                                            .navigation
                                            .path;
                                }}
                            >

                                <span
                                    className={
                                        layoutStyles.navIcon
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
                                        layoutStyles.navLabel
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
                )}

            </nav>

            <div
                className={
                    layoutStyles.sidebarFooter
                }
            >
                <span>
                    {
                        getTenantNavigation(
                            tenant ||
                            ""
                        )
                            .courseManagement
                            .label
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

    switch (
        id
    ) {

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
