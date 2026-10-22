import type {
    DeliveryPlanningConfig,
} from "@/types/course-engine.types";


export const universityDeliveryPlanning:
    DeliveryPlanningConfig = {

    tenant: "university",

    supportsDailyPlanning: true,

    supportsWeeklyPlanning: true,

    supportsSessionPlanning: true,

    supportsSelfPaced: true,

    supportsCohorts: true,

    supportsBatches: true,

    defaultSessionMinutes: 60,

    defaultBreakMinutes: 15,

    minimumSessionMinutes: 30,

    maximumSessionMinutes: 180,

};