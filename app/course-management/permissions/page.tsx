"use client";

import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    Check,
    ChevronDown,
    RotateCcw,
    Save,
    Search,
    ShieldCheck,
    UserRoundCog,
} from "lucide-react";

import CourseHeader from "@/components/CourseHeader/CourseHeader";
import styles from "./page.module.css";

/* =========================================================
   TYPES
========================================================= */

type TenantKey =
    | "university"
    | "college"
    | "corporate"
    | "skill_academy"
    | "bootcamp"
    | "ngo"
    | "government";

type ActorKey =
    | "coordinator"
    | "faculty"
    | "student"
    | "manager"
    | "trainer"
    | "employee"
    | "learner"
    | "mentor"
    | "program_manager"
    | "beneficiary"
    | "program_officer"
    | "participant";

type PermissionId =
    | "course.dashboard.view"
    | "course.list.view"
    | "course.create"
    | "course.edit"
    | "course.drafts.view"
    | "course.review.view"
    | "course.review.approve"
    | "course.published.view"
    | "course.publish"
    | "course.unpublish"
    | "course.delete"
    | "course.structure.manage"
    | "course.content.manage"
    | "course.assessment.manage"
    | "course.learner.preview"
    | "course.reports.view"
    | "course.logs.view"
    | "learning.assigned.view"
    | "learning.content.access"
    | "learning.assessment.attempt"
    | "learning.progress.view";

type PermissionMap =
    Record<string, PermissionId[]>;

type TenantConfig = {
    id: TenantKey;
    name: string;
    managementLabel: string;
    pluralLabel: string;
    singularLabel: string;
    createLabel: string;
    draftLabel: string;
    publishedLabel: string;
    actors: Array<{
        id: ActorKey;
        label: string;
        type:
            | "coordinator"
            | "teaching"
            | "learner";
    }>;
};

type DirectoryUser = {
    id: string;
    userId: string;
    name: string;
    employeeId?: string;
    email?: string;
    designation?: string;
    department?: string;
    actor: ActorKey;
    tenant: TenantKey;
};

type LoggedInUser = {
    id: string;
    name: string;
    tenant: string;
    tenantName?: string;
    role: string;
    roleName?: string;
};

type StoredTenantUser = {
    id: string;
    name: string;
    role: string;
    roleName?: string;
    department?: string;
    email?: string;
    employeeId?: string;
    designation?: string;
};

type PermissionDefinition = {
    id: PermissionId;
    label: string;
    shortLabel: string;
    description: string;
    appliesTo:
        Array<
            "coordinator" |
            "teaching" |
            "learner"
        >;
};

type StoredPermissionPayload = {
    version: 3;
    updatedAt: string;
    tenant: TenantKey;
    actor: ActorKey;
    permissions: PermissionMap;
    directory: Record<
        string,
        DirectoryUser
    >;
};

type NavigationItem = {
    label: string;
    path: string;
};

/* =========================================================
   CONSTANTS
========================================================= */

const STORAGE_KEY =
    "neurolxp-course-management-permissions-v3";

const LEGACY_PERMISSION_KEY =
    "course_management_permissions";

const TENANTS:
    TenantConfig[] = [
    {
        id: "university",
        name: "University",
        managementLabel:
            "Course Management",
        pluralLabel:
            "Courses",
        singularLabel:
            "Course",
        createLabel:
            "Create Course",
        draftLabel:
            "Draft Courses",
        publishedLabel:
            "Published Courses",
        actors: [
            {
                id: "coordinator",
                label:
                    "Coordinator",
                type:
                    "coordinator",
            },
            {
                id: "faculty",
                label:
                    "Faculty",
                type:
                    "teaching",
            },
            {
                id: "student",
                label:
                    "Student",
                type:
                    "learner",
            },
        ],
    },
    {
        id: "college",
        name: "College",
        managementLabel:
            "Course Management",
        pluralLabel:
            "Courses",
        singularLabel:
            "Course",
        createLabel:
            "Create Course",
        draftLabel:
            "Draft Courses",
        publishedLabel:
            "Published Courses",
        actors: [
            {
                id: "coordinator",
                label:
                    "Coordinator",
                type:
                    "coordinator",
            },
            {
                id: "faculty",
                label:
                    "Faculty",
                type:
                    "teaching",
            },
            {
                id: "student",
                label:
                    "Student",
                type:
                    "learner",
            },
        ],
    },
    {
        id: "corporate",
        name: "Corporate",
        managementLabel:
            "Training Management",
        pluralLabel:
            "Trainings",
        singularLabel:
            "Training",
        createLabel:
            "Create Training",
        draftLabel:
            "Draft Trainings",
        publishedLabel:
            "Published Trainings",
        actors: [
            {
                id: "manager",
                label:
                    "Manager",
                type:
                    "coordinator",
            },
            {
                id: "trainer",
                label:
                    "Trainer",
                type:
                    "teaching",
            },
            {
                id: "employee",
                label:
                    "Employee",
                type:
                    "learner",
            },
        ],
    },
    {
        id: "skill_academy",
        name: "Skill Academy",
        managementLabel:
            "Academy Management",
        pluralLabel:
            "Programs",
        singularLabel:
            "Program",
        createLabel:
            "Create Program",
        draftLabel:
            "Draft Programs",
        publishedLabel:
            "Published Programs",
        actors: [
            {
                id: "trainer",
                label:
                    "Trainer",
                type:
                    "teaching",
            },
            {
                id: "learner",
                label:
                    "Learner",
                type:
                    "learner",
            },
        ],
    },
    {
        id: "bootcamp",
        name: "Bootcamp",
        managementLabel:
            "Bootcamp Management",
        pluralLabel:
            "Bootcamps",
        singularLabel:
            "Bootcamp",
        createLabel:
            "Create Bootcamp",
        draftLabel:
            "Draft Bootcamps",
        publishedLabel:
            "Published Bootcamps",
        actors: [
            {
                id: "mentor",
                label:
                    "Mentor",
                type:
                    "teaching",
            },
            {
                id: "learner",
                label:
                    "Learner",
                type:
                    "learner",
            },
        ],
    },
    {
        id: "ngo",
        name: "NGO",
        managementLabel:
            "Training Management",
        pluralLabel:
            "Trainings",
        singularLabel:
            "Training",
        createLabel:
            "Create Training",
        draftLabel:
            "Draft Trainings",
        publishedLabel:
            "Published Trainings",
        actors: [
            {
                id: "program_manager",
                label:
                    "Program Manager",
                type:
                    "coordinator",
            },
            {
                id: "trainer",
                label:
                    "Trainer",
                type:
                    "teaching",
            },
            {
                id: "beneficiary",
                label:
                    "Beneficiary",
                type:
                    "learner",
            },
        ],
    },
    {
        id: "government",
        name: "Government",
        managementLabel:
            "Training Management",
        pluralLabel:
            "Trainings",
        singularLabel:
            "Training",
        createLabel:
            "Create Training",
        draftLabel:
            "Draft Trainings",
        publishedLabel:
            "Published Trainings",
        actors: [
            {
                id: "program_officer",
                label:
                    "Program Officer",
                type:
                    "coordinator",
            },
            {
                id: "trainer",
                label:
                    "Trainer",
                type:
                    "teaching",
            },
            {
                id: "participant",
                label:
                    "Participant",
                type:
                    "learner",
            },
        ],
    },
];

const BASE_PERMISSIONS:
    PermissionDefinition[] = [
    {
        id:
            "course.dashboard.view",
        label:
            "{MANAGEMENT} Dashboard",
        shortLabel:
            "Dashboard",
        description:
            "Open the management dashboard.",
        appliesTo: [
            "coordinator",
            "teaching",
        ],
    },
    {
        id:
            "course.list.view",
        label:
            "View {PLURAL}",
        shortLabel:
            "View {PLURAL}",
        description:
            "View available management records.",
        appliesTo: [
            "coordinator",
            "teaching",
        ],
    },
    {
        id:
            "course.create",
        label:
            "{CREATE}",
        shortLabel:
            "Create",
        description:
            "Create a new {SINGULAR}.",
        appliesTo: [
            "coordinator",
            "teaching",
        ],
    },
    {
        id:
            "course.edit",
        label:
            "Edit {SINGULAR}",
        shortLabel:
            "Edit",
        description:
            "Edit an assigned or permitted {SINGULAR}.",
        appliesTo: [
            "coordinator",
            "teaching",
        ],
    },
    {
        id:
            "course.drafts.view",
        label:
            "{DRAFT}",
        shortLabel:
            "Drafts",
        description:
            "View draft records.",
        appliesTo: [
            "coordinator",
            "teaching",
        ],
    },
    {
        id:
            "course.review.view",
        label:
            "Review {PLURAL}",
        shortLabel:
            "Review",
        description:
            "Open the review queue and review details.",
        appliesTo: [
            "coordinator",
            "teaching",
        ],
    },
    {
        id:
            "course.review.approve",
        label:
            "Approve {SINGULAR}",
        shortLabel:
            "Approve",
        description:
            "Approve or request changes after review.",
        appliesTo: [
            "coordinator",
        ],
    },
    {
        id:
            "course.published.view",
        label:
            "{PUBLISHED}",
        shortLabel:
            "Published",
        description:
            "View published learning records.",
        appliesTo: [
            "coordinator",
            "teaching",
        ],
    },
    {
        id:
            "course.publish",
        label:
            "Publish {SINGULAR}",
        shortLabel:
            "Publish",
        description:
            "Publish a validated {SINGULAR}.",
        appliesTo: [
            "coordinator",
        ],
    },
    {
        id:
            "course.unpublish",
        label:
            "Unpublish {SINGULAR}",
        shortLabel:
            "Unpublish",
        description:
            "Remove learner access by unpublishing.",
        appliesTo: [
            "coordinator",
        ],
    },
    {
        id:
            "course.delete",
        label:
            "Delete {SINGULAR}",
        shortLabel:
            "Delete",
        description:
            "Delete a permitted management record.",
        appliesTo: [
            "coordinator",
        ],
    },
    {
        id:
            "course.structure.manage",
        label:
            "Manage Learning Structure",
        shortLabel:
            "Structure",
        description:
            "Create and edit modules and learning units.",
        appliesTo: [
            "coordinator",
            "teaching",
        ],
    },
    {
        id:
            "course.content.manage",
        label:
            "Manage Learning Content",
        shortLabel:
            "Content",
        description:
            "Add, edit, upload, preview, or remove learning content.",
        appliesTo: [
            "coordinator",
            "teaching",
        ],
    },
    {
        id:
            "course.assessment.manage",
        label:
            "Manage Assessments",
        shortLabel:
            "Assessment",
        description:
            "Create and manage assessments.",
        appliesTo: [
            "coordinator",
            "teaching",
        ],
    },
    {
        id:
            "course.learner.preview",
        label:
            "Learner Preview",
        shortLabel:
            "Preview",
        description:
            "Preview the learning experience before release.",
        appliesTo: [
            "coordinator",
            "teaching",
        ],
    },
    {
        id:
            "course.reports.view",
        label:
            "View Reports",
        shortLabel:
            "Reports",
        description:
            "View management and learner reports.",
        appliesTo: [
            "coordinator",
            "teaching",
        ],
    },
    {
        id:
            "course.logs.view",
        label:
            "View Logs",
        shortLabel:
            "Logs",
        description:
            "View activity and permission logs.",
        appliesTo: [
            "coordinator",
        ],
    },
    {
        id:
            "learning.assigned.view",
        label:
            "View Assigned {PLURAL}",
        shortLabel:
            "My {PLURAL}",
        description:
            "Access assigned published learning.",
        appliesTo: [
            "learner",
        ],
    },
    {
        id:
            "learning.content.access",
        label:
            "Access Learning Content",
        shortLabel:
            "Content",
        description:
            "Open permitted learning resources.",
        appliesTo: [
            "learner",
        ],
    },
    {
        id:
            "learning.assessment.attempt",
        label:
            "Attempt Assessments",
        shortLabel:
            "Assessments",
        description:
            "Open and attempt assigned assessments.",
        appliesTo: [
            "learner",
        ],
    },
    {
        id:
            "learning.progress.view",
        label:
            "View Own Progress",
        shortLabel:
            "Progress",
        description:
            "View personal progress and completion.",
        appliesTo: [
            "learner",
        ],
    },
];

/* =========================================================
   HELPERS
========================================================= */

function getTenantConfig(
    tenant:
        TenantKey
): TenantConfig {
    return (
        TENANTS.find(
            (item) =>
                item.id ===
                tenant
        ) ??
        TENANTS[0]
    );
}

function getActorConfig(
    tenant:
        TenantConfig,
    actor:
        ActorKey
) {
    return (
        tenant.actors.find(
            (item) =>
                item.id ===
                actor
        ) ??
        tenant.actors[0]
    );
}

function formatPermissionText(
    value: string,
    tenant:
        TenantConfig
): string {
    return value
        .replaceAll(
            "{MANAGEMENT}",
            tenant.managementLabel
        )
        .replaceAll(
            "{PLURAL}",
            tenant.pluralLabel
        )
        .replaceAll(
            "{SINGULAR}",
            tenant.singularLabel
        )
        .replaceAll(
            "{CREATE}",
            tenant.createLabel
        )
        .replaceAll(
            "{DRAFT}",
            tenant.draftLabel
        )
        .replaceAll(
            "{PUBLISHED}",
            tenant.publishedLabel
        );
}

function getPermissionKey(
    tenant:
        TenantKey,
    actor:
        ActorKey,
    userId:
        string
): string {
    return `${tenant}:${actor}:${userId}`;
}

function unique(
    values:
        string[]
): string[] {
    return Array.from(
        new Set(
            values.filter(
                Boolean
            )
        )
    ).sort();
}

function getDefaultPermissionIds(
    actorType:
        "coordinator" |
        "teaching" |
        "learner"
):
    PermissionId[] {
    return BASE_PERMISSIONS
        .filter(
            (permission) =>
                permission
                    .appliesTo
                    .includes(
                        actorType
                    )
        )
        .filter(
            (permission) => {
                if (
                    actorType ===
                    "coordinator"
                ) {
                    return true;
                }

                if (
                    actorType ===
                    "teaching"
                ) {
                    return ![
                        "course.publish",
                        "course.unpublish",
                        "course.delete",
                        "course.logs.view",
                        "course.review.approve",
                    ].includes(
                        permission.id
                    );
                }

                return true;
            }
        )
        .map(
            (permission) =>
                permission.id
        );
}

function loadStoredPermissionMap():
    PermissionMap {
    if (
        typeof window ===
        "undefined"
    ) {
        return {};
    }

    try {
        const raw =
            localStorage.getItem(
                STORAGE_KEY
            );

        if (!raw) {
            return {};
        }

        const parsed =
            JSON.parse(
                raw
            ) as
                StoredPermissionPayload;

        if (
            parsed.version !==
            3
        ) {
            return {};
        }

        return (
            parsed.permissions ??
            {}
        );
    } catch {
        return {};
    }
}

function buildNavigation(
    tenant:
        TenantConfig
): Array<{
    id: string;
    label: string;
    path: string;
}> {
    return [
        {
            id: "dashboard",
            label:
                "Dashboard",
            path:
                "/dashboard",
        },
        {
            id: "courses",
            label:
                tenant.pluralLabel,
            path:
                "/course-management",
        },
        {
            id: "create",
            label:
                tenant.createLabel,
            path:
                "/course-management/create",
        },
        {
            id: "drafts",
            label:
                tenant.draftLabel,
            path:
                "/course-management/draft-courses",
        },
        {
            id: "review",
            label:
                "Review",
            path:
                "/course-management/review",
        },
        {
            id: "published",
            label:
                tenant.publishedLabel,
            path:
                "/course-management/trainings",
        },
        {
            id: "permissions",
            label:
                "Permissions",
            path:
                "/course-management/permissions",
        },
        {
            id: "logs",
            label:
                "Logs",
            path:
                "/course-management/logs",
        },
    ];
}

function navIcon(
    id:
        string
): string {
    switch (id) {
        case "dashboard":
            return "⌂";
        case "courses":
            return "▣";
        case "create":
            return "+";
        case "drafts":
            return "□";
        case "review":
            return "✓";
        case "published":
            return "◉";
        case "permissions":
            return "⚿";
        case "logs":
            return "▤";
        default:
            return "•";
    }
}

/* =========================================================
   PAGE
========================================================= */

export default function PermissionControlPage() {
    const [
        tenantId,
        setTenantId,
    ] =
        useState<TenantKey | null>(
            null
        );

    const [
        tenantUsers,
        setTenantUsers,
    ] =
        useState<
            DirectoryUser[]
        >([]);

    const [
        actor,
        setActor,
    ] =
        useState<ActorKey>(
            "coordinator"
        );

    const [
        permissions,
        setPermissions,
    ] =
        useState<
            PermissionMap
        >({});

    const [
        search,
        setSearch,
    ] =
        useState("");

    const [
        department,
        setDepartment,
    ] =
        useState(
            "All Departments"
        );

    const [
        message,
        setMessage,
    ] =
        useState("");

    const [
        sessionReady,
        setSessionReady,
    ] =
        useState(false);

    const tenant =
        getTenantConfig(
            tenantId ??
            "university"
        );

    const actorConfig =
        getActorConfig(
            tenant,
            actor
        );

    useEffect(() => {
        /*
         * Tenant comes only from the logged-in session created
         * by app/login/page.tsx.
         *
         * No tenant can be selected or changed from this page.
         */
        const rawUser =
            localStorage.getItem(
                "user"
            );

        if (!rawUser) {
            window.location.href =
                "/login";

            return;
        }

        try {
            const loggedInUser =
                JSON.parse(
                    rawUser
                ) as LoggedInUser;

            const matchedTenant =
                TENANTS.find(
                    (item) =>
                        item.id ===
                        loggedInUser.tenant
                );

            if (!matchedTenant) {
                window.location.href =
                    "/login";

                return;
            }

            const resolvedTenantId =
                matchedTenant.id;

            setTenantId(
                resolvedTenantId
            );

            /*
             * Login temporarily stores only the users belonging
             * to the selected tenant under "tenant_users".
             */
            const rawTenantUsers =
                localStorage.getItem(
                    "tenant_users"
                );

            let storedUsers:
                StoredTenantUser[] =
                [];

            if (rawTenantUsers) {
                const parsed =
                    JSON.parse(
                        rawTenantUsers
                    );

                if (
                    Array.isArray(
                        parsed
                    )
                ) {
                    storedUsers =
                        parsed as
                            StoredTenantUser[];
                }
            }

            const validActorIds =
                new Set(
                    matchedTenant
                        .actors
                        .map(
                            (item) =>
                                item.id
                        )
                );

            const mappedUsers:
                DirectoryUser[] =
                storedUsers
                    .filter(
                        (user) =>
                            validActorIds.has(
                                user.role as
                                    ActorKey
                            )
                    )
                    .map(
                        (user) => ({
                            id:
                                String(
                                    user.id
                                ),
                            userId:
                                String(
                                    user.id
                                ),
                            name:
                                user.name,
                            employeeId:
                                user.employeeId ??
                                user.id,
                            email:
                                user.email,
                            designation:
                                user.designation ??
                                user.roleName,
                            department:
                                user.department,
                            actor:
                                user.role as
                                    ActorKey,
                            tenant:
                                resolvedTenantId,
                        })
                    );

            setTenantUsers(
                mappedUsers
            );

            /*
             * Show the first actor that actually has users.
             * If none has users yet, retain the tenant's first
             * configured manageable actor.
             */
            const firstActorWithUsers =
                matchedTenant
                    .actors
                    .find(
                        (actorItem) =>
                            mappedUsers.some(
                                (user) =>
                                    user.actor ===
                                    actorItem.id
                            )
                    );

            setActor(
                firstActorWithUsers?.id ??
                matchedTenant
                    .actors[0]
                    .id
            );

            setPermissions(
                loadStoredPermissionMap()
            );

            setDepartment(
                "All Departments"
            );

            setSearch("");
            setMessage("");
            setSessionReady(
                true
            );
        } catch {
            window.location.href =
                "/login";
        }
    }, []);

    const visiblePermissions =
        useMemo(
            () =>
                BASE_PERMISSIONS.filter(
                    (
                        permission
                    ) =>
                        permission
                            .appliesTo
                            .includes(
                                actorConfig.type
                            )
                ),
            [
                actorConfig.type,
            ]
        );

    const visibleUsers =
        useMemo(
            () => {
                const query =
                    search
                        .trim()
                        .toLowerCase();

                return tenantUsers.filter(
                    (user) => {
                        if (
                            user.actor !==
                            actor
                        ) {
                            return false;
                        }

                        if (
                            department !==
                                "All Departments" &&
                            user.department !==
                                department
                        ) {
                            return false;
                        }

                        if (!query) {
                            return true;
                        }

                        return [
                            user.name,
                            user.userId,
                            user.employeeId,
                            user.email,
                            user.designation,
                            user.department,
                        ]
                            .filter(
                                Boolean
                            )
                            .join(" ")
                            .toLowerCase()
                            .includes(
                                query
                            );
                    }
                );
            },
            [
                tenantUsers,
                actor,
                department,
                search,
            ]
        );

    const departments =
        useMemo(
            () =>
                unique(
                    tenantUsers
                        .filter(
                            (user) =>
                                user.actor ===
                                actor
                        )
                        .map(
                            (user) =>
                                user.department ??
                                ""
                        )
                ),
            [
                tenantUsers,
                actor,
            ]
        );

    const selectedCount =
        visibleUsers.reduce(
            (
                total,
                user
            ) => {
                const key =
                    getPermissionKey(
                        tenant.id,
                        actor,
                        user.userId
                    );

                return (
                    total +
                    (
                        permissions[
                            key
                        ] ??
                        []
                    ).length
                );
            },
            0
        );

    function getUserPermissions(
        user:
            DirectoryUser
    ): PermissionId[] {
        const key =
            getPermissionKey(
                tenant.id,
                actor,
                user.userId
            );

        return (
            permissions[key] ??
            []
        );
    }

    function setUserPermissions(
        user:
            DirectoryUser,
        next:
            PermissionId[]
    ) {
        const key =
            getPermissionKey(
                tenant.id,
                actor,
                user.userId
            );

        setPermissions(
            (previous) => ({
                ...previous,
                [key]:
                    Array.from(
                        new Set(
                            next
                        )
                    ),
            })
        );

        setMessage("");
    }

    function togglePermission(
        user:
            DirectoryUser,
        permissionId:
            PermissionId
    ) {
        const current =
            getUserPermissions(
                user
            );

        setUserPermissions(
            user,
            current.includes(
                permissionId
            )
                ? current.filter(
                      (id) =>
                          id !==
                          permissionId
                  )
                : [
                      ...current,
                      permissionId,
                  ]
        );
    }

    function toggleWholeRow(
        user:
            DirectoryUser
    ) {
        const current =
            getUserPermissions(
                user
            );

        const availableIds =
            visiblePermissions.map(
                (permission) =>
                    permission.id
            );

        const hasAll =
            availableIds.every(
                (id) =>
                    current.includes(
                        id
                    )
            );

        setUserPermissions(
            user,
            hasAll
                ? []
                : availableIds
        );
    }

    function toggleWholeColumn(
        permissionId:
            PermissionId
    ) {
        const everybodyHas =
            visibleUsers.length >
                0 &&
            visibleUsers.every(
                (user) =>
                    getUserPermissions(
                        user
                    ).includes(
                        permissionId
                    )
            );

        setPermissions(
            (previous) => {
                const next = {
                    ...previous,
                };

                visibleUsers.forEach(
                    (user) => {
                        const key =
                            getPermissionKey(
                                tenant.id,
                                actor,
                                user.userId
                            );

                        const current =
                            next[key] ??
                            [];

                        next[key] =
                            everybodyHas
                                ? current.filter(
                                      (id) =>
                                          id !==
                                          permissionId
                                  )
                                : Array.from(
                                      new Set([
                                          ...current,
                                          permissionId,
                                      ])
                                  );
                    }
                );

                return next;
            }
        );

        setMessage("");
    }

    function handleReset() {
        setPermissions(
            (previous) => {
                const next = {
                    ...previous,
                };

                visibleUsers.forEach(
                    (user) => {
                        const key =
                            getPermissionKey(
                                tenant.id,
                                actor,
                                user.userId
                            );

                        next[key] =
                            getDefaultPermissionIds(
                                actorConfig.type
                            );
                    }
                );

                return next;
            }
        );

        setMessage(
            `Default ${actorConfig.label} permissions restored for the visible users.`
        );
    }

    function handleSave() {
        const directory =
            Object.fromEntries(
                tenantUsers.map(
                    (user) => [
                        user.userId,
                        user,
                    ]
                )
            );

        const payload:
            StoredPermissionPayload =
            {
                version: 3,
                updatedAt:
                    new Date().toISOString(),
                tenant:
                    tenant.id,
                actor,
                permissions,
                directory,
            };

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(
                payload
            )
        );

        /*
         * Compatibility key used by existing sidebar/page checks.
         *
         * This writes the selected actor/user maps in one object.
         * Protected pages can read:
         * tenant:actor:userId -> PermissionId[]
         */
        localStorage.setItem(
            LEGACY_PERMISSION_KEY,
            JSON.stringify(
                permissions
            )
        );

        window.dispatchEvent(
            new CustomEvent(
                "neurolxp-permissions-updated",
                {
                    detail:
                        payload,
                }
            )
        );

        setMessage(
            `${actorConfig.label} permissions saved successfully for ${tenant.name}.`
        );
    }

    const navigation =
        buildNavigation(
            tenant
        );

    if (!sessionReady) {
        return (
            <div
                className={
                    styles.page
                }
            />
        );
    }

    return (
        <div
            className={
                styles.page
            }
        >
            {/* =============================================
                SAME COURSE MANAGEMENT SIDEBAR SHELL
            ============================================= */}

            <aside
                className={
                    styles.sidebar
                }
            >
                <div
                    className={
                        styles.sidebarInner
                    }
                >
                    <div
                        className={
                            styles.brand
                        }
                    >
                        <div
                            className={
                                styles.brandIcon
                            }
                        >
                            N
                        </div>

                        <div
                            className={
                                styles.brandText
                            }
                        >
                            <strong>
                                NeuroLXP
                            </strong>

                            <span>
                                Learning Platform
                            </span>
                        </div>
                    </div>

                    <nav
                        className={
                            styles.navigation
                        }
                    >
                        <span
                            className={
                                styles.navigationTitle
                            }
                        >
                            COURSE MANAGEMENT
                        </span>

                        {navigation.map(
                            (item) => {
                                const active =
                                    item.id ===
                                    "permissions";

                                return (
                                    <button
                                        key={
                                            item.id
                                        }
                                        type="button"
                                        className={`${styles.navItem} ${
                                            active
                                                ? styles.navActive
                                                : ""
                                        }`}
                                        onClick={() => {
                                            window.location.href =
                                                item.path;
                                        }}
                                    >
                                        <span
                                            className={
                                                styles.navIcon
                                            }
                                        >
                                            {
                                                navIcon(
                                                    item.id
                                                )
                                            }
                                        </span>

                                        <span
                                            className={
                                                styles.navLabel
                                            }
                                        >
                                            {
                                                item.label
                                            }
                                        </span>
                                    </button>
                                );
                            }
                        )}
                    </nav>

                    <div
                        className={
                            styles.sidebarFooter
                        }
                    >
                        <span>
                            {
                                tenant.managementLabel
                            }
                        </span>

                        <small>
                            NeuroLXP Platform
                        </small>
                    </div>
                </div>
            </aside>

            {/* =============================================
                MAIN + SAME SHARED TOP BAR
            ============================================= */}

            <main
                className={
                    styles.main
                }
            >
                <CourseHeader />

                <div
                    className={
                        styles.content
                    }
                >
                    {/* =============================================
                        PERMISSION PAGE CONTENT
                    ============================================= */}

                    <section
                        className={
                            styles.headerCard
                        }
                    >
                        <div>
                            <div
                                className={
                                    styles.eyebrow
                                }
                            >
                                <ShieldCheck
                                    size={
                                        16
                                    }
                                />
                                ACCESS CONTROL
                            </div>

                            <h1>
                                Permission Management
                            </h1>

                            <p>
                                Assign tenant-aware permissions to coordinators, faculty, trainers, instructors, students and learners. Revoked functions remain unavailable to the selected user.
                            </p>
                        </div>

                        <div
                            className={
                                styles.headerActions
                            }
                        >
                            <button
                                type="button"
                                className={
                                    styles.secondaryButton
                                }
                                onClick={
                                    handleReset
                                }
                            >
                                <RotateCcw
                                    size={
                                        16
                                    }
                                />
                                Reset
                            </button>

                            <button
                                type="button"
                                className={
                                    styles.primaryButton
                                }
                                onClick={
                                    handleSave
                                }
                            >
                                <Save
                                    size={
                                        16
                                    }
                                />
                                Save Permissions
                            </button>
                        </div>
                    </section>

                    {message && (
                        <div
                            className={
                                styles.messageBar
                            }
                        >
                            <Check
                                size={
                                    17
                                }
                            />
                            <span>
                                {message}
                            </span>
                        </div>
                    )}

                    {/* =============================================
                        TENANT + ACTOR
                    ============================================= */}

                    <section
                        className={
                            styles.roleCard
                        }
                    >
                        <div
                            className={
                                styles.roleHeading
                            }
                        >
                            <div>
                                <h2>
                                    Tenant & Actor
                                </h2>

                                <p>
                                    Tenant is fetched automatically from the logged-in admin. Actor names and permission labels are loaded for that tenant.
                                </p>
                            </div>

                            <span
                                className={
                                    styles.selectedCount
                                }
                            >
                                {
                                    selectedCount
                                }{" "}
                                permissions selected
                            </span>
                        </div>

                        <div
                            className={
                                styles.tenantActorGrid
                            }
                        >
                            <div
                                className={
                                    styles.field
                                }
                            >
                                <span>
                                    Tenant
                                </span>

                                <div
                                    className={
                                        styles.contextSummary
                                    }
                                >
                                    <strong>
                                        {
                                            tenant.name
                                        }
                                    </strong>

                                    <small>
                                        Fetched from login
                                    </small>
                                </div>
                            </div>

                            <div
                                className={
                                    styles.actorBlock
                                }
                            >
                                <span
                                    className={
                                        styles.actorLabel
                                    }
                                >
                                    Actor
                                </span>

                                <div
                                    className={
                                        styles.roleTabs
                                    }
                                >
                                    {tenant.actors.map(
                                        (
                                            item
                                        ) => (
                                            <button
                                                key={
                                                    item.id
                                                }
                                                type="button"
                                                className={
                                                    actor ===
                                                    item.id
                                                        ? styles.roleTabActive
                                                        : styles.roleTab
                                                }
                                                onClick={() => {
                                                    setActor(
                                                        item.id
                                                    );
                                                    setDepartment(
                                                        "All Departments"
                                                    );
                                                    setSearch(
                                                        ""
                                                    );
                                                    setMessage(
                                                        ""
                                                    );
                                                }}
                                            >
                                                <UserRoundCog
                                                    size={
                                                        17
                                                    }
                                                />

                                                {
                                                    item.label
                                                }

                                                <span>
                                                    {
                                                        tenantUsers.filter(
                                                            (
                                                                user
                                                            ) =>
                                                                user.actor ===
                                                                item.id
                                                        )
                                                            .length
                                                    }
                                                </span>
                                            </button>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* =============================================
                        FILTERS
                    ============================================= */}

                    <section
                        className={
                            styles.filterCard
                        }
                    >
                        <div
                            className={
                                styles.filterGrid
                            }
                        >
                            <label
                                className={
                                    styles.field
                                }
                            >
                                <span>
                                    Department
                                </span>

                                <div
                                    className={
                                        styles.selectWrap
                                    }
                                >
                                    <select
                                        value={
                                            department
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setDepartment(
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                    >
                                        <option
                                            value="All Departments"
                                        >
                                            All Departments
                                        </option>

                                        {departments.map(
                                            (
                                                item
                                            ) => (
                                                <option
                                                    key={
                                                        item
                                                    }
                                                    value={
                                                        item
                                                    }
                                                >
                                                    {
                                                        item
                                                    }
                                                </option>
                                            )
                                        )}
                                    </select>

                                    <ChevronDown
                                        size={
                                            16
                                        }
                                    />
                                </div>
                            </label>

                            <label
                                className={
                                    styles.searchBox
                                }
                            >
                                <span>
                                    Search{" "}
                                    {
                                        actorConfig.label
                                    }
                                </span>

                                <div>
                                    <Search
                                        size={
                                            16
                                        }
                                    />

                                    <input
                                        value={
                                            search
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setSearch(
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        placeholder="Name, ID, email, department"
                                    />
                                </div>
                            </label>

                            <div
                                className={
                                    styles.contextSummary
                                }
                            >
                                <span>
                                    Current Context
                                </span>

                                <strong>
                                    {
                                        tenant.name
                                    }{" "}
                                    ·{" "}
                                    {
                                        actorConfig.label
                                    }
                                </strong>

                                <small>
                                    {
                                        tenant.managementLabel
                                    }
                                </small>
                            </div>
                        </div>
                    </section>

                    {/* =============================================
                        MATRIX
                    ============================================= */}

                    <section
                        className={
                            styles.matrixCard
                        }
                    >
                        <div
                            className={
                                styles.matrixTitle
                            }
                        >
                            <div>
                                <h2>
                                    {
                                        actorConfig.label
                                    }{" "}
                                    Permission Matrix
                                </h2>

                                <p>
                                    Rows are individual users. Columns are the functions available to this actor type. Checked means access is granted; unchecked means that function should remain hidden or blocked.
                                </p>
                            </div>

                            <span>
                                {
                                    visibleUsers.length
                                }{" "}
                                users
                            </span>
                        </div>

                        <div
                            className={
                                styles.matrixScroll
                            }
                        >
                            <table
                                className={
                                    styles.permissionMatrix
                                }
                            >
                                <thead>
                                    <tr>
                                        <th
                                            className={
                                                styles.serialColumn
                                            }
                                        >
                                            No.
                                        </th>

                                        <th
                                            className={
                                                styles.userColumn
                                            }
                                        >
                                            {
                                                actorConfig.label
                                            }{" "}
                                            Details
                                        </th>

                                        <th
                                            className={
                                                styles.departmentColumn
                                            }
                                        >
                                            Department
                                        </th>

                                        <th
                                            className={
                                                styles.allColumn
                                            }
                                        >
                                            <div
                                                className={
                                                    styles.columnHeader
                                                }
                                            >
                                                <span>
                                                    All
                                                </span>
                                            </div>
                                        </th>

                                        {visiblePermissions.map(
                                            (
                                                permission
                                            ) => {
                                                const checked =
                                                    visibleUsers.length >
                                                        0 &&
                                                    visibleUsers.every(
                                                        (
                                                            user
                                                        ) =>
                                                            getUserPermissions(
                                                                user
                                                            ).includes(
                                                                permission.id
                                                            )
                                                    );

                                                return (
                                                    <th
                                                        key={
                                                            permission.id
                                                        }
                                                        className={
                                                            styles.permissionColumn
                                                        }
                                                        title={
                                                            formatPermissionText(
                                                                permission.description,
                                                                tenant
                                                            )
                                                        }
                                                    >
                                                        <button
                                                            type="button"
                                                            className={
                                                                styles.columnHeaderButton
                                                            }
                                                            onClick={() =>
                                                                toggleWholeColumn(
                                                                    permission.id
                                                                )
                                                            }
                                                            aria-label={`Toggle ${formatPermissionText(
                                                                permission.label,
                                                                tenant
                                                            )} for all visible users`}
                                                        >
                                                            <span>
                                                                {
                                                                    formatPermissionText(
                                                                        permission.shortLabel,
                                                                        tenant
                                                                    )
                                                                }
                                                            </span>

                                                            <span
                                                                className={
                                                                    checked
                                                                        ? styles.checkboxActive
                                                                        : styles.checkbox
                                                                }
                                                            >
                                                                {checked && (
                                                                    <Check
                                                                        size={
                                                                            13
                                                                        }
                                                                    />
                                                                )}
                                                            </span>
                                                        </button>
                                                    </th>
                                                );
                                            }
                                        )}
                                    </tr>
                                </thead>

                                <tbody>
                                    {visibleUsers.map(
                                        (
                                            user,
                                            index
                                        ) => {
                                            const current =
                                                getUserPermissions(
                                                    user
                                                );

                                            const wholeRowChecked =
                                                visiblePermissions.every(
                                                    (
                                                        permission
                                                    ) =>
                                                        current.includes(
                                                            permission.id
                                                        )
                                                );

                                            return (
                                                <tr
                                                    key={
                                                        user.id
                                                    }
                                                >
                                                    <td
                                                        className={
                                                            styles.serialCell
                                                        }
                                                    >
                                                        {String(
                                                            index +
                                                                1
                                                        ).padStart(
                                                            2,
                                                            "0"
                                                        )}
                                                    </td>

                                                    <td
                                                        className={
                                                            styles.userCell
                                                        }
                                                    >
                                                        <div
                                                            className={
                                                                styles.avatar
                                                            }
                                                        >
                                                            {user.name
                                                                .split(
                                                                    " "
                                                                )
                                                                .filter(
                                                                    Boolean
                                                                )
                                                                .slice(
                                                                    -2
                                                                )
                                                                .map(
                                                                    (
                                                                        part
                                                                    ) =>
                                                                        part[0]
                                                                )
                                                                .join(
                                                                    ""
                                                                )
                                                                .toUpperCase()}
                                                        </div>

                                                        <div
                                                            className={
                                                                styles.userDetails
                                                            }
                                                        >
                                                            <strong>
                                                                {
                                                                    user.name
                                                                }
                                                            </strong>

                                                            <span>
                                                                {
                                                                    user.employeeId ??
                                                                    user.userId
                                                                }
                                                                {" · "}
                                                                {
                                                                    user.designation ??
                                                                    actorConfig.label
                                                                }
                                                            </span>

                                                            <small>
                                                                {
                                                                    user.email ??
                                                                    user.userId
                                                                }
                                                            </small>
                                                        </div>
                                                    </td>

                                                    <td
                                                        className={
                                                            styles.departmentCell
                                                        }
                                                    >
                                                        {
                                                            user.department ??
                                                            "Organization-wide"
                                                        }
                                                    </td>

                                                    <td
                                                        className={
                                                            styles.checkboxCell
                                                        }
                                                    >
                                                        <button
                                                            type="button"
                                                            className={
                                                                styles.checkboxButton
                                                            }
                                                            onClick={() =>
                                                                toggleWholeRow(
                                                                    user
                                                                )
                                                            }
                                                            aria-label={`Toggle all permissions for ${user.name}`}
                                                        >
                                                            <span
                                                                className={
                                                                    wholeRowChecked
                                                                        ? styles.checkboxActive
                                                                        : styles.checkbox
                                                                }
                                                            >
                                                                {wholeRowChecked && (
                                                                    <Check
                                                                        size={
                                                                            14
                                                                        }
                                                                    />
                                                                )}
                                                            </span>
                                                        </button>
                                                    </td>

                                                    {visiblePermissions.map(
                                                        (
                                                            permission
                                                        ) => {
                                                            const checked =
                                                                current.includes(
                                                                    permission.id
                                                                );

                                                            return (
                                                                <td
                                                                    key={
                                                                        permission.id
                                                                    }
                                                                    className={
                                                                        styles.checkboxCell
                                                                    }
                                                                    title={`${user.name}: ${formatPermissionText(
                                                                        permission.label,
                                                                        tenant
                                                                    )}`}
                                                                >
                                                                    <button
                                                                        type="button"
                                                                        className={
                                                                            styles.checkboxButton
                                                                        }
                                                                        onClick={() =>
                                                                            togglePermission(
                                                                                user,
                                                                                permission.id
                                                                            )
                                                                        }
                                                                        aria-label={`${checked ? "Revoke" : "Grant"} ${formatPermissionText(
                                                                            permission.label,
                                                                            tenant
                                                                        )} for ${user.name}`}
                                                                    >
                                                                        <span
                                                                            className={
                                                                                checked
                                                                                    ? styles.checkboxActive
                                                                                    : styles.checkbox
                                                                            }
                                                                        >
                                                                            {checked && (
                                                                                <Check
                                                                                    size={
                                                                                        14
                                                                                    }
                                                                                />
                                                                            )}
                                                                        </span>
                                                                    </button>
                                                                </td>
                                                            );
                                                        }
                                                    )}
                                                </tr>
                                            );
                                        }
                                    )}

                                    {visibleUsers.length ===
                                        0 && (
                                        <tr>
                                            <td
                                                className={
                                                    styles.emptyState
                                                }
                                                colSpan={
                                                    visiblePermissions.length +
                                                    4
                                                }
                                            >
                                                No matching{" "}
                                                {
                                                    actorConfig.label
                                                }{" "}
                                                records were found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div
                            className={
                                styles.matrixFooter
                            }
                        >
                            <span>
                                <strong>
                                    Access rule:
                                </strong>{" "}
                                Checked permissions are saved per{" "}
                                <strong>
                                    tenant + actor + user ID
                                </strong>
                                . Your sidebar and protected feature handlers can use the same Permission ID to show, hide, enable, or block that function.
                            </span>

                            <button
                                type="button"
                                className={
                                    styles.primaryButton
                                }
                                onClick={
                                    handleSave
                                }
                            >
                                <Save
                                    size={
                                        16
                                    }
                                />
                                Save Permissions
                            </button>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}
