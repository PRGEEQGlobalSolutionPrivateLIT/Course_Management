// "use client";

// import {
//     getCurrentUser,
// } from "@/lib/auth/frontend-auth";

// export interface FrontendCourse {
//     id: string;
//     tenantId: string;

//     title: string;

//     status:
//         | "draft"
//         | "review"
//         | "published";

//     departmentId?: string;
//     programmeId?: string;
//     batchId?: string;
//     cohortId?: string;

//     trainerIds?: string[];
//     learnerIds?: string[];

//     createdBy?: string;
// }

// /**
//  * Get courses from frontend storage.
//  */
// export function getStoredCourses():
//     FrontendCourse[] {
//     if (typeof window === "undefined") {
//         return [];
//     }

//     const raw = localStorage.getItem(
//         "neurolxp_courses",
//     );

//     if (!raw) {
//         return [];
//     }

//     try {
//         const parsed = JSON.parse(raw);

//         return Array.isArray(parsed)
//             ? parsed
//             : [];
//     } catch {
//         return [];
//     }
// }

// /**
//  * Return courses visible to
//  * the current logged-in user.
//  */
// export function getCoursesForCurrentUser():
//     FrontendCourse[] {
//     const user = getCurrentUser();

//     if (!user) {
//         return [];
//     }

//     const courses = getStoredCourses();

//     /**
//      * FIRST:
//      * Tenant isolation.
//      */
//     const tenantCourses =
//         courses.filter(
//             (course) =>
//                 course.tenantId ===
//                 user.tenantId,
//         );

//     /**
//      * ADMIN:
//      * Tenant-wide visibility.
//      */
//     if (
//         user.role ===
//             "corporate_admin" ||
//         user.role ===
//             "institute_admin" ||
//         user.role ===
//             "ngo_admin" ||
//         user.role ===
//             "government_admin"
//     ) {
//         return tenantCourses;
//     }

//     /**
//      * MANAGER / COORDINATOR
//      */
//     if (user.role === "coordinator") {
//         return tenantCourses.filter(
//             (course) =>
//                 user.departmentIds?.includes(
//                     course.departmentId ?? "",
//                 ) ||
//                 user.programmeIds?.includes(
//                     course.programmeId ?? "",
//                 ) ||
//                 user.batchIds?.includes(
//                     course.batchId ?? "",
//                 ) ||
//                 user.cohortIds?.includes(
//                     course.cohortId ?? "",
//                 ),
//         );
//     }

//     /**
//      * TRAINER / FACULTY
//      */
//     if (
//         user.role === "trainer" ||
//         user.role === "faculty"
//     ) {
//         return tenantCourses.filter(
//             (course) =>
//                 user.courseIds?.includes(
//                     course.id,
//                 ) ||
//                 course.trainerIds?.includes(
//                     user.id,
//                 ) ||
//                 user.batchIds?.includes(
//                     course.batchId ?? "",
//                 ) ||
//                 user.cohortIds?.includes(
//                     course.cohortId ?? "",
//                 ),
//         );
//     }

//     /**
//      * LEARNER / STUDENT
//      */
//     if (
//         user.role === "learner" ||
//         user.role === "student"
//     ) {
//         return tenantCourses.filter(
//             (course) =>
//                 user.courseIds?.includes(
//                     course.id,
//                 ) ||
//                 course.learnerIds?.includes(
//                     user.id,
//                 ),
//         );
//     }

//     return [];
// }


"use client";

import type { AccessContext } from "../auth/access-control"

import { getCurrentUser } from "./frontend-auth";

/**
 * =========================================================
 * CURRENT ACCESS CONTEXT
 * =========================================================
 *
 * Builds the authorization context for the currently
 * authenticated frontend user.
 *
 * The context is consumed by:
 *
 * - Sidebar/menu authorization
 * - Page authorization
 * - Button/action authorization
 * - Course authorization
 * - Batch/cohort authorization
 * - Department authorization
 * - Tenant isolation
 * - Permission delegation
 *
 * IMPORTANT:
 *
 * tenant:
 *     Tenant TYPE
 *
 *     Example:
 *       corporate
 *       university
 *       skill_academy
 *       bootcamp
 *       ngo
 *       government
 *
 * tenantId:
 *     Actual organization / tenant DATABASE ID
 *
 *     Example:
 *       CORP_001
 *       UNI_001
 *       NGO_001
 *
 * The two values must NOT be confused.
 */

/**
 * =========================================================
 * GET CURRENT ACCESS CONTEXT
 * =========================================================
 */
export function getCurrentAccessContext():
    | AccessContext
    | null {
    const user = getCurrentUser();

    /**
     * No authenticated user.
     *
     * Fail closed.
     */
    if (!user) {
        return null;
    }

    /**
     * -------------------------------------------------------
     * BASIC USER VALIDATION
     * -------------------------------------------------------
     */
    if (!user.id) {
        return null;
    }

    if (!user.role) {
        return null;
    }

    if (!user.tenant) {
        return null;
    }

    /**
     * -------------------------------------------------------
     * BUILD ACCESS CONTEXT
     * -------------------------------------------------------
     *
     * AccessContext currently uses the first assigned
     * organizational scope when multiple IDs exist.
     *
     * The complete arrays can remain in frontend-auth/User
     * for other UI purposes, but authorization functions
     * consume the singular scope currently defined in
     * access-control.ts.
     */
    const context: AccessContext = {
        /**
         * Authenticated user.
         */
        userId: user.id,

        /**
         * User role.
         *
         * Examples:
         * - corporate_admin
         * - coordinator
         * - trainer
         * - learner
         * - institute_admin
         */
        role: user.role,

        /**
         * Tenant TYPE.
         */
        tenant: user.tenant,

        /**
         * Actual tenant / organization ID.
         *
         * This is required for tenant isolation when
         * the resource contains a tenantId.
         */
        tenantId: user.tenantId,

        /**
         * ---------------------------------------------------
         * ORGANIZATIONAL SCOPE
         * ---------------------------------------------------
         *
         * If the user has multiple assignments, the first
         * assignment is used as the current authorization
         * scope.
         *
         * Later, if the application introduces an explicit
         * "active department / active batch / active course"
         * selector, these values can be changed to the
         * selected IDs.
         */
        departmentId:
            user.departmentIds?.[0],

        programmeId:
            user.programmeIds?.[0],

        batchId:
            user.batchIds?.[0],

        cohortId:
            user.cohortIds?.[0],

        courseId:
            user.courseIds?.[0],

        /**
         * Learner-specific authorization scope.
         */
        learnerId:
            user.learnerId,
    };

    return context;
}