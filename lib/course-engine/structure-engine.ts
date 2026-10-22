import {
    universityCourseStructure,
} from "@/config/course-structure/university";

import {
    corporateCourseStructure,
} from "@/config/course-structure/corporate";

import {
    skillAcademyCourseStructure,
} from "@/config/course-structure/skill-academy";

import {
    bootcampCourseStructure,
} from "@/config/course-structure/bootcamp";

import {
    ngoCourseStructure,
} from "@/config/course-structure/ngo";

import {
    governmentCourseStructure,
} from "@/config/course-structure/government";

import type {
    CourseStructureConfig,
    StructureNode,
    TenantType,
} from "@/types/course-engine.types";


const structures:
    Record<TenantType, CourseStructureConfig> = {

    university:
        universityCourseStructure,

    corporate:
        corporateCourseStructure,

    skill_academy:
        skillAcademyCourseStructure,

    bootcamp:
        bootcampCourseStructure,

    ngo:
        ngoCourseStructure,

    government:
        governmentCourseStructure,

};


export function getCourseStructure(
    tenant: TenantType
): CourseStructureConfig {

    return structures[tenant];

}


export function createStructureNode(
    type: string,
    title: string,
    order: number,
    parentId?: string
): StructureNode {

    return {

        id:
            `NODE-${Date.now()}-${Math.random()
                .toString(36)
                .slice(2, 8)}`,

        type,

        title,

        order,

        parentId,

        children: [],

    };

}