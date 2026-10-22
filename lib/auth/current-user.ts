import type {
    UserRole,
    TenantType,
} from "@/types/user.types";

import type {
    AccessContext,
} from "@/lib/auth/access-control";

/* =========================================================
   AUTHENTICATED USER
   ========================================================= */

export interface AuthenticatedUser {
    id: string;
    name: string;

    role: UserRole;
    tenant: TenantType;

    tenantId: string;

    departmentId?: string;
    programmeId?: string;
    batchId?: string;
    cohortId?: string;
    courseId?: string;
    learnerId?: string;
}

/* =========================================================
   CURRENT USER ACCESS CONTEXT
   ========================================================= */

/**
 * Converts the authenticated user/session object
 * into the AccessContext used by the access-control engine.
 *
 * IMPORTANT:
 * Do not manually create tenant/role information
 * separately inside every page.
 *
 * All pages should use this context.
 */
export function createAccessContext(
    user: AuthenticatedUser,
): AccessContext {
    return {
        userId: user.id,

        role: user.role,

        tenant: user.tenant,

        departmentId: user.departmentId,

        programmeId: user.programmeId,

        batchId: user.batchId,

        cohortId: user.cohortId,

        courseId: user.courseId,

        learnerId: user.learnerId,
    };
}

/* =========================================================
   CURRENT USER STORAGE
   ========================================================= */

/**
 * Temporary client-side implementation.
 *
 * Later this should be replaced by your actual
 * authenticated session/API response.
 *
 * DO NOT use localStorage as the final security layer.
 * Backend/API must validate the real authenticated user.
 */
const CURRENT_USER_STORAGE_KEY =
    "neurolxp_current_user";

/**
 * Save authenticated user.
 */
export function setCurrentUser(
    user: AuthenticatedUser,
): void {
    if (typeof window === "undefined") {
        return;
    }

    window.localStorage.setItem(
        CURRENT_USER_STORAGE_KEY,
        JSON.stringify(user),
    );
}

/**
 * Get authenticated user.
 */
export function getCurrentUser():
    | AuthenticatedUser
    | null {
    if (typeof window === "undefined") {
        return null;
    }

    const storedUser =
        window.localStorage.getItem(
            CURRENT_USER_STORAGE_KEY,
        );

    if (!storedUser) {
        return null;
    }

    try {
        const parsed: unknown =
            JSON.parse(storedUser);

        if (!isAuthenticatedUser(parsed)) {
            return null;
        }

        return parsed;
    } catch {
        return null;
    }
}

/**
 * Remove current user.
 */
export function clearCurrentUser(): void {
    if (typeof window === "undefined") {
        return;
    }

    window.localStorage.removeItem(
        CURRENT_USER_STORAGE_KEY,
    );
}

/* =========================================================
   ACCESS CONTEXT HELPER
   ========================================================= */

/**
 * Returns the current user's AccessContext.
 *
 * Returns null when no authenticated user exists.
 */
export function getCurrentAccessContext():
    | AccessContext
    | null {
    const user = getCurrentUser();

    if (!user) {
        return null;
    }

    return createAccessContext(user);
}

/* =========================================================
   TYPE GUARD
   ========================================================= */

function isAuthenticatedUser(
    value: unknown,
): value is AuthenticatedUser {
    if (
        typeof value !== "object" ||
        value === null
    ) {
        return false;
    }

    const user =
        value as Record<string, unknown>;

    return (
        typeof user.id === "string" &&
        typeof user.name === "string" &&
        typeof user.role === "string" &&
        typeof user.tenant === "string" &&
        typeof user.tenantId === "string"
    );
}