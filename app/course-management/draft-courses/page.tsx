"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import CourseHeader from "@/components/CourseHeader/CourseHeader";

import type {
    CourseCreationState,
} from "@/types/course-creation.types";

import {
    deleteCourseDraft,
} from "@/services/course-draft.service";

import styles from "./page.module.css";

/* =========================================================
   USER SESSION
========================================================= */

interface UserSession {
    id: string;
    name: string;
    tenant: string;
    tenantName: string;
    role: string;
    roleName: string;
}

/* =========================================================
   NAVIGATION TYPES
========================================================= */

interface NavigationItem {
    label: string;
    path: string;
}

interface TenantNavigation {
    dashboard: NavigationItem;
    courseManagement: NavigationItem;
    createCourse: NavigationItem;
    coursePlural: NavigationItem;
    draftCourses: NavigationItem;
    offerings: NavigationItem;
    assessments: NavigationItem;
    reports: NavigationItem;
    settings: NavigationItem;
}

/* =========================================================
   TENANT NAVIGATION
========================================================= */

function getTenantNavigation(
    tenant: string
): TenantNavigation {

    const normalizedTenant =
        tenant
            .trim()
            .toLowerCase()
            .replace(/-/g, "_");

    /* =====================================================
       CORPORATE
    ===================================================== */

    if (
        normalizedTenant === "corporate" ||
        normalizedTenant === "corporate_training"
    ) {
        return {
            dashboard: {
                label: "Dashboard",
                path: "/dashboard",
            },

            courseManagement: {
                label: "Training Management",
                path: "/course-management/dashboard",
            },

            createCourse: {
                label: "Create Training",
                path: "/course-management/create",
            },

            coursePlural: {
                label: "Trainings",
                path: "/course-management",
            },

            draftCourses: {
                label: "Draft Trainings",
                path: "/course-management/draft-courses",
            },

            offerings: {
                label: "Training Offerings",
                path: "/course-management/offerings",
            },

            assessments: {
                label: "Assessments",
                path: "/course-management/assessments",
            },

            reports: {
                label: "Reports",
                path: "/course-management/reports",
            },

            settings: {
                label: "Settings",
                path: "/course-management/settings",
            },
        };
    }

    /* =====================================================
       SKILL ACADEMY
    ===================================================== */

    if (
        normalizedTenant === "skill_academy" ||
        normalizedTenant === "skill academy"
    ) {
        return {
            dashboard: {
                label: "Dashboard",
                path: "/dashboard",
            },

            courseManagement: {
                label: "Academy Management",
                path: "/course-management",
            },

            createCourse: {
                label: "Create Program",
                path: "/course-management/create",
            },

            coursePlural: {
                label: "Programs",
                path: "/course-management",
            },

            draftCourses: {
                label: "Draft Programs",
                path: "/course-management/draft-courses",
            },

            offerings: {
                label: "Program Offerings",
                path: "/course-management/offerings",
            },

            assessments: {
                label: "Assessments",
                path: "/course-management/assessments",
            },

            reports: {
                label: "Reports",
                path: "/course-management/reports",
            },

            settings: {
                label: "Settings",
                path: "/course-management/settings",
            },
        };
    }

    /* =====================================================
       BOOTCAMP
    ===================================================== */

    if (
        normalizedTenant === "bootcamp"
    ) {
        return {
            dashboard: {
                label: "Dashboard",
                path: "/dashboard",
            },

            courseManagement: {
                label: "Bootcamp Management",
                path: "/course-management",
            },

            createCourse: {
                label: "Create Bootcamp",
                path: "/course-management/create",
            },

            coursePlural: {
                label: "Bootcamps",
                path: "/course-management",
            },

            draftCourses: {
                label: "Draft Bootcamps",
                path: "/course-management/draft-courses",
            },

            offerings: {
                label: "Bootcamp Offerings",
                path: "/course-management/offerings",
            },

            assessments: {
                label: "Assessments",
                path: "/course-management/assessments",
            },

            reports: {
                label: "Reports",
                path: "/course-management/reports",
            },

            settings: {
                label: "Settings",
                path: "/course-management/settings",
            },
        };
    }

    /* =====================================================
       DEFAULT
    ===================================================== */

    return {
        dashboard: {
            label: "Dashboard",
            path: "/dashboard",
        },

        courseManagement: {
            label: "Course Management",
            path: "/course-management",
        },

        createCourse: {
            label: "Create Course",
            path: "/course-management/create",
        },

        coursePlural: {
            label: "Courses",
            path: "/course-management",
        },

        draftCourses: {
            label: "Draft Courses",
            path: "/course-management/draft-courses",
        },

        offerings: {
            label: "Course Offerings",
            path: "/course-management/offerings",
        },

        assessments: {
            label: "Assessments",
            path: "/course-management/assessments",
        },

        reports: {
            label: "Reports",
            path: "/course-management/reports",
        },

        settings: {
            label: "Settings",
            path: "/course-management/settings",
        },
    };
}

/* =========================================================
   SIDEBAR ITEMS
========================================================= */

function getSidebarItems(
    tenant: string
) {
    const navigation =
        getTenantNavigation(tenant);

    return [
        {
            id: "dashboard",
            navigation: navigation.dashboard,
        },

        {
            id: "courses",
            navigation: navigation.coursePlural,
        },

        {
            id: "create",
            navigation: navigation.createCourse,
        },

        {
            id: "drafts",
            navigation: navigation.draftCourses,
        },

        {
            id: "offerings",
            navigation: navigation.offerings,
        },

        {
            id: "assessments",
            navigation: navigation.assessments,
        },

        {
            id: "reports",
            navigation: navigation.reports,
        },

        {
            id: "settings",
            navigation: navigation.settings,
        },
    ];
}

/* =========================================================
   STORAGE
========================================================= */

const DRAFT_PREFIX =
    "course-draft-";

/* =========================================================
   STEP INFORMATION
========================================================= */

const TOTAL_STEPS = 11;

const STEP_NAMES = [
    "Basic Setup",
    "Outcomes & Skills",
    "Structure",
    "Content",
    "Assessment",
    "Course Team",
    "Delivery",
    "Enrollment",
    "Completion",
    "Validation",
    "Review",
];

/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(
    value: string
): string {

    if (!value) {
        return "Not available";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "Not available";
    }

    return new Intl.DateTimeFormat(
        "en-US",
        {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
        }
    ).format(date);
}

/* =========================================================
   COURSE TITLE
========================================================= */

function getDraftTitle(
    draft: CourseCreationState
): string {

    const title =
        draft.setup?.title?.trim();

    if (title) {
        return title;
    }

    return "Untitled Training";
}

/* =========================================================
   COURSE TYPE
========================================================= */

function formatCourseType(
    value?: string
): string {

    if (!value) {
        return "Not specified";
    }

    return value
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(
            /\b\w/g,
            (letter) =>
                letter.toUpperCase()
        );
}

/* =========================================================
   DELIVERY MODE
========================================================= */

function formatDeliveryMode(
    value?: string
): string {

    if (!value) {
        return "Not specified";
    }

    return value
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(
            /\b\w/g,
            (letter) =>
                letter.toUpperCase()
        );
}

/* =========================================================
   PROGRESS
========================================================= */

function getProgress(
    currentStep: number
): number {

    const safeStep =
        Math.min(
            Math.max(
                currentStep,
                0
            ),
            TOTAL_STEPS - 1
        );

    return Math.round(
        ((safeStep + 1) /
            TOTAL_STEPS) *
            100
    );
}

/* =========================================================
   DRAFT COURSE PAGE
========================================================= */

export default function DraftCoursesPage() {

    const [
        mounted,
        setMounted,
    ] = useState(false);

    const [
        user,
        setUser,
    ] = useState<UserSession | null>(
        null
    );

    const [
        drafts,
        setDrafts,
    ] = useState<CourseCreationState[]>(
        []
    );

    const [
        loading,
        setLoading,
    ] = useState<boolean>(
        true
    );

    const [
        error,
        setError,
    ] = useState<string>(
        ""
    );

    const [
        search,
        setSearch,
    ] = useState<string>(
        ""
    );

    const [
        filter,
        setFilter,
    ] = useState<
        "ALL" | "RECENT" | "IN_PROGRESS"
    >(
        "ALL"
    );

    const [
        deleteTarget,
        setDeleteTarget,
    ] = useState<string | null>(
        null
    );

    /* =====================================================
       NAVIGATION
    ===================================================== */

    const navigation =
        useMemo(
            () =>
                getTenantNavigation(
                    user?.tenant || ""
                ),
            [user?.tenant]
        );

    /* =====================================================
       LOAD DRAFTS
    ===================================================== */

    const loadDrafts =
        useCallback(
            (
                tenant: string
            ) => {

                try {

                    const loadedDrafts:
                        CourseCreationState[] =
                        [];

                    for (
                        let index = 0;
                        index <
                        localStorage.length;
                        index++
                    ) {

                        const key =
                            localStorage.key(
                                index
                            );

                        if (
                            !key ||
                            !key.startsWith(
                                DRAFT_PREFIX
                            )
                        ) {
                            continue;
                        }

                        const stored =
                            localStorage.getItem(
                                key
                            );

                        if (!stored) {
                            continue;
                        }

                        try {

                            const parsed:
                                unknown =
                                JSON.parse(
                                    stored
                                );

                            if (
                                !parsed ||
                                typeof parsed !==
                                    "object"
                            ) {
                                continue;
                            }

                            const draft =
                                parsed as CourseCreationState;

                            if (
                                draft.tenant !==
                                tenant
                            ) {
                                continue;
                            }

                            if (
                                draft.status !==
                                "DRAFT"
                            ) {
                                continue;
                            }

                            loadedDrafts.push(
                                draft
                            );

                        } catch {
                            continue;
                        }
                    }

                    loadedDrafts.sort(
                        (
                            first,
                            second
                        ) =>
                            new Date(
                                second.updatedAt
                            ).getTime() -
                            new Date(
                                first.updatedAt
                            ).getTime()
                    );

                    setDrafts(
                        loadedDrafts
                    );

                } catch {

                    setError(
                        "Unable to load draft trainings."
                    );

                } finally {

                    setLoading(
                        false
                    );
                }
            },
            []
        );

    /* =====================================================
       INITIALIZE CLIENT
    ===================================================== */

    useEffect(() => {

        setMounted(true);

        const storedUser =
            localStorage.getItem(
                "user"
            );

        if (!storedUser) {

            window.location.href =
                "/login";

            return;
        }

        try {

            const parsedUser =
                JSON.parse(
                    storedUser
                ) as UserSession;

            if (
                !parsedUser.tenant ||
                !parsedUser.role
            ) {

                setError(
                    "Your account configuration is incomplete."
                );

                setLoading(
                    false
                );

                return;
            }

            setUser(
                parsedUser
            );

            loadDrafts(
                parsedUser.tenant
            );

        } catch {

            setError(
                "Unable to load your account."
            );

            setLoading(
                false
            );
        }

    }, [loadDrafts]);

    /* =====================================================
       FILTERED DRAFTS
    ===================================================== */

    const filteredDrafts =
        useMemo(
            () => {

                const normalizedSearch =
                    search
                        .trim()
                        .toLowerCase();

                let result =
                    drafts.filter(
                        (draft) => {

                            if (
                                !normalizedSearch
                            ) {
                                return true;
                            }

                            const title =
                                getDraftTitle(
                                    draft
                                ).toLowerCase();

                            const code =
                                (
                                    draft.setup
                                        ?.code ||
                                    ""
                                ).toLowerCase();

                            const id =
                                draft.courseId
                                    .toLowerCase();

                            return (
                                title.includes(
                                    normalizedSearch
                                ) ||
                                code.includes(
                                    normalizedSearch
                                ) ||
                                id.includes(
                                    normalizedSearch
                                )
                            );
                        }
                    );

                if (
                    filter ===
                    "IN_PROGRESS"
                ) {

                    result =
                        result.filter(
                            (draft) =>
                                draft.currentStep >
                                0
                        );
                }

                if (
                    filter ===
                    "RECENT"
                ) {

                    const oneWeekAgo =
                        Date.now() -
                        7 *
                            24 *
                            60 *
                            60 *
                            1000;

                    result =
                        result.filter(
                            (draft) =>
                                new Date(
                                    draft.updatedAt
                                ).getTime() >=
                                oneWeekAgo
                        );
                }

                return result;

            },
            [
                drafts,
                search,
                filter,
            ]
        );

    /* =====================================================
       SUMMARY
    ===================================================== */

    const totalDrafts =
        drafts.length;

    const inProgressDrafts =
        drafts.filter(
            (draft) =>
                draft.currentStep > 0
        ).length;

    const recentlyUpdatedDrafts =
        drafts.filter(
            (draft) => {

                const updated =
                    new Date(
                        draft.updatedAt
                    ).getTime();

                return (
                    Date.now() -
                        updated <=
                    7 *
                        24 *
                        60 *
                        60 *
                        1000
                );
            }
        ).length;

    /* =====================================================
       CREATE NEW
    ===================================================== */

    function handleCreateNew() {

        window.location.href =
            navigation
                .createCourse
                .path;
    }

    /* =====================================================
       CONTINUE DRAFT
    ===================================================== */

    function handleContinue(
        courseId: string
    ) {

        window.location.href =
            `${navigation.createCourse.path}?courseId=${encodeURIComponent(
                courseId
            )}`;
    }

    /* =====================================================
       DELETE DRAFT
       
       UPDATED:
       The draft page loads directly from localStorage
       using the key:
       
       course-draft-${courseId}
       
       Therefore we explicitly remove that exact key.
    ===================================================== */

    function handleDelete(courseId: string) {
    try {
        // Remove from localStorage
        deleteCourseDraft(courseId);

        // Immediately remove from the visible list
        setDrafts((current) =>
            current.filter(
                (draft) => draft.courseId !== courseId
            )
        );

        // Close confirmation modal
        setDeleteTarget(null);

    } catch (error) {
        console.error("Delete draft error:", error);

        setError(
            "Unable to delete the draft."
        );
    }
}

    /* =====================================================
       HYDRATION SAFE INITIAL STATE
    ===================================================== */

    if (!mounted) {

        return (
            <div
                className={
                    styles.page
                }
            >
                <main
                    className={
                        styles.main
                    }
                >
                    <div
                        className={
                            styles.stateArea
                        }
                    >
                        <div
                            className={
                                styles.loadingCard
                            }
                        >
                            <div
                                className={
                                    styles.spinner
                                }
                            />

                            <span>
                                Loading draft trainings...
                            </span>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    /* =====================================================
       ERROR STATE
    ===================================================== */

    if (error) {

        return (
            <div
                className={
                    styles.page
                }
            >

                <aside
                    className={
                        styles.sidebar
                    }
                >
                    <Sidebar
                        activeItem="drafts"
                        tenant={
                            user?.tenant
                        }
                    />
                </aside>

                <main
                    className={
                        styles.main
                    }
                >

                    <CourseHeader />

                    <div
                        className={
                            styles.stateArea
                        }
                    >

                        <div
                            className={
                                styles.errorCard
                            }
                        >

                            <div
                                className={
                                    styles.errorIcon
                                }
                            >
                                !
                            </div>

                            <div
                                className={
                                    styles.stateContent
                                }
                            >

                                <h1>
                                    Unable to Load Drafts
                                </h1>

                                <p>
                                    {error}
                                </p>

                            </div>

                        </div>

                    </div>

                </main>

            </div>
        );
    }

    /* =====================================================
       MAIN PAGE
    ===================================================== */

    return (

        <div
            className={
                styles.page
            }
        >

            {/* =================================================
                SIDEBAR
            ================================================= */}

            <aside
                className={
                    styles.sidebar
                }
            >

                <Sidebar
                    activeItem="drafts"
                    tenant={
                        user?.tenant
                    }
                />

            </aside>

            {/* =================================================
                MAIN
            ================================================= */}

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

                    {/* =================================================
                        BREADCRUMBS
                    ================================================= */}

                    <nav
                        className={
                            styles.breadcrumbs
                        }
                        aria-label="Breadcrumb"
                    >

                        <button
                            type="button"
                            onClick={() => {
                                window.location.href =
                                    navigation
                                        .dashboard
                                        .path;
                            }}
                        >
                            {
                                navigation
                                    .dashboard
                                    .label
                            }
                        </button>

                        <span>
                            /
                        </span>

                        <button
                            type="button"
                            onClick={() => {
                                window.location.href =
                                    navigation
                                        .courseManagement
                                        .path;
                            }}
                        >
                            {
                                navigation
                                    .courseManagement
                                    .label
                            }
                        </button>

                        <span>
                            /
                        </span>

                        <strong>
                            {
                                navigation
                                    .draftCourses
                                    .label
                            }
                        </strong>

                    </nav>

                    {/* =================================================
                        PAGE HEADER
                    ================================================= */}

                    <header
                        className={
                            styles.pageHeader
                        }
                    >

                        <div
                            className={
                                styles.titleBlock
                            }
                        >

                            <span
                                className={
                                    styles.eyebrow
                                }
                            >
                                COURSE MANAGEMENT
                            </span>

                            <h1>
                                {
                                    navigation
                                        .draftCourses
                                        .label
                                }
                            </h1>

                            <p>
                                Continue creating
                                learning content
                                saved before
                                publication.
                            </p>

                        </div>

                        <button
                            type="button"
                            className={
                                styles.createButton
                            }
                            onClick={
                                handleCreateNew
                            }
                        >

                            <span>
                                +
                            </span>

                            {
                                navigation
                                    .createCourse
                                    .label
                            }

                        </button>

                    </header>

                    {/* =================================================
                        SUMMARY
                    ================================================= */}

                    <section
                        className={
                            styles.summaryGrid
                        }
                    >

                        <div
                            className={
                                styles.summaryCard
                            }
                        >

                            <div
                                className={
                                    styles.summaryIcon
                                }
                            >
                                D
                            </div>

                            <div>

                                <span>
                                    Total Drafts
                                </span>

                                <strong>
                                    {
                                        totalDrafts
                                    }
                                </strong>

                            </div>

                        </div>

                        <div
                            className={
                                styles.summaryCard
                            }
                        >

                            <div
                                className={
                                    styles.summaryIcon
                                }
                            >
                                →
                            </div>

                            <div>

                                <span>
                                    In Progress
                                </span>

                                <strong>
                                    {
                                        inProgressDrafts
                                    }
                                </strong>

                            </div>

                        </div>

                        <div
                            className={
                                styles.summaryCard
                            }
                        >

                            <div
                                className={
                                    styles.summaryIcon
                                }
                            >
                                ↻
                            </div>

                            <div>

                                <span>
                                    Updated This Week
                                </span>

                                <strong>
                                    {
                                        recentlyUpdatedDrafts
                                    }
                                </strong>

                            </div>

                        </div>

                    </section>

                    {/* =================================================
                        TOOLBAR
                    ================================================= */}

                    <section
                        className={
                            styles.toolbar
                        }
                    >

                        <div
                            className={
                                styles.searchBox
                            }
                        >

                            <span>
                                ⌕
                            </span>

                            <input
                                type="text"
                                value={
                                    search
                                }
                                onChange={(
                                    event
                                ) =>
                                    setSearch(
                                        event.target.value
                                    )
                                }
                                placeholder={
                                    `Search ${
                                        navigation
                                            .coursePlural
                                            .label
                                            .toLowerCase()
                                    }...`
                                }
                                aria-label={
                                    "Search drafts"
                                }
                            />

                        </div>

                        <div
                            className={
                                styles.filters
                            }
                        >

                            <button
                                type="button"
                                className={
                                    filter === "ALL"
                                        ? styles.filterActive
                                        : styles.filter
                                }
                                onClick={() =>
                                    setFilter(
                                        "ALL"
                                    )
                                }
                            >
                                All
                            </button>

                            <button
                                type="button"
                                className={
                                    filter ===
                                    "IN_PROGRESS"
                                        ? styles.filterActive
                                        : styles.filter
                                }
                                onClick={() =>
                                    setFilter(
                                        "IN_PROGRESS"
                                    )
                                }
                            >
                                In Progress
                            </button>

                            <button
                                type="button"
                                className={
                                    filter === "RECENT"
                                        ? styles.filterActive
                                        : styles.filter
                                }
                                onClick={() =>
                                    setFilter(
                                        "RECENT"
                                    )
                                }
                            >
                                Recently Updated
                            </button>

                        </div>

                    </section>

                    {/* =================================================
                        DRAFT CONTENT
                    ================================================= */}

                    {loading ? (

                        <div
                            className={
                                styles.loadingArea
                            }
                        >

                            <div
                                className={
                                    styles.loadingCard
                                }
                            >

                                <div
                                    className={
                                        styles.spinner
                                    }
                                />

                                <span>
                                    Loading drafts...
                                </span>

                            </div>

                        </div>

                    ) : filteredDrafts.length === 0 ? (

                        <section
                            className={
                                styles.emptyState
                            }
                        >

                            <div
                                className={
                                    styles.emptyIcon
                                }
                            >
                                □
                            </div>

                            <h2>
                                No Drafts Found
                            </h2>

                            <p>
                                {search
                                    ? "No drafts match your search."
                                    : `You do not have any ${
                                          navigation
                                              .coursePlural
                                              .label
                                              .toLowerCase()
                                      } in draft.`}
                            </p>

                            {!search && (

                                <button
                                    type="button"
                                    className={
                                        styles.emptyButton
                                    }
                                    onClick={
                                        handleCreateNew
                                    }
                                >

                                    <span>
                                        +
                                    </span>

                                    {
                                        navigation
                                            .createCourse
                                            .label
                                    }

                                </button>

                            )}

                        </section>

                    ) : (

                        <section
                            className={
                                styles.draftList
                            }
                        >

                            <div
                                className={
                                    styles.listHeader
                                }
                            >

                                <div>
                                    {
                                        filteredDrafts.length
                                    }{" "}
                                    draft
                                    {
                                        filteredDrafts.length !==
                                        1
                                            ? "s"
                                            : ""
                                    }
                                </div>

                                <div>
                                    Last updated
                                </div>

                            </div>

                            {filteredDrafts.map(
                                (
                                    draft
                                ) => {

                                    const progress =
                                        getProgress(
                                            draft.currentStep
                                        );

                                    const title =
                                        getDraftTitle(
                                            draft
                                        );

                                    const courseType =
                                        formatCourseType(
                                            draft
                                                .setup
                                                ?.type
                                        );

                                    const deliveryMode =
                                        formatDeliveryMode(
                                            draft
                                                .setup
                                                ?.deliveryMode
                                        );

                                    const stepIndex =
                                        Math.min(
                                            Math.max(
                                                draft.currentStep,
                                                0
                                            ),
                                            STEP_NAMES.length -
                                                1
                                        );

                                    return (

                                        <article
                                            key={
                                                draft.courseId
                                            }
                                            className={
                                                styles.draftCard
                                            }
                                        >

                                            {/* COURSE INFO */}

                                            <div
                                                className={
                                                    styles.courseInfo
                                                }
                                            >

                                                <div
                                                    className={
                                                        styles.courseIcon
                                                    }
                                                >
                                                    {
                                                        title
                                                            .charAt(
                                                                0
                                                            )
                                                            .toUpperCase()
                                                    }
                                                </div>

                                                <div
                                                    className={
                                                        styles.courseText
                                                    }
                                                >

                                                    <h2>
                                                        {
                                                            title
                                                        }
                                                    </h2>

                                                    <div
                                                        className={
                                                            styles.courseMeta
                                                        }
                                                    >

                                                        <span>
                                                            {
                                                                draft.courseId
                                                            }
                                                        </span>

                                                        {draft
                                                            .setup
                                                            ?.code && (

                                                            <span>
                                                                {
                                                                    draft
                                                                        .setup
                                                                        .code
                                                                }
                                                            </span>

                                                        )}

                                                    </div>

                                                    <div
                                                        className={
                                                            styles.tags
                                                        }
                                                    >

                                                        <span>
                                                            {
                                                                courseType
                                                            }
                                                        </span>

                                                        <span>
                                                            {
                                                                deliveryMode
                                                            }
                                                        </span>

                                                    </div>

                                                </div>

                                            </div>

                                            {/* PROGRESS */}

                                            <div
                                                className={
                                                    styles.progressSection
                                                }
                                            >

                                                <div
                                                    className={
                                                        styles.progressTop
                                                    }
                                                >

                                                    <span>
                                                        {
                                                            STEP_NAMES[
                                                                stepIndex
                                                            ]
                                                        }
                                                    </span>

                                                    <strong>
                                                        {
                                                            progress
                                                        }%
                                                    </strong>

                                                </div>

                                                <div
                                                    className={
                                                        styles.progressTrack
                                                    }
                                                >

                                                    <div
                                                        className={
                                                            styles.progressBar
                                                        }
                                                        style={{
                                                            width:
                                                                `${progress}%`,
                                                        }}
                                                    />

                                                </div>

                                                <small>
                                                    Step{" "}
                                                    {
                                                        Math.min(
                                                            draft.currentStep +
                                                                1,
                                                            TOTAL_STEPS
                                                        )
                                                    }{" "}
                                                    of{" "}
                                                    {
                                                        TOTAL_STEPS
                                                    }
                                                </small>

                                            </div>

                                            {/* UPDATED */}

                                            <div
                                                className={
                                                    styles.updated
                                                }
                                            >

                                                <span>
                                                    Updated
                                                </span>

                                                <strong>
                                                    {
                                                        formatDate(
                                                            draft.updatedAt
                                                        )
                                                    }
                                                </strong>

                                            </div>

                                            {/* ACTIONS */}

                                            <div
                                                className={
                                                    styles.actions
                                                }
                                            >

                                                <button
                                                    type="button"
                                                    className={
                                                        styles.continueButton
                                                    }
                                                    onClick={() =>
                                                        handleContinue(
                                                            draft.courseId
                                                        )
                                                    }
                                                >
                                                    Continue
                                                </button>

                                               <button
    type="button"
    className={styles.deleteButton}
    onClick={() => handleDelete(draft.courseId)}
    aria-label={`Delete ${title}`}
>
    ×
</button>

                                            </div>

                                        </article>
                                    );
                                }
                            )}

                        </section>
                    )}

                </div>

            </main>

            {/* =================================================
                DELETE CONFIRMATION
            ================================================= */}

            {deleteTarget && (

                <div
                    className={
                        styles.modalOverlay
                    }
                    role="presentation"
                    onMouseDown={(event) => {

                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            setDeleteTarget(
                                null
                            );
                        }

                    }}
                >

                    <div
                        className={
                            styles.modal
                        }
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="delete-title"
                    >

                        <div
                            className={
                                styles.modalIcon
                            }
                        >
                            !
                        </div>

                        <h2
                            id="delete-title"
                        >
                            Delete Draft?
                        </h2>

                        <p>
                            This will permanently
                            remove this draft from
                            your local draft list.
                        </p>

                        <div
                            className={
                                styles.modalActions
                            }
                        >

                            <button
                                type="button"
                                className={
                                    styles.cancelButton
                                }
                                onClick={() =>
                                    setDeleteTarget(
                                        null
                                    )
                                }
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className={
                                    styles.confirmDeleteButton
                                }
                                onClick={() =>
                                    handleDelete(
                                        deleteTarget
                                    )
                                }
                            >
                                Delete Draft
                            </button>

                        </div>

                    </div>

                </div>
            )}

        </div>
    );
}

/* =========================================================
   SIDEBAR
========================================================= */

function Sidebar({
    activeItem,
    tenant,
}: {
    activeItem: string;
    tenant?: string;
}) {

    const sidebarItems =
        getSidebarItems(
            tenant || ""
        );

    return (

        <div
            className={
                styles.sidebarInner
            }
        >

            {/* BRAND */}

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

            {/* NAVIGATION */}

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

                {sidebarItems.map(
                    (item) => {

                        const isActive =
                            item.id ===
                            activeItem;

                        return (

                            <button
                                key={
                                    item.id
                                }
                                type="button"
                                className={`
                                    ${styles.navItem}
                                    ${
                                        isActive
                                            ? styles.navActive
                                            : ""
                                    }
                                `}
                                onClick={() => {

                                    window.location.href =
                                        item
                                            .navigation
                                            .path;

                                }}
                            >

                                <span
                                    className={
                                        styles.navIcon
                                    }
                                >
                                    {
                                        getNavIcon(
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
                                        item
                                            .navigation
                                            .label
                                    }
                                </span>

                            </button>

                        );
                    }
                )}

            </nav>

            {/* FOOTER */}

            <div
                className={
                    styles.sidebarFooter
                }
            >

                <span>
                    Course Management
                </span>

                <small>
                    NeuroLXP Platform
                </small>

            </div>

        </div>
    );
}

/* =========================================================
   NAVIGATION ICONS
========================================================= */

function getNavIcon(
    id: string
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

        case "offerings":
            return "◫";

        case "assessments":
            return "✓";

        case "reports":
            return "▤";

        case "settings":
            return "⚙";

        default:
            return "•";
    }
}