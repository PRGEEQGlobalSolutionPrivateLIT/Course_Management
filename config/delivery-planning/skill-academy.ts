import type {
    DeliveryPlanningConfig,
} from "@/types/course-engine.types";


export const skillAcademyDeliveryPlanning:
    DeliveryPlanningConfig = {

    tenant: "skill_academy",

    supportsDailyPlanning: true,

    supportsWeeklyPlanning: true,

    supportsSessionPlanning: true,

    supportsSelfPaced: true,

    supportsCohorts: true,

    supportsBatches: true,

    defaultSessionMinutes: 90,

    defaultBreakMinutes: 15,

    minimumSessionMinutes: 30,

    maximumSessionMinutes: 240,

};