export interface TenantCapabilities {
    academicFlow: boolean;
    academicMapping: boolean;
    credits: boolean;
    courseOutcomes: boolean;
    poPsoMapping: boolean;
    attainment: boolean;
}

const DEFAULT_CAPABILITIES: TenantCapabilities = {
    academicFlow: false,
    academicMapping: false,
    credits: false,
    courseOutcomes: false,
    poPsoMapping: false,
    attainment: false,
};

export const TENANT_CAPABILITIES: Record<
    string,
    TenantCapabilities
> = {
    university: {
        academicFlow: true,
        academicMapping: true,
        credits: true,
        courseOutcomes: true,
        poPsoMapping: true,
        attainment: true,
    },

    college: {
        academicFlow: true,
        academicMapping: true,
        credits: true,
        courseOutcomes: true,
        poPsoMapping: true,
        attainment: true,
    },

    corporate: {
        ...DEFAULT_CAPABILITIES,
    },

    skill_academy: {
        ...DEFAULT_CAPABILITIES,
    },

    bootcamp: {
        ...DEFAULT_CAPABILITIES,
    },

    ngo: {
        ...DEFAULT_CAPABILITIES,
    },

    government: {
        ...DEFAULT_CAPABILITIES,
    },
};

export function normalizeTenant(
    value?: string | null
): string {
    return String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/-/g, "_")
        .replace(/\s+/g, "_");
}

export function getTenantCapabilities(
    tenant?: string | null
): TenantCapabilities {
    const normalized =
        normalizeTenant(tenant);

    return (
        TENANT_CAPABILITIES[
            normalized
        ] ??
        DEFAULT_CAPABILITIES
    );
}