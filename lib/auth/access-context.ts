import type {
    PermissionDefinition,
    PermissionScope,
} from "@/types/permission.types";

import type {
    UserRole,
    TenantType,
} from "@/types/user.types";

import {
    getRolePolicy,
    isRoleAllowedForTenant,
    roleHasPermission,
} from "@/types/permission.types";

/* =========================================================
   ACCESS CONTEXT
   ========================================================= */

/**
 * Information about the currently authenticated user.
 *
 * tenant      = tenant category/type
 * tenantId    = actual organization/tenant record ID
 *
 * Examples:
 *
 * Corporate
 *   tenant = "corporate"
 *   tenantId = "ORG_001"
 *
 * University
 *   tenant = "university"
 *   tenantId = "UNI_001"
 */
export interface AccessContext {
    userId: string;

    role: UserRole;

    tenant: TenantType;

    /**
     * Actual tenant / organization ID from database.
     *
     * This is important for tenant isolation.
     */
    tenantId?: string;

    /**
     * Organisational scope assigned to the user.
     *
     * Depending on tenant and role, one or more of these
     * may be populated.
     */
    departmentId?: string;

    programmeId?: string;

    batchId?: string;

    cohortId?: string;

    courseId?: string;

    learnerId?: string;
}


/* =========================================================
   RESOURCE CONTEXT
   ========================================================= */

/**
 * Identifies the resource against which access is being checked.
 *
 * Example:
 *
 * Course
 *   tenantId
 *   departmentId
 *   courseId
 *
 * Batch
 *   tenantId
 *   departmentId
 *   batchId
 *
 * Learner
 *   tenantId
 *   cohortId
 *   learnerId
 */
export interface ResourceContext {
    /**
     * Actual database tenant / organization ID.
     */
    tenantId?: string;

    departmentId?: string;

    programmeId?: string;

    batchId?: string;

    cohortId?: string;

    courseId?: string;

    learnerId?: string;
}


/* =========================================================
   ROLE / TENANT VALIDATION
   ========================================================= */

/**
 * Checks whether:
 *
 * 1. User exists
 * 2. Role exists
 * 3. Tenant exists
 * 4. Role is allowed for the tenant type
 */
export function isUserAllowedForTenant(
    context: AccessContext,
): boolean {
    if (!context) {
        return false;
    }

    if (!context.userId) {
        return false;
    }

    if (!context.role) {
        return false;
    }

    if (!context.tenant) {
        return false;
    }

    return isRoleAllowedForTenant(
        context.role,
        context.tenant,
    );
}


/* =========================================================
   RESOURCE / TENANT ISOLATION
   ========================================================= */

/**
 * Ensures that a resource belongs to the same tenant
 * as the authenticated user.
 *
 * IMPORTANT:
 *
 * context.tenantId
 *     = actual authenticated tenant ID
 *
 * resource.tenantId
 *     = tenant ID stored against the resource
 *
 * Example:
 *
 * User:
 *   tenant = corporate
 *   tenantId = CORP_001
 *
 * Course:
 *   tenantId = CORP_001
 *
 * Result:
 *   true
 *
 * Another company's course:
 *   tenantId = CORP_002
 *
 * Result:
 *   false
 */
export function isResourceInUserTenant(
    context: AccessContext,
    resource?: ResourceContext,
): boolean {
    /**
     * If there is no resource, there is nothing to validate.
     *
     * The calling function will decide whether the resource
     * itself is required for the permission.
     */
    if (!resource) {
        return true;
    }

    /**
     * If the resource does not contain tenant information,
     * we cannot perform tenant comparison here.
     *
     * Backend/API layer must still enforce tenant isolation.
     */
    if (!resource.tenantId) {
        return true;
    }

    /**
     * If the authenticated context does not contain a tenant ID,
     * fail closed for a resource that explicitly contains one.
     */
    if (!context.tenantId) {
        return false;
    }

    return resource.tenantId === context.tenantId;
}


/* =========================================================
   BASIC PERMISSION CHECK
   ========================================================= */

/**
 * Checks:
 *
 * 1. Valid user
 * 2. Valid role
 * 3. Valid tenant type
 * 4. Role is allowed for tenant
 * 5. Permission exists for role
 *
 * This checks permission only.
 *
 * It does NOT check course / batch / department scope.
 *
 * For resource-aware checking use canAccess().
 */
export function hasPermission(
    context: AccessContext,
    permissionKey: string,
): boolean {
    if (!permissionKey) {
        return false;
    }

    if (!isUserAllowedForTenant(context)) {
        return false;
    }

    return roleHasPermission(
        context.role,
        context.tenant,
        permissionKey,
    );
}


/* =========================================================
   GET PERMISSION DEFINITION
   ========================================================= */

/**
 * Returns the complete permission definition
 * available to the user's role.
 */
export function getPermission(
    context: AccessContext,
    permissionKey: string,
): PermissionDefinition | null {
    if (!permissionKey) {
        return null;
    }

    if (!isUserAllowedForTenant(context)) {
        return null;
    }

    const policy = getRolePolicy(
        context.role,
    );

    if (!policy) {
        return null;
    }

    /**
     * Ensure the role policy actually supports
     * the current tenant type.
     */
    if (!policy.tenants.includes(context.tenant)) {
        return null;
    }

    return (
        policy.permissions.find(
            (permission) =>
                permission.key === permissionKey,
        ) ?? null
    );
}


/* =========================================================
   SCOPE RANK
   ========================================================= */

/**
 * Higher number = broader scope.
 *
 * tenant
 *     ↓
 * department
 *     ↓
 * programme
 *     ↓
 * batch / cohort
 *     ↓
 * course
 *     ↓
 * learner
 *
 * Batch and cohort are treated as parallel scopes.
 */
function getScopeRank(
    scope: PermissionScope,
): number {
    switch (scope) {
        case "tenant":
            return 100;

        case "department":
            return 80;

        case "programme":
            return 70;

        case "batch":
        case "cohort":
            return 60;

        case "course":
            return 50;

        case "learner":
            return 40;

        default:
            return 0;
    }
}


/* =========================================================
   SCOPE ID MATCH
   ========================================================= */

/**
 * Checks whether the user's assigned scope directly
 * matches the requested resource scope.
 */
function matchesScope(
    context: AccessContext,
    requiredScope: PermissionScope,
    resource?: ResourceContext,
): boolean {
    if (!resource) {
        return false;
    }

    switch (requiredScope) {
        case "tenant":
            return true;

        case "department":
            return Boolean(
                context.departmentId &&
                resource.departmentId &&
                context.departmentId ===
                    resource.departmentId,
            );

        case "programme":
            return Boolean(
                context.programmeId &&
                resource.programmeId &&
                context.programmeId ===
                    resource.programmeId,
            );

        case "batch":
            return Boolean(
                context.batchId &&
                resource.batchId &&
                context.batchId ===
                    resource.batchId,
            );

        case "cohort":
            return Boolean(
                context.cohortId &&
                resource.cohortId &&
                context.cohortId ===
                    resource.cohortId,
            );

        case "course":
            return Boolean(
                context.courseId &&
                resource.courseId &&
                context.courseId ===
                    resource.courseId,
            );

        case "learner":
            return Boolean(
                context.learnerId &&
                resource.learnerId &&
                context.learnerId ===
                    resource.learnerId,
            );

        default:
            return false;
    }
}


/* =========================================================
   SCOPE ACCESS
   ========================================================= */

/**
 * Checks whether the user has access to the
 * requested organisational scope.
 *
 * Examples:
 *
 * Corporate Admin
 *     → tenant
 *
 * Manager
 *     → department
 *
 * Trainer
 *     → batch / cohort / course
 *
 * Learner
 *     → learner
 */
export function hasScopeAccess(
    context: AccessContext,
    requiredScope: PermissionScope,
    resource?: ResourceContext,
): boolean {
    if (!isUserAllowedForTenant(context)) {
        return false;
    }

    /**
     * -----------------------------------------------------
     * TENANT ISOLATION
     * -----------------------------------------------------
     */
    if (
        resource?.tenantId &&
        !isResourceInUserTenant(
            context,
            resource,
        )
    ) {
        return false;
    }

    /**
     * -----------------------------------------------------
     * TENANT LEVEL
     * -----------------------------------------------------
     *
     * A tenant-level permission allows access to
     * resources inside the authenticated tenant.
     */
    if (requiredScope === "tenant") {
        return true;
    }

    /**
     * -----------------------------------------------------
     * RESOURCE REQUIRED
     * -----------------------------------------------------
     */
    if (!resource) {
        return false;
    }

    /**
     * -----------------------------------------------------
     * EXACT SCOPE MATCH
     * -----------------------------------------------------
     */
    if (
        matchesScope(
            context,
            requiredScope,
            resource,
        )
    ) {
        return true;
    }

    /**
     * -----------------------------------------------------
     * BROADER SCOPE ACCESS
     * -----------------------------------------------------
     *
     * Example:
     *
     * Manager
     *   departmentId = D01
     *
     * Course
     *   departmentId = D01
     *
     * Manager can access the course.
     *
     * But:
     *
     * Trainer
     *   courseId = C01
     *
     * Course
     *   courseId = C02
     *
     * Trainer cannot access C02.
     */
    const userScopes: Array<{
        scope: PermissionScope;
        id?: string;
    }> = [
        {
            scope: "department",
            id: context.departmentId,
        },
        {
            scope: "programme",
            id: context.programmeId,
        },
        {
            scope: "batch",
            id: context.batchId,
        },
        {
            scope: "cohort",
            id: context.cohortId,
        },
        {
            scope: "course",
            id: context.courseId,
        },
        {
            scope: "learner",
            id: context.learnerId,
        },
    ];

    /**
     * Check whether a broader user scope matches
     * an identifier available on the resource.
     */
    for (const userScope of userScopes) {
        if (!userScope.id) {
            continue;
        }

        /**
         * User scope must be broader than the requested
         * resource scope.
         */
        if (
            getScopeRank(userScope.scope) <=
            getScopeRank(requiredScope)
        ) {
            continue;
        }

        switch (userScope.scope) {
            case "department":
                if (
                    resource.departmentId &&
                    userScope.id ===
                        resource.departmentId
                ) {
                    return true;
                }
                break;

            case "programme":
                if (
                    resource.programmeId &&
                    userScope.id ===
                        resource.programmeId
                ) {
                    return true;
                }
                break;

            case "batch":
                if (
                    resource.batchId &&
                    userScope.id ===
                        resource.batchId
                ) {
                    return true;
                }
                break;

            case "cohort":
                if (
                    resource.cohortId &&
                    userScope.id ===
                        resource.cohortId
                ) {
                    return true;
                }
                break;

            case "course":
                if (
                    resource.courseId &&
                    userScope.id ===
                        resource.courseId
                ) {
                    return true;
                }
                break;

            default:
                break;
        }
    }

    return false;
}


/* =========================================================
   COMPLETE ACCESS CHECK
   ========================================================= */

/**
 * MAIN ACCESS FUNCTION.
 *
 * Use this from:
 *
 * - Pages
 * - Components
 * - Sidebar menus
 * - Buttons
 * - Course actions
 * - Trainer actions
 * - Manager actions
 * - API guards later
 *
 * Access requires:
 *
 * 1. Valid user
 * 2. Valid role
 * 3. Valid tenant
 * 4. Permission
 * 5. Tenant isolation
 * 6. Scope access
 */
export function canAccess(
    context: AccessContext,
    permissionKey: string,
    resource?: ResourceContext,
): boolean {
    /**
     * -----------------------------------------------------
     * PERMISSION VALIDATION
     * -----------------------------------------------------
     */
    const permission = getPermission(
        context,
        permissionKey,
    );

    if (!permission) {
        return false;
    }

    /**
     * -----------------------------------------------------
     * TENANT ISOLATION
     * -----------------------------------------------------
     */
    if (
        resource?.tenantId &&
        !isResourceInUserTenant(
            context,
            resource,
        )
    ) {
        return false;
    }

    /**
     * -----------------------------------------------------
     * SCOPE VALIDATION
     * -----------------------------------------------------
     */
    return hasScopeAccess(
        context,
        permission.scope,
        resource,
    );
}


/* =========================================================
   DELEGATION CHECK
   ========================================================= */

/**
 * Checks whether the current role can delegate
 * a permission to another role.
 *
 * Delegation requires:
 *
 * 1. Valid current user
 * 2. Valid tenant
 * 3. Current role can delegate
 * 4. Target role is allowed
 * 5. Permission belongs to current role
 * 6. Permission is delegatable
 */
export function canDelegatePermission(
    context: AccessContext,
    permissionKey: string,
    targetRole: UserRole,
): boolean {
    if (!isUserAllowedForTenant(context)) {
        return false;
    }

    const policy = getRolePolicy(
        context.role,
    );

    if (!policy) {
        return false;
    }

    if (!policy.canDelegatePermissions) {
        return false;
    }

    if (
        !policy.canDelegateTo.includes(
            targetRole,
        )
    ) {
        return false;
    }

    const permission =
        policy.permissions.find(
            (item) =>
                item.key === permissionKey,
        );

    if (!permission) {
        return false;
    }

    if (!permission.delegatable) {
        return false;
    }

    return true;
}


/* =========================================================
   GET ACCESS FLAGS
   ========================================================= */

/**
 * Returns permission flags for UI rendering.
 *
 * Example:
 *
 * const flags = getAccessFlags(
 *     context,
 *     [
 *         "course.create",
 *         "course.edit",
 *         "course.publish",
 *     ],
 * );
 *
 * flags["course.create"]
 * flags["course.edit"]
 * flags["course.publish"]
 *
 * NOTE:
 *
 * This performs permission-level checks only.
 *
 * If course / batch / department scope is required,
 * use getResourceAccessFlags().
 */
export function getAccessFlags(
    context: AccessContext,
    permissionKeys: string[],
): Record<string, boolean> {
    return permissionKeys.reduce(
        (
            result,
            permissionKey,
        ) => {
            result[permissionKey] =
                hasPermission(
                    context,
                    permissionKey,
                );

            return result;
        },
        {} as Record<string, boolean>,
    );
}


/* =========================================================
   GET RESOURCE ACCESS FLAGS
   ========================================================= */

/**
 * Resource-aware version of getAccessFlags().
 *
 * Use this on pages where permissions depend on:
 *
 * - Course
 * - Batch
 * - Cohort
 * - Department
 * - Programme
 * - Learner
 */
export function getResourceAccessFlags(
    context: AccessContext,
    permissionKeys: string[],
    resource?: ResourceContext,
): Record<string, boolean> {
    return permissionKeys.reduce(
        (
            result,
            permissionKey,
        ) => {
            result[permissionKey] =
                canAccess(
                    context,
                    permissionKey,
                    resource,
                );

            return result;
        },
        {} as Record<string, boolean>,
    );
}


/* =========================================================
   REQUIRE ACCESS
   ========================================================= */

/**
 * Convenience helper for page-level checks.
 *
 * Returns:
 *
 * true  → access allowed
 * false → access denied
 *
 * The page can redirect the user to an
 * unauthorized page when this returns false.
 */
export function requireAccess(
    context: AccessContext,
    permissionKey: string,
    resource?: ResourceContext,
): boolean {
    return canAccess(
        context,
        permissionKey,
        resource,
    );
}


/* =========================================================
   GET USER PERMISSIONS
   ========================================================= */

/**
 * Returns all permissions available to the user's
 * role within the current tenant type.
 */
export function getUserPermissions(
    context: AccessContext,
): PermissionDefinition[] {
    if (!isUserAllowedForTenant(context)) {
        return [];
    }

    const policy = getRolePolicy(
        context.role,
    );

    if (!policy) {
        return [];
    }

    if (!policy.tenants.includes(context.tenant)) {
        return [];
    }

    return policy.permissions;
}


/* =========================================================
   CHECK MULTIPLE PERMISSIONS
   ========================================================= */

/**
 * Checks whether the user has ALL supplied permissions.
 *
 * Permission-level check only.
 */
export function hasAllPermissions(
    context: AccessContext,
    permissionKeys: string[],
): boolean {
    if (!permissionKeys.length) {
        return false;
    }

    return permissionKeys.every(
        (permissionKey) =>
            hasPermission(
                context,
                permissionKey,
            ),
    );
}


/**
 * Checks whether the user has ANY supplied permissions.
 *
 * Permission-level check only.
 */
export function hasAnyPermission(
    context: AccessContext,
    permissionKeys: string[],
): boolean {
    if (!permissionKeys.length) {
        return false;
    }

    return permissionKeys.some(
        (permissionKey) =>
            hasPermission(
                context,
                permissionKey,
            ),
    );
}


/* =========================================================
   RESOURCE-AWARE MULTIPLE PERMISSIONS
   ========================================================= */

/**
 * Checks whether the user has ALL supplied permissions
 * against a specific resource.
 */
export function canAccessAll(
    context: AccessContext,
    permissionKeys: string[],
    resource?: ResourceContext,
): boolean {
    if (!permissionKeys.length) {
        return false;
    }

    return permissionKeys.every(
        (permissionKey) =>
            canAccess(
                context,
                permissionKey,
                resource,
            ),
    );
}


/**
 * Checks whether the user has ANY supplied permission
 * against a specific resource.
 */
export function canAccessAny(
    context: AccessContext,
    permissionKeys: string[],
    resource?: ResourceContext,
): boolean {
    if (!permissionKeys.length) {
        return false;
    }

    return permissionKeys.some(
        (permissionKey) =>
            canAccess(
                context,
                permissionKey,
                resource,
            ),
    );
}