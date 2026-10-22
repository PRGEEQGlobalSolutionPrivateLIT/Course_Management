import type {
    DeliveryPlanningConfig,
} from "@/types/course-engine.types";


export const governmentDeliveryPlanning:
    DeliveryPlanningConfig = {

    tenant: "government",

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