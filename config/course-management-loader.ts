import {
    universityInstituteAdminCourseManagement
} from "./course-management-config/university/institute-admin";

import {
    universityCoordinatorCourseManagement
} from "./course-management-config/university/coordinator";

import {
    universityFacultyCourseManagement
} from "./course-management-config/university/faculty";

import {
    universityStudentCourseManagement
} from "./course-management-config/university/student";


import {
    corporateAdminCourseManagement
} from "./course-management-config/corporate/corporate-admin";

import {
    corporateManagerCourseManagement
} from "./course-management-config/corporate/manager";

import {
    corporateTrainerCourseManagement
} from "./course-management-config/corporate/trainer";

import {
    corporateEmployeeCourseManagement
} from "./course-management-config/corporate/employee";


import {
    skillAcademyAdminCourseManagement
} from "./course-management-config/skill-academy/academy-admin";

import {
    skillAcademyTrainerCourseManagement
} from "./course-management-config/skill-academy/trainer";

import {
    skillAcademyLearnerCourseManagement
} from "./course-management-config/skill-academy/learner";


import {
    bootcampAdminCourseManagement
} from "./course-management-config/bootcamp/bootcamp-admin";

import {
    bootcampMentorCourseManagement
} from "./course-management-config/bootcamp/mentor";

import {
    bootcampLearnerCourseManagement
} from "./course-management-config/bootcamp/learner";


import {
    ngoAdminCourseManagement
} from "./course-management-config/ngo/ngo-admin";

import {
    ngoProgramManagerCourseManagement
} from "./course-management-config/ngo/program-manager";

import {
    ngoTrainerCourseManagement
} from "./course-management-config/ngo/trainer";

import {
    ngoBeneficiaryCourseManagement
} from "./course-management-config/ngo/beneficiary";


import {
    governmentAdminCourseManagement
} from "./course-management-config/government/department-admin";

import {
    governmentProgramOfficerCourseManagement
} from "./course-management-config/government/program-officer";

import {
    governmentTrainerCourseManagement
} from "./course-management-config/government/trainer";

import {
    governmentParticipantCourseManagement
} from "./course-management-config/government/participant";


import type {
    CourseManagementConfig
} from "../types/course-management.types";



/* =========================================================
   COURSE MANAGEMENT CONFIGURATION MAP
========================================================= */

const courseManagementConfigs: Record<
    string,
    CourseManagementConfig
> = {

    /* =====================================================
       UNIVERSITY
    ===================================================== */

    "university_institute_admin":
        universityInstituteAdminCourseManagement,

    "university_coordinator":
        universityCoordinatorCourseManagement,

    "university_faculty":
        universityFacultyCourseManagement,

    "university_student":
        universityStudentCourseManagement,


    /* =====================================================
       CORPORATE
    ===================================================== */

    "corporate_corporate_admin":
        corporateAdminCourseManagement,

    "corporate_manager":
        corporateManagerCourseManagement,

    "corporate_trainer":
        corporateTrainerCourseManagement,

    "corporate_employee":
        corporateEmployeeCourseManagement,


    /* =====================================================
       SKILL ACADEMY
    ===================================================== */

    "skill_academy_academy_admin":
        skillAcademyAdminCourseManagement,

    "skill_academy_trainer":
        skillAcademyTrainerCourseManagement,

    "skill_academy_learner":
        skillAcademyLearnerCourseManagement,


    /* =====================================================
       BOOTCAMP
    ===================================================== */

    "bootcamp_bootcamp_admin":
        bootcampAdminCourseManagement,

    "bootcamp_mentor":
        bootcampMentorCourseManagement,

    "bootcamp_learner":
        bootcampLearnerCourseManagement,


    /* =====================================================
       NGO
    ===================================================== */

    "ngo_ngo_admin":
        ngoAdminCourseManagement,

    "ngo_program_manager":
        ngoProgramManagerCourseManagement,

    "ngo_trainer":
        ngoTrainerCourseManagement,

    "ngo_beneficiary":
        ngoBeneficiaryCourseManagement,


    /* =====================================================
       GOVERNMENT
    ===================================================== */

    "government_department_admin":
        governmentAdminCourseManagement,

    "government_program_officer":
        governmentProgramOfficerCourseManagement,

    "government_trainer":
        governmentTrainerCourseManagement,

    "government_participant":
        governmentParticipantCourseManagement

};



/* =========================================================
   GET COURSE MANAGEMENT CONFIGURATION
========================================================= */

export function getCourseManagementConfig(
    tenant: string,
    role: string
): CourseManagementConfig | undefined {

    const key = `${tenant}_${role}`;

    return courseManagementConfigs[key];

}