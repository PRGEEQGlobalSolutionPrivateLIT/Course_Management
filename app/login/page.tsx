"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

import type {
    TenantType,
} from "@/types/user.types";

type UserRole =
    | "institute_admin"
    | "coordinator"
    | "faculty"
    | "student"
    | "corporate_admin"
    | "manager"
    | "trainer"
    | "employee"
    | "academy_admin"
    | "learner"
    | "bootcamp_admin"
    | "mentor"
    | "ngo_admin"
    | "program_manager"
    | "beneficiary"
    | "department_admin"
    | "program_officer"
    | "participant";

import {
    isRoleAllowedForTenant,
} from "@/types/permission.types";

/* =========================================================
   TYPES
   ========================================================= */

interface TenantOption {
    value: TenantType;
    label: string;
}

interface RoleOption {
    value: UserRole;
    label: string;
}

interface DemoUser {
    id: string;
    name: string;
    role: UserRole;
    roleName: string;
    department?: string;
    email: string;

    departmentId?: string;
    organizationId?: string;
    programmeId?: string;

    batchId?: string;
    batchIds?: string[];

    cohortId?: string;
    cohortIds?: string[];

    courseId?: string;
    courseIds?: string[];

    learnerId?: string;
}

interface LoginUser {
    id: string;
    name: string;
    email: string;

    tenant: TenantType;
    tenantId: string;
    tenantName: string;

    role: UserRole;
    roleName: string;

    department?: string;
    departmentId?: string;

    organizationId?: string;
    programmeId?: string;

    batchId?: string;
    batchIds?: string[];

    cohortId?: string;
    cohortIds?: string[];

    courseId?: string;
    courseIds?: string[];

    learnerId?: string;
}

/* =========================================================
   TENANTS
   ========================================================= */

const tenants: TenantOption[] = [
    {
        value: "university",
        label: "University",
    },
    {
        value: "corporate",
        label: "Corporate",
    },
    {
        value: "skill_academy",
        label: "Skill Academy",
    },
    {
        value: "bootcamp",
        label: "Bootcamp",
    },
    {
        value: "ngo",
        label: "NGO Trust",
    },
    {
        value: "government",
        label: "Government",
    },
];

/* =========================================================
   TENANT DATABASE IDs
   ---------------------------------------------------------
   DEMO ONLY.
   In production these must come from the backend/database.
   ========================================================= */

const tenantIds: Record<TenantType, string> = {
    university: "TENANT_UNI_001",
    corporate: "TENANT_CORP_001",
    skill_academy: "TENANT_ACA_001",
    bootcamp: "TENANT_BOOT_001",
    ngo: "TENANT_NGO_001",
    government: "TENANT_GOV_001",
};

/* =========================================================
   ROLES BY TENANT
   ========================================================= */

const rolesByTenant: Record<TenantType, RoleOption[]> = {
    university: [
        {
            value: "institute_admin",
            label: "Institute Admin",
        },
        {
            value: "coordinator",
            label: "Coordinator",
        },
        {
            value: "faculty",
            label: "Faculty",
        },
        {
            value: "student",
            label: "Student",
        },
    ],

    corporate: [
        {
            value: "corporate_admin",
            label: "Corporate Admin",
        },
        {
            value: "manager",
            label: "Manager",
        },
        {
            value: "trainer",
            label: "Trainer",
        },
        {
            value: "employee",
            label: "Employee",
        },
    ],

    skill_academy: [
        {
            value: "academy_admin",
            label: "Academy Admin",
        },
        {
            value: "trainer",
            label: "Trainer",
        },
        {
            value: "learner",
            label: "Learner",
        },
    ],

    bootcamp: [
        {
            value: "bootcamp_admin",
            label: "Bootcamp Admin",
        },
        {
            value: "mentor",
            label: "Mentor",
        },
        {
            value: "learner",
            label: "Learner",
        },
    ],

    ngo: [
        {
            value: "ngo_admin",
            label: "NGO Admin",
        },
        {
            value: "program_manager",
            label: "Program Manager",
        },
        {
            value: "trainer",
            label: "Trainer",
        },
        {
            value: "beneficiary",
            label: "Beneficiary",
        },
    ],

    government: [
        {
            value: "department_admin",
            label: "Department Admin",
        },
        {
            value: "program_officer",
            label: "Program Officer",
        },
        {
            value: "trainer",
            label: "Trainer",
        },
        {
            value: "participant",
            label: "Participant",
        },
    ],
};

/* =========================================================
   DEMO USERS
   ---------------------------------------------------------
   DEMO ONLY.

   Production:
   These records must come from the authentication API /
   database after credentials are validated.
   ========================================================= */

const usersByTenant: Record<TenantType, DemoUser[]> = {
    /* -----------------------------------------------------
       UNIVERSITY
       ----------------------------------------------------- */

    university: [
        {
            id: "UNI_ADMIN_001",
            name: "University Admin",
            role: "institute_admin",
            roleName: "Institute Admin",
            department: "Academic Administration",
            email: "admin@university.edu",
            departmentId: "UNI_DEPT_ADMIN",
        },

        {
            id: "UNI001",
            name: "Ananya Rao",
            role: "coordinator",
            roleName: "Coordinator",
            department: "Computer Science",
            email: "ananya@university.edu",
            departmentId: "UNI_DEPT_CSE",
            programmeId: "UNI_PROG_CSE",
            batchId: "UNI_BATCH_2026",
            batchIds: [
                "UNI_BATCH_2026",
            ],
        },

        {
            id: "UNI002",
            name: "Priya Iyer",
            role: "faculty",
            roleName: "Faculty",
            department: "Computer Science",
            email: "priya@university.edu",
            departmentId: "UNI_DEPT_CSE",
            programmeId: "UNI_PROG_CSE",
            batchId: "UNI_BATCH_2026",
            batchIds: [
                "UNI_BATCH_2026",
            ],
            courseId: "UNI_COURSE_001",
            courseIds: [
                "UNI_COURSE_001",
            ],
        },

        {
            id: "UNI003",
            name: "Aarav Sharma",
            role: "student",
            roleName: "Student",
            department: "Computer Science",
            email: "aarav@university.edu",
            departmentId: "UNI_DEPT_CSE",
            programmeId: "UNI_PROG_CSE",
            batchId: "UNI_BATCH_2026",
            batchIds: [
                "UNI_BATCH_2026",
            ],
            courseId: "UNI_COURSE_001",
            courseIds: [
                "UNI_COURSE_001",
            ],
            learnerId: "UNI_LEARNER_003",
        },
    ],

    /* -----------------------------------------------------
       CORPORATE
       ----------------------------------------------------- */

    corporate: [
        {
            id: "CORP_ADMIN_001",
            name: "Corporate Admin",
            role: "corporate_admin",
            roleName: "Corporate Admin",
            department: "Learning & Development",
            email: "admin@company.com",
            departmentId: "CORP_DEPT_LD",
            organizationId: "CORP_ORG_001",
        },

        {
            id: "CORP001",
            name: "Rohit Verma",
            role: "manager",
            roleName: "Manager",
            department: "Learning & Development",
            email: "rohit@company.com",
            departmentId: "CORP_DEPT_LD",
            organizationId: "CORP_ORG_001",
            cohortId: "CORP_COHORT_001",
            cohortIds: [
                "CORP_COHORT_001",
            ],
        },

        {
            id: "CORP002",
            name: "Neha Kapoor",
            role: "trainer",
            roleName: "Trainer",
            department: "Learning & Development",
            email: "neha@company.com",
            departmentId: "CORP_DEPT_LD",
            organizationId: "CORP_ORG_001",
            cohortId: "CORP_COHORT_001",
            cohortIds: [
                "CORP_COHORT_001",
            ],
            courseId: "CORP_COURSE_001",
            courseIds: [
                "CORP_COURSE_001",
            ],
        },

        {
            id: "CORP003",
            name: "Karan Singh",
            role: "employee",
            roleName: "Employee",
            department: "Engineering",
            email: "karan@company.com",
            departmentId: "CORP_DEPT_ENG",
            organizationId: "CORP_ORG_001",
            cohortId: "CORP_COHORT_001",
            cohortIds: [
                "CORP_COHORT_001",
            ],
            courseId: "CORP_COURSE_001",
            courseIds: [
                "CORP_COURSE_001",
            ],
            learnerId: "CORP_LEARNER_003",
        },
    ],

    /* -----------------------------------------------------
       SKILL ACADEMY
       ----------------------------------------------------- */

    skill_academy: [
        {
            id: "ACA_ADMIN_001",
            name: "Academy Admin",
            role: "academy_admin",
            roleName: "Academy Admin",
            department: "Academy Administration",
            email: "admin@academy.com",
            departmentId: "ACA_DEPT_ADMIN",
            organizationId: "ACA_ORG_001",
        },

        {
            id: "ACA001",
            name: "Sahana Reddy",
            role: "trainer",
            roleName: "Trainer",
            department: "Technology Programs",
            email: "sahana@academy.com",
            departmentId: "ACA_DEPT_TECH",
            organizationId: "ACA_ORG_001",
            cohortId: "ACA_COHORT_001",
            cohortIds: [
                "ACA_COHORT_001",
            ],
            courseId: "ACA_COURSE_001",
            courseIds: [
                "ACA_COURSE_001",
            ],
        },

        {
            id: "ACA002",
            name: "Riya Das",
            role: "learner",
            roleName: "Learner",
            department: "Technology Programs",
            email: "riya@academy.com",
            departmentId: "ACA_DEPT_TECH",
            organizationId: "ACA_ORG_001",
            cohortId: "ACA_COHORT_001",
            cohortIds: [
                "ACA_COHORT_001",
            ],
            courseId: "ACA_COURSE_001",
            courseIds: [
                "ACA_COURSE_001",
            ],
            learnerId: "ACA_LEARNER_002",
        },
    ],

    /* -----------------------------------------------------
       BOOTCAMP
       ----------------------------------------------------- */

    bootcamp: [
        {
            id: "BOOT_ADMIN_001",
            name: "Bootcamp Admin",
            role: "bootcamp_admin",
            roleName: "Bootcamp Admin",
            department: "Bootcamp Administration",
            email: "admin@bootcamp.com",
            departmentId: "BOOT_DEPT_ADMIN",
            organizationId: "BOOT_ORG_001",
        },

        {
            id: "BOOT001",
            name: "Sneha Roy",
            role: "mentor",
            roleName: "Mentor",
            department: "Full Stack Development",
            email: "sneha@bootcamp.com",
            departmentId: "BOOT_DEPT_FSD",
            organizationId: "BOOT_ORG_001",
            cohortId: "BOOT_COHORT_001",
            cohortIds: [
                "BOOT_COHORT_001",
            ],
            courseId: "BOOT_COURSE_001",
            courseIds: [
                "BOOT_COURSE_001",
            ],
        },

        {
            id: "BOOT002",
            name: "Aditya Jain",
            role: "learner",
            roleName: "Learner",
            department: "Full Stack Development",
            email: "aditya@bootcamp.com",
            departmentId: "BOOT_DEPT_FSD",
            organizationId: "BOOT_ORG_001",
            cohortId: "BOOT_COHORT_001",
            cohortIds: [
                "BOOT_COHORT_001",
            ],
            courseId: "BOOT_COURSE_001",
            courseIds: [
                "BOOT_COURSE_001",
            ],
            learnerId: "BOOT_LEARNER_002",
        },
    ],

    /* -----------------------------------------------------
       NGO
       ----------------------------------------------------- */

    ngo: [
        {
            id: "NGO_ADMIN_001",
            name: "NGO Admin",
            role: "ngo_admin",
            roleName: "NGO Admin",
            department: "NGO Administration",
            email: "admin@ngo.org",
            departmentId: "NGO_DEPT_ADMIN",
            organizationId: "NGO_ORG_001",
        },

        {
            id: "NGO001",
            name: "Farah Khan",
            role: "program_manager",
            roleName: "Program Manager",
            department: "Digital Skills",
            email: "farah@ngo.org",
            departmentId: "NGO_DEPT_DIGITAL",
            organizationId: "NGO_ORG_001",
            cohortId: "NGO_COHORT_001",
            cohortIds: [
                "NGO_COHORT_001",
            ],
        },

        {
            id: "NGO002",
            name: "Rajesh Kumar",
            role: "trainer",
            roleName: "Trainer",
            department: "Digital Skills",
            email: "rajesh@ngo.org",
            departmentId: "NGO_DEPT_DIGITAL",
            organizationId: "NGO_ORG_001",
            cohortId: "NGO_COHORT_001",
            cohortIds: [
                "NGO_COHORT_001",
            ],
            courseId: "NGO_COURSE_001",
            courseIds: [
                "NGO_COURSE_001",
            ],
        },

        {
            id: "NGO003",
            name: "Pooja Patel",
            role: "beneficiary",
            roleName: "Beneficiary",
            department: "Digital Skills",
            email: "pooja@ngo.org",
            departmentId: "NGO_DEPT_DIGITAL",
            organizationId: "NGO_ORG_001",
            cohortId: "NGO_COHORT_001",
            cohortIds: [
                "NGO_COHORT_001",
            ],
            courseId: "NGO_COURSE_001",
            courseIds: [
                "NGO_COURSE_001",
            ],
            learnerId: "NGO_LEARNER_003",
        },
    ],

    /* -----------------------------------------------------
       GOVERNMENT
       ----------------------------------------------------- */

    government: [
        {
            id: "GOV_ADMIN_001",
            name: "Department Admin",
            role: "department_admin",
            roleName: "Department Admin",
            department: "Government Administration",
            email: "admin@gov.in",
            departmentId: "GOV_DEPT_ADMIN",
            organizationId: "GOV_ORG_001",
        },

        {
            id: "GOV001",
            name: "Arun Nair",
            role: "program_officer",
            roleName: "Program Officer",
            department: "Capacity Building",
            email: "arun@gov.in",
            departmentId: "GOV_DEPT_CAPACITY",
            organizationId: "GOV_ORG_001",
            cohortId: "GOV_COHORT_001",
            cohortIds: [
                "GOV_COHORT_001",
            ],
        },

        {
            id: "GOV002",
            name: "Meera Joshi",
            role: "trainer",
            roleName: "Trainer",
            department: "Capacity Building",
            email: "meera@gov.in",
            departmentId: "GOV_DEPT_CAPACITY",
            organizationId: "GOV_ORG_001",
            cohortId: "GOV_COHORT_001",
            cohortIds: [
                "GOV_COHORT_001",
            ],
            courseId: "GOV_COURSE_001",
            courseIds: [
                "GOV_COURSE_001",
            ],
        },

        {
            id: "GOV003",
            name: "Nitin Rao",
            role: "participant",
            roleName: "Participant",
            department: "Capacity Building",
            email: "nitin@gov.in",
            departmentId: "GOV_DEPT_CAPACITY",
            organizationId: "GOV_ORG_001",
            cohortId: "GOV_COHORT_001",
            cohortIds: [
                "GOV_COHORT_001",
            ],
            courseId: "GOV_COURSE_001",
            courseIds: [
                "GOV_COURSE_001",
            ],
            learnerId: "GOV_LEARNER_003",
        },
    ],
};

/* =========================================================
   LOGIN PAGE
   ========================================================= */

export default function Login() {
    const router = useRouter();

    const [tenant, setTenant] =
        useState<TenantType | "">("");

    const [role, setRole] =
        useState<UserRole | "">("");

    const [error, setError] =
        useState("");

    const [isLoggingIn, setIsLoggingIn] =
        useState(false);

    /* =====================================================
       AVAILABLE ROLES
       ===================================================== */

    const availableRoles = useMemo<RoleOption[]>(() => {
        if (!tenant) {
            return [];
        }

        return rolesByTenant[tenant] ?? [];
    }, [tenant]);

    /* =====================================================
       TENANT CHANGE
       ===================================================== */

    function handleTenantChange(
        value: string,
    ) {
        setError("");
        setRole("");

        if (!value) {
            setTenant("");
            return;
        }

        setTenant(value as TenantType);
    }

    /* =====================================================
       LOGIN
       ===================================================== */

    function login() {
        setError("");

        /* -----------------------------------------------
           Validate tenant
           ----------------------------------------------- */

        if (!tenant) {
            setError(
                "Please select a tenant.",
            );

            return;
        }

        /* -----------------------------------------------
           Validate role
           ----------------------------------------------- */

        if (!role) {
            setError(
                "Please select an actor.",
            );

            return;
        }

        /* -----------------------------------------------
           Validate role against tenant
           ----------------------------------------------- */

        if (
            !isRoleAllowedForTenant(
                role as Parameters<typeof isRoleAllowedForTenant>[0],
                tenant,
            )
        ) {
            setError(
                "The selected actor is not permitted for this tenant.",
            );

            return;
        }

        /* -----------------------------------------------
           Validate role appears in UI mapping
           ----------------------------------------------- */

        const selectedRole =
            availableRoles.find(
                (item) =>
                    item.value === role,
            );

        if (!selectedRole) {
            setError(
                "The selected actor is not available for this tenant.",
            );

            return;
        }

        /* -----------------------------------------------
           Find demo/authenticated user
           ----------------------------------------------- */

        const tenantUsers =
            usersByTenant[tenant] ?? [];

        const selectedUser =
            tenantUsers.find(
                (item) =>
                    item.role === role,
            );

        if (!selectedUser) {
            setError(
                "No user is configured for the selected actor.",
            );

            return;
        }

        /* -----------------------------------------------
           Resolve tenant
           ----------------------------------------------- */

        const selectedTenant =
            tenants.find(
                (item) =>
                    item.value === tenant,
            );

        const resolvedTenantId =
            tenantIds[tenant];

        if (!resolvedTenantId) {
            setError(
                "Tenant ID could not be resolved.",
            );

            return;
        }

        /* -----------------------------------------------
           Build login user
           ----------------------------------------------- */

        const user: LoginUser = {
            id: selectedUser.id,

            name: selectedUser.name,

            email: selectedUser.email,

            tenant,

            tenantId: resolvedTenantId,

            tenantName:
                selectedTenant?.label ?? "",

            role: selectedUser.role,

            roleName:
                selectedUser.roleName,

            department:
                selectedUser.department,

            departmentId:
                selectedUser.departmentId,

            organizationId:
                selectedUser.organizationId,

            programmeId:
                selectedUser.programmeId,

            batchId:
                selectedUser.batchId,

            batchIds:
                selectedUser.batchIds ??
                (
                    selectedUser.batchId
                        ? [selectedUser.batchId]
                        : []
                ),

            cohortId:
                selectedUser.cohortId,

            cohortIds:
                selectedUser.cohortIds ??
                (
                    selectedUser.cohortId
                        ? [selectedUser.cohortId]
                        : []
                ),

            courseId:
                selectedUser.courseId,

            courseIds:
                selectedUser.courseIds ??
                (
                    selectedUser.courseId
                        ? [selectedUser.courseId]
                        : []
                ),

            learnerId:
                selectedUser.learnerId,
        };

        /* =================================================
           CLEAR OLD SESSION CONTEXT
           ================================================= */

        localStorage.removeItem(
            "user",
        );

        localStorage.removeItem(
            "access_context",
        );

        localStorage.removeItem(
            "tenant_context",
        );

        localStorage.removeItem(
            "tenant_users",
        );

        /* =================================================
           USER SESSION
           ================================================= */

        localStorage.setItem(
            "user",
            JSON.stringify(user),
        );

        /* =================================================
           TENANT USERS
           -------------------------------------------------
           Existing pages currently use this key.
           Keep it for compatibility.
           ================================================= */

        localStorage.setItem(
            "tenant_users",
            JSON.stringify(tenantUsers),
        );

        /* =================================================
           ACCESS CONTROL CONTEXT
           -------------------------------------------------
           This is consumed by:
             - access-control.ts
             - course pages
             - course management
             - permissions
             - batches
             - cohorts
             - trainer assignments
             - learner pages
           ================================================= */

        const accessContext = {
            userId: user.id,

            role: user.role,

            tenant: user.tenant,

            /*
             * Actual database tenant / organization ID.
             */
            tenantId: user.tenantId,

            organizationId:
                user.organizationId,

            departmentId:
                user.departmentId,

            programmeId:
                user.programmeId,

            /*
             * Backward-compatible single values.
             */
            batchId:
                user.batchId,

            cohortId:
                user.cohortId,

            courseId:
                user.courseId,

            learnerId:
                user.learnerId,

            /*
             * New multi-assignment values.
             */
            batchIds:
                user.batchIds ?? [],

            cohortIds:
                user.cohortIds ?? [],

            courseIds:
                user.courseIds ?? [],
        };

        localStorage.setItem(
            "access_context",
            JSON.stringify(
                accessContext,
            ),
        );

        /* =================================================
           TENANT CONTEXT
           ================================================= */

        localStorage.setItem(
            "tenant_context",
            JSON.stringify({
                tenantId:
                    user.tenantId,

                tenant:
                    user.tenant,

                tenantName:
                    user.tenantName,

                organizationId:
                    user.organizationId,
            }),
        );

        /* =================================================
           LOGIN STATE
           -------------------------------------------------
           Useful for pages that need to know whether the
           user has completed the login flow.
           ================================================= */

        localStorage.setItem(
            "auth_state",
            JSON.stringify({
                authenticated: true,

                userId:
                    user.id,

                tenantId:
                    user.tenantId,

                tenant:
                    user.tenant,

                role:
                    user.role,

                loginAt:
                    new Date().toISOString(),
            }),
        );

        /* =================================================
           REDIRECT
           ================================================= */

        setIsLoggingIn(true);

        router.push(
            "/dashboard",
        );
    }

    /* =====================================================
       RENDER
       ===================================================== */

    return (
        <main
            className={
                styles.page
            }
        >
            <div
                className={
                    styles.loginCard
                }
            >
                {/* -----------------------------------------
                   LOGO
                   ----------------------------------------- */}

                <div
                    className={
                        styles.logo
                    }
                >
                    n
                </div>

                {/* -----------------------------------------
                   TITLE
                   ----------------------------------------- */}

                <h1>
                    NeuroLXP
                </h1>

                <p
                    className={
                        styles.subtitle
                    }
                >
                    Select your tenant and actor
                </p>

                {/* -----------------------------------------
                   TENANT
                   ----------------------------------------- */}

                <div
                    className={
                        styles.field
                    }
                >
                    <label
                        htmlFor="tenant"
                    >
                        Tenant
                    </label>

                    <select
                        id="tenant"
                        className={
                            styles.select
                        }
                        value={tenant}
                        onChange={(event) =>
                            handleTenantChange(
                                event.target.value,
                            )
                        }
                        disabled={
                            isLoggingIn
                        }
                    >
                        <option value="">
                            Select Tenant
                        </option>

                        {tenants.map(
                            (item) => (
                                <option
                                    key={
                                        item.value
                                    }
                                    value={
                                        item.value
                                    }
                                >
                                    {
                                        item.label
                                    }
                                </option>
                            ),
                        )}
                    </select>
                </div>

                {/* -----------------------------------------
                   ACTOR
                   ----------------------------------------- */}

                <div
                    className={
                        styles.field
                    }
                >
                    <label
                        htmlFor="actor"
                    >
                        Actor
                    </label>

                    <select
                        id="actor"
                        className={
                            styles.select
                        }
                        value={role}
                        onChange={(event) =>
                            setRole(
                                event.target
                                    .value as UserRole | "",
                            )
                        }
                        disabled={
                            !tenant ||
                            isLoggingIn
                        }
                    >
                        <option value="">
                            {tenant
                                ? "Select Actor"
                                : "Select Tenant First"}
                        </option>

                        {availableRoles.map(
                            (item) => (
                                <option
                                    key={
                                        item.value
                                    }
                                    value={
                                        item.value
                                    }
                                >
                                    {
                                        item.label
                                    }
                                </option>
                            ),
                        )}
                    </select>
                </div>

                {/* -----------------------------------------
                   CONTEXT PREVIEW
                   ----------------------------------------- */}

                {tenant &&
                    role && (
                        <div
                            className={
                                styles.contextPreview
                            }
                        >
                            <span>
                                {
                                    tenants.find(
                                        (item) =>
                                            item.value ===
                                            tenant,
                                    )?.label
                                }
                            </span>

                            <span>
                                {
                                    availableRoles.find(
                                        (item) =>
                                            item.value ===
                                            role,
                                    )?.label
                                }
                            </span>
                        </div>
                    )}

                {/* -----------------------------------------
                   ERROR
                   ----------------------------------------- */}

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

                {/* -----------------------------------------
                   LOGIN BUTTON
                   ----------------------------------------- */}

                <button
                    type="button"
                    className={
                        styles.loginButton
                    }
                    onClick={login}
                    disabled={
                        isLoggingIn
                    }
                >
                    {isLoggingIn
                        ? "Signing in..."
                        : "Login"}
                </button>
            </div>
        </main>
    );
}