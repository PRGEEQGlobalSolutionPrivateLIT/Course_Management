"use client";

import { useEffect, useState } from "react";

import {
    Bell,
    ClipboardCheck,
    ChevronDown
} from "lucide-react";

import styles from "./CourseHeader.module.css";

interface UserSession {
    id: string;
    name: string;
    tenant: string;
    tenantName?: string;
    role: string;
    roleName?: string;
}

export default function CourseHeader() {

    const [user, setUser] =
        useState<UserSession | null>(null);


    useEffect(() => {

        const storedUser =
            localStorage.getItem("user");

        if (!storedUser) {
            return;
        }

        try {

            const parsedUser: UserSession =
                JSON.parse(storedUser);

            setUser(parsedUser);

        } catch {

            localStorage.removeItem("user");

        }

    }, []);


    const tenantName =
        user?.tenantName ||
        getTenantName(user?.tenant) ||
        "NeuroLXP";


    const roleName =
        user?.roleName ||
        getRoleName(user?.role) ||
        "User";


    const displayName =
        user?.name ||
        roleName;


    return (

        <header className={styles.header}>

            {/* =================================================
                TITLE
            ================================================= */}

            <div className={styles.titleBlock}>

                <h1>
                    {tenantName}
                </h1>

                <p>
                    Welcome back, {displayName} 👋
                </p>

            </div>


            {/* =================================================
                USER AREA
            ================================================= */}

            <div className={styles.userArea}>

                <button
                    className={styles.iconButton}
                    aria-label="Notifications"
                >

                    <Bell size={18} />

                    <span
                        className={styles.dot}
                    />

                </button>


                <button
                    className={styles.iconButton}
                    aria-label="Assessments"
                >

                    <ClipboardCheck size={18} />

                </button>


                <div className={styles.profile}>

                    <div className={styles.avatar}>

                        {getInitials(displayName)}

                    </div>


                    <div className={styles.profileInfo}>

                        <h4>
                            {roleName}
                        </h4>

                        <span>
                            {getWorkspaceName(user)}
                        </span>

                    </div>


                    <ChevronDown
                        size={16}
                        className={styles.chevron}
                    />

                </div>

            </div>

        </header>

    );

}


/* =========================================================
   TENANT NAME
========================================================= */

function getTenantName(
    tenant?: string
): string {

    const tenantNames: Record<string, string> = {

        university:
            "Institute of Technology",

        corporate:
            "Corporate Training",

        skill_academy:
            "Skill Academy",

        bootcamp:
            "Bootcamp",

        ngo:
            "NGO Trust",

        government:
            "Government Training"

    };

    return tenant
        ? tenantNames[tenant] || tenant
        : "NeuroLXP";
}


/* =========================================================
   ROLE NAME
========================================================= */

function getRoleName(
    role?: string
): string {

    const roleNames: Record<string, string> = {

        institute_admin:
            "Institute Admin",

        coordinator:
            "Coordinator",

        faculty:
            "Faculty",

        student:
            "Student",

        corporate_admin:
            "Corporate Admin",

        manager:
            "Manager",

        trainer:
            "Trainer",

        employee:
            "Employee",

        academy_admin:
            "Academy Admin",

        learner:
            "Learner",

        bootcamp_admin:
            "Bootcamp Admin",

        mentor:
            "Mentor",

        ngo_admin:
            "NGO Admin",

        program_manager:
            "Program Manager",

        beneficiary:
            "Beneficiary",

        department_admin:
            "Department Admin",

        program_officer:
            "Program Officer",

        participant:
            "Participant"

    };

    return role
        ? roleNames[role] || role
        : "User";
}


/* =========================================================
   WORKSPACE NAME
========================================================= */

function getWorkspaceName(
    user: UserSession | null
): string {

    if (!user) {
        return "Course Management";
    }


    switch (user.tenant) {

        case "university":

            return "Academic Course Management";


        case "corporate":

            return "Corporate Training";


        case "skill_academy":

            return "Skill Development";


        case "bootcamp":

            return "Bootcamp Learning";


        case "ngo":

            return "Community Training";


        case "government":

            return "Government Training";


        default:

            return "Course Management";

    }

}


/* =========================================================
   INITIALS
========================================================= */

function getInitials(
    name: string
): string {

    const parts =
        name
            .trim()
            .split(/\s+/)
            .filter(Boolean);


    if (parts.length === 0) {
        return "N";
    }


    if (parts.length === 1) {

        return parts[0]
            .substring(0, 2)
            .toUpperCase();

    }


    return (
        parts[0][0] +
        parts[parts.length - 1][0]
    ).toUpperCase();

}