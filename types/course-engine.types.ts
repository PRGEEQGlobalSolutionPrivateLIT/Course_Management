export type TenantType =
    | "university"
    | "corporate"
    | "skill_academy"
    | "bootcamp"
    | "ngo"
    | "government";


export type DeliveryMode =
    | "in_person"
    | "virtual"
    | "blended"
    | "self_paced";


export type DurationType =
    | "fixed_dates"
    | "days"
    | "weeks"
    | "months"
    | "self_paced";


export type StructureLevelConfig = {
    level: number;
    key: string;
    label: string;
    pluralLabel: string;

    required: boolean;

    allowChildren: boolean;

    description?: string;
};


export type CourseStructureConfig = {
    tenant: TenantType;

    rootLabel: string;

    levels: StructureLevelConfig[];
};


export type DeliveryPlanningConfig = {
    tenant: TenantType;

    supportsDailyPlanning: boolean;

    supportsWeeklyPlanning: boolean;

    supportsSessionPlanning: boolean;

    supportsSelfPaced: boolean;

    supportsCohorts: boolean;

    supportsBatches: boolean;

    defaultSessionMinutes: number;

    defaultBreakMinutes: number;

    minimumSessionMinutes: number;

    maximumSessionMinutes: number;
};


export type CourseDuration = {
    type: DurationType;

    startDate?: string;

    endDate?: string;

    numberOfDays?: number;

    numberOfWeeks?: number;

    numberOfMonths?: number;

    timeZone: string;

    totalLearningMinutes: number;
};


export type StructureNode = {
    id: string;

    type: string;

    title: string;

    description?: string;

    order: number;

    parentId?: string;

    children?: StructureNode[];
};


export type ContentItem = {
    id: string;

    structureNodeId: string;

    type: string;

    title: string;

    description?: string;

    durationMinutes: number;

    required: boolean;

    url?: string;
};


export type CourseSession = {
    id: string;

    date: string;

    startTime: string;

    endTime: string;

    durationMinutes: number;

    breakMinutes: number;

    timeZone: string;

    structureNodeIds: string[];

    contentIds: string[];

    trainerIds: string[];

    location?: string;

    deliveryMode: DeliveryMode;

    status:
        | "planned"
        | "scheduled"
        | "completed"
        | "cancelled";
};


export type DeliveryDay = {
    id: string;

    date: string;

    dayNumber: number;

    weekNumber: number;

    sessions: CourseSession[];

    totalLearningMinutes: number;

    status:
        | "planned"
        | "scheduled"
        | "completed";
};


export type DeliveryWeek = {
    id: string;

    weekNumber: number;

    startDate: string;

    endDate: string;

    days: DeliveryDay[];

    totalLearningMinutes: number;
};


export type DeliveryPlan = {
    id: string;

    tenant: TenantType;

    startDate: string;

    endDate: string;

    timeZone: string;

    weeks: DeliveryWeek[];

    totalPlannedMinutes: number;

    totalAvailableMinutes: number;
};


export type CourseDraft = {
    id: string;

    tenant: TenantType;

    role: string;

    title: string;

    description?: string;

    duration: CourseDuration;

    deliveryMode: DeliveryMode;

    structure: StructureNode[];

    content: ContentItem[];

    deliveryPlan?: DeliveryPlan;

    createdAt: string;

    updatedAt: string;
};