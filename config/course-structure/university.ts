import type {
    CourseStructureConfig,
} from "@/types/course-engine.types";


export const universityCourseStructure:
    CourseStructureConfig = {

    tenant: "university",

    rootLabel: "Course",

    levels: [

        {
            level: 0,
            key: "course",
            label: "Course",
            pluralLabel: "Courses",
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
            key: "unit",
            label: "Unit",
            pluralLabel: "Units",
            required: true,
            allowChildren: true,
        },

        {
            level: 3,
            key: "topic",
            label: "Topic",
            pluralLabel: "Topics",
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