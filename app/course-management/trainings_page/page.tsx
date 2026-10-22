"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Clock3,
  Edit3,
  Eye,
  FileText,
  RefreshCw,
  Search,
  UserRound,
} from "lucide-react";

import CourseHeader from "@/components/CourseHeader/CourseHeader";
import styles from "./page.module.css";

type TenantKey =
  | "university"
  | "corporate"
  | "skill_academy"
  | "bootcamp"
  | "ngo"
  | "government";

type TrainingStatus =
  | "DRAFT"
  | "IN_PROGRESS"
  | "VALIDATION"
  | "REVIEW"
  | "PUBLISHED"
  | "UNPUBLISHED";

interface LoggedInUser {
  id: string;
  name: string;
  tenant: TenantKey;
  tenantName?: string;
  role: string;
  roleName?: string;
}

interface UserStamp {
  userId?: string;
  name?: string;
  role?: string;
}

interface TrainingRecord {
  courseId?: string;
  tenant?: string;
  tenantId?: string;
  status?: string;

  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;

  createdBy?: UserStamp | string;
  lastEditedBy?: UserStamp | string;
  publishedBy?: UserStamp | string;

  setup?: {
    title?: string;
    code?: string;
    shortName?: string;
    description?: string;
    category?: string;
    department?: string;
    language?: string;
    deliveryMode?: string;
  };

  structure?: unknown[];
  learningStructure?: unknown[];

  [key: string]: unknown;
}

interface TenantLabels {
  management: string;
  plural: string;
  singular: string;
  create: string;
  draft: string;
  published: string;
}

interface SidebarItem {
  id: string;
  label: string;
  path: string;
}

const COURSE_DRAFT_PREFIX = "course-draft-";

function getTenantLabels(tenant?: string): TenantLabels {
  switch (String(tenant ?? "").trim().toLowerCase()) {
    case "corporate":
      return {
        management: "Training Management",
        plural: "Trainings",
        singular: "Training",
        create: "Create Training",
        draft: "Draft Trainings",
        published: "Published Trainings",
      };

    case "skill_academy":
      return {
        management: "Academy Management",
        plural: "Programs",
        singular: "Program",
        create: "Create Program",
        draft: "Draft Programs",
        published: "Published Programs",
      };

    case "bootcamp":
      return {
        management: "Bootcamp Management",
        plural: "Bootcamps",
        singular: "Bootcamp",
        create: "Create Bootcamp",
        draft: "Draft Bootcamps",
        published: "Published Bootcamps",
      };

    case "ngo":
    case "government":
      return {
        management: "Training Management",
        plural: "Trainings",
        singular: "Training",
        create: "Create Training",
        draft: "Draft Trainings",
        published: "Published Trainings",
      };

    default:
      return {
        management: "Course Management",
        plural: "Courses",
        singular: "Course",
        create: "Create Course",
        draft: "Draft Courses",
        published: "Published Courses",
      };
  }
}

function getSidebarItems(labels: TenantLabels): SidebarItem[] {
  return [
    { id: "dashboard", label: "Dashboard", path: "/dashboard" },
    { id: "courses", label: labels.plural, path: "/course-management" },
    { id: "create", label: labels.create, path: "/course-management/create" },
    { id: "drafts", label: labels.draft, path: "/course-management/draft-courses" },
    { id: "review", label: "Review", path: "/course-management/review" },
    { id: "published", label: labels.published, path: "/course-management/trainings" },
    { id: "permissions", label: "Permissions", path: "/course-management/permissions" },
    { id: "logs", label: "Logs", path: "/course-management/logs" },
  ];
}

function normalizeTenant(value?: string): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_")
    .replace(/\s+/g, "_");
}

function normalizeStatus(value?: string): TrainingStatus {
  const status = String(value ?? "DRAFT")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");

  if (
    status === "IN_PROGRESS" ||
    status === "VALIDATION" ||
    status === "REVIEW" ||
    status === "PUBLISHED" ||
    status === "UNPUBLISHED"
  ) {
    return status;
  }

  return "DRAFT";
}

function getStatusLabel(status: TrainingStatus): string {
  switch (status) {
    case "IN_PROGRESS":
      return "In Progress";
    case "VALIDATION":
      return "Validation";
    case "REVIEW":
      return "Review";
    case "PUBLISHED":
      return "Published";
    case "UNPUBLISHED":
      return "Unpublished";
    default:
      return "Draft";
  }
}

function formatDateTime(value?: string): string {
  if (!value) return "Not recorded";

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

function getUserName(value?: UserStamp | string): string {
  if (!value) return "Not recorded";
  if (typeof value === "string") return value;
  return value.name ?? value.userId ?? "Not recorded";
}

function getTitle(record: TrainingRecord): string {
  return record.setup?.title ?? record.setup?.shortName ?? "Untitled";
}

function getCode(record: TrainingRecord): string {
  return record.setup?.code ?? record.courseId ?? "—";
}

function getStructureCount(record: TrainingRecord): number {
  if (Array.isArray(record.structure)) return record.structure.length;
  if (Array.isArray(record.learningStructure)) return record.learningStructure.length;
  return 0;
}

function loadAllRecords(tenant: TenantKey): TrainingRecord[] {
  if (typeof window === "undefined") return [];

  const result: TrainingRecord[] = [];
  const currentTenant = normalizeTenant(tenant);

  for (let index = 0; index < localStorage.length; index++) {
    const key = localStorage.key(index);

    if (!key || !key.startsWith(COURSE_DRAFT_PREFIX)) continue;

    const raw = localStorage.getItem(key);
    if (!raw) continue;

    try {
      const record = JSON.parse(raw) as TrainingRecord;

      if (!record || typeof record !== "object") continue;

      if (normalizeTenant(record.tenant) !== currentTenant) continue;

      result.push(record);
    } catch {
      // Ignore broken local records.
    }
  }

  return result.sort(
    (a, b) =>
      new Date(b.updatedAt ?? b.createdAt ?? 0).getTime() -
      new Date(a.updatedAt ?? a.createdAt ?? 0).getTime()
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

export default function CourseManagementMasterPage() {
  const [user, setUser] = useState<LoggedInUser | null>(null);
  const [records, setRecords] = useState<TrainingRecord[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | TrainingStatus>("ALL");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const rawUser = localStorage.getItem("user");

    if (!rawUser) {
      window.location.href = "/login";
      return;
    }

    try {
      const parsed = JSON.parse(rawUser) as LoggedInUser;

      setUser(parsed);
      setRecords(loadAllRecords(parsed.tenant));
      setLoading(false);
    } catch {
      window.location.href = "/login";
    }
  }, []);

  useEffect(() => {
    function refreshOnFocus() {
      if (user?.tenant) {
        setRecords(loadAllRecords(user.tenant));
      }
    }

    window.addEventListener("focus", refreshOnFocus);
    window.addEventListener("storage", refreshOnFocus);

    return () => {
      window.removeEventListener("focus", refreshOnFocus);
      window.removeEventListener("storage", refreshOnFocus);
    };
  }, [user?.tenant]);

  const labels = getTenantLabels(user?.tenant);
  const sidebarItems = getSidebarItems(labels);

  const departments = useMemo(() => {
    return Array.from(
      new Set(
        records
          .map((record) => String(record.setup?.department ?? "").trim())
          .filter(Boolean)
      )
    ).sort();
  }, [records]);

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return records.filter((record) => {
      const status = normalizeStatus(record.status);

      const matchesStatus =
        statusFilter === "ALL" ||
        status === statusFilter;

      const matchesDepartment =
        departmentFilter === "ALL" ||
        String(record.setup?.department ?? "") === departmentFilter;

      const searchable = [
        getTitle(record),
        getCode(record),
        record.courseId,
        record.setup?.category,
        record.setup?.department,
        getUserName(record.createdBy),
        getUserName(record.lastEditedBy),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query ||
        searchable.includes(query);

      return matchesStatus && matchesDepartment && matchesSearch;
    });
  }, [records, search, statusFilter, departmentFilter]);

  const counts = useMemo(() => {
    const result: Record<TrainingStatus, number> = {
      DRAFT: 0,
      IN_PROGRESS: 0,
      VALIDATION: 0,
      REVIEW: 0,
      PUBLISHED: 0,
      UNPUBLISHED: 0,
    };

    records.forEach((record) => {
      result[normalizeStatus(record.status)] += 1;
    });

    return result;
  }, [records]);

  function refreshRecords() {
    if (!user?.tenant) return;
    setRecords(loadAllRecords(user.tenant));
  }

  function openRecord(record: TrainingRecord) {
    const courseId = String(record.courseId ?? "").trim();
    if (!courseId) return;

    const status = normalizeStatus(record.status);

    if (status === "REVIEW") {
      window.location.href =
        `/course-management/review?courseId=${encodeURIComponent(courseId)}`;
      return;
    }

    if (status === "PUBLISHED") {
      window.location.href =
        `/course-management/create/learner-view?courseId=${encodeURIComponent(courseId)}`;
      return;
    }

    window.location.href =
      `/course-management/create?courseId=${encodeURIComponent(courseId)}`;
  }

  function editRecord(record: TrainingRecord) {
    const courseId = String(record.courseId ?? "").trim();
    if (!courseId) return;

    window.location.href =
      `/course-management/create?courseId=${encodeURIComponent(courseId)}`;
  }

  if (loading || !user) {
    return <div className={styles.page} />;
  }

  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
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
              const active = item.id === "courses";

              return (
                <button
                  key={item.id}
                  type="button"
                  className={`${styles.navItem} ${active ? styles.navActive : ""}`}
                  onClick={() => {
                    window.location.href = item.path;
                  }}
                >
                  <span className={styles.navIcon}>{getNavIcon(item.id)}</span>
                  <span className={styles.navLabel}>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className={styles.sidebarFooter}>
            <span>{labels.management}</span>
            <small>NeuroLXP Platform</small>
          </div>
        </div>
      </aside>

      <main className={styles.main}>
        <CourseHeader />

        <div className={styles.content}>
          <section className={styles.pageHeader}>
            <div>
              <span className={styles.eyebrow}>MASTER REGISTER</span>

              <h1>{labels.plural}</h1>

              <p>
                View all {labels.plural.toLowerCase()} across draft, in-progress,
                validation, review, published and unpublished stages.
              </p>
            </div>

            <div className={styles.headerActions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={refreshRecords}
              >
                <RefreshCw size={15} />
                Refresh
              </button>

              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => {
                  window.location.href = "/course-management/create";
                }}
              >
                + {labels.create}
              </button>
            </div>
          </section>

          <section className={styles.summaryGrid}>
            <SummaryCard
              label="Total"
              value={records.length}
              active={statusFilter === "ALL"}
              onClick={() => setStatusFilter("ALL")}
            />

            <SummaryCard
              label="Draft"
              value={counts.DRAFT}
              active={statusFilter === "DRAFT"}
              onClick={() => setStatusFilter("DRAFT")}
            />

            <SummaryCard
              label="In Progress"
              value={counts.IN_PROGRESS}
              active={statusFilter === "IN_PROGRESS"}
              onClick={() => setStatusFilter("IN_PROGRESS")}
            />

            <SummaryCard
              label="Validation"
              value={counts.VALIDATION}
              active={statusFilter === "VALIDATION"}
              onClick={() => setStatusFilter("VALIDATION")}
            />

            <SummaryCard
              label="Review"
              value={counts.REVIEW}
              active={statusFilter === "REVIEW"}
              onClick={() => setStatusFilter("REVIEW")}
            />

            <SummaryCard
              label="Published"
              value={counts.PUBLISHED}
              active={statusFilter === "PUBLISHED"}
              onClick={() => setStatusFilter("PUBLISHED")}
            />

            <SummaryCard
              label="Unpublished"
              value={counts.UNPUBLISHED}
              active={statusFilter === "UNPUBLISHED"}
              onClick={() => setStatusFilter("UNPUBLISHED")}
            />
          </section>

          <section className={styles.filterCard}>
            <div className={styles.searchBox}>
              <Search size={16} />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={`Search ${labels.plural.toLowerCase()} by title, code, user or department`}
              />
            </div>

            <select
              className={styles.filterSelect}
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as "ALL" | TrainingStatus)
              }
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="VALIDATION">Validation</option>
              <option value="REVIEW">Review</option>
              <option value="PUBLISHED">Published</option>
              <option value="UNPUBLISHED">Unpublished</option>
            </select>

            <select
              className={styles.filterSelect}
              value={departmentFilter}
              onChange={(event) => setDepartmentFilter(event.target.value)}
            >
              <option value="ALL">All Departments</option>

              {departments.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
          </section>

          <section className={styles.tableCard}>
            <div className={styles.tableHeader}>
              <div>
                <h2>All {labels.plural}</h2>
                <p>
                  {filteredRecords.length} of {records.length} records
                </p>
              </div>
            </div>

            <div className={styles.tableScroll}>
              <table className={styles.masterTable}>
                <thead>
                  <tr>
                    <th>{labels.singular}</th>
                    <th>Status</th>
                    <th>Department</th>
                    <th>Created By</th>
                    <th>Created</th>
                    <th>Last Edited By</th>
                    <th>Last Modified</th>
                    <th>Published By</th>
                    <th>Published</th>
                    <th>Modules</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRecords.map((record) => {
                    const status = normalizeStatus(record.status);

                    return (
                      <tr key={record.courseId ?? getCode(record)}>
                        <td>
                          <div className={styles.trainingCell}>
                            <div className={styles.trainingIcon}>
                              <FileText size={17} />
                            </div>

                            <div>
                              <strong>{getTitle(record)}</strong>

                              <span>
                                {getCode(record)} ·{" "}
                                {record.setup?.category ?? "No category"}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <StatusBadge status={status} />
                        </td>

                        <td>
                          {record.setup?.department ?? "Not recorded"}
                        </td>

                        <td>
                          <UserValue value={getUserName(record.createdBy)} />
                        </td>

                        <td>
                          <DateValue value={formatDateTime(record.createdAt)} />
                        </td>

                        <td>
                          <UserValue value={getUserName(record.lastEditedBy)} />
                        </td>

                        <td>
                          <DateValue value={formatDateTime(record.updatedAt)} />
                        </td>

                        <td>
                          <UserValue value={getUserName(record.publishedBy)} />
                        </td>

                        <td>
                          <DateValue value={formatDateTime(record.publishedAt)} />
                        </td>

                        <td className={styles.centerCell}>
                          {getStructureCount(record)}
                        </td>

                        <td>
                          <div className={styles.actions}>
                            <button
                              type="button"
                              className={styles.iconButton}
                              title={
                                status === "PUBLISHED"
                                  ? "View learner experience"
                                  : "Open record"
                              }
                              onClick={() => openRecord(record)}
                            >
                              <Eye size={15} />
                            </button>

                            {status !== "PUBLISHED" && (
                              <button
                                type="button"
                                className={styles.iconButton}
                                title={`Edit ${labels.singular.toLowerCase()}`}
                                onClick={() => editRecord(record)}
                              >
                                <Edit3 size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredRecords.length === 0 && (
                    <tr>
                      <td colSpan={11} className={styles.emptyState}>
                        No {labels.plural.toLowerCase()} match the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  active,
  onClick,
}: {
  label: string;
  value: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={active ? styles.summaryCardActive : styles.summaryCard}
      onClick={onClick}
    >
      <span>{label}</span>
      <strong>{value}</strong>
    </button>
  );
}

function StatusBadge({
  status,
}: {
  status: TrainingStatus;
}) {
  return (
    <span className={`${styles.statusBadge} ${styles[`status${status}`] ?? ""}`}>
      {getStatusLabel(status)}
    </span>
  );
}

function UserValue({
  value,
}: {
  value: string;
}) {
  return (
    <div className={styles.userValue}>
      <UserRound size={14} />
      <span>{value}</span>
    </div>
  );
}

function DateValue({
  value,
}: {
  value: string;
}) {
  return (
    <div className={styles.dateValue}>
      <Clock3 size={13} />
      <span>{value}</span>
    </div>
  );
}
