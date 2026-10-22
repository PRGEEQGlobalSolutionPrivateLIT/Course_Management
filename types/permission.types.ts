import type {
    PermissionAction,
    PermissionScope,
    TenantType,
    UserRole,
} from "./user.types";

// Re-export shared types so consumers may import them from this module when needed.
export type {
    PermissionAction,
    PermissionScope,
    TenantType,
    UserRole,
} from "./user.types";


/* =========================================================
   PERMISSION DEFINITION
   ========================================================= */

export interface PermissionDefinition {

    /**
     * Unique permission key.
     *
     * Example:
     * course.view
     * course.create
     * course.publish
     */
    key: string;

    /**
     * Resource on which permission operates.
     */
    resource: string;

    /**
     * Action allowed on the resource.
     */
    action: PermissionAction | "export";

    /**
     * Maximum scope at which the permission can operate.
     */
    scope: PermissionScope;

    /**
     * Whether this permission can be delegated
     * to another lower-level actor.
     */
    delegatable: boolean;
}


/* =========================================================
   ROLE POLICY
   ========================================================= */

export interface RolePolicy {

    role: UserRole;

    /**
     * Tenants in which this role is valid.
     */
    tenants: TenantType[];

    /**
     * Permissions automatically available
     * to this role.
     */
    permissions: PermissionDefinition[];

    /**
     * Whether the role can delegate permissions.
     */
    canDelegatePermissions: boolean;

    /**
     * Roles to which this role can delegate.
     */
    canDelegateTo: UserRole[];
}


/* =========================================================
   PERMISSION KEYS
   ========================================================= */

export const PERMISSIONS = {

    /* ---------------- COURSE ---------------- */

    COURSE_VIEW: "course.view",
    COURSE_CREATE: "course.create",
    COURSE_EDIT: "course.edit",
    COURSE_DELETE: "course.delete",

    COURSE_SUBMIT: "course.submit",
    COURSE_REVIEW: "course.review",

    COURSE_APPROVE: "course.approve",

    COURSE_PUBLISH: "course.publish",
    COURSE_UNPUBLISH: "course.unpublish",

    /* ---------------- CONTENT ---------------- */

    CONTENT_VIEW: "content.view",
    CONTENT_CREATE: "content.create",
    CONTENT_EDIT: "content.edit",
    CONTENT_DELETE: "content.delete",

    CONTENT_UPLOAD: "content.upload",
    CONTENT_SAVE: "content.save",

    /* ---------------- ASSESSMENT ---------------- */

    ASSESSMENT_VIEW: "assessment.view",
    ASSESSMENT_CREATE: "assessment.create",
    ASSESSMENT_EDIT: "assessment.edit",

    ASSESSMENT_EVALUATE: "assessment.evaluate",

    /* ---------------- DELIVERY ---------------- */

    OFFERING_VIEW: "offering.view",
    OFFERING_CREATE: "offering.create",
    OFFERING_EDIT: "offering.edit",

    BATCH_VIEW: "batch.view",
    BATCH_CREATE: "batch.create",
    BATCH_EDIT: "batch.edit",

    COHORT_VIEW: "cohort.view",
    COHORT_CREATE: "cohort.create",
    COHORT_EDIT: "cohort.edit",

    /* ---------------- USERS ---------------- */

    USER_VIEW: "user.view",
    USER_CREATE: "user.create",
    USER_EDIT: "user.edit",
    USER_DELETE: "user.delete",

    USER_ASSIGN: "user.assign",

    /* ---------------- TRAINER ---------------- */

    TRAINER_VIEW: "trainer.view",
    TRAINER_ASSIGN: "trainer.assign",

    /* ---------------- LEARNER ---------------- */

    LEARNER_VIEW: "learner.view",
    LEARNER_PROGRESS_VIEW: "learner.progress.view",

    /* ---------------- REPORTS ---------------- */

    REPORT_VIEW: "report.view",
    REPORT_EXPORT: "report.export",

    /* ---------------- PERMISSIONS ---------------- */

    PERMISSION_VIEW: "permission.view",
    PERMISSION_ASSIGN: "permission.assign",

} as const;


/* =========================================================
   ROLE POLICY BUILDER
   ========================================================= */

function permission(
    key: string,
    resource: string,
    action: PermissionAction | "export",
    scope: PermissionScope,
    delegatable = false,
): PermissionDefinition {

    return {
        key,
        resource,
        action,
        scope,
        delegatable,
    };
}


/* =========================================================
   COMMON COURSE PERMISSIONS
   ========================================================= */

const COURSE_VIEW = permission(
    PERMISSIONS.COURSE_VIEW,
    "course",
    "view",
    "tenant",
);

const COURSE_CREATE = permission(
    PERMISSIONS.COURSE_CREATE,
    "course",
    "create",
    "tenant",
);

const COURSE_EDIT = permission(
    PERMISSIONS.COURSE_EDIT,
    "course",
    "edit",
    "tenant",
);

const COURSE_REVIEW = permission(
    PERMISSIONS.COURSE_REVIEW,
    "course",
    "review",
    "tenant",
    true,
);

const COURSE_APPROVE = permission(
    PERMISSIONS.COURSE_APPROVE,
    "course",
    "approve",
    "tenant",
    true,
);

const COURSE_PUBLISH = permission(
    PERMISSIONS.COURSE_PUBLISH,
    "course",
    "publish",
    "tenant",
    true,
);


/* =========================================================
   CORPORATE ADMIN POLICY
   ========================================================= */

const CORPORATE_ADMIN_POLICY: RolePolicy = {

    role: "corporate_admin",

    tenants: [
        "corporate",
    ],

    permissions: [

        COURSE_VIEW,

        COURSE_CREATE,

        COURSE_EDIT,

        COURSE_REVIEW,

        COURSE_APPROVE,

        COURSE_PUBLISH,

        permission(
            PERMISSIONS.CONTENT_VIEW,
            "content",
            "view",
            "tenant",
        ),

        permission(
            PERMISSIONS.CONTENT_CREATE,
            "content",
            "create",
            "tenant",
        ),

        permission(
            PERMISSIONS.CONTENT_EDIT,
            "content",
            "edit",
            "tenant",
        ),

        permission(
            PERMISSIONS.CONTENT_UPLOAD,
            "content",
            "upload",
            "tenant",
        ),

        permission(
            PERMISSIONS.USER_VIEW,
            "user",
            "view",
            "tenant",
        ),

        permission(
            PERMISSIONS.USER_CREATE,
            "user",
            "create",
            "tenant",
        ),

        permission(
            PERMISSIONS.USER_EDIT,
            "user",
            "edit",
            "tenant",
        ),

        permission(
            PERMISSIONS.USER_ASSIGN,
            "user",
            "assign",
            "tenant",
        ),

        permission(
            PERMISSIONS.TRAINER_ASSIGN,
            "trainer",
            "assign",
            "tenant",
        ),

        permission(
            PERMISSIONS.REPORT_VIEW,
            "report",
            "view",
            "tenant",
        ),

        permission(
            PERMISSIONS.REPORT_EXPORT,
            "report",
            "export",
            "tenant",
        ),

        permission(
            PERMISSIONS.PERMISSION_VIEW,
            "permission",
            "view",
            "tenant",
        ),

        permission(
            PERMISSIONS.PERMISSION_ASSIGN,
            "permission",
            "assign",
            "tenant",
        ),
    ],

    canDelegatePermissions: true,

    canDelegateTo: [
        "manager",
        "trainer",
        "employee",
    ],
};


/* =========================================================
   CORPORATE MANAGER POLICY
   ========================================================= */

const MANAGER_POLICY: RolePolicy = {

    role: "manager",

    tenants: [
        "corporate",
    ],

    permissions: [

        permission(
            PERMISSIONS.COURSE_VIEW,
            "course",
            "view",
            "department",
        ),

        permission(
            PERMISSIONS.COURSE_EDIT,
            "course",
            "edit",
            "department",
        ),

        permission(
            PERMISSIONS.COURSE_REVIEW,
            "course",
            "review",
            "department",
            true,
        ),

        permission(
            PERMISSIONS.CONTENT_VIEW,
            "content",
            "view",
            "department",
        ),

        permission(
            PERMISSIONS.CONTENT_EDIT,
            "content",
            "edit",
            "department",
        ),

        permission(
            PERMISSIONS.BATCH_VIEW,
            "batch",
            "view",
            "department",
        ),

        permission(
            PERMISSIONS.BATCH_EDIT,
            "batch",
            "edit",
            "department",
        ),

        permission(
            PERMISSIONS.COHORT_VIEW,
            "cohort",
            "view",
            "department",
        ),

        permission(
            PERMISSIONS.COHORT_EDIT,
            "cohort",
            "edit",
            "department",
        ),

        permission(
            PERMISSIONS.TRAINER_ASSIGN,
            "trainer",
            "assign",
            "department",
        ),

        permission(
            PERMISSIONS.LEARNER_VIEW,
            "learner",
            "view",
            "department",
        ),

        permission(
            PERMISSIONS.LEARNER_PROGRESS_VIEW,
            "learner",
            "view",
            "department",
        ),

        permission(
            PERMISSIONS.REPORT_VIEW,
            "report",
            "view",
            "department",
        ),
    ],

    canDelegatePermissions: true,

    canDelegateTo: [
        "trainer",
        "employee",
    ],
};


/* =========================================================
   CORPORATE TRAINER POLICY
   ========================================================= */

const TRAINER_POLICY: RolePolicy = {

    role: "trainer",

    tenants: [
        "corporate",
        "skill_academy",
        "bootcamp",
        "ngo",
        "government",
    ],

    permissions: [

        permission(
            PERMISSIONS.COURSE_VIEW,
            "course",
            "view",
            "course",
        ),

        permission(
            PERMISSIONS.CONTENT_VIEW,
            "content",
            "view",
            "course",
        ),

        permission(
            PERMISSIONS.CONTENT_CREATE,
            "content",
            "create",
            "course",
        ),

        permission(
            PERMISSIONS.CONTENT_EDIT,
            "content",
            "edit",
            "course",
        ),

        permission(
            PERMISSIONS.CONTENT_UPLOAD,
            "content",
            "upload",
            "course",
        ),

        permission(
            PERMISSIONS.CONTENT_SAVE,
            "content",
            "save",
            "course",
        ),

        permission(
            PERMISSIONS.ASSESSMENT_VIEW,
            "assessment",
            "view",
            "course",
        ),

        permission(
            PERMISSIONS.ASSESSMENT_CREATE,
            "assessment",
            "create",
            "course",
        ),

        permission(
            PERMISSIONS.ASSESSMENT_EDIT,
            "assessment",
            "edit",
            "course",
        ),

        permission(
            PERMISSIONS.ASSESSMENT_EVALUATE,
            "assessment",
            "evaluate",
            "batch",
        ),

        permission(
            PERMISSIONS.LEARNER_VIEW,
            "learner",
            "view",
            "batch",
        ),

        permission(
            PERMISSIONS.LEARNER_PROGRESS_VIEW,
            "learner",
            "view",
            "batch",
        ),
    ],

    canDelegatePermissions: false,

    canDelegateTo: [],
};


/* =========================================================
   CORPORATE EMPLOYEE POLICY
   ========================================================= */

const EMPLOYEE_POLICY: RolePolicy = {

    role: "employee",

    tenants: [
        "corporate",
    ],

    permissions: [

        permission(
            PERMISSIONS.COURSE_VIEW,
            "course",
            "view",
            "learner",
        ),

        permission(
            PERMISSIONS.CONTENT_VIEW,
            "content",
            "view",
            "learner",
        ),

        permission(
            PERMISSIONS.CONTENT_SAVE,
            "content",
            "save",
            "learner",
        ),

        permission(
            PERMISSIONS.CONTENT_UPLOAD,
            "content",
            "upload",
            "learner",
        ),

        permission(
            PERMISSIONS.ASSESSMENT_VIEW,
            "assessment",
            "view",
            "learner",
        ),
    ],

    canDelegatePermissions: false,

    canDelegateTo: [],
};


/* =========================================================
   UNIVERSITY ADMIN
   ========================================================= */

const INSTITUTE_ADMIN_POLICY: RolePolicy = {

    role: "institute_admin",

    tenants: [
        "university",
    ],

    permissions: [

        COURSE_VIEW,

        permission(
            PERMISSIONS.USER_VIEW,
            "user",
            "view",
            "tenant",
        ),

        permission(
            PERMISSIONS.REPORT_VIEW,
            "report",
            "view",
            "tenant",
        ),

        permission(
            PERMISSIONS.REPORT_EXPORT,
            "report",
            "export",
            "tenant",
        ),

        permission(
            PERMISSIONS.PERMISSION_VIEW,
            "permission",
            "view",
            "tenant",
        ),

        permission(
            PERMISSIONS.PERMISSION_ASSIGN,
            "permission",
            "assign",
            "tenant",
        ),
    ],

    canDelegatePermissions: true,

    canDelegateTo: [
        "coordinator",
        "faculty",
    ],
};


/* =========================================================
   UNIVERSITY COORDINATOR
   ========================================================= */

const COORDINATOR_POLICY: RolePolicy = {

    role: "coordinator",

    tenants: [
        "university",
    ],

    permissions: [

        permission(
            PERMISSIONS.COURSE_VIEW,
            "course",
            "view",
            "programme",
        ),

        permission(
            PERMISSIONS.COURSE_CREATE,
            "course",
            "create",
            "programme",
        ),

        permission(
            PERMISSIONS.COURSE_EDIT,
            "course",
            "edit",
            "programme",
        ),

        permission(
            PERMISSIONS.COURSE_REVIEW,
            "course",
            "review",
            "programme",
        ),

        permission(
            PERMISSIONS.COURSE_PUBLISH,
            "course",
            "publish",
            "programme",
        ),

        permission(
            PERMISSIONS.OFFERING_VIEW,
            "offering",
            "view",
            "programme",
        ),

        permission(
            PERMISSIONS.OFFERING_CREATE,
            "offering",
            "create",
            "programme",
        ),

        permission(
            PERMISSIONS.OFFERING_EDIT,
            "offering",
            "edit",
            "programme",
        ),

        permission(
            PERMISSIONS.BATCH_VIEW,
            "batch",
            "view",
            "programme",
        ),

        permission(
            PERMISSIONS.BATCH_CREATE,
            "batch",
            "create",
            "programme",
        ),

        permission(
            PERMISSIONS.BATCH_EDIT,
            "batch",
            "edit",
            "programme",
        ),

        permission(
            PERMISSIONS.TRAINER_ASSIGN,
            "trainer",
            "assign",
            "programme",
        ),
    ],

    canDelegatePermissions: true,

    canDelegateTo: [
        "faculty",
    ],
};


/* =========================================================
   UNIVERSITY FACULTY
   ========================================================= */

const FACULTY_POLICY: RolePolicy = {

    role: "faculty",

    tenants: [
        "university",
    ],

    permissions: [

        permission(
            PERMISSIONS.COURSE_VIEW,
            "course",
            "view",
            "course",
        ),

        permission(
            PERMISSIONS.COURSE_EDIT,
            "course",
            "edit",
            "course",
        ),

        permission(
            PERMISSIONS.CONTENT_VIEW,
            "content",
            "view",
            "course",
        ),

        permission(
            PERMISSIONS.CONTENT_CREATE,
            "content",
            "create",
            "course",
        ),

        permission(
            PERMISSIONS.CONTENT_EDIT,
            "content",
            "edit",
            "course",
        ),

        permission(
            PERMISSIONS.CONTENT_UPLOAD,
            "content",
            "upload",
            "course",
        ),

        permission(
            PERMISSIONS.ASSESSMENT_CREATE,
            "assessment",
            "create",
            "course",
        ),

        permission(
            PERMISSIONS.ASSESSMENT_EDIT,
            "assessment",
            "edit",
            "course",
        ),

        permission(
            PERMISSIONS.ASSESSMENT_EVALUATE,
            "assessment",
            "evaluate",
            "batch",
        ),

        permission(
            PERMISSIONS.LEARNER_VIEW,
            "learner",
            "view",
            "batch",
        ),
    ],

    canDelegatePermissions: false,

    canDelegateTo: [],
};


/* =========================================================
   UNIVERSITY STUDENT
   ========================================================= */

const STUDENT_POLICY: RolePolicy = {

    role: "student",

    tenants: [
        "university",
    ],

    permissions: [

        permission(
            PERMISSIONS.COURSE_VIEW,
            "course",
            "view",
            "learner",
        ),

        permission(
            PERMISSIONS.CONTENT_VIEW,
            "content",
            "view",
            "learner",
        ),

        permission(
            PERMISSIONS.CONTENT_SAVE,
            "content",
            "save",
            "learner",
        ),

        permission(
            PERMISSIONS.CONTENT_UPLOAD,
            "content",
            "upload",
            "learner",
        ),

        permission(
            PERMISSIONS.ASSESSMENT_VIEW,
            "assessment",
            "view",
            "learner",
        ),
    ],

    canDelegatePermissions: false,

    canDelegateTo: [],
};


/* =========================================================
   GENERIC ADMIN POLICIES
   ========================================================= */

const ACADEMY_ADMIN_POLICY: RolePolicy = {

    role: "academy_admin",

    tenants: [
        "skill_academy",
    ],

    permissions: [
        COURSE_VIEW,
        COURSE_CREATE,
        COURSE_EDIT,
        COURSE_REVIEW,
        COURSE_APPROVE,
        COURSE_PUBLISH,

        permission(
            PERMISSIONS.USER_VIEW,
            "user",
            "view",
            "tenant",
        ),

        permission(
            PERMISSIONS.USER_CREATE,
            "user",
            "create",
            "tenant",
        ),

        permission(
            PERMISSIONS.REPORT_VIEW,
            "report",
            "view",
            "tenant",
        ),

        permission(
            PERMISSIONS.PERMISSION_VIEW,
            "permission",
            "view",
            "tenant",
        ),

        permission(
            PERMISSIONS.PERMISSION_ASSIGN,
            "permission",
            "assign",
            "tenant",
        ),
    ],

    canDelegatePermissions: true,

    canDelegateTo: [
        "mentor",
        "learner",
    ],
};


const BOOTCAMP_ADMIN_POLICY: RolePolicy = {

    role: "bootcamp_admin",

    tenants: [
        "bootcamp",
    ],

    permissions: [
        COURSE_VIEW,
        COURSE_CREATE,
        COURSE_EDIT,
        COURSE_REVIEW,
        COURSE_APPROVE,
        COURSE_PUBLISH,

        permission(
            PERMISSIONS.USER_VIEW,
            "user",
            "view",
            "tenant",
        ),

        permission(
            PERMISSIONS.USER_CREATE,
            "user",
            "create",
            "tenant",
        ),

        permission(
            PERMISSIONS.REPORT_VIEW,
            "report",
            "view",
            "tenant",
        ),

        permission(
            PERMISSIONS.PERMISSION_VIEW,
            "permission",
            "view",
            "tenant",
        ),

        permission(
            PERMISSIONS.PERMISSION_ASSIGN,
            "permission",
            "assign",
            "tenant",
        ),
    ],

    canDelegatePermissions: true,

    canDelegateTo: [
        "program_manager",
        "mentor",
        "learner",
    ],
};


const NGO_ADMIN_POLICY: RolePolicy = {

    role: "ngo_admin",

    tenants: [
        "ngo",
    ],

    permissions: [
        COURSE_VIEW,
        COURSE_CREATE,
        COURSE_EDIT,
        COURSE_REVIEW,
        COURSE_APPROVE,
        COURSE_PUBLISH,

        permission(
            PERMISSIONS.USER_VIEW,
            "user",
            "view",
            "tenant",
        ),

        permission(
            PERMISSIONS.REPORT_VIEW,
            "report",
            "view",
            "tenant",
        ),

        permission(
            PERMISSIONS.PERMISSION_VIEW,
            "permission",
            "view",
            "tenant",
        ),

        permission(
            PERMISSIONS.PERMISSION_ASSIGN,
            "permission",
            "assign",
            "tenant",
        ),
    ],

    canDelegatePermissions: true,

    canDelegateTo: [
        "program_coordinator",
        "ngo_trainer",
        "beneficiary",
    ],
};


const GOVERNMENT_ADMIN_POLICY: RolePolicy = {

    role: "government_admin",

    tenants: [
        "government",
    ],

    permissions: [
        COURSE_VIEW,
        COURSE_CREATE,
        COURSE_EDIT,
        COURSE_REVIEW,
        COURSE_APPROVE,
        COURSE_PUBLISH,

        permission(
            PERMISSIONS.USER_VIEW,
            "user",
            "view",
            "tenant",
        ),

        permission(
            PERMISSIONS.REPORT_VIEW,
            "report",
            "view",
            "tenant",
        ),

        permission(
            PERMISSIONS.PERMISSION_VIEW,
            "permission",
            "view",
            "tenant",
        ),

        permission(
            PERMISSIONS.PERMISSION_ASSIGN,
            "permission",
            "assign",
            "tenant",
        ),
    ],

    canDelegatePermissions: true,

    canDelegateTo: [
        "program_officer",
        "government_trainer",
        "participant",
    ],
};


/* =========================================================
   ROLE POLICY REGISTRY
   ========================================================= */

export const ROLE_POLICIES: Record<UserRole, RolePolicy> = {

    institute_admin: INSTITUTE_ADMIN_POLICY,

    coordinator: COORDINATOR_POLICY,

    faculty: FACULTY_POLICY,

    student: STUDENT_POLICY,

    corporate_admin: CORPORATE_ADMIN_POLICY,

    manager: MANAGER_POLICY,

    trainer: TRAINER_POLICY,

    employee: EMPLOYEE_POLICY,

    academy_admin: ACADEMY_ADMIN_POLICY,

    mentor: {
        ...TRAINER_POLICY,
        role: "mentor",
        tenants: [
            "skill_academy",
            "bootcamp",
        ],
    },

    learner: {
        ...STUDENT_POLICY,
        role: "learner",
        tenants: [
            "skill_academy",
            "bootcamp",
        ],
    },

    bootcamp_admin: BOOTCAMP_ADMIN_POLICY,

    program_manager: {
        ...MANAGER_POLICY,
        role: "program_manager",
        tenants: [
            "bootcamp",
        ],
    },

    ngo_admin: NGO_ADMIN_POLICY,

    program_coordinator: {
        ...MANAGER_POLICY,
        role: "program_coordinator",
        tenants: [
            "ngo",
        ],
    },

    ngo_trainer: {
        ...TRAINER_POLICY,
        role: "ngo_trainer",
        tenants: [
            "ngo",
        ],
    },

    beneficiary: {
        ...STUDENT_POLICY,
        role: "beneficiary",
        tenants: [
            "ngo",
        ],
    },

    government_admin: GOVERNMENT_ADMIN_POLICY,

    program_officer: {
        ...MANAGER_POLICY,
        role: "program_officer",
        tenants: [
            "government",
        ],
    },

    government_trainer: {
        ...TRAINER_POLICY,
        role: "government_trainer",
        tenants: [
            "government",
        ],
    },

    participant: {
        ...STUDENT_POLICY,
        role: "participant",
        tenants: [
            "government",
        ],
    },
};


/* =========================================================
   GET ROLE POLICY
   ========================================================= */

export function getRolePolicy(
    role: UserRole,
): RolePolicy | null {

    return ROLE_POLICIES[role] ?? null;
}


/* =========================================================
   CHECK ROLE TENANT COMPATIBILITY
   ========================================================= */

export function isRoleAllowedForTenant(
    role: UserRole,
    tenant: TenantType,
): boolean {

    const policy = getRolePolicy(role);

    if (!policy) {
        return false;
    }

    return policy.tenants.includes(tenant);
}


/* =========================================================
   CHECK BASE ROLE PERMISSION
   ========================================================= */

export function roleHasPermission(
    role: UserRole,
    tenant: TenantType,
    permissionKey: string,
): boolean {

    const policy = getRolePolicy(role);

    if (!policy) {
        return false;
    }

    if (!policy.tenants.includes(tenant)) {
        return false;
    }

    return policy.permissions.some(
        (item) => item.key === permissionKey,
    );
}


/* =========================================================
   GET ROLE PERMISSIONS
   ========================================================= */

export function getRolePermissions(
    role: UserRole,
    tenant: TenantType,
): PermissionDefinition[] {

    const policy = getRolePolicy(role);

    if (!policy) {
        return [];
    }

    if (!policy.tenants.includes(tenant)) {
        return [];
    }

    return policy.permissions;
}


/* =========================================================
   CHECK WHETHER ROLE CAN DELEGATE
   ========================================================= */

export function canRoleDelegate(
    role: UserRole,
): boolean {

    const policy = getRolePolicy(role);

    if (!policy) {
        return false;
    }

    return policy.canDelegatePermissions;
}


/* =========================================================
   CHECK DELEGATION TARGET
   ========================================================= */

export function canDelegateTo(
    role: UserRole,
    targetRole: UserRole,
): boolean {

    const policy = getRolePolicy(role);

    if (!policy) {
        return false;
    }

    return policy.canDelegateTo.includes(targetRole);
}