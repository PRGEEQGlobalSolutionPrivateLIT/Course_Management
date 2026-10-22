"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
    LayoutDashboard,
    BookOpen,
    ClipboardCheck,
    GraduationCap,
    Users,
    CalendarDays,
    Bell,
    BarChart3,
    FileText,
    UserCheck,
    Settings,
    LogOut
} from "lucide-react";

import styles from "./CourseSidebar.module.css";


/* =========================================================
   USER SESSION
========================================================= */

interface UserSession {
    id: string;
    name: string;
    tenant: string;
    role: string;
    tenantName?: string;
    roleName?: string;
}


/* =========================================================
   MENU ITEM
========================================================= */

interface MenuItem {
    name: string;
    icon: React.ElementType;
    path: string;
}


/* =========================================================
   COMMON PRODUCT MODULES
   These remain available for every tenant.
========================================================= */

const dashboardItem: MenuItem = {
    name: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard"
};


/* =========================================================
   COURSE MANAGEMENT
   Tenant + actor specific terminology.
========================================================= */

const courseManagementNames: Record<string, string> = {

    university_institute_admin: "Course Management",
    university_coordinator: "Course Management",
    university_faculty: "Course Management",
    university_student: "Course Management",

    corporate_corporate_admin: "Training Management",
    corporate_manager: "Training Management",
    corporate_trainer: "Training Management",
    corporate_employee: "Training Management",

    skill_academy_academy_admin: "Program Management",
    skill_academy_trainer: "Program Management",
    skill_academy_learner: "My Programs",

    bootcamp_bootcamp_admin: "Bootcamp Management",
    bootcamp_mentor: "Bootcamp Programs",
    bootcamp_learner: "My Bootcamp",

    ngo_ngo_admin: "Program Management",
    ngo_program_manager: "Program Management",
    ngo_trainer: "Training Programs",
    ngo_beneficiary: "My Programs",

    government_department_admin: "Training Management",
    government_program_officer: "Program Management",
    government_trainer: "Training Programs",
    government_participant: "My Training"
};


/* =========================================================
   ASSESSMENT
========================================================= */

const assessmentNames: Record<string, string> = {

    university_institute_admin: "Assessment",
    university_coordinator: "Assessment",
    university_faculty: "Assessments",
    university_student: "Assessments",

    corporate_corporate_admin: "Assessment",
    corporate_manager: "Assessment",
    corporate_trainer: "Assessments",
    corporate_employee: "Assessments",

    skill_academy_academy_admin: "Assessment",
    skill_academy_trainer: "Assessments",
    skill_academy_learner: "Assessments",

    bootcamp_bootcamp_admin: "Assessment",
    bootcamp_mentor: "Assessments",
    bootcamp_learner: "Assessments",

    ngo_ngo_admin: "Assessment",
    ngo_program_manager: "Assessment",
    ngo_trainer: "Assessments",
    ngo_beneficiary: "Assessments",

    government_department_admin: "Assessment",
    government_program_officer: "Assessment",
    government_trainer: "Assessments",
    government_participant: "Assessments"
};


/* =========================================================
   PROGRESS
========================================================= */

const progressNames: Record<string, string> = {

    university_institute_admin: "Student Progress",
    university_coordinator: "Student Progress",
    university_faculty: "Student Progress",
    university_student: "My Progress",

    corporate_corporate_admin: "Employee Progress",
    corporate_manager: "Employee Progress",
    corporate_trainer: "Employee Progress",
    corporate_employee: "My Progress",

    skill_academy_academy_admin: "Learner Progress",
    skill_academy_trainer: "Learner Progress",
    skill_academy_learner: "My Progress",

    bootcamp_bootcamp_admin: "Learner Progress",
    bootcamp_mentor: "Cohort Progress",
    bootcamp_learner: "My Progress",

    ngo_ngo_admin: "Beneficiary Progress",
    ngo_program_manager: "Beneficiary Progress",
    ngo_trainer: "Beneficiary Progress",
    ngo_beneficiary: "My Progress",

    government_department_admin: "Participant Progress",
    government_program_officer: "Participant Progress",
    government_trainer: "Participant Progress",
    government_participant: "My Progress"
};


/* =========================================================
   LEARNING
========================================================= */

const learningNames: Record<string, string> = {

    university_institute_admin: "Learning",
    university_coordinator: "Learning",
    university_faculty: "Learning Content",
    university_student: "Learning Content",

    corporate_corporate_admin: "Learning",
    corporate_manager: "Learning",
    corporate_trainer: "Learning Content",
    corporate_employee: "Learning Content",

    skill_academy_academy_admin: "Learning",
    skill_academy_trainer: "Learning Content",
    skill_academy_learner: "Learning Content",

    bootcamp_bootcamp_admin: "Learning",
    bootcamp_mentor: "Learning Content",
    bootcamp_learner: "Learning Content",

    ngo_ngo_admin: "Learning",
    ngo_program_manager: "Learning",
    ngo_trainer: "Learning Content",
    ngo_beneficiary: "Learning Content",

    government_department_admin: "Learning",
    government_program_officer: "Learning",
    government_trainer: "Learning Content",
    government_participant: "Learning Content"
};


/* =========================================================
   ATTENDANCE
========================================================= */

const attendanceNames: Record<string, string> = {

    university_institute_admin: "Attendance",
    university_coordinator: "Attendance",
    university_faculty: "Attendance",
    university_student: "My Attendance",

    corporate_corporate_admin: "Attendance",
    corporate_manager: "Team Attendance",
    corporate_trainer: "Training Attendance",
    corporate_employee: "My Attendance",

    skill_academy_academy_admin: "Attendance",
    skill_academy_trainer: "Learner Attendance",
    skill_academy_learner: "My Attendance",

    bootcamp_bootcamp_admin: "Attendance",
    bootcamp_mentor: "Cohort Attendance",
    bootcamp_learner: "My Attendance",

    ngo_ngo_admin: "Attendance",
    ngo_program_manager: "Beneficiary Attendance",
    ngo_trainer: "Training Attendance",
    ngo_beneficiary: "My Attendance",

    government_department_admin: "Attendance",
    government_program_officer: "Participant Attendance",
    government_trainer: "Training Attendance",
    government_participant: "My Attendance"
};


/* =========================================================
   REPORTS
========================================================= */

const reportNames: Record<string, string> = {

    university_institute_admin: "Reports",
    university_coordinator: "Course Reports",
    university_faculty: "Course Reports",
    university_student: "My Reports",

    corporate_corporate_admin: "Training Reports",
    corporate_manager: "Team Reports",
    corporate_trainer: "Training Reports",
    corporate_employee: "My Reports",

    skill_academy_academy_admin: "Program Reports",
    skill_academy_trainer: "Training Reports",
    skill_academy_learner: "My Reports",

    bootcamp_bootcamp_admin: "Bootcamp Reports",
    bootcamp_mentor: "Mentor Reports",
    bootcamp_learner: "My Reports",

    ngo_ngo_admin: "Program Reports",
    ngo_program_manager: "Program Reports",
    ngo_trainer: "Training Reports",
    ngo_beneficiary: "My Reports",

    government_department_admin: "Training Reports",
    government_program_officer: "Program Reports",
    government_trainer: "Training Reports",
    government_participant: "My Reports"
};


/* =========================================================
   MAIN SIDEBAR BUILDER
========================================================= */

function getMenu(
    tenant: string,
    role: string
): MenuItem[] {

    const key = `${tenant}_${role}`;


    return [

        /* ---------------------------------------------
           DASHBOARD
        --------------------------------------------- */

        dashboardItem,


        /* ---------------------------------------------
           COURSE / TRAINING / PROGRAM MANAGEMENT
        --------------------------------------------- */

        {
            name:
                courseManagementNames[key] ||
                "Course Management",

            icon: BookOpen,

            path:
                "/course-management/dashboard"
        },


        /* ---------------------------------------------
           ASSESSMENT
        --------------------------------------------- */

        {
            name:
                assessmentNames[key] ||
                "Assessment",

            icon: ClipboardCheck,

            path: "/assessment"
        },


        /* ---------------------------------------------
           LEARNING
        --------------------------------------------- */

        {
            name:
                learningNames[key] ||
                "Learning",

            icon: GraduationCap,

            path: "/learning"
        },


        /* ---------------------------------------------
           PROGRESS
        --------------------------------------------- */

        {
            name:
                progressNames[key] ||
                "Progress",

            icon: Users,

            path: "/progress"
        },


        /* ---------------------------------------------
           ATTENDANCE
        --------------------------------------------- */

        {
            name:
                attendanceNames[key] ||
                "Attendance",

            icon: UserCheck,

            path: "/attendance"
        },


        /* ---------------------------------------------
           NOTIFICATIONS
        --------------------------------------------- */

        {
            name: "Notifications",

            icon: Bell,

            path: "/notifications"
        },


        /* ---------------------------------------------
           REPORTS
        --------------------------------------------- */

        {
            name:
                reportNames[key] ||
                "Reports",

            icon: BarChart3,

            path: "/reports"
        }

    ];

}


/* =========================================================
   COMPONENT
========================================================= */

export default function CourseSidebar() {

    const [user, setUser] =
        useState<UserSession | null>(null);


    /* ---------------------------------------------
       READ LOGIN SESSION
    --------------------------------------------- */

    useEffect(() => {

        const storedUser =
            localStorage.getItem("user");


        if (!storedUser) {

            return;

        }


        try {

            const parsedUser:
                UserSession =
                JSON.parse(storedUser);


            setUser(parsedUser);

        } catch {

            localStorage.removeItem("user");

        }

    }, []);


    /* ---------------------------------------------
       BUILD MENU
    --------------------------------------------- */

    const menu = user
        ? getMenu(
            user.tenant,
            user.role
        )
        : [dashboardItem];


    /* ---------------------------------------------
       LOGOUT
    --------------------------------------------- */

    function logout() {

        localStorage.removeItem("user");

        window.location.href = "/login";

    }


    /* ---------------------------------------------
       RENDER
    --------------------------------------------- */

    return (

        <aside className={styles.sidebar}>


            {/* =====================================
                LOGO
            ===================================== */}

            <div className={styles.logoArea}>

                <div className={styles.logo}>
                    n
                </div>


                <div>

                    <h2>
                        NeuroLXP
                    </h2>


                    {user && (

                        <span
                            className={
                                styles.tenantName
                            }
                        >
                            {user.tenantName ||
                                user.tenant}
                        </span>

                    )}

                </div>

            </div>


            {/* =====================================
                MAIN PRODUCT MENU
            ===================================== */}

            <nav className={styles.menuContainer}>

                {menu.map((item) => {

                    const Icon =
                        item.icon;


                    return (

                        <Link
                            href={item.path}
                            key={item.name}
                            className={
                                styles.menuItem
                            }
                        >

                            <Icon size={18} />


                            <span>
                                {item.name}
                            </span>

                        </Link>

                    );

                })}

            </nav>


            {/* =====================================
                LOGOUT
            ===================================== */}

            <button
                className={styles.logout}
                onClick={logout}
            >

                <LogOut size={18} />

                <span>
                    Logout
                </span>

            </button>


        </aside>

    );

}