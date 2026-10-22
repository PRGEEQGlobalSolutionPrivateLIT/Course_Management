import { User } from "@/types/user.types";

export const users: User[] = [
    {
        id: "USR001",
        name: "John Admin",
        role: "institute_admin",
        tenant: "university",
        tenantId: "TEN001"
    },

    {
        id: "USR002",
        name: "David Coordinator",
        role: "coordinator",
        tenant: "university",
        tenantId: "TEN001"
    },

    {
        id: "USR003",
        name: "Sarah Faculty",
        role: "faculty",
        tenant: "university",
        tenantId: "TEN001"
    },

    {
        id: "USR004",
        name: "Alex Student",
        role: "student",
        tenant: "university",
        tenantId: "TEN001"
    },

    {
        id: "COR001",
        name: "Corporate Admin",
        role: "corporate_admin",
        tenant: "corporate",
        tenantId: "TEN002"
    },

    {
        id: "NGO001",
        name: "NGO Manager",
        role: "ngo_admin",
        tenant: "ngo",
        tenantId: "TEN003"
    }
];