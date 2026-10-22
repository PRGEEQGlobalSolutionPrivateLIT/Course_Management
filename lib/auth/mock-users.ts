import type { UserRole, TenantType } from "@/types/user.types";

export interface MockUser {
    id: string;
    name: string;
    email: string;

    role: UserRole;
    tenant: TenantType;

    /**
     * Actual tenant/organization identifier.
     *
     * Example:
     * corp_acme_001
     */
    tenantId: string;

    /**
     * Optional organizational scopes.
     */
    departmentIds?: string[];
    programmeIds?: string[];
    batchIds?: string[];
    cohortIds?: string[];
    courseIds?: string[];

    /**
     * Optional learner-specific scope.
     */
    learnerId?: string;
}

/**
 * ---------------------------------------------------------
 * TEMPORARY FRONTEND USERS
 * ---------------------------------------------------------
 *
 * These users are only for frontend development.
 *
 * Replace with database/API authentication later.
 */
export const MOCK_USERS: MockUser[] = [
    /* =====================================================
       CORPORATE ADMIN
       ===================================================== */

    {
        id: "USR-CORP-001",
        name: "Corporate Admin",
        email: "admin@acme.com",

        role: "corporate_admin",
        tenant: "corporate",
        tenantId: "TENANT-CORP-001",

        departmentIds: [
            "DEPT-IT",
            "DEPT-HR",
            "DEPT-FINANCE",
        ],
    },

    /* =====================================================
       CORPORATE MANAGER / COORDINATOR
       ===================================================== */

    {
        id: "USR-CORP-MGR-001",
        name: "Corporate Manager",
        email: "manager@acme.com",

        role: "coordinator",
        tenant: "corporate",
        tenantId: "TENANT-CORP-001",

        departmentIds: [
            "DEPT-IT",
        ],

        cohortIds: [
            "COHORT-001",
            "COHORT-002",
        ],

        batchIds: [
            "BATCH-001",
            "BATCH-002",
        ],
    },

    /* =====================================================
       CORPORATE TRAINER
       ===================================================== */

    {
        id: "USR-CORP-TRN-001",
        name: "Corporate Trainer",
        email: "trainer@acme.com",

        role: "trainer",
        tenant: "corporate",
        tenantId: "TENANT-CORP-001",

        departmentIds: [
            "DEPT-IT",
        ],

        batchIds: [
            "BATCH-001",
        ],

        cohortIds: [
            "COHORT-001",
        ],

        courseIds: [
            "COURSE-PYTHON",
            "COURSE-AI",
        ],
    },

    /* =====================================================
       CORPORATE LEARNER
       ===================================================== */

    {
        id: "USR-CORP-LRN-001",
        name: "Corporate Employee",
        email: "employee@acme.com",

        role: "learner",
        tenant: "corporate",
        tenantId: "TENANT-CORP-001",

        departmentIds: [
            "DEPT-IT",
        ],

        batchIds: [
            "BATCH-001",
        ],

        cohortIds: [
            "COHORT-001",
        ],

        courseIds: [
            "COURSE-PYTHON",
        ],

        learnerId: "LEARNER-001",
    },

    /* =====================================================
       UNIVERSITY ADMIN
       ===================================================== */

    {
        id: "USR-UNI-ADM-001",
        name: "University Admin",
        email: "admin@university.com",

        role: "institute_admin",
        tenant: "university",
        tenantId: "TENANT-UNI-001",
    },

    /* =====================================================
       UNIVERSITY COORDINATOR
       ===================================================== */

    {
        id: "USR-UNI-COORD-001",
        name: "University Coordinator",
        email: "coordinator@university.com",

        role: "coordinator",
        tenant: "university",
        tenantId: "TENANT-UNI-001",

        departmentIds: [
            "CSE",
        ],

        programmeIds: [
            "BTECH-CSE",
        ],

        batchIds: [
            "UNI-BATCH-001",
        ],

        courseIds: [
            "UNI-COURSE-001",
        ],
    },

    /* =====================================================
       UNIVERSITY FACULTY
       ===================================================== */

    {
        id: "USR-UNI-FAC-001",
        name: "University Faculty",
        email: "faculty@university.com",

        role: "faculty",
        tenant: "university",
        tenantId: "TENANT-UNI-001",

        departmentIds: [
            "CSE",
        ],

        programmeIds: [
            "BTECH-CSE",
        ],

        batchIds: [
            "UNI-BATCH-001",
        ],

        courseIds: [
            "UNI-COURSE-001",
        ],
    },

    /* =====================================================
       UNIVERSITY STUDENT
       ===================================================== */

    {
        id: "USR-UNI-STU-001",
        name: "University Student",
        email: "student@university.com",

        role: "student",
        tenant: "university",
        tenantId: "TENANT-UNI-001",

        departmentIds: [
            "CSE",
        ],

        programmeIds: [
            "BTECH-CSE",
        ],

        batchIds: [
            "UNI-BATCH-001",
        ],

        courseIds: [
            "UNI-COURSE-001",
        ],

        learnerId: "UNI-STUDENT-001",
    },

    /* =====================================================
       NGO ADMIN
       ===================================================== */

    {
        id: "USR-NGO-ADM-001",
        name: "NGO Admin",
        email: "admin@ngo.com",

        role: "ngo_admin",
        tenant: "ngo",
        tenantId: "TENANT-NGO-001",
    },

    /* =====================================================
       GOVERNMENT ADMIN
       ===================================================== */

    {
        id: "USR-GOV-ADM-001",
        name: "Government Admin",
        email: "admin@gov.in",

        role: "government_admin",
        tenant: "government",
        tenantId: "TENANT-GOV-001",
    },
];

/**
 * Find user by ID.
 */
export function getMockUserById(
    userId: string,
): MockUser | null {
    return (
        MOCK_USERS.find(
            (user) => user.id === userId,
        ) ?? null
    );
}

/**
 * Find user by email.
 */
export function getMockUserByEmail(
    email: string,
): MockUser | null {
    return (
        MOCK_USERS.find(
            (user) =>
                user.email.toLowerCase() ===
                email.toLowerCase(),
        ) ?? null
    );
}