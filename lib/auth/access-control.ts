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

export interface AccessContext {
    /**
     * Authenticated user ID.
     */
    userId: string;

    /**
     * Current authenticated role.
     */
    role: UserRole;

    /**
     * Tenant type.
     */
    tenant: TenantType;

    /**
     * IMPORTANT:
     * Actual tenant / organization ID.
     *
     * Example:
     * tenantId = "TENANT-001"
     */
    tenantId?: string;

    /**
     * Optional organization / business-unit scope.
     */
    organizationId?: string;

    /**
     * Optional department scope.
     */
    departmentId?: string;

    /**
     * Optional academic programme scope.
     */
    programmeId?: string;

    /**
     * Single batch scope.
     *
     * Kept for backward compatibility.
     */
    batchId?: string;

    /**
     * Multiple assigned batches.
     */
    batchIds?: string[];

    /**
     * Single cohort scope.
     *
     * Kept for backward compatibility.
     */
    cohortId?: string;

    /**
     * Multiple assigned cohorts.
     */
    cohortIds?: string[];

    /**
     * Single course scope.
     *
     * Kept for backward compatibility.
     */
    courseId?: string;

    /**
     * Multiple assigned courses.
     */
    courseIds?: string[];

    /**
     * Learner-specific scope.
     */
    learnerId?: string;
}


/* =========================================================
   RESOURCE CONTEXT
   ========================================================= */

export interface ResourceContext {
    /**
     * Actual tenant ID owning the resource.
     */
    tenantId?: string;

    /**
     * Organization / business unit.
     */
    organizationId?: string;

    /**
     * Department.
     */
    departmentId?: string;

    /**
     * Academic programme.
     */
    programmeId?: string;

    /**
     * Batch.
     */
    batchId?: string;

    /**
     * Cohort.
     */
    cohortId?: string;

    /**
     * Course.
     */
    courseId?: string;

    /**
     * Learner.
     */
    learnerId?: string;
}


/* =========================================================
   ROLE / TENANT VALIDATION
   ========================================================= */

/**
 * Checks whether the current role is permitted
 * for the current tenant type.
 */
export function isUserAllowedForTenant(
    context: AccessContext,
): boolean {
    if (!context.userId) {
        return false;
    }

    if (!context.role || !context.tenant) {
        return false;
    }

    return isRoleAllowedForTenant(
        context.role,
        context.tenant,
    );
}


/* =========================================================
   TENANT ISOLATION
   ========================================================= */

/**
 * Checks whether a resource belongs to the
 * authenticated user's tenant.
 *
 * IMPORTANT:
 * tenant is the tenant TYPE:
 *
 *     corporate
 *     university
 *     ngo
 *     etc.
 *
 * tenantId is the actual tenant / organization ID:
 *
 *     TENANT-001
 *     TENANT-002
 *
 * Therefore tenantId must be compared with tenantId,
 * NOT with tenant type.
 */
export function isResourceInUserTenant(
    context: AccessContext,
    resource?: ResourceContext,
): boolean {
    if (!resource?.tenantId) {
        return true;
    }

    /**
     * A resource has a tenant ID but the authenticated
     * context does not have one.
     *
     * Fail closed.
     */
    if (!context.tenantId) {
        return false;
    }

    return resource.tenantId === context.tenantId;
}


/* =========================================================
   ORGANIZATION ISOLATION
   ========================================================= */

export function isResourceInUserOrganization(
    context: AccessContext,
    resource?: ResourceContext,
): boolean {
    if (!resource?.organizationId) {
        return true;
    }

    if (!context.organizationId) {
        return false;
    }

    return (
        resource.organizationId ===
        context.organizationId
    );
}


/* =========================================================
   BASIC PERMISSION CHECK
   ========================================================= */

/**
 * Checks whether a role has a specific permission.
 *
 * This is a permission-only check.
 *
 * For resource-level access use canAccess().
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
     * Verify that this role policy actually supports
     * the current tenant type.
     */
    if (
        Array.isArray(policy.tenants) &&
        !policy.tenants.includes(context.tenant)
    ) {
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
 * Higher number = broader organizational access.
 *
 * tenant
 *   ↓
 * organization
 *   ↓
 * department
 *   ↓
 * programme
 *   ↓
 * batch / cohort
 *   ↓
 * course
 *   ↓
 * learner
 */
function getScopeRank(
    scope: PermissionScope,
): number {
    switch (scope) {
        case "tenant":
            return 100;

        case "organization":
            return 90;

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
   ID MATCH HELPERS
   ========================================================= */

function matchesSingleOrMultiple(
    singleId: string | undefined,
    multipleIds: string[] | undefined,
    resourceId: string | undefined,
): boolean {
    if (!resourceId) {
        return false;
    }

    if (
        singleId &&
        singleId === resourceId
    ) {
        return true;
    }

    if (
        multipleIds?.includes(resourceId)
    ) {
        return true;
    }

    return false;
}


/* =========================================================
   EXACT SCOPE MATCH
   ========================================================= */

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

        case "organization":
            return Boolean(
                context.organizationId &&
                resource.organizationId &&
                context.organizationId ===
                    resource.organizationId,
            );

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
            return matchesSingleOrMultiple(
                context.batchId,
                context.batchIds,
                resource.batchId,
            );

        case "cohort":
            return matchesSingleOrMultiple(
                context.cohortId,
                context.cohortIds,
                resource.cohortId,
            );

        case "course":
            return matchesSingleOrMultiple(
                context.courseId,
                context.courseIds,
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
   BROADER SCOPE ACCESS
   ========================================================= */

/**
 * Checks whether a broader scope owned by the user
 * can access a narrower resource.
 *
 * Example:
 *
 * Manager:
 *     departmentId = D01
 *
 * Course:
 *     departmentId = D01
 *
 * Result:
 *     allowed
 *
 *
 * Trainer:
 *     courseIds = [C01, C02]
 *
 * Course:
 *     courseId = C02
 *
 * Result:
 *     allowed
 */
function hasBroaderScopeAccess(
    context: AccessContext,
    requiredScope: PermissionScope,
    resource: ResourceContext,
): boolean {
    const requiredRank =
        getScopeRank(requiredScope);

    const broaderScopes: Array<{
        scope: PermissionScope;
        ids: string[];
    }> = [];

    if (context.organizationId) {
        broaderScopes.push({
            scope: "organization",
            ids: [context.organizationId],
        });
    }

    if (context.departmentId) {
        broaderScopes.push({
            scope: "department",
            ids: [context.departmentId],
        });
    }

    if (context.programmeId) {
        broaderScopes.push({
            scope: "programme",
            ids: [context.programmeId],
        });
    }

    const batchIds = [
        ...(context.batchId
            ? [context.batchId]
            : []),
        ...(context.batchIds ?? []),
    ];

    if (batchIds.length) {
        broaderScopes.push({
            scope: "batch",
            ids: Array.from(
                new Set(batchIds),
            ),
        });
    }

    const cohortIds = [
        ...(context.cohortId
            ? [context.cohortId]
            : []),
        ...(context.cohortIds ?? []),
    ];

    if (cohortIds.length) {
        broaderScopes.push({
            scope: "cohort",
            ids: Array.from(
                new Set(cohortIds),
            ),
        });
    }

    const courseIds = [
        ...(context.courseId
            ? [context.courseId]
            : []),
        ...(context.courseIds ?? []),
    ];

    if (courseIds.length) {
        broaderScopes.push({
            scope: "course",
            ids: Array.from(
                new Set(courseIds),
            ),
        });
    }

    for (const userScope of broaderScopes) {
        const userRank =
            getScopeRank(userScope.scope);

        /**
         * User scope must be broader than
         * the required resource scope.
         */
        if (userRank <= requiredRank) {
            continue;
        }

        switch (userScope.scope) {
            case "organization":
                if (
                    resource.organizationId &&
                    userScope.ids.includes(
                        resource.organizationId,
                    )
                ) {
                    return true;
                }
                break;

            case "department":
                if (
                    resource.departmentId &&
                    userScope.ids.includes(
                        resource.departmentId,
                    )
                ) {
                    return true;
                }
                break;

            case "programme":
                if (
                    resource.programmeId &&
                    userScope.ids.includes(
                        resource.programmeId,
                    )
                ) {
                    return true;
                }
                break;

            case "batch":
                if (
                    resource.batchId &&
                    userScope.ids.includes(
                        resource.batchId,
                    )
                ) {
                    return true;
                }
                break;

            case "cohort":
                if (
                    resource.cohortId &&
                    userScope.ids.includes(
                        resource.cohortId,
                    )
                ) {
                    return true;
                }
                break;

            case "course":
                if (
                    resource.courseId &&
                    userScope.ids.includes(
                        resource.courseId,
                    )
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
   SCOPE ACCESS
   ========================================================= */

export function hasScopeAccess(
    context: AccessContext,
    requiredScope: PermissionScope,
    resource?: ResourceContext,
): boolean {
    /**
     * Validate user first.
     */
    if (!isUserAllowedForTenant(context)) {
        return false;
    }

    /**
     * Tenant isolation.
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
     * Organization isolation.
     *
     * Only enforce this when the resource explicitly
     * belongs to an organization.
     */
    if (
        resource?.organizationId &&
        !isResourceInUserOrganization(
            context,
            resource,
        )
    ) {
        /**
         * A tenant-level user can still access
         * resources across organizations within
         * their tenant.
         */
        if (requiredScope !== "tenant") {
            return false;
        }
    }

    /**
     * Tenant-level permission.
     */
    if (requiredScope === "tenant") {
        return true;
    }

    /**
     * Organization-level permission.
     */
    if (requiredScope === "organization") {
        return Boolean(
            context.organizationId &&
            resource?.organizationId &&
            context.organizationId ===
                resource.organizationId,
        );
    }

    /**
     * Resource is required for all narrower scopes.
     */
    if (!resource) {
        return false;
    }

    /**
     * Exact scope match.
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
     * Broader scope can access narrower resource.
     */
    return hasBroaderScopeAccess(
        context,
        requiredScope,
        resource,
    );
}


/* =========================================================
   COMPLETE ACCESS CHECK
   ========================================================= */

/**
 * MAIN ACCESS FUNCTION.
 *
 * Use this for:
 *
 * - Page access
 * - Menu visibility
 * - Button visibility
 * - Course actions
 * - Training actions
 * - Batch actions
 * - Assessment actions
 * - Publishing
 * - Reviewing
 * - API guards later
 */
export function canAccess(
    context: AccessContext,
    permissionKey: string,
    resource?: ResourceContext,
): boolean {
    /**
     * Get permission definition.
     */
    const permission = getPermission(
        context,
        permissionKey,
    );

    if (!permission) {
        return false;
    }

    /**
     * Tenant isolation.
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
     * Scope validation.
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
 * Important:
 *
 * A user cannot delegate merely because they possess
 * the permission.
 *
 * The role policy must explicitly allow delegation.
 */
export function canDelegatePermission(
    context: AccessContext,
    permissionKey: string,
    targetRole: UserRole,
): boolean {
    /**
     * Validate current user.
     */
    if (!isUserAllowedForTenant(context)) {
        return false;
    }

    const policy = getRolePolicy(
        context.role,
    );

    if (!policy) {
        return false;
    }

    /**
     * Current role must have delegation authority.
     */
    if (!policy.canDelegatePermissions) {
        return false;
    }

    /**
     * Target role must be explicitly allowed.
     */
    if (
        !policy.canDelegateTo.includes(
            targetRole,
        )
    ) {
        return false;
    }

    /**
     * Permission must exist in the current
     * role's policy.
     */
    const permission =
        policy.permissions.find(
            (item) =>
                item.key === permissionKey,
        );

    if (!permission) {
        return false;
    }

    /**
     * Permission must explicitly allow
     * delegation.
     */
    if (!permission.delegatable) {
        return false;
    }

    return true;
}


/* =========================================================
   UI ACCESS FLAGS
   ========================================================= */

/**
 * Permission-only UI flags.
 *
 * Use when the UI only needs to know whether the
 * logged-in role has a permission.
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
   RESOURCE ACCESS FLAGS
   ========================================================= */

/**
 * Resource-aware permission flags.
 *
 * Example:
 *
 * Trainer opens Course C01.
 *
 * The trainer may have:
 *
 * course.edit
 * course.review
 *
 * but only if C01 is actually assigned
 * to the trainer.
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
 * Convenience helper for pages.
 *
 * Returns:
 *
 * true  -> allowed
 * false -> denied
 *
 * The page can redirect when false.
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
 * Returns all permissions defined for the
 * authenticated role.
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

    if (
        Array.isArray(policy.tenants) &&
        !policy.tenants.includes(context.tenant)
    ) {
        return [];
    }

    return policy.permissions;
}


/* =========================================================
   MULTIPLE PERMISSIONS
   ========================================================= */

/**
 * User must have ALL supplied permissions.
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
 * User must have ANY supplied permission.
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
 * User must have ALL permissions against
 * the specified resource.
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
 * User must have ANY permission against
 * the specified resource.
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


/* =========================================================
   ASSIGNED RESOURCE HELPERS
   ========================================================= */

/**
 * Check whether a batch is assigned to the user.
 */
export function hasBatchAccess(
    context: AccessContext,
    batchId: string,
): boolean {
    if (!batchId) {
        return false;
    }

    return matchesSingleOrMultiple(
        context.batchId,
        context.batchIds,
        batchId,
    );
}


/**
 * Check whether a cohort is assigned to the user.
 */
export function hasCohortAccess(
    context: AccessContext,
    cohortId: string,
): boolean {
    if (!cohortId) {
        return false;
    }

    return matchesSingleOrMultiple(
        context.cohortId,
        context.cohortIds,
        cohortId,
    );
}


/**
 * Check whether a course is assigned to the user.
 */
export function hasCourseAccess(
    context: AccessContext,
    courseId: string,
): boolean {
    if (!courseId) {
        return false;
    }

    return matchesSingleOrMultiple(
        context.courseId,
        context.courseIds,
        courseId,
    );
}


/* =========================================================
   TENANT-SAFE RESOURCE ACCESS
   ========================================================= */

/**
 * Combined helper for pages that need to verify
 * tenant + permission + resource scope.
 */
export function canAccessResource(
    context: AccessContext,
    permissionKey: string,
    resource: ResourceContext,
): boolean {
    if (!resource.tenantId) {
        return false;
    }

    if (!context.tenantId) {
        return false;
    }

    if (
        resource.tenantId !==
        context.tenantId
    ) {
        return false;
    }

    return canAccess(
        context,
        permissionKey,
        resource,
    );
}