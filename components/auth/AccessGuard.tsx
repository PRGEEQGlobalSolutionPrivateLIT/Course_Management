"use client";

import React, { ReactNode } from "react";

import {
    canAccess,
    canAccessAll,
    canAccessAny,
    type AccessContext,
    type ResourceContext,
} from "@/lib/auth/access-control";

/* =========================================================
   TYPES
   ========================================================= */

export interface AccessGuardProps {
    /**
     * Current authenticated user's access context.
     */
    context: AccessContext;

    /**
     * Permission required for access.
     */
    permission?: string;

    /**
     * Multiple permissions.
     */
    permissions?: string[];

    /**
     * How multiple permissions should be evaluated.
     *
     * all:
     * User must have every permission.
     *
     * any:
     * User must have at least one permission.
     */
    mode?: "all" | "any";

    /**
     * Optional resource information.
     *
     * Used for tenant / department / programme /
     * batch / cohort / course / learner scope validation.
     */
    resource?: ResourceContext;

    /**
     * Content displayed when access is granted.
     */
    children: ReactNode;

    /**
     * Optional fallback content when access is denied.
     *
     * If not supplied, nothing is rendered.
     */
    fallback?: ReactNode;

    /**
     * Optional flag to hide the component completely
     * instead of displaying fallback content.
     *
     * Default: true.
     */
    hideWhenDenied?: boolean;
}

/* =========================================================
   ACCESS GUARD
   ========================================================= */

/**
 * AccessGuard
 *
 * Central UI-level authorization component.
 *
 * It does NOT replace backend authorization.
 *
 * Backend/API endpoints must independently validate:
 * - authenticated user
 * - tenant
 * - role
 * - permission
 * - organizational scope
 */
export default function AccessGuard({
    context,
    permission,
    permissions = [],
    mode = "all",
    resource,
    children,
    fallback = null,
    hideWhenDenied = true,
}: AccessGuardProps) {
    /* -----------------------------------------------------
       BASIC VALIDATION
       ----------------------------------------------------- */

    if (!context) {
        return hideWhenDenied ? null : <>{fallback}</>;
    }

    /* -----------------------------------------------------
       SINGLE PERMISSION
       ----------------------------------------------------- */

    if (permission) {
        const allowed = canAccess(
            context,
            permission,
            resource,
        );

        if (allowed) {
            return <>{children}</>;
        }

        return hideWhenDenied ? null : <>{fallback}</>;
    }

    /* -----------------------------------------------------
       MULTIPLE PERMISSIONS
       ----------------------------------------------------- */

    if (permissions.length > 0) {
        const allowed =
            mode === "any"
                ? canAccessAny(
                      context,
                      permissions,
                      resource,
                  )
                : canAccessAll(
                      context,
                      permissions,
                      resource,
                  );

        if (allowed) {
            return <>{children}</>;
        }

        return hideWhenDenied ? null : <>{fallback}</>;
    }

    /* -----------------------------------------------------
       NO PERMISSION SPECIFIED
       ----------------------------------------------------- */

    /**
     * Fail closed.
     *
     * A guard without a permission requirement should
     * not automatically expose protected functionality.
     */
    return hideWhenDenied ? null : <>{fallback}</>;
}

/* =========================================================
   SPECIALIZED GUARDS
   ========================================================= */

/**
 * Require one permission.
 */
export interface RequirePermissionProps
    extends Omit<
        AccessGuardProps,
        "permission" | "permissions" | "mode"
    > {
    permission: string;
}

export function RequirePermission({
    permission,
    ...props
}: RequirePermissionProps) {
    return (
        <AccessGuard
            {...props}
            permission={permission}
        />
    );
}

/**
 * Require ALL permissions.
 */
export interface RequireAllPermissionsProps
    extends Omit<
        AccessGuardProps,
        "permission" | "permissions" | "mode"
    > {
    permissions: string[];
}

export function RequireAllPermissions({
    permissions,
    ...props
}: RequireAllPermissionsProps) {
    return (
        <AccessGuard
            {...props}
            permissions={permissions}
            mode="all"
        />
    );
}

/**
 * Require ANY permission.
 */
export interface RequireAnyPermissionProps
    extends Omit<
        AccessGuardProps,
        "permission" | "permissions" | "mode"
    > {
    permissions: string[];
}

export function RequireAnyPermission({
    permissions,
    ...props
}: RequireAnyPermissionProps) {
    return (
        <AccessGuard
            {...props}
            permissions={permissions}
            mode="any"
        />
    );
}