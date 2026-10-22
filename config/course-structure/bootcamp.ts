import type {
    CourseStructureConfig,
} from "@/types/course-engine.types";


export const bootcampCourseStructure:
    CourseStructureConfig = {

    tenant: "bootcamp",

    rootLabel: "Bootcamp",

    levels: [

        {
            level: 0,
            key: "bootcamp",
            label: "Bootcamp",
            pluralLabel: "Bootcamps",
            required: true,
            allowChildren: true,
        },

        {
            level: 1,
            key: "week",
            label: "Week",
            pluralLabel: "Weeks",
            required: true,
            allowChildren: true,
        },

        {
            level: 2,
            key: "session",
            label: "Session",
            pluralLabel: "Sessions",
            required: true,
            allowChildren: true,
        },

        {
            level: 3,
            key: "lab",
            label: "Lab",
            pluralLabel: "Labs",
            required: false,
            allowChildren: true,
        },

        {
            level: 4,
            key: "challenge",
            label: "Challenge",
            pluralLabel: "Challenges",
            required: false,
            allowChildren: false,
        },

    ],
};