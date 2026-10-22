import type {
    CourseStructureConfig,
} from "@/types/course-engine.types";


export const governmentCourseStructure:
    CourseStructureConfig = {

    tenant: "government",

    rootLabel: "Training Program",

    levels: [

        {
            level: 0,
            key: "training_program",
            label: "Training Program",
            pluralLabel: "Training Programs",
            required: true,
            allowChildren: true,
        },

        {
            level: 1,
            key: "module",
            label: "Module",
            pluralLabel: "Modules",
            required: true,
            allowChildren: true,
        },

        {
            level: 2,
            key: "training_unit",
            label: "Training Unit",
            pluralLabel: "Training Units",
            required: true,
            allowChildren: true,
        },

        {
            level: 3,
            key: "session",
            label: "Session",
            pluralLabel: "Sessions",
            required: true,
            allowChildren: true,
        },

        {
            level: 4,
            key: "activity",
            label: "Activity",
            pluralLabel: "Activities",
            required: false,
            allowChildren: false,
        },

    ],
};