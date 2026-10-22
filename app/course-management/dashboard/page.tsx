"use client";

import { useEffect, useState } from "react";

import {
    BookOpen,
    CheckCircle,
    Clock,
    Users,
    BarChart3,
    GraduationCap,
    ArrowRight,
    Plus,
    FileEdit,
    Layers,
} from "lucide-react";

import CourseLayout from "@/components/CourseLayout/CourseLayout";
import {
    getCourseManagementConfig,
} from "@/config/course-management-loader";

import styles from "./page.module.css";


interface UserSession {
    id: string;
    name: string;
    tenant: string;
    tenantName: string;
    role: string;
    roleName: string;
}


export default function CourseManagementDashboard() {

    const [user, setUser] =
        useState<UserSession | null>(null);


    useEffect(() => {

        const storedUser =
            localStorage.getItem("user");


        if (!storedUser) {

            window.location.href = "/login";

            return;

        }


        try {

            const parsedUser: UserSession =
                JSON.parse(storedUser);

            setUser(parsedUser);

        } catch {

            localStorage.removeItem("user");

            window.location.href = "/login";

        }

    }, []);


    if (!user) {

        return (

            <div className={styles.loading}>

                Loading Course Management...

            </div>

        );

    }


    const config =
        getCourseManagementConfig(
            user.tenant,
            user.role
        );


    if (!config) {

        return (

            <CourseLayout>

                <div className={styles.errorContainer}>

                    <div className={styles.errorIcon}>
                        !
                    </div>

                    <h1>
                        Course Management Configuration Not Found
                    </h1>

                    <p>
                        No Course Management configuration
                        is available for{" "}
                        <strong>
                            {user.tenantName}
                        </strong>{" "}
                        and{" "}
                        <strong>
                            {user.roleName}
                        </strong>.
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            window.location.href =
                                "/dashboard"
                        }
                        className={styles.backButton}
                    >
                        Back to Dashboard
                    </button>

                </div>

            </CourseLayout>

        );

    }


    const icons = [
        BookOpen,
        CheckCircle,
        Clock,
        Users,
        BarChart3,
        GraduationCap,
    ];


    function openCreateCourse() {

        window.location.href =
            "/course-management/create";

    }


    return (

        <CourseLayout>

            <div className={styles.container}>

                {/* =================================================
                    PAGE HEADER
                ================================================= */}

                <div className={styles.pageHeader}>

                    <div className={styles.titleBlock}>

                        <span className={styles.eyebrow}>
                            COURSE MANAGEMENT
                        </span>

                        <h1>
                            {config.title}
                        </h1>

                        <p>
                            {config.subtitle}
                        </p>

                    </div>


                    <div className={styles.actorBadge}>

                        <div className={styles.actorIcon}>

                            {user.roleName
                                .charAt(0)
                                .toUpperCase()}

                        </div>

                        <div>

                            <span>
                                {user.tenantName}
                            </span>

                            <strong>
                                {user.roleName}
                            </strong>

                        </div>

                    </div>

                </div>


                {/* =================================================
                    SUMMARY CARDS
                ================================================= */}

                <section className={styles.summaryGrid}>

                    {config.cards.map(
                        (card, index) => {

                            const Icon =
                                icons[
                                    index %
                                    icons.length
                                ];


                            return (

                                <div
                                    className={
                                        styles.summaryCard
                                    }
                                    key={
                                        `${card.title}-${index}`
                                    }
                                >

                                    <div
                                        className={
                                            styles.cardIcon
                                        }
                                    >
                                        <Icon
                                            size={21}
                                        />
                                    </div>


                                    <div
                                        className={
                                            styles.cardContent
                                        }
                                    >

                                        <span>
                                            {card.title}
                                        </span>

                                        <strong>
                                            {card.value}
                                        </strong>

                                    </div>

                                </div>

                            );

                        }
                    )}

                </section>


                {/* =================================================
                    CREATE COURSE ENTRY POINT
                ================================================= */}

                {config.permissions.createCourse && (

                    <section
                        className={
                            styles.createSection
                        }
                    >

                        <div
                            className={
                                styles.createContent
                            }
                        >

                            <div
                                className={
                                    styles.createIcon
                                }
                            >
                                <Plus size={25} />
                            </div>


                            <div>

                                <span
                                    className={
                                        styles.createEyebrow
                                    }
                                >
                                    QUICK ACTION
                                </span>

                                <h2>
                                    Create Learning Experience
                                </h2>

                                <p>
                                    Start a new course,
                                    training program, or
                                    learning experience
                                    using the configuration
                                    for your tenant and role.
                                </p>

                            </div>

                        </div>


                        <button
                            type="button"
                            className={
                                styles.createButton
                            }
                            onClick={
                                openCreateCourse
                            }
                        >

                            <span>
                                Create Course
                            </span>

                            <ArrowRight
                                size={18}
                            />

                        </button>

                    </section>

                )}


                {/* =================================================
                    COURSE MANAGEMENT ACTIONS
                ================================================= */}

                <section className={styles.section}>

                    <div className={styles.sectionHeader}>

                        <div>

                            <span
                                className={
                                    styles.sectionEyebrow
                                }
                            >
                                WORKSPACE
                            </span>

                            <h2>
                                Course Management
                            </h2>

                            <p>
                                Manage courses and learning
                                activities available to your role.
                            </p>

                        </div>

                    </div>


                    <div className={styles.actionGrid}>

                        {config.actions.map(
                            (action) => (

                                <button
                                    type="button"
                                    key={action.title}
                                    className={
                                        styles.actionCard
                                    }
                                    onClick={() =>
                                        window.location.href =
                                            action.link
                                    }
                                >

                                    <div
                                        className={
                                            styles.actionIcon
                                        }
                                    >

                                        <Layers
                                            size={19}
                                        />

                                    </div>


                                    <div
                                        className={
                                            styles.actionContent
                                        }
                                    >

                                        <h3>
                                            {action.title}
                                        </h3>

                                        <p>
                                            {
                                                action.description
                                            }
                                        </p>

                                    </div>


                                    <ArrowRight
                                        size={18}
                                        className={
                                            styles.actionArrow
                                        }
                                    />

                                </button>

                            )
                        )}

                    </div>

                </section>


                {/* =================================================
                    OVERVIEW
                ================================================= */}

                <section className={styles.section}>

                    <div className={styles.sectionHeader}>

                        <div>

                            <span
                                className={
                                    styles.sectionEyebrow
                                }
                            >
                                OVERVIEW
                            </span>

                            <h2>
                                Course Status
                            </h2>

                            <p>
                                View the areas available
                                for your role.
                            </p>

                        </div>

                    </div>


                    <div className={styles.statusGrid}>

                        {config.sections.map(
                            (section, index) => (

                                <div
                                    className={
                                        styles.statusCard
                                    }
                                    key={section}
                                >

                                    <div
                                        className={
                                            styles.statusNumber
                                        }
                                    >
                                        {String(
                                            index + 1
                                        ).padStart(
                                            2,
                                            "0"
                                        )}
                                    </div>


                                    <div
                                        className={
                                            styles.statusContent
                                        }
                                    >

                                        <h3>
                                            {section}
                                        </h3>

                                        <p>
                                            View and manage{" "}
                                            {
                                                section.toLowerCase()
                                            }
                                        </p>

                                    </div>


                                    <ArrowRight
                                        size={16}
                                        className={
                                            styles.statusArrow
                                        }
                                    />

                                </div>

                            )
                        )}

                    </div>

                </section>


                {/* =================================================
                    ACCESS PERMISSIONS
                ================================================= */}

                <section className={styles.section}>

                    <div className={styles.sectionHeader}>

                        <div>

                            <span
                                className={
                                    styles.sectionEyebrow
                                }
                            >
                                SECURITY
                            </span>

                            <h2>
                                Access Permissions
                            </h2>

                            <p>
                                Your current course management
                                permissions.
                            </p>

                        </div>

                    </div>


                    <div className={styles.permissionGrid}>

                        <Permission
                            label="Create Course"
                            enabled={
                                config.permissions
                                    .createCourse
                            }
                        />

                        <Permission
                            label="Edit Course"
                            enabled={
                                config.permissions
                                    .editCourse
                            }
                        />

                        <Permission
                            label="Publish Course"
                            enabled={
                                config.permissions
                                    .publishCourse
                            }
                        />

                        <Permission
                            label="Review Course"
                            enabled={
                                config.permissions
                                    .reviewCourse
                            }
                        />

                        <Permission
                            label="Trainer Allocation"
                            enabled={
                                config.permissions
                                    .assignTrainer
                            }
                        />

                        <Permission
                            label="Delivery Management"
                            enabled={
                                config.permissions
                                    .manageDelivery
                            }
                        />

                        <Permission
                            label="Reports"
                            enabled={
                                config.permissions
                                    .viewReports
                            }
                        />

                    </div>

                </section>

            </div>

        </CourseLayout>

    );
}


/* =========================================================
   PERMISSION ITEM
========================================================= */

function Permission({
    label,
    enabled,
}: {
    label: string;
    enabled: boolean;
}) {

    return (

        <div
            className={
                styles.permissionItem
            }
        >

            <CheckCircle
                size={18}
                className={
                    enabled
                        ? styles.enabled
                        : styles.disabled
                }
            />

            <span>
                {label}
            </span>

            <strong
                className={
                    enabled
                        ? styles.allowed
                        : styles.restricted
                }
            >
                {enabled
                    ? "Allowed"
                    : "Restricted"}
            </strong>

        </div>

    );

}