import type { UserRole, TenantType } from "@/types/user.types";

export interface AuthUser {
    id: string;
    name: string;
    email: string;

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

export interface AuthSession {
    authenticated: boolean;

    user: AuthUser | null;

    permissions: string[];
}