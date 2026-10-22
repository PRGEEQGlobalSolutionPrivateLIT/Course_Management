/**
 * =========================================================
 * USER / TENANT / ACCESS TYPES
 * =========================================================
 *
 * This file defines the common identity and organizational
 * structures used across all tenant types.
 *
 * Supported tenants:
 * - University
 * - Corporate
 * - Skill Academy
 * - Bootcamp
 * - NGO
 * - Government
 *
 * The same access model is used across all tenants.
 * Only the role names and organizational terminology change.
 */

/**
 * =========================================================
 * USER ROLES
 * =========================================================
 */

export type UserRole =
    // University / College
    | "institute_admin"
    | "coordinator"
    | "faculty"
    | "student"

    // Corporate
    | "corporate_admin"
    | "manager"
    | "trainer"
    | "employee"

    // Skill Academy
    | "academy_admin"
    | "mentor"
    | "learner"

    // Bootcamp
    | "bootcamp_admin"
    | "program_manager"

    // NGO
    | "ngo_admin"
    | "program_coordinator"
    | "ngo_trainer"
    | "beneficiary"

    // Government
    | "government_admin"
    | "program_officer"
    | "government_trainer"
    | "participant";


/**
 * =========================================================
 * TENANT TYPES
 * =========================================================
 */

export type TenantType =
    | "university"
    | "corporate"
    | "skill_academy"
    | "bootcamp"
    | "ngo"
    | "government";


/**
 * =========================================================
 * PERMISSION SCOPES
 * =========================================================
 *
 * Scope determines how broadly a permission applies.
 *
 * Example:
 *
 * tenant
 *   → entire organization
 *
 * organization
 *   → organization/business unit
 *
 * department
 *   → department
 *
 * programme
 *   → academic/training programme
 *
 * batch
 *   → assigned batch
 *
 * cohort
 *   → assigned cohort
 *
 * course
 *   → specific course
 *
 * learner
 *   → specific learner
 */

export type PermissionScope =
    | "tenant"
    | "organization"
    | "department"
    | "programme"
    | "course"
    | "batch"
    | "cohort"
    | "learner";


/**
 * =========================================================
 * PERMISSION ACTIONS
 * =========================================================
 *
 * These are the actions that can be controlled through
 * organization-level permission management.
 */

export type PermissionAction =
    | "view"
    | "create"
    | "edit"
    | "delete"
    | "upload"
    | "save"
    | "submit"
    | "review"
    | "approve"
    | "publish"
    | "unpublish"
    | "assign"
    | "evaluate"
    | "manage_users"
    | "view_reports"
    | "manage_permissions";


/**
 * =========================================================
 * USER
 * =========================================================
 *
 * Represents the authenticated user.
 *
 * Important:
 * tenantId is the actual tenant/organization identifier.
 * tenant is the tenant category/type.
 */

export interface User {

    /**
     * Unique user ID.
     */
    id: string;

    /**
     * Display name.
     */
    name: string;

    /**
     * Login email.
     */
    email?: string;

    /**
     * Current role of the user.
     */
    role: UserRole;

    /**
     * Type of tenant to which the user belongs.
     */
    tenant: TenantType;

    /**
     * Actual tenant/organization ID.
     *
     * Example:
     * corporate-001
     * university-005
     */
    tenantId: string;

    /**
     * Optional organization/business-unit ID.
     */
    organizationId?: string;

    /**
     * Department controlled by the user.
     */
    departmentId?: string;

    /**
     * Academic/training programme controlled
     * or assigned to the user.
     */
    programmeId?: string;

    /**
     * Multiple departments may be assigned.
     */
    departmentIds?: string[];

    /**
     * Multiple programmes may be assigned.
     */
    programmeIds?: string[];

    /**
     * Batches assigned to the user.
     */
    batchIds?: string[];

    /**
     * Cohorts assigned to the user.
     */
    cohortIds?: string[];

    /**
     * Courses directly assigned to the user.
     */
    courseIds?: string[];

    /**
     * Learners directly assigned to the user.
     */
    learnerIds?: string[];

    /**
     * Whether the user account is active.
     */
    active?: boolean;
}


/**
 * =========================================================
 * USER PERMISSION
 * =========================================================
 *
 * Defines one permission assigned to a user/role.
 *
 * Example:
 *
 * {
 *   action: "publish",
 *   resource: "course",
 *   scope: "course",
 *   resourceIds: ["COURSE001"]
 * }
 */

export interface UserPermission {

    /**
     * Action allowed for the user.
     */
    action: PermissionAction;

    /**
     * Resource on which the action applies.
     *
     * Examples:
     * course
     * batch
     * cohort
     * learner
     * assessment
     * report
     */
    resource: string;

    /**
     * Organizational scope of this permission.
     */
    scope: PermissionScope;

    /**
     * Specific resource IDs covered by this permission.
     *
     * Example:
     *
     * resource = "course"
     * resourceIds = ["C001", "C002"]
     */
    resourceIds?: string[];

    /**
     * Whether this permission is currently active.
     *
     * Defaults conceptually to true when omitted.
     */
    active?: boolean;

    /**
     * Whether the user may delegate this permission.
     *
     * Delegation must still pass the role hierarchy
     * and target-role validation in access-control.ts.
     */
    canDelegate?: boolean;

    /**
     * Optional expiry date for temporary permissions.
     *
     * ISO date/time string.
     *
     * Example:
     * 2026-12-31T23:59:59Z
     */
    expiresAt?: string;
}


/**
 * =========================================================
 * USER ACCESS CONTEXT
 * =========================================================
 *
 * This object represents everything required by the
 * application after authentication.
 *
 * It combines:
 *
 * User identity
 * +
 * Assigned permissions
 * +
 * Accessible organizational resources
 */

export interface UserAccessContext {

    /**
     * Authenticated user.
     */
    user: User;

    /**
     * Permissions explicitly assigned to the user.
     */
    permissions: UserPermission[];

    /**
     * Tenant IDs accessible to the user.
     */
    accessibleTenantIds?: string[];

    /**
     * Organization/business-unit IDs accessible
     * to the user.
     */
    accessibleOrganizationIds?: string[];

    /**
     * Department IDs accessible to the user.
     */
    accessibleDepartmentIds?: string[];

    /**
     * Programme IDs accessible to the user.
     */
    accessibleProgrammeIds?: string[];

    /**
     * Course IDs accessible to the user.
     */
    accessibleCourseIds?: string[];

    /**
     * Batch IDs accessible to the user.
     */
    accessibleBatchIds?: string[];

    /**
     * Cohort IDs accessible to the user.
     */
    accessibleCohortIds?: string[];

    /**
     * Learner IDs accessible to the user.
     */
    accessibleLearnerIds?: string[];
}


/**
 * =========================================================
 * USER ASSIGNMENT
 * =========================================================
 *
 * Represents organizational assignment independently
 * from permission.
 *
 * This is useful for:
 *
 * Manager → Department
 * Mentor → Programme / Cohort
 * Trainer → Batch / Course
 * Employee → Own learning
 */

export interface UserAssignment {

    /**
     * Tenant containing the assignment.
     */
    tenantId: string;

    /**
     * Optional organization/business unit.
     */
    organizationId?: string;

    /**
     * Optional department.
     */
    departmentId?: string;

    /**
     * Optional programme.
     */
    programmeId?: string;

    /**
     * Optional batch.
     */
    batchId?: string;

    /**
     * Optional cohort.
     */
    cohortId?: string;

    /**
     * Optional course.
     */
    courseId?: string;

    /**
     * Optional learner.
     */
    learnerId?: string;

    /**
     * Whether this assignment is active.
     */
    active?: boolean;
}


/**
 * =========================================================
 * DELEGATED PERMISSION
 * =========================================================
 *
 * Stores permission delegation information.
 *
 * Example:
 *
 * Corporate Admin
 *     ↓
 * Manager
 *     ↓
 * Trainer
 *
 * A lower-level user must not receive a permission
 * broader than the permission delegated to them.
 */

export interface DelegatedPermission {

    /**
     * Unique delegation ID.
     */
    id: string;

    /**
     * User who delegated the permission.
     */
    delegatedByUserId: string;

    /**
     * User receiving the permission.
     */
    delegatedToUserId: string;

    /**
     * Permission action.
     */
    action: PermissionAction;

    /**
     * Permission resource.
     */
    resource: string;

    /**
     * Scope at which the permission was delegated.
     */
    scope: PermissionScope;

    /**
     * Specific resources covered by delegation.
     */
    resourceIds?: string[];

    /**
     * Whether delegation is active.
     */
    active?: boolean;

    /**
     * Optional expiry.
     */
    expiresAt?: string;
}


/**
 * =========================================================
 * LOGIN / SESSION CONTEXT
 * =========================================================
 *
 * This is useful when the application builds the
 * authenticated context immediately after login.
 */

export interface AuthenticatedUserContext {

    /**
     * User identity.
     */
    user: User;

    /**
     * Access permissions.
     */
    permissions: UserPermission[];

    /**
     * Organizational assignments.
     */
    assignments?: UserAssignment[];

    /**
     * Whether the session is active.
     */
    authenticated: boolean;
}


/**
 * =========================================================
 * RESOURCE ACCESS
 * =========================================================
 *
 * Generic representation of a resource being accessed.
 *
 * Used by pages/components before calling access-control.
 */

export interface AccessResource {

    /**
     * Resource type.
     *
     * Examples:
     * course
     * batch
     * cohort
     * learner
     */
    resource: string;

    /**
     * Resource ID.
     */
    resourceId?: string;

    /**
     * Tenant ID.
     */
    tenantId?: string;

    /**
     * Organization ID.
     */
    organizationId?: string;

    /**
     * Department ID.
     */
    departmentId?: string;

    /**
     * Programme ID.
     */
    programmeId?: string;

    /**
     * Batch ID.
     */
    batchId?: string;

    /**
     * Cohort ID.
     */
    cohortId?: string;

    /**
     * Course ID.
     */
    courseId?: string;

    /**
     * Learner ID.
     */
    learnerId?: string;
}


/**
 * =========================================================
 * ROLE / TENANT HELPERS
 * =========================================================
 *
 * These mappings are intentionally kept simple.
 *
 * Detailed permission policy remains in
 * permission.types.ts.
 */


/**
 * Roles supported by each tenant type.
 */

export const TENANT_ROLES: Record<
    TenantType,
    readonly UserRole[]
> = {

    university: [
        "institute_admin",
        "coordinator",
        "faculty",
        "student",
    ],

    corporate: [
        "corporate_admin",
        "manager",
        "trainer",
        "employee",
    ],

    skill_academy: [
        "academy_admin",
        "mentor",
        "trainer",
        "learner",
    ],

    bootcamp: [
        "bootcamp_admin",
        "program_manager",
        "mentor",
        "trainer",
        "learner",
    ],

    ngo: [
        "ngo_admin",
        "program_coordinator",
        "ngo_trainer",
        "beneficiary",
    ],

    government: [
        "government_admin",
        "program_officer",
        "government_trainer",
        "participant",
    ],
};


/**
 * =========================================================
 * ROLE VALIDATION
 * =========================================================
 *
 * Lightweight client-side helper.
 *
 * Backend must perform the authoritative validation.
 */

export function isRoleValidForTenant(
    role: UserRole,
    tenant: TenantType,
): boolean {

    return TENANT_ROLES[tenant]?.includes(role) ?? false;
}


/**
 * =========================================================
 * USER ACTIVE CHECK
 * =========================================================
 */

export function isUserActive(
    user: User,
): boolean {

    return user.active !== false;
}


/**
 * =========================================================
 * PERMISSION ACTIVE CHECK
 * =========================================================
 *
 * Checks:
 *
 * - permission.active
 * - permission.expiresAt
 */

export function isPermissionActive(
    permission: UserPermission,
    now: Date = new Date(),
): boolean {

    if (permission.active === false) {
        return false;
    }

    if (!permission.expiresAt) {
        return true;
    }

    const expiry = new Date(
        permission.expiresAt,
    );

    if (Number.isNaN(expiry.getTime())) {
        return false;
    }

    return expiry.getTime() > now.getTime();
}