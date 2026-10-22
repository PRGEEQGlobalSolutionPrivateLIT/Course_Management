import type {
    CourseStructureConfig,
} from "@/types/course-engine.types";


export const skillAcademyCourseStructure:
    CourseStructureConfig = {

    tenant: "skill_academy",

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
            key: "skill_area",
            label: "Skill Area",
            pluralLabel: "Skill Areas",
            required: true,
            allowChildren: true,
        },

        {
            level: 3,
            key: "learning_activity",
            label: "Learning Activity",
            pluralLabel: "Learning Activities",
            required: true,
            allowChildren: true,
        },

        {
            level: 4,
            key: "practice",
            label: "Practice",
            pluralLabel: "Practices",
            required: false,
            allowChildren: false,
        },

    ],
};