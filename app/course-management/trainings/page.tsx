"use client";

import { useEffect, useMemo, useState } from "react";
import CourseHeader from "@/components/CourseHeader/CourseHeader";
import type { CourseCreationState } from "@/types/course-creation.types";
import styles from "./page.module.css";

interface UserSession {
  id: string;
  name: string;
  tenant: string;
  tenantName: string;
  role: string;
  roleName: string;
}

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
  review: NavigationItem;
  publishedCourses: NavigationItem;
  permissions: NavigationItem;
  logs: NavigationItem;
}

type PublishedCourse = CourseCreationState & Record<string, any>;

type AcademicSetupMaster = Record<string, any> & {
  id: string;
  academicSetupId?: string;
};

type ProgrammeSetupMaster = Record<string, any> & {
  id: string;
  programmeId?: string;
  academicSetupId?: string;
};

type CurriculumVersionMaster = Record<string, any> & {
  id: string;
  curriculumVersionId?: string;
  programmeId?: string;
  academicSetupId?: string;
};

type ResolvedAcademicContext = {
  academicSetup: AcademicSetupMaster | null;
  programme: ProgrammeSetupMaster | null;
  curriculum: CurriculumVersionMaster | null;
};

type SidebarPermission = "view" | "create" | "draft" | "review" | "published" | "permissions" | "logs";

const COURSE_DRAFT_PREFIX = "course-draft-";

const ACADEMIC_SETUP_STORAGE_KEY =
  "neurolxp_academic_setup_records";

const PROGRAMME_SETUP_STORAGE_KEY =
  "neurolxp_programme_setup_records";

const CURRICULUM_VERSION_STORAGE_KEY =
  "neurolxp_curriculum_version_records";

function normalizeTenant(value?: string | null): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_")
    .replace(/\s+/g, "_");
}

function getTenantNavigation(tenant: string): TenantNavigation {
  const t = normalizeTenant(tenant);

  let management = "Course Management";
  let item = "Courses";
  let create = "Create Course";
  let draft = "Draft Courses";
  let published = "Published Courses";

  if (t === "corporate" || t === "corporate_training") {
    management = "Training Management";
    item = "Trainings";
    create = "Create Training";
    draft = "Draft Trainings";
    published = "Published Trainings";
  } else if (t === "skill_academy" || t === "skillacademy") {
    management = "Academy Management";
    item = "Programs";
    create = "Create Program";
    draft = "Draft Programs";
    published = "Published Programs";
  } else if (t === "bootcamp" || t === "bootcamps") {
    management = "Bootcamp Management";
    item = "Bootcamps";
    create = "Create Bootcamp";
    draft = "Draft Bootcamps";
    published = "Published Bootcamps";
  } else if (
    t === "ngo" ||
    t === "non_profit" ||
    t === "nonprofit" ||
    t === "government" ||
    t === "govt" ||
    t === "government_training"
  ) {
    management = "Training Management";
    item = "Trainings";
    create = "Create Training";
    draft = "Draft Trainings";
    published = "Published Trainings";
  }

  return {
    dashboard: { label: "Dashboard", path: "/dashboard" },
    courseManagement: { label: management, path: "/course-management/dashboard" },
    createCourse: { label: create, path: "/course-management/create" },
    coursePlural: { label: item, path: "/course-management" },
    draftCourses: { label: draft, path: "/course-management/draft-courses" },
    review: { label: "Review", path: "/course-management/review" },
    publishedCourses: { label: published, path: "/course-management/published-courses" },
    permissions: { label: "Permissions", path: "/course-management/permissions" },
    logs: { label: "Logs", path: "/course-management/logs" },
  };
}

function normalizeRole(role?: string | null): "admin" | "coordinator" | "faculty" {
  const value = String(role ?? "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_")
    .replace(/\s+/g, "_");

  if (
    value.includes("admin") ||
    value.includes("manager") ||
    value.includes("organization_admin") ||
    value.includes("institute_admin")
  ) {
    return "admin";
  }

  if (value.includes("coordinator")) return "coordinator";
  return "faculty";
}

function getStoredPermissions(): Record<string, unknown> | null {
  if (typeof window === "undefined") return null;

  for (const key of ["course_management_permissions", "coursePermissions", "permissions"]) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed as Record<string, unknown>;
    } catch {}
  }
  return null;
}

function readPermission(
  permissions: Record<string, unknown> | null,
  aliases: string[]
): boolean | undefined {
  if (!permissions) return undefined;

  for (const key of aliases) {
    const value = permissions[key];
    if (typeof value === "boolean") return value;

    if (
      value &&
      typeof value === "object" &&
      "enabled" in value &&
      typeof (value as { enabled?: unknown }).enabled === "boolean"
    ) {
      return Boolean((value as { enabled: boolean }).enabled);
    }
  }
  return undefined;
}

function hasSidebarPermission(
  role?: string | null,
  permission?: SidebarPermission,
  permissions: Record<string, unknown> | null = null
): boolean {
  if (!permission) return false;
  if (normalizeRole(role) === "admin") return true;

  const aliases: Record<SidebarPermission, string[]> = {
    view: ["viewCourses", "viewTrainings", "viewPrograms", "courses.view", "trainings.view"],
    create: ["createCourse", "createTraining", "createProgram", "courses.create", "trainings.create"],
    draft: ["viewDraftCourses", "viewDraftTrainings", "draftCourses", "draftTrainings", "courses.draft", "trainings.draft"],
    review: ["review", "reviewCourses", "reviewTrainings", "courses.review", "trainings.review"],
    published: ["viewPublishedCourses", "viewPublishedTrainings", "publishedCourses", "publishedTrainings", "courses.published", "trainings.published"],
    permissions: ["managePermissions", "permissions", "courseManagement.permissions"],
    logs: ["viewLogs", "logs", "courseManagement.logs"],
  };

  const explicit = readPermission(permissions, aliases[permission]);
  if (typeof explicit === "boolean") return explicit;
  if (permission === "permissions" || permission === "logs") return false;
  return true;
}

function getSidebarItems(tenant?: string | null, role?: string | null) {
  const navigation = getTenantNavigation(String(tenant ?? ""));
  const permissions = getStoredPermissions();

  const items: Array<{
    id: string;
    navigation: NavigationItem;
    permission: SidebarPermission;
  }> = [
    { id: "dashboard", navigation: navigation.dashboard, permission: "view" },
    { id: "courses", navigation: navigation.coursePlural, permission: "view" },
    { id: "create", navigation: navigation.createCourse, permission: "create" },
    { id: "drafts", navigation: navigation.draftCourses, permission: "draft" },
    { id: "review", navigation: navigation.review, permission: "review" },
    { id: "published", navigation: navigation.publishedCourses, permission: "published" },
    { id: "permissions", navigation: navigation.permissions, permission: "permissions" },
    { id: "logs", navigation: navigation.logs, permission: "logs" },
  ];

  return items.filter((item) =>
    hasSidebarPermission(role, item.permission, permissions)
  );
}

function asArray(value: unknown): any[] {
  return Array.isArray(value) ? value : [];
}

function asText(value: unknown, fallback = "—"): string {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text || fallback;
}

function formatDate(value: unknown): string {
  if (!value || typeof value !== "string") return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value: unknown): string {
  if (!value || typeof value !== "string") return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}


function normalizeIdentifier(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function identifiersMatch(left: unknown, right: unknown): boolean {
  const a = normalizeIdentifier(left);
  const b = normalizeIdentifier(right);

  return Boolean(a && b && a === b);
}

function readMasterRecords<T>(key: string): T[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];

    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed)) {
      return parsed as T[];
    }

    if (
      parsed &&
      typeof parsed === "object" &&
      Array.isArray((parsed as { records?: unknown[] }).records)
    ) {
      return (parsed as { records: T[] }).records;
    }
  } catch {}

  return [];
}

function firstText(
  source: Record<string, any> | null | undefined,
  keys: string[],
  fallback = "—"
): string {
  if (!source) return fallback;

  for (const key of keys) {
    const value = source[key];

    if (
      value !== null &&
      value !== undefined &&
      String(value).trim()
    ) {
      return String(value).trim();
    }
  }

  return fallback;
}

function getAcademicReferenceIds(course: PublishedCourse) {
  const academic =
    (course.academic ?? {}) as Record<string, any>;

  const academicContext =
    (course.academicContext ??
      course.academicConfiguration ??
      {}) as Record<string, any>;

  const setup =
    (course.setup ?? {}) as Record<string, any>;

  return {
    academicSetupId:
      course.academicSetupId ??
      academic.academicSetupId ??
      academicContext.academicSetupId ??
      setup.academicSetupId ??
      academic.academicSetup?.academicSetupId ??
      academic.academicSetup?.id ??
      academicContext.academicSetup?.academicSetupId ??
      academicContext.academicSetup?.id ??
      "",

    programmeId:
      course.programmeId ??
      academic.programmeId ??
      academicContext.programmeId ??
      setup.programmeId ??
      academic.programme?.programmeId ??
      academic.programme?.id ??
      academicContext.programme?.programmeId ??
      academicContext.programme?.id ??
      "",

    curriculumVersionId:
      course.curriculumVersionId ??
      academic.curriculumVersionId ??
      academicContext.curriculumVersionId ??
      setup.curriculumVersionId ??
      academic.curriculum?.curriculumVersionId ??
      academic.curriculum?.id ??
      academicContext.curriculum?.curriculumVersionId ??
      academicContext.curriculum?.id ??
      "",
  };
}

function resolveAcademicContext(
  course: PublishedCourse
): ResolvedAcademicContext {
  if (typeof window === "undefined") {
    return {
      academicSetup: null,
      programme: null,
      curriculum: null,
    };
  }

  const academic =
    (course.academic ?? {}) as Record<string, any>;

  const academicContext =
    (course.academicContext ??
      course.academicConfiguration ??
      {}) as Record<string, any>;

  const refs = getAcademicReferenceIds(course);

  const academicSetups =
    readMasterRecords<AcademicSetupMaster>(
      ACADEMIC_SETUP_STORAGE_KEY
    );

  const programmes =
    readMasterRecords<ProgrammeSetupMaster>(
      PROGRAMME_SETUP_STORAGE_KEY
    );

  const curricula =
    readMasterRecords<CurriculumVersionMaster>(
      CURRICULUM_VERSION_STORAGE_KEY
    );

  const academicSetup =
    academicSetups.find(
      (record) =>
        identifiersMatch(
          record.id,
          refs.academicSetupId
        ) ||
        identifiersMatch(
          record.academicSetupId,
          refs.academicSetupId
        )
    ) ??
    academic.academicSetup ??
    academicContext.academicSetup ??
    null;

  const programme =
    programmes.find(
      (record) =>
        identifiersMatch(
          record.id,
          refs.programmeId
        ) ||
        identifiersMatch(
          record.programmeId,
          refs.programmeId
        )
    ) ??
    academic.programme ??
    academicContext.programme ??
    null;

  const curriculum =
    curricula.find(
      (record) =>
        identifiersMatch(
          record.id,
          refs.curriculumVersionId
        ) ||
        identifiersMatch(
          record.curriculumVersionId,
          refs.curriculumVersionId
        )
    ) ??
    academic.curriculum ??
    academicContext.curriculum ??
    null;

  return {
    academicSetup,
    programme,
    curriculum,
  };
}

function getCourseTitle(course: PublishedCourse): string {
  return asText(course.setup?.title ?? course.title, "Untitled Course");
}

function getCourseCode(course: PublishedCourse): string {
  return asText(course.setup?.code ?? course.code, course.courseId);
}

function getStructureStats(course: PublishedCourse) {
  const structure = asArray(course.structure ?? course.learningStructure);
  let learnings = 0;
  let resources = 0;
  let assessments = 0;

  for (const module of structure) {
    const moduleLearnings = asArray(module?.learnings);
    learnings += moduleLearnings.length;

    for (const learning of moduleLearnings) {
      resources += asArray(learning?.contents).length;
      assessments += asArray(learning?.assessments).length;
    }
  }

  return {
    modules: structure.length,
    learnings,
    resources,
    assessments,
  };
}

function loadPublishedCourses(tenant: string): PublishedCourse[] {
  if (typeof window === "undefined") return [];

  const normalizedTenant = normalizeTenant(tenant);
  const result: PublishedCourse[] = [];

  try {
    for (let index = 0; index < localStorage.length; index++) {
      const key = localStorage.key(index);

      if (!key || !key.startsWith(COURSE_DRAFT_PREFIX)) continue;

      const raw = localStorage.getItem(key);
      if (!raw) continue;

      try {
        const record = JSON.parse(raw) as PublishedCourse;

        if (!record || typeof record !== "object") continue;
        if (String(record.status ?? "").toUpperCase() !== "PUBLISHED") continue;
        if (normalizeTenant(record.tenant) !== normalizedTenant) continue;

        result.push(record);
      } catch {}
    }
  } catch {
    return [];
  }

  return result.sort(
    (a, b) =>
      new Date(b.updatedAt ?? 0).getTime() -
      new Date(a.updatedAt ?? 0).getTime()
  );
}

export default function PublishedCoursesPage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [courses, setCourses] = useState<PublishedCourse[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const rawUser = localStorage.getItem("user");

    if (!rawUser) {
      window.location.href = "/login";
      return;
    }

    try {
      const parsed = JSON.parse(rawUser) as UserSession;

      if (!parsed.tenant || !parsed.role) {
        setError("Your account configuration is incomplete.");
        setLoading(false);
        return;
      }

      setUser(parsed);
      setCourses(loadPublishedCourses(parsed.tenant));
      setLoading(false);
    } catch {
      setError("Unable to load published courses.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    function reload() {
      if (user?.tenant) {
        setCourses(loadPublishedCourses(user.tenant));
      }
    }

    window.addEventListener("focus", reload);
    window.addEventListener("storage", reload);

    return () => {
      window.removeEventListener("focus", reload);
      window.removeEventListener("storage", reload);
    };
  }, [user?.tenant]);

  const navigation = getTenantNavigation(user?.tenant ?? "");

  const categories = useMemo(() => {
    return Array.from(
      new Set(
        courses
          .map((course) => String(course.setup?.category ?? "").trim())
          .filter(Boolean)
      )
    ).sort();
  }, [courses]);

  const filteredCourses = useMemo(() => {
    const q = search.trim().toLowerCase();

    return courses.filter((course) => {
      const matchesSearch =
        !q ||
        getCourseTitle(course).toLowerCase().includes(q) ||
        getCourseCode(course).toLowerCase().includes(q) ||
        String(course.courseId ?? "").toLowerCase().includes(q) ||
        String(course.setup?.description ?? "").toLowerCase().includes(q) ||
        (
          (
            normalizeTenant(user?.tenant) === "university" ||
            normalizeTenant(user?.tenant) === "college"
          ) &&
          (() => {
            const context = resolveAcademicContext(course);

            return [
              firstText(
                context.academicSetup,
                ["academicYear", "sessionName", "session"],
                ""
              ),
              firstText(
                context.programme,
                ["programmeName", "programmeCode"],
                ""
              ),
              firstText(
                context.curriculum,
                [
                  "curriculumName",
                  "curriculumVersion",
                  "regulation",
                ],
                ""
              ),
            ]
              .join(" ")
              .toLowerCase()
              .includes(q);
          })()
        );

      const matchesCategory =
        category === "ALL" ||
        String(course.setup?.category ?? "") === category;

      return matchesSearch && matchesCategory;
    });
  }, [courses, search, category]);

  function toggleDetails(courseId: string) {
    setExpanded((previous) => {
      const next = new Set(previous);

      if (next.has(courseId)) next.delete(courseId);
      else next.add(courseId);

      return next;
    });
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <aside className={styles.sidebar}>
          <Sidebar activeItem="published" />
        </aside>

        <main className={styles.main}>
          <CourseHeader />
          <div className={styles.stateArea}>
            <div className={styles.loadingCard}>
              <div className={styles.spinner} />
              <div>
                <h2>Loading published content</h2>
                <p>Please wait...</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <aside className={styles.sidebar}>
          <Sidebar
            activeItem="published"
            tenant={user?.tenant}
            role={user?.role}
          />
        </aside>

        <main className={styles.main}>
          <CourseHeader />
          <div className={styles.stateArea}>
            <div className={styles.errorCard}>
              <div className={styles.errorIcon}>!</div>
              <div>
                <h2>Unable to Load</h2>
                <p>{error}</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <Sidebar
          activeItem="published"
          tenant={user?.tenant}
          role={user?.role}
        />
      </aside>

      <main className={styles.main}>
        <CourseHeader />

        <div className={styles.content}>
          <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
            <button
              type="button"
              onClick={() => {
                window.location.href = navigation.dashboard.path;
              }}
            >
              {navigation.dashboard.label}
            </button>

            <span>/</span>

            <button
              type="button"
              onClick={() => {
                window.location.href = navigation.courseManagement.path;
              }}
            >
              {navigation.courseManagement.label}
            </button>

            <span>/</span>

            <strong>{navigation.publishedCourses.label}</strong>
          </nav>

          <header className={styles.pageHeader}>
            <div className={styles.titleBlock}>
              <span className={styles.eyebrow}>PUBLISHED LEARNING</span>
              <h1>{navigation.publishedCourses.label}</h1>
              <p>
                All offerings that completed review and were published are shown here.
              </p>
            </div>

            <div className={styles.summaryCard}>
              <span>TOTAL PUBLISHED</span>
              <strong>{courses.length}</strong>
              <small>{navigation.coursePlural.label}</small>
            </div>
          </header>

          <section className={styles.filterBar}>
            <div className={styles.searchBox}>
              <span>⌕</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={`Search ${navigation.coursePlural.label.toLowerCase()} by title, code or ID`}
              />
            </div>

            <select
              className={styles.select}
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="ALL">All Categories</option>

              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <button
              type="button"
              className={styles.refreshButton}
              onClick={() => {
                if (user?.tenant) {
                  setCourses(loadPublishedCourses(user.tenant));
                }
              }}
            >
              ↻ Refresh
            </button>
          </section>

          {filteredCourses.length === 0 ? (
            <section className={styles.emptyState}>
              <div className={styles.emptyIcon}>◫</div>
              <h2>No {navigation.publishedCourses.label.toLowerCase()} yet</h2>
              <p>
                After the Review step passes all checks and Publish is clicked,
                the complete record will appear here automatically.
              </p>
              <button
                type="button"
                onClick={() => {
                  window.location.href = navigation.review.path;
                }}
              >
                Go to Review
              </button>
            </section>
          ) : (
            <section className={styles.courseGrid}>
              {filteredCourses.map((course) => {
                const courseId = String(course.courseId ?? "");
                const setup =
                  (course.setup ?? {}) as unknown as Record<string, any>;

                const stats = getStructureStats(course);
                const isExpanded = expanded.has(courseId);

                const tags = asArray(setup.tags);
                const languages = asArray(setup.supportedLanguages);
                const instructors = asArray(setup.instructorIds);
                const teamMembers = asArray(course.teamMembers);

                const isAcademicTenant =
                  normalizeTenant(user?.tenant) === "university" ||
                  normalizeTenant(user?.tenant) === "college";

                const academicContext =
                  isAcademicTenant
                    ? resolveAcademicContext(course)
                    : null;

                return (
                  <article key={courseId} className={styles.courseCard}>
                    <div className={styles.cardTop}>
                      <div className={styles.courseIdentity}>
                        <div className={styles.courseIcon}>▣</div>

                        <div>
                          <div className={styles.statusRow}>
                            <span className={styles.statusBadge}>Published</span>
                            <span className={styles.courseId}>{courseId}</span>
                          </div>

                          <h2>{getCourseTitle(course)}</h2>
                          <p className={styles.courseCode}>{getCourseCode(course)}</p>
                        </div>
                      </div>

                      <div className={styles.publishedMeta}>
                        <span>Published</span>
                        <strong>{formatDate(course.updatedAt)}</strong>
                      </div>
                    </div>

                    <p className={styles.description}>
                      {asText(setup.description, "No description provided.")}
                    </p>

                    <div className={styles.quickDetails}>
                      <Detail label="Category" value={asText(setup.category)} />
                      <Detail label="Department" value={asText(setup.department)} />
                      <Detail label="Language" value={asText(setup.language)} />
                      <Detail label="Delivery" value={asText(setup.deliveryMode)} />
                    </div>

                    <div className={styles.statsGrid}>
                      <Stat value={stats.modules} label="Modules" />
                      <Stat value={stats.learnings} label="Learnings" />
                      <Stat value={stats.resources} label="Resources" />
                      <Stat value={stats.assessments} label="Assessments" />
                    </div>

                    {isExpanded && (
                      <div className={styles.expandedDetails}>
                        <h3>Full Published Record</h3>

                        <div className={styles.detailSections}>
                          {isAcademicTenant && academicContext && (
                            <InfoSection
                              title="Academic Context"
                              items={[
                                [
                                  "Academic Setup",
                                  firstText(
                                    academicContext.academicSetup,
                                    [
                                      "academicSetupName",
                                      "setupName",
                                      "academicYear",
                                      "sessionName",
                                      "session",
                                      "name",
                                    ]
                                  ),
                                ],
                                [
                                  "Academic Year / Session",
                                  [
                                    firstText(
                                      academicContext.academicSetup,
                                      [
                                        "academicYear",
                                        "academicYearName",
                                      ],
                                      ""
                                    ),
                                    firstText(
                                      academicContext.academicSetup,
                                      [
                                        "sessionName",
                                        "session",
                                        "academicSession",
                                      ],
                                      ""
                                    ),
                                  ]
                                    .filter(Boolean)
                                    .join(" / ") || "—",
                                ],
                                [
                                  "Programme",
                                  firstText(
                                    academicContext.programme,
                                    [
                                      "programmeName",
                                      "programName",
                                      "name",
                                    ]
                                  ),
                                ],
                                [
                                  "Programme Code",
                                  firstText(
                                    academicContext.programme,
                                    [
                                      "programmeCode",
                                      "programCode",
                                      "code",
                                    ]
                                  ),
                                ],
                                [
                                  "Curriculum",
                                  firstText(
                                    academicContext.curriculum,
                                    [
                                      "curriculumName",
                                      "name",
                                    ]
                                  ),
                                ],
                                [
                                  "Curriculum Version",
                                  firstText(
                                    academicContext.curriculum,
                                    [
                                      "curriculumVersion",
                                      "versionName",
                                      "version",
                                    ]
                                  ),
                                ],
                                [
                                  "Regulation / Scheme",
                                  firstText(
                                    academicContext.curriculum,
                                    [
                                      "regulation",
                                      "regulationName",
                                      "scheme",
                                      "regulationScheme",
                                    ]
                                  ),
                                ],
                              ]}
                            />
                          )}

                          <InfoSection
                            title="Basic Information"
                            items={[
                              ["Short Name", asText(setup.shortName)],
                              ["Target Audience", asText(setup.targetAudience)],
                              ["Prerequisites", asText(setup.prerequisites)],
                            ]}
                          />

                          <InfoSection
                            title="Learning Configuration"
                            items={[
                              ["Modules", String(stats.modules)],
                              ["Learnings", String(stats.learnings)],
                              ["Resources", String(stats.resources)],
                              ["Assessments", String(stats.assessments)],
                              [
                                "Supported Languages",
                                languages.length ? languages.join(", ") : "—",
                              ],
                            ]}
                          />

                          <InfoSection
                            title="People & Metadata"
                            items={[
                              [
                                "Assigned Instructors",
                                instructors.length ? instructors.join(", ") : "—",
                              ],
                              [
                                "Course Team",
                                teamMembers.length
                                  ? teamMembers
                                      .map((member) =>
                                        member?.name
                                          ? `${member.name}${member.role ? ` (${member.role})` : ""}`
                                          : String(member)
                                      )
                                      .join(", ")
                                  : "—",
                              ],
                              ["Tags", tags.length ? tags.join(", ") : "—"],
                              ["Created", formatDateTime(course.createdAt)],
                              ["Published / Updated", formatDateTime(course.updatedAt)],
                              ["Status", asText(course.status)],
                            ]}
                          />
                        </div>
                      </div>
                    )}

                    <div className={styles.cardActions}>
                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={() => toggleDetails(courseId)}
                      >
                        {isExpanded ? "Hide Details" : "View Full Details"}
                      </button>

                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={() => {
                          window.location.href =
                            `/course-management/create?courseId=${encodeURIComponent(courseId)}`;
                        }}
                      >
                        Open Course
                      </button>

                      <button
                        type="button"
                        className={styles.primaryButton}
                        onClick={() => {
                          window.location.href =
                            `/course-management/create/learner-view?courseId=${encodeURIComponent(courseId)}`;
                        }}
                      >
                        Learner View
                      </button>
                    </div>
                  </article>
                );
              })}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.detailItem}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className={styles.statItem}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function InfoSection({
  title,
  items,
}: {
  title: string;
  items: Array<[string, string]>;
}) {
  return (
    <section className={styles.infoSection}>
      <h4>{title}</h4>

      {items.map(([label, value]) => (
        <div key={label} className={styles.infoRow}>
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </section>
  );
}

function Sidebar({
  activeItem,
  tenant,
  role,
}: {
  activeItem: string;
  tenant?: string;
  role?: string;
}) {
  const sidebarItems = getSidebarItems(tenant ?? "", role ?? "");

  return (
    <div className={styles.sidebarInner}>
      <div className={styles.brand}>
        <div className={styles.brandIcon}>N</div>

        <div className={styles.brandText}>
          <strong>NeuroLXP</strong>
          <span>Learning Platform</span>
        </div>
      </div>

      <nav className={styles.navigation}>
        <span className={styles.navigationTitle}>COURSE MANAGEMENT</span>

        {sidebarItems.map((item) => {
          const isActive = item.id === activeItem;

          return (
            <button
              key={item.id}
              type="button"
              className={`${styles.navItem} ${isActive ? styles.navActive : ""}`}
              onClick={() => {
                window.location.href = item.navigation.path;
              }}
            >
              <span className={styles.navIcon}>{getNavIcon(item.id)}</span>
              <span className={styles.navLabel}>{item.navigation.label}</span>
            </button>
          );
        })}
      </nav>

      <div className={styles.sidebarFooter}>
        <span>{getTenantNavigation(tenant ?? "").courseManagement.label}</span>
        <small>NeuroLXP Platform</small>
      </div>
    </div>
  );
}

function getNavIcon(id: string): string {
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
