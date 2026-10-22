import type {
    CourseSetupData,
} from "./course-creation.types";


export const defaultCourseSetup:
    CourseSetupData = {

    title: "",

    code: "",

    shortName: "",

    description: "",

    objectives: "",

    prerequisites: "",

    targetAudience: "",

    level: "",

    type: "",

    deliveryMode: "",

    category: "",

    tags: [],

    department: "",

    ownerId: "",

    primaryInstructorId: "",

    instructorIds: [],

    reviewerId: "",

    approverId: "",

    language: "en",

    supportedLanguages: ["en"],

    estimatedDuration: 0,

    estimatedDurationUnit: "HOURS",

    credits: undefined,

    passingScore: undefined,

    enrollmentCapacity: undefined,

    waitingListEnabled: false,

    dates: {

        noExpiryAccess: false,

        timezone:
            Intl.DateTimeFormat()
                .resolvedOptions()
                .timeZone,

    },

    branding: {},

};