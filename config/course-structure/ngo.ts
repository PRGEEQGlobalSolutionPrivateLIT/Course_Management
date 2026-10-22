import type {
    CourseStructureConfig,
} from "@/types/course-engine.types";


export const ngoCourseStructure:
    CourseStructureConfig = {

    tenant: "ngo",

    rootLabel: "Learning Program",

    levels: [

        {
            level: 0,
            key: "learning_program",
            label: "Learning Program",
            pluralLabel: "Learning Programs",
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
            key: "learning_unit",
            label: "Learning Unit",
            pluralLabel: "Learning Units",
            required: true,
            allowChildren: true,
        },

        {
            level: 3,
            key: "activity",
            label: "Activity",
            pluralLabel: "Activities",
            required: true,
            allowChildren: true,
        },

        {
            level: 4,
            key: "field_activity",
            label: "Field Activity",
            pluralLabel: "Field Activities",
            required: false,
            allowChildren: false,
        },

    ],
};