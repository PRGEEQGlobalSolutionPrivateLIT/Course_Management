"use client";

import { useEffect, useMemo, useState } from "react";
import CourseHeader from "@/components/CourseHeader/CourseHeader";
import {
  createCourseDraft,
  saveCourseDraft,
} from "@/services/course-draft.service";
import type { CourseCreationState } from "@/types/course-creation.types";
import styles from "./page.module.css";

type TenantKind =
  | "university"
  | "college"
  | "corporate"
  | "skill_academy"
  | "bootcamp"
  | "ngo"
  | "government";

type UserSession = {
  id: string;
  name: string;
  tenant: string;
  tenantName: string;
  role: string;
  roleName: string;
};

type AcademicSetupMaster = Record<string, any> & {
  id: string;
  academicSetupId?: string;
  status?: string;
};

type ProgrammeSetupMaster = Record<string, any> & {
  id: string;
  programmeId?: string;
  academicSetupId?: string;
  programmeName?: string;
  programmeCode?: string;
  status?: string;
};

type CurriculumVersionMaster = Record<string, any> & {
  id: string;
  curriculumVersionId?: string;
  programmeId?: string;
  academicSetupId?: string;
  curriculumName?: string;
  versionName?: string;
  regulationName?: string;
  status?: string;
};

type CsvRow = Record<string, string>;

type UploadStepId =
  | "setup"
  | "credits"
  | "outcomes"
  | "mappings"
  | "structure"
  | "operations";

type UploadStepConfig = {
  id: UploadStepId;
  title: string;
  description: string;
  templateName: string;
  required: boolean;
  headers: string[];
  example: CsvRow;
};

type TenantBulkConfig = {
  singular: string;
  plural: string;
  title: string;
  setupLabel: string;
  steps: UploadStepConfig[];
};

type ParsedFileState = {
  fileName: string;
  rows: CsvRow[];
  error: string;
};

type ImportSummary = {
  created: number;
  failed: number;
  createdIds: string[];
  errors: string[];
};

const ACADEMIC_SETUP_STORAGE_KEY = "neurolxp_academic_setup_records";
const PROGRAMME_SETUP_STORAGE_KEY = "neurolxp_programme_setup_records";
const CURRICULUM_VERSION_STORAGE_KEY = "neurolxp_curriculum_version_records";

function normalizeTenant(value?: string | null): TenantKind {
  const tenant = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_")
    .replace(/\s+/g, "_");

  if (tenant === "university") return "university";
  if (tenant === "college") return "college";
  if (tenant === "corporate" || tenant === "corporate_training") return "corporate";
  if (tenant === "skill_academy" || tenant === "skillacademy") return "skill_academy";
  if (tenant === "bootcamp" || tenant === "bootcamps") return "bootcamp";
  if (tenant === "ngo" || tenant === "non_profit" || tenant === "nonprofit") return "ngo";
  if (
    tenant === "government" ||
    tenant === "govt" ||
    tenant === "government_training"
  ) {
    return "government";
  }

  return "corporate";
}

function isAcademicTenant(tenant: TenantKind): boolean {
  return tenant === "university" || tenant === "college";
}

function normalizeId(value?: string | null): string {
  return String(value ?? "").trim().toLowerCase();
}

function idsMatch(left?: string | null, right?: string | null): boolean {
  const a = normalizeId(left);
  const b = normalizeId(right);
  return Boolean(a && b && a === b);
}

function readArray<T>(key: string): T[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed)) return parsed as T[];
    if (parsed && typeof parsed === "object" && Array.isArray(parsed.records)) {
      return parsed.records as T[];
    }
  } catch {}

  return [];
}

function escapeCsvCell(value: unknown): string {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function rowsToCsv(headers: string[], rows: CsvRow[]): string {
  return [
    headers.map(escapeCsvCell).join(","),
    ...rows.map((row) =>
      headers.map((header) => escapeCsvCell(row[header] ?? "")).join(",")
    ),
  ].join("\r\n");
}

function downloadTextFile(name: string, content: string) {
  const blob = new Blob([content], {
    type: "text/csv;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function parseCsv(text: string): CsvRow[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(cell.trim());
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell.trim());
      if (row.some((item) => item !== "")) rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  row.push(cell.trim());
  if (row.some((item) => item !== "")) rows.push(row);

  if (rows.length < 2) return [];

  const headers = rows[0].map((item) => item.trim());

  return rows.slice(1).map((values) => {
    const result: CsvRow = {};

    headers.forEach((header, index) => {
      result[header] = String(values[index] ?? "").trim();
    });

    return result;
  });
}

function splitList(value?: string): string[] {
  return String(value ?? "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

function asNumber(value?: string, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asBoolean(value?: string, fallback = false): boolean {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (["true", "1", "yes", "y"].includes(normalized)) return true;
  if (["false", "0", "no", "n"].includes(normalized)) return false;
  return fallback;
}

function getCourseKey(row: CsvRow): string {
  return (
    row.courseCode ||
    row.trainingCode ||
    row.programCode ||
    row.bootcampCode ||
    ""
  ).trim();
}

const UNIVERSITY_STEPS: UploadStepConfig[] = [
  {
    id: "setup",
    title: "Course Setup",
    description: "Course-specific Step 1 data. Academic master data is selected above and is not repeated in this CSV.",
    templateName: "university_course_setup.csv",
    required: true,
    headers: [
      "courseCode",
      "courseTitle",
      "shortName",
      "description",
      "courseType",
      "category",
      "language",
      "targetAudience",
      "prerequisites",
      "courseObjective",
      "estimatedLearningHours",
      "durationValue",
      "durationUnit",
      "deliveryMode",
      "startDate",
      "endDate",
    ],
    example: {
      courseCode: "CS301",
      courseTitle: "Data Structures",
      shortName: "DS",
      description: "Data structures and algorithms",
      courseType: "ACADEMIC",
      category: "Core / Compulsory",
      language: "English",
      targetAudience: "ENROLLED_LEARNERS",
      prerequisites: "Programming Fundamentals",
      courseObjective: "Develop algorithmic problem-solving skills",
      estimatedLearningHours: "40",
      durationValue: "16",
      durationUnit: "WEEKS",
      deliveryMode: "CLASSROOM",
      startDate: "2026-08-01",
      endDate: "2026-11-30",
    },
  },
  {
    id: "credits",
    title: "Credits",
    description: "Academic credit structure used by Step 2.",
    templateName: "university_credits.csv",
    required: true,
    headers: [
      "courseCode",
      "totalCredits",
      "lectureCredits",
      "tutorialCredits",
      "practicalCredits",
      "projectCredits",
      "contactHours",
      "selfStudyHours",
    ],
    example: {
      courseCode: "CS301",
      totalCredits: "4",
      lectureCredits: "3",
      tutorialCredits: "0",
      practicalCredits: "1",
      projectCredits: "0",
      contactHours: "45",
      selfStudyHours: "75",
    },
  },
  {
    id: "outcomes",
    title: "Course Outcomes",
    description: "One row per CO. Programme Outcomes and PSOs continue to come from the selected Programme master.",
    templateName: "university_course_outcomes.csv",
    required: true,
    headers: [
      "courseCode",
      "coId",
      "statement",
      "bloomLevel",
      "targetAttainment",
      "weight",
    ],
    example: {
      courseCode: "CS301",
      coId: "CO1",
      statement: "Explain fundamental data structures",
      bloomLevel: "Understand",
      targetAttainment: "70",
      weight: "20",
    },
  },
  {
    id: "mappings",
    title: "CO-PO / PSO Mapping",
    description: "One row per mapping. Strength must be 0, 1, 2 or 3.",
    templateName: "university_outcome_mappings.csv",
    required: true,
    headers: [
      "courseCode",
      "coId",
      "outcomeType",
      "outcomeId",
      "strength",
    ],
    example: {
      courseCode: "CS301",
      coId: "CO1",
      outcomeType: "PO",
      outcomeId: "PO1",
      strength: "3",
    },
  },
  {
    id: "structure",
    title: "Learning Structure",
    description: "University/College hierarchy: Module → Chapter → Unit → Topic.",
    templateName: "university_learning_structure.csv",
    required: true,
    headers: [
      "courseCode",
      "moduleNo",
      "moduleTitle",
      "chapterNo",
      "chapterTitle",
      "unitNo",
      "unitTitle",
      "topicNo",
      "topicTitle",
      "learningHours",
      "description",
    ],
    example: {
      courseCode: "CS301",
      moduleNo: "1",
      moduleTitle: "Introduction",
      chapterNo: "1.1",
      chapterTitle: "Data Structures",
      unitNo: "1.1.1",
      unitTitle: "Basics",
      topicNo: "1.1.1.1",
      topicTitle: "Arrays",
      learningHours: "2",
      description: "Introduction to arrays",
    },
  },
  {
    id: "operations",
    title: "Course Operations",
    description: "Combined Team, Delivery, Enrollment and Completion data for manual Steps 4–7.",
    templateName: "university_course_operations.csv",
    required: true,
    headers: [
      "courseCode",
      "coordinatorId",
      "facultyIds",
      "deliveryMode",
      "deliveryStartDate",
      "deliveryEndDate",
      "enrollmentType",
      "enrollmentStartDate",
      "enrollmentEndDate",
      "maxLearners",
      "completionRule",
      "minimumProgress",
      "minimumScore",
      "certificateEnabled",
    ],
    example: {
      courseCode: "CS301",
      coordinatorId: "COORD001",
      facultyIds: "FAC001|FAC002",
      deliveryMode: "CLASSROOM",
      deliveryStartDate: "2026-08-01",
      deliveryEndDate: "2026-11-30",
      enrollmentType: "BATCH",
      enrollmentStartDate: "2026-07-01",
      enrollmentEndDate: "2026-07-25",
      maxLearners: "60",
      completionRule: "COURSE_AND_ASSESSMENT",
      minimumProgress: "100",
      minimumScore: "60",
      certificateEnabled: "true",
    },
  },
];

function buildGeneralSteps(
  tenant: TenantKind,
  singular: string
): UploadStepConfig[] {
  const prefix =
    tenant === "skill_academy"
      ? "program"
      : tenant === "bootcamp"
        ? "bootcamp"
        : "training";

  const codeField =
    tenant === "skill_academy"
      ? "programCode"
      : tenant === "bootcamp"
        ? "bootcampCode"
        : "trainingCode";

  const titleField =
    tenant === "skill_academy"
      ? "programTitle"
      : tenant === "bootcamp"
        ? "bootcampTitle"
        : "trainingTitle";

  return [
    {
      id: "setup",
      title: `${singular} Setup`,
      description: `Core ${singular.toLowerCase()} setup data matching the manual Step 1 fields.`,
      templateName: `${tenant}_${prefix}_setup.csv`,
      required: true,
      headers: [
        codeField,
        titleField,
        "shortName",
        "description",
        "category",
        "language",
        "targetAudience",
        "prerequisites",
        "objective",
        "estimatedLearningHours",
        "durationValue",
        "durationUnit",
        "deliveryMode",
        "startDate",
        "endDate",
      ],
      example: {
        [codeField]: `${prefix.toUpperCase()}-101`,
        [titleField]: `${singular} Fundamentals`,
        shortName: "FUND",
        description: `Sample ${singular.toLowerCase()} created through bulk upload`,
        category: "Professional Skills",
        language: "English",
        targetAudience: "ALL_LEARNERS",
        prerequisites: "None",
        objective: `Build practical ${singular.toLowerCase()} capability`,
        estimatedLearningHours: "24",
        durationValue: "4",
        durationUnit: "WEEKS",
        deliveryMode: "ONLINE",
        startDate: "2026-09-01",
        endDate: "2026-09-30",
      },
    },
    {
      id: "structure",
      title: "Learning Structure",
      description: `Module → Learning structure matching the existing non-academic manual flow.`,
      templateName: `${tenant}_learning_structure.csv`,
      required: true,
      headers: [
        codeField,
        "moduleNo",
        "moduleTitle",
        "learningNo",
        "learningTitle",
        "learningType",
        "learningHours",
        "description",
      ],
      example: {
        [codeField]: `${prefix.toUpperCase()}-101`,
        moduleNo: "1",
        moduleTitle: "Foundation",
        learningNo: "1.1",
        learningTitle: "Introduction",
        learningType: "LESSON",
        learningHours: "2",
        description: "Introductory learning item",
      },
    },
    {
      id: "operations",
      title: `${singular} Operations`,
      description: "Combined Team, Delivery, Enrollment and Completion data.",
      templateName: `${tenant}_${prefix}_operations.csv`,
      required: true,
      headers: [
        codeField,
        "managerOrCoordinatorId",
        "trainerIds",
        "deliveryMode",
        "deliveryStartDate",
        "deliveryEndDate",
        "cohortOrBatch",
        "enrollmentType",
        "enrollmentStartDate",
        "enrollmentEndDate",
        "maxLearners",
        "completionRule",
        "minimumProgress",
        "minimumScore",
        "certificateEnabled",
      ],
      example: {
        [codeField]: `${prefix.toUpperCase()}-101`,
        managerOrCoordinatorId: "MGR001",
        trainerIds: "TRN001|TRN002",
        deliveryMode: "ONLINE",
        deliveryStartDate: "2026-09-01",
        deliveryEndDate: "2026-09-30",
        cohortOrBatch: "SEP-2026",
        enrollmentType: "ASSIGNED",
        enrollmentStartDate: "2026-08-15",
        enrollmentEndDate: "2026-08-31",
        maxLearners: "40",
        completionRule: "COURSE_AND_ASSESSMENT",
        minimumProgress: "100",
        minimumScore: "60",
        certificateEnabled: "true",
      },
    },
  ];
}

function getTenantConfig(tenant: TenantKind): TenantBulkConfig {
  if (tenant === "university" || tenant === "college") {
    return {
      singular: "Course",
      plural: "Courses",
      title: "University / College Bulk Upload",
      setupLabel: "Course Setup",
      steps: UNIVERSITY_STEPS,
    };
  }

  if (tenant === "skill_academy") {
    return {
      singular: "Program",
      plural: "Programs",
      title: "Skill Academy Bulk Upload",
      setupLabel: "Program Setup",
      steps: buildGeneralSteps(tenant, "Program"),
    };
  }

  if (tenant === "bootcamp") {
    return {
      singular: "Bootcamp",
      plural: "Bootcamps",
      title: "Bootcamp Bulk Upload",
      setupLabel: "Bootcamp Setup",
      steps: buildGeneralSteps(tenant, "Bootcamp"),
    };
  }

  if (tenant === "ngo") {
    return {
      singular: "Training",
      plural: "Trainings",
      title: "NGO Training Bulk Upload",
      setupLabel: "Training Setup",
      steps: buildGeneralSteps(tenant, "Training"),
    };
  }

  if (tenant === "government") {
    return {
      singular: "Training",
      plural: "Trainings",
      title: "Government Training Bulk Upload",
      setupLabel: "Training Setup",
      steps: buildGeneralSteps(tenant, "Training"),
    };
  }

  return {
    singular: "Training",
    plural: "Trainings",
    title: "Corporate Training Bulk Upload",
    setupLabel: "Training Setup",
    steps: buildGeneralSteps("corporate", "Training"),
  };
}

function validateHeaders(
  rows: CsvRow[],
  headers: string[]
): string {
  if (!rows.length) return "CSV contains no data rows.";

  const first = rows[0];
  const missing = headers.filter(
    (header) => !(header in first)
  );

  return missing.length
    ? `Missing columns: ${missing.join(", ")}`
    : "";
}

function buildAcademicStructure(rows: CsvRow[]) {
  const modules = new Map<string, any>();

  for (const row of rows) {
    const moduleKey = row.moduleNo || row.moduleTitle;
    if (!moduleKey) continue;

    if (!modules.has(moduleKey)) {
      modules.set(moduleKey, {
        id: `module-${moduleKey}`,
        moduleNo: row.moduleNo,
        title: row.moduleTitle,
        chapters: [],
      });
    }

    const module = modules.get(moduleKey);
    const chapterKey = row.chapterNo || row.chapterTitle;

    let chapter = module.chapters.find(
      (item: any) =>
        item.chapterNo === row.chapterNo ||
        item.title === row.chapterTitle
    );

    if (!chapter) {
      chapter = {
        id: `chapter-${moduleKey}-${chapterKey}`,
        chapterNo: row.chapterNo,
        title: row.chapterTitle,
        units: [],
      };
      module.chapters.push(chapter);
    }

    let unit = chapter.units.find(
      (item: any) =>
        item.unitNo === row.unitNo ||
        item.title === row.unitTitle
    );

    if (!unit) {
      unit = {
        id: `unit-${moduleKey}-${chapterKey}-${row.unitNo || row.unitTitle}`,
        unitNo: row.unitNo,
        title: row.unitTitle,
        topics: [],
      };
      chapter.units.push(unit);
    }

    unit.topics.push({
      id: `topic-${moduleKey}-${chapterKey}-${row.unitNo}-${row.topicNo || row.topicTitle}`,
      topicNo: row.topicNo,
      title: row.topicTitle,
      learningHours: asNumber(row.learningHours),
      description: row.description,
    });
  }

  return Array.from(modules.values());
}

function buildGeneralStructure(rows: CsvRow[]) {
  const modules = new Map<string, any>();

  for (const row of rows) {
    const moduleKey = row.moduleNo || row.moduleTitle;
    if (!moduleKey) continue;

    if (!modules.has(moduleKey)) {
      modules.set(moduleKey, {
        id: `module-${moduleKey}`,
        moduleNo: row.moduleNo,
        title: row.moduleTitle,
        learnings: [],
      });
    }

    modules.get(moduleKey).learnings.push({
      id: `learning-${moduleKey}-${row.learningNo || row.learningTitle}`,
      learningNo: row.learningNo,
      title: row.learningTitle,
      type: row.learningType || "LESSON",
      estimatedHours: asNumber(row.learningHours),
      description: row.description,
      contents: [],
      assessments: [],
    });
  }

  return Array.from(modules.values());
}

function buildSetup(
  tenant: TenantKind,
  row: CsvRow
) {
  const code =
    row.courseCode ||
    row.trainingCode ||
    row.programCode ||
    row.bootcampCode ||
    "";

  const title =
    row.courseTitle ||
    row.trainingTitle ||
    row.programTitle ||
    row.bootcampTitle ||
    "";

  const type =
    tenant === "university" || tenant === "college"
      ? "ACADEMIC"
      : tenant === "bootcamp"
        ? "BOOTCAMP"
        : tenant === "skill_academy"
          ? "PROGRAM"
          : "CORPORATE_TRAINING";

  return {
    title: title.trim(),
    code: code.trim(),
    shortName: row.shortName?.trim() || "",
    description: row.description?.trim() || "",
    objectives:
      row.courseObjective?.trim() ||
      row.objective?.trim() ||
      "",
    prerequisites: row.prerequisites?.trim() || "",
    targetAudience: row.targetAudience?.trim() || "",
    level: "INTERMEDIATE",
    type,
    deliveryMode: row.deliveryMode?.trim() || "ONLINE",
    category: row.category?.trim() || "",
    tags: [],
    ownerId: "",
    primaryInstructorId: "",
    instructorIds: [],
    reviewerId: "",
    approverId: "",
    language: row.language?.trim() || "English",
    supportedLanguages: [
      row.language?.trim() || "English",
    ],
    estimatedDuration:
      asNumber(row.estimatedLearningHours) > 0
        ? asNumber(row.estimatedLearningHours)
        : asNumber(row.durationValue),
    estimatedDurationUnit:
      asNumber(row.estimatedLearningHours) > 0
        ? "HOURS"
        : row.durationUnit?.trim() || "WEEKS",
    dates: {
      enrollmentStartDate:
        row.enrollmentStartDate || row.startDate || undefined,
      enrollmentEndDate:
        row.enrollmentEndDate || row.endDate || undefined,
      courseStartDate:
        row.deliveryStartDate || row.startDate || undefined,
      courseEndDate:
        row.deliveryEndDate || row.endDate || undefined,
      noExpiryAccess: false,
      timezone:
        typeof Intl !== "undefined"
          ? Intl.DateTimeFormat().resolvedOptions().timeZone
          : "UTC",
    },
    branding: {},
  };
}

function createDraftFromRows(
  tenant: TenantKind,
  role: string,
  setupRow: CsvRow,
  rowsByStep: Partial<Record<UploadStepId, CsvRow[]>>,
  academicContext?: {
    academicSetup: AcademicSetupMaster;
    programme: ProgrammeSetupMaster;
    curriculum: CurriculumVersionMaster;
  }
): CourseCreationState {
  const base = createCourseDraft(tenant, role);
  const key = getCourseKey(setupRow);

  const structureRows =
    rowsByStep.structure?.filter(
      (row) => getCourseKey(row) === key
    ) ?? [];

  const operationRow =
    rowsByStep.operations?.find(
      (row) => getCourseKey(row) === key
    ) ?? {};

  const draft: any = {
    ...base,
    setup: buildSetup(tenant, setupRow),
    status: "DRAFT",
    currentStep: 0,
    completedThroughStep: 0,
    updatedAt: new Date().toISOString(),
  };

  if (academicContext) {
    draft.academicSetupId =
      academicContext.academicSetup.id;

    draft.programmeId =
      academicContext.programme.programmeId ||
      academicContext.programme.id;

    draft.curriculumVersionId =
      academicContext.curriculum.curriculumVersionId ||
      academicContext.curriculum.id;

    draft.academic = {
      academicSetupId: draft.academicSetupId,
      programmeId: draft.programmeId,
      curriculumVersionId: draft.curriculumVersionId,
      academicSetup: academicContext.academicSetup,
      programme: academicContext.programme,
      curriculum: academicContext.curriculum,
    };

    const creditRow =
      rowsByStep.credits?.find(
        (row) => getCourseKey(row) === key
      ) ?? {};

    draft.academicCredits = {
      totalCredits: asNumber(creditRow.totalCredits),
      lectureCredits: asNumber(creditRow.lectureCredits),
      tutorialCredits: asNumber(creditRow.tutorialCredits),
      practicalCredits: asNumber(creditRow.practicalCredits),
      projectCredits: asNumber(creditRow.projectCredits),
      contactHours: asNumber(creditRow.contactHours),
      selfStudyHours: asNumber(creditRow.selfStudyHours),
    };

    draft.courseOutcomes =
      rowsByStep.outcomes
        ?.filter((row) => getCourseKey(row) === key)
        .map((row) => ({
          id: row.coId,
          coId: row.coId,
          statement: row.statement,
          bloomLevel: row.bloomLevel,
          targetAttainment: asNumber(row.targetAttainment),
          weight: asNumber(row.weight),
        })) ?? [];

    draft.programmeOutcomes =
      academicContext.programme.programmeOutcomes ?? [];

    draft.programmeSpecificOutcomes =
      academicContext.programme.programmeSpecificOutcomes ?? [];

    draft.outcomeMappings =
      rowsByStep.mappings
        ?.filter((row) => getCourseKey(row) === key)
        .map((row) => ({
          coId: row.coId,
          outcomeType: row.outcomeType,
          outcomeId: row.outcomeId,
          strength: Math.max(
            0,
            Math.min(3, asNumber(row.strength))
          ),
        })) ?? [];

    draft.structure =
      buildAcademicStructure(structureRows);
  } else {
    draft.structure =
      buildGeneralStructure(structureRows);
  }

  const trainerIds =
    splitList(
      operationRow.facultyIds ||
      operationRow.trainerIds
    );

  draft.teamMembers = [
    ...(
      operationRow.coordinatorId ||
      operationRow.managerOrCoordinatorId
        ? [
            {
              id:
                operationRow.coordinatorId ||
                operationRow.managerOrCoordinatorId,
              role:
                tenant === "university" ||
                tenant === "college"
                  ? "Coordinator"
                  : "Manager / Coordinator",
            },
          ]
        : []
    ),
    ...trainerIds.map((id) => ({
      id,
      role:
        tenant === "university" ||
        tenant === "college"
          ? "Faculty"
          : "Trainer",
    })),
  ];

  draft.team = {
    coordinatorId:
      operationRow.coordinatorId ||
      operationRow.managerOrCoordinatorId ||
      "",
    facultyIds: trainerIds,
    trainerIds,
  };

  draft.delivery = {
    mode:
      operationRow.deliveryMode ||
      setupRow.deliveryMode ||
      "ONLINE",
    startDate:
      operationRow.deliveryStartDate ||
      setupRow.startDate ||
      "",
    endDate:
      operationRow.deliveryEndDate ||
      setupRow.endDate ||
      "",
    batch:
      operationRow.cohortOrBatch || "",
  };

  draft.enrollment = {
    type:
      operationRow.enrollmentType ||
      "ASSIGNED",
    startDate:
      operationRow.enrollmentStartDate ||
      "",
    endDate:
      operationRow.enrollmentEndDate ||
      "",
    maxLearners:
      asNumber(operationRow.maxLearners),
    cohortOrBatch:
      operationRow.cohortOrBatch || "",
  };

  draft.completion = {
    rule:
      operationRow.completionRule ||
      "COURSE_AND_ASSESSMENT",
    minimumProgress:
      asNumber(
        operationRow.minimumProgress,
        100
      ),
    minimumScore:
      asNumber(operationRow.minimumScore),
    certificateEnabled:
      asBoolean(
        operationRow.certificateEnabled,
        false
      ),
  };

  /*
   * IMPORTANT:
   * Bulk Upload only pre-populates draft data.
   * Validation and Review are intentionally NOT completed.
   * Every imported offering remains DRAFT until the user
   * opens that individual draft and publishes it manually.
   */
  draft.validation = {
    status: "PENDING",
    source: "BULK_UPLOAD",
  };

  draft.review = {
    status: "PENDING",
    source: "BULK_UPLOAD",
  };

  draft.status = "DRAFT";
  draft.currentStep = 0;
  draft.completedThroughStep = 0;

  return draft as CourseCreationState;
}

export default function BulkUploadPage() {
  const [user, setUser] =
    useState<UserSession | null>(null);

  const [academicSetups, setAcademicSetups] =
    useState<AcademicSetupMaster[]>([]);

  const [programmes, setProgrammes] =
    useState<ProgrammeSetupMaster[]>([]);

  const [curricula, setCurricula] =
    useState<CurriculumVersionMaster[]>([]);

  const [selectedAcademicSetupId, setSelectedAcademicSetupId] =
    useState("");

  const [selectedProgrammeId, setSelectedProgrammeId] =
    useState("");

  const [selectedCurriculumId, setSelectedCurriculumId] =
    useState("");

  const [files, setFiles] =
    useState<Partial<Record<UploadStepId, ParsedFileState>>>({});

  const [importing, setImporting] =
    useState(false);

  const [summary, setSummary] =
    useState<ImportSummary | null>(null);

  const [pageError, setPageError] =
    useState("");

  useEffect(() => {
    const rawUser = localStorage.getItem("user");

    if (!rawUser) {
      window.location.href = "/login";
      return;
    }

    try {
      const parsed =
        JSON.parse(rawUser) as UserSession;

      setUser(parsed);

      const tenant =
        normalizeTenant(parsed.tenant);

      if (isAcademicTenant(tenant)) {
        setAcademicSetups(
          readArray<AcademicSetupMaster>(
            ACADEMIC_SETUP_STORAGE_KEY
          ).filter((record) =>
            ["Active", "Locked"].includes(
              String(record.status ?? "")
            )
          )
        );

        setProgrammes(
          readArray<ProgrammeSetupMaster>(
            PROGRAMME_SETUP_STORAGE_KEY
          ).filter((record) =>
            ["Active", "Locked"].includes(
              String(record.status ?? "")
            )
          )
        );

        setCurricula(
          readArray<CurriculumVersionMaster>(
            CURRICULUM_VERSION_STORAGE_KEY
          ).filter((record) =>
            ["Active", "Locked"].includes(
              String(record.status ?? "")
            )
          )
        );
      }
    } catch {
      setPageError(
        "Unable to read the current user session."
      );
    }
  }, []);

  const tenant =
    normalizeTenant(user?.tenant);

  const config =
    useMemo(
      () => getTenantConfig(tenant),
      [tenant]
    );

  const selectedAcademicSetup =
    useMemo(
      () =>
        academicSetups.find(
          (record) =>
            idsMatch(
              record.id,
              selectedAcademicSetupId
            ) ||
            idsMatch(
              record.academicSetupId,
              selectedAcademicSetupId
            )
        ) ?? null,
      [
        academicSetups,
        selectedAcademicSetupId,
      ]
    );

  const availableProgrammes =
    useMemo(
      () =>
        selectedAcademicSetup
          ? programmes.filter((record) =>
              idsMatch(
                record.academicSetupId,
                selectedAcademicSetup.id
              ) ||
              idsMatch(
                record.academicSetupId,
                selectedAcademicSetup.academicSetupId
              )
            )
          : [],
      [
        programmes,
        selectedAcademicSetup,
      ]
    );

  const selectedProgramme =
    useMemo(
      () =>
        availableProgrammes.find(
          (record) =>
            idsMatch(
              record.id,
              selectedProgrammeId
            ) ||
            idsMatch(
              record.programmeId,
              selectedProgrammeId
            )
        ) ?? null,
      [
        availableProgrammes,
        selectedProgrammeId,
      ]
    );

  const availableCurricula =
    useMemo(
      () =>
        selectedProgramme
          ? curricula.filter((record) =>
              idsMatch(
                record.programmeId,
                selectedProgramme.id
              ) ||
              idsMatch(
                record.programmeId,
                selectedProgramme.programmeId
              ) ||
              (
                record.programmeCode &&
                selectedProgramme.programmeCode &&
                idsMatch(
                  record.programmeCode,
                  selectedProgramme.programmeCode
                )
              )
            )
          : [],
      [
        curricula,
        selectedProgramme,
      ]
    );

  const selectedCurriculum =
    useMemo(
      () =>
        availableCurricula.find(
          (record) =>
            idsMatch(
              record.id,
              selectedCurriculumId
            ) ||
            idsMatch(
              record.curriculumVersionId,
              selectedCurriculumId
            )
        ) ?? null,
      [
        availableCurricula,
        selectedCurriculumId,
      ]
    );

  function handleAcademicSetupChange(
    value: string
  ) {
    setSelectedAcademicSetupId(value);
    setSelectedProgrammeId("");
    setSelectedCurriculumId("");
    setSummary(null);
  }

  function handleProgrammeChange(
    value: string
  ) {
    setSelectedProgrammeId(value);
    setSelectedCurriculumId("");
    setSummary(null);
  }

  async function handleFile(
    step: UploadStepConfig,
    file?: File
  ) {
    if (!file) return;

    const text =
      await file.text();

    const rows =
      parseCsv(text);

    const error =
      validateHeaders(
        rows,
        step.headers
      );

    setFiles((current) => ({
      ...current,
      [step.id]: {
        fileName: file.name,
        rows,
        error,
      },
    }));

    setSummary(null);
  }

  function downloadTemplate(
    step: UploadStepConfig
  ) {
    downloadTextFile(
      step.templateName,
      rowsToCsv(
        step.headers,
        [step.example]
      )
    );
  }

  const canImport =
    useMemo(() => {
      if (!user) return false;

      if (
        isAcademicTenant(tenant) &&
        (
          !selectedAcademicSetup ||
          !selectedProgramme ||
          !selectedCurriculum
        )
      ) {
        return false;
      }

      return config.steps
        .filter((step) => step.required)
        .every((step) => {
          const state = files[step.id];
          return Boolean(
            state &&
            state.rows.length &&
            !state.error
          );
        });
    }, [
      user,
      tenant,
      config.steps,
      files,
      selectedAcademicSetup,
      selectedProgramme,
      selectedCurriculum,
    ]);

  function validateCourseCoverage(
    setupRows: CsvRow[],
    rowsByStep: Partial<Record<UploadStepId, CsvRow[]>>
  ): string[] {
    const errors: string[] = [];
    const setupKeys =
      setupRows.map(getCourseKey).filter(Boolean);

    if (!setupKeys.length) {
      errors.push(
        `${config.setupLabel} CSV does not contain any valid item codes.`
      );
      return errors;
    }

    const duplicateKeys =
      setupKeys.filter(
        (key, index) =>
          setupKeys.indexOf(key) !== index
      );

    if (duplicateKeys.length) {
      errors.push(
        `Duplicate item codes in setup CSV: ${Array.from(
          new Set(duplicateKeys)
        ).join(", ")}`
      );
    }

    for (const step of config.steps) {
      if (
        step.id === "setup" ||
        !step.required
      ) {
        continue;
      }

      const rows =
        rowsByStep[step.id] ?? [];

      const rowKeys =
        new Set(
          rows.map(getCourseKey).filter(Boolean)
        );

      for (const key of setupKeys) {
        if (!rowKeys.has(key)) {
          errors.push(
            `${step.title}: no data found for ${key}.`
          );
        }
      }
    }

    return errors;
  }

  function importDrafts() {
    if (
      !user ||
      !canImport
    ) {
      return;
    }

    setImporting(true);
    setSummary(null);

    try {
      const rowsByStep:
        Partial<Record<UploadStepId, CsvRow[]>> =
        {};

      for (const step of config.steps) {
        rowsByStep[step.id] =
          files[step.id]?.rows ?? [];
      }

      const setupRows =
        rowsByStep.setup ?? [];

      const coverageErrors =
        validateCourseCoverage(
          setupRows,
          rowsByStep
        );

      if (coverageErrors.length) {
        setSummary({
          created: 0,
          failed: coverageErrors.length,
          createdIds: [],
          errors: coverageErrors,
        });
        setImporting(false);
        return;
      }

      const createdIds: string[] = [];
      const errors: string[] = [];

      for (const setupRow of setupRows) {
        const key =
          getCourseKey(setupRow);

        try {
          const academicContext =
            isAcademicTenant(tenant) &&
            selectedAcademicSetup &&
            selectedProgramme &&
            selectedCurriculum
              ? {
                  academicSetup:
                    selectedAcademicSetup,
                  programme:
                    selectedProgramme,
                  curriculum:
                    selectedCurriculum,
                }
              : undefined;

          const draft =
            createDraftFromRows(
              tenant,
              user.role,
              setupRow,
              rowsByStep,
              academicContext
            );

          /*
           * Every record is saved separately.
           * Bulk Upload never calls publishCourseDraft().
           */
          const saved =
            saveCourseDraft({
              ...draft,
              status: "DRAFT",
            } as CourseCreationState);

          createdIds.push(
            saved.courseId
          );
        } catch (error) {
          errors.push(
            `${key || "Unknown item"}: ${
              error instanceof Error
                ? error.message
                : "Unable to create draft."
            }`
          );
        }
      }

      setSummary({
        created: createdIds.length,
        failed: errors.length,
        createdIds,
        errors,
      });
    } finally {
      setImporting(false);
    }
  }

  if (!user) {
    return (
      <div className={styles.page}>
        <main className={styles.main}>
          <CourseHeader />
          <div className={styles.stateArea}>
            <div className={styles.loadingCard}>
              Loading Bulk Upload...
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <BulkSidebar
          tenant={tenant}
          activeItem="bulk-upload"
        />
      </aside>

      <main className={styles.main}>
        <CourseHeader />

        <div className={styles.content}>
          <nav
            className={styles.breadcrumbs}
            aria-label="Breadcrumb"
          >
            <button
              type="button"
              onClick={() => {
                window.location.href =
                  "/dashboard";
              }}
            >
              Dashboard
            </button>

            <span>/</span>

            <button
              type="button"
              onClick={() => {
                window.location.href =
                  "/course-management/dashboard";
              }}
            >
              Course Management
            </button>

            <span>/</span>
            <strong>Bulk Upload</strong>
          </nav>

          <header className={styles.pageHeader}>
            <div className={styles.titleBlock}>
              <span className={styles.eyebrow}>
                TENANT-AWARE IMPORT
              </span>

              <h1>{config.title}</h1>

              <p>
                Upload tenant-specific CSV files.
                Imported records are created as
                individual drafts only. Nothing is
                published automatically.
              </p>
            </div>

            <div className={styles.courseIdCard}>
              <span>IMPORT MODE</span>
              <strong>DRAFT ONLY</strong>
              <div className={styles.draftIndicator}>
                <span />
                Manual publish required
              </div>
            </div>
          </header>

          {pageError && (
            <section className={styles.errorCard}>
              {pageError}
            </section>
          )}

          {isAcademicTenant(tenant) && (
            <section className={styles.bulkCard}>
              <div className={styles.bulkSectionHeader}>
                <div>
                  <span className={styles.stepBadge}>
                    STEP 1
                  </span>
                  <h2>Academic Context</h2>
                  <p>
                    Select the Academic Setup,
                    Programme and Curriculum Version
                    already created in Academic
                    Configuration. This context is
                    applied to every course in this
                    bulk upload.
                  </p>
                </div>
              </div>

              <div className={styles.bulkGrid}>
                <div className={styles.bulkField}>
                  <label>
                    Academic Setup *
                  </label>

                  <select
                    value={
                      selectedAcademicSetupId
                    }
                    onChange={(event) =>
                      handleAcademicSetupChange(
                        event.target.value
                      )
                    }
                  >
                    <option value="">
                      Select Academic Setup
                    </option>

                    {academicSetups.map(
                      (record) => (
                        <option
                          key={record.id}
                          value={record.id}
                        >
                          {record.academicYearName ||
                            record.sessionName ||
                            record.name ||
                            record.id}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className={styles.bulkField}>
                  <label>Programme *</label>

                  <select
                    value={
                      selectedProgrammeId
                    }
                    disabled={
                      !selectedAcademicSetup
                    }
                    onChange={(event) =>
                      handleProgrammeChange(
                        event.target.value
                      )
                    }
                  >
                    <option value="">
                      Select Programme
                    </option>

                    {availableProgrammes.map(
                      (record) => (
                        <option
                          key={record.id}
                          value={record.id}
                        >
                          {record.programmeName ||
                            record.programmeCode ||
                            record.id}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className={styles.bulkField}>
                  <label>
                    Curriculum Version *
                  </label>

                  <select
                    value={
                      selectedCurriculumId
                    }
                    disabled={
                      !selectedProgramme
                    }
                    onChange={(event) => {
                      setSelectedCurriculumId(
                        event.target.value
                      );
                      setSummary(null);
                    }}
                  >
                    <option value="">
                      Select Curriculum Version
                    </option>

                    {availableCurricula.map(
                      (record) => (
                        <option
                          key={record.id}
                          value={record.id}
                        >
                          {[
                            record.curriculumName,
                            record.versionName,
                            record.regulationName,
                          ]
                            .filter(Boolean)
                            .join(" • ") ||
                            record.id}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>
            </section>
          )}

          <section className={styles.bulkCard}>
            <div className={styles.bulkSectionHeader}>
              <div>
                <span className={styles.stepBadge}>
                  {isAcademicTenant(tenant)
                    ? "STEP 2"
                    : "STEP 1"}
                </span>

                <h2>
                  Upload {config.singular} Data
                </h2>

                <p>
                  Download each template, fill it
                  using the same item code across
                  files, then upload the completed
                  CSV.
                </p>
              </div>
            </div>

            <div className={styles.uploadList}>
              {config.steps.map(
                (step, index) => {
                  const fileState =
                    files[step.id];

                  return (
                    <div
                      key={step.id}
                      className={
                        styles.uploadRow
                      }
                    >
                      <div
                        className={
                          styles.uploadNumber
                        }
                      >
                        {index + 1}
                      </div>

                      <div
                        className={
                          styles.uploadInfo
                        }
                      >
                        <h3>
                          {step.title}
                          {step.required && (
                            <span
                              className={
                                styles.required
                              }
                            >
                              {" "}
                              *
                            </span>
                          )}
                        </h3>

                        <p>
                          {step.description}
                        </p>

                        {fileState && (
                          <div
                            className={
                              fileState.error
                                ? styles.fileError
                                : styles.fileSuccess
                            }
                          >
                            {fileState.error
                              ? fileState.error
                              : `${fileState.fileName} • ${fileState.rows.length} row(s)`}
                          </div>
                        )}
                      </div>

                      <div
                        className={
                          styles.uploadActions
                        }
                      >
                        <button
                          type="button"
                          className={
                            styles.secondaryButton
                          }
                          onClick={() =>
                            downloadTemplate(
                              step
                            )
                          }
                        >
                          Download Template
                        </button>

                        <label
                          className={
                            styles.primaryButton
                          }
                        >
                          Upload CSV
                          <input
                            type="file"
                            accept=".csv,text/csv"
                            hidden
                            onChange={(
                              event
                            ) =>
                              handleFile(
                                step,
                                event.target
                                  .files?.[0]
                              )
                            }
                          />
                        </label>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </section>

          <section className={styles.bulkCard}>
            <div className={styles.bulkSectionHeader}>
              <div>
                <span className={styles.stepBadge}>
                  {isAcademicTenant(tenant)
                    ? "STEP 3"
                    : "STEP 2"}
                </span>

                <h2>
                  Validate & Create Drafts
                </h2>

                <p>
                  Each setup row becomes one
                  independent draft. Validation and
                  Review remain pending so every
                  draft must be opened and published
                  individually.
                </p>
              </div>
            </div>

            <div className={styles.importActions}>
              <button
                type="button"
                className={styles.primaryButton}
                disabled={
                  !canImport || importing
                }
                onClick={importDrafts}
              >
                {importing
                  ? "Creating Drafts..."
                  : `Create ${config.plural} as Drafts`}
              </button>
            </div>

            {summary && (
              <div className={styles.importSummary}>
                <div className={styles.summaryStat}>
                  <span>Drafts Created</span>
                  <strong>
                    {summary.created}
                  </strong>
                </div>

                <div className={styles.summaryStat}>
                  <span>Failed</span>
                  <strong>
                    {summary.failed}
                  </strong>
                </div>

                {summary.createdIds.length >
                  0 && (
                  <div
                    className={
                      styles.summaryDetails
                    }
                  >
                    <h3>Created Draft IDs</h3>
                    <p>
                      {summary.createdIds.join(
                        ", "
                      )}
                    </p>

                    <button
                      type="button"
                      className={
                        styles.secondaryButton
                      }
                      onClick={() => {
                        window.location.href =
                          "/course-management/draft-courses";
                      }}
                    >
                      Open Draft Courses
                    </button>
                  </div>
                )}

                {summary.errors.length > 0 && (
                  <div
                    className={
                      styles.summaryErrors
                    }
                  >
                    <h3>
                      Import Errors
                    </h3>

                    {summary.errors.map(
                      (error) => (
                        <p key={error}>
                          {error}
                        </p>
                      )
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function BulkSidebar({
  tenant,
  activeItem,
}: {
  tenant: TenantKind;
  activeItem: string;
}) {
  const academic =
    isAcademicTenant(tenant);

  const itemLabel =
    tenant === "skill_academy"
      ? "Programs"
      : tenant === "bootcamp"
        ? "Bootcamps"
        : tenant === "university" ||
            tenant === "college"
          ? "Courses"
          : "Trainings";

  const createLabel =
    tenant === "skill_academy"
      ? "Create Program"
      : tenant === "bootcamp"
        ? "Create Bootcamp"
        : tenant === "university" ||
            tenant === "college"
          ? "Create Course"
          : "Create Training";

  const draftLabel =
    tenant === "skill_academy"
      ? "Draft Programs"
      : tenant === "bootcamp"
        ? "Draft Bootcamps"
        : tenant === "university" ||
            tenant === "college"
          ? "Draft Courses"
          : "Draft Trainings";

  const publishedLabel =
    tenant === "skill_academy"
      ? "Published Programs"
      : tenant === "bootcamp"
        ? "Published Bootcamps"
        : tenant === "university" ||
            tenant === "college"
          ? "Published Courses"
          : "Published Trainings";

  const items = [
    {
      id: "dashboard",
      label: "Dashboard",
      path: "/dashboard",
      icon: "⌂",
    },
    {
      id: "courses",
      label: itemLabel,
      path: "/course-management/trainings_page",
      icon: "▣",
    },
    {
      id: "create",
      label: createLabel,
      path: "/course-management/create",
      icon: "+",
    },
    {
      id: "drafts",
      label: draftLabel,
      path: "/course-management/draft-courses",
      icon: "□",
    },
    ...(academic
      ? [
          {
            id: "bulk-upload",
            label: "Bulk Upload",
            path: "/course-management/bulk-upload",
            icon: "⇧",
          },
        ]
      : [
          {
            id: "bulk-upload",
            label: "Bulk Upload",
            path: "/course-management/bulk-upload",
            icon: "⇧",
          },
          {
            id: "review",
            label: "Review",
            path: "/course-management/review",
            icon: "✓",
          },
        ]),
    {
      id: "published",
      label: publishedLabel,
      path: "/course-management/trainings",
      icon: "◉",
    },
    ...(academic
      ? [
          {
            id: "academic-configuration",
            label: "Academic Configuration",
            path: "/course-management/academic-configuration",
            icon: "⚙",
          },
        ]
      : []),
    {
      id: "permissions",
      label: "Permissions",
      path: "/course-management/permissions",
      icon: "⚿",
    },
    {
      id: "logs",
      label: "Logs",
      path: "/course-management/logs",
      icon: "▤",
    },
  ];

  return (
    <div className={styles.sidebarInner}>
      <div className={styles.brand}>
        <div className={styles.brandIcon}>
          N
        </div>

        <div className={styles.brandText}>
          <strong>NeuroLXP</strong>
          <span>Learning Platform</span>
        </div>
      </div>

      <nav className={styles.navigation}>
        <span
          className={styles.navigationTitle}
        >
          COURSE MANAGEMENT
        </span>

        {items.map((item) => {
          const active =
            item.id === activeItem;

          return (
            <button
              key={item.id}
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
                className={styles.navIcon}
              >
                {item.icon}
              </span>

              <span
                className={styles.navLabel}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      <div className={styles.sidebarFooter}>
        <span>Bulk Upload</span>
        <small>NeuroLXP Platform</small>
      </div>
    </div>
  );
}
