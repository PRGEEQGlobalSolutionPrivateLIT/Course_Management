import type {
    DeliveryPlanningConfig,
} from "@/types/course-engine.types";


export const corporateDeliveryPlanning:
    DeliveryPlanningConfig = {

    tenant: "corporate",

    supportsDailyPlanning: true,

    supportsWeeklyPlanning: true,

    supportsSessionPlanning: true,

    supportsSelfPaced: true,

    supportsCohorts: true,

    supportsBatches: true,

    defaultSessionMinutes: 60,

    defaultBreakMinutes: 15,

    minimumSessionMinutes: 30,

    maximumSessionMinutes: 240,

};