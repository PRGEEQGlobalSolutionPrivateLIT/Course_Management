"use client";

import {
    useEffect,
    useState
} from "react";

import {
    BookOpen,
    Users,
    GraduationCap,
    BarChart3,
    ClipboardCheck,
    Bell,
    ArrowUpRight
} from "lucide-react";

import Link from "next/link";

import CourseLayout from "@/components/CourseLayout/CourseLayout";

import {
    getDashboardConfig
} from "@/config/dashboard-loader";

import styles from "./page.module.css";


interface DashboardCard {
    title: string;
    value: string;
}

interface DashboardModule {
    title: string;
    description: string;
    link: string;
}

interface DashboardConfig {
    title: string;
    cards: DashboardCard[];
    modules: DashboardModule[];
    sections: string[];
}


const iconMap: Record<string, React.ElementType> = {

    "Students": Users,

    "Faculty": GraduationCap,

    "Courses": BookOpen,

    "Active Batches": BarChart3,


    "Employees": Users,

    "Departments": BarChart3,

    "Training Programs": BookOpen,

    "Active Courses": BookOpen,

    "Certified Employees": GraduationCap,


    "Assigned Courses": BookOpen,

    "Active Cohorts": Users,

    "Employees Trained": Users,

    "Pending Evaluation": ClipboardCheck,

    "Average Rating": BarChart3,

    "Completion Rate": BarChart3,


    "Learners": Users,

    "Skill Programs": BookOpen,

    "Trainers": GraduationCap,


    "Beneficiaries": Users,

    "Training Centres": GraduationCap,


    "Citizens Trained": Users

};



export default function Dashboard() {


    const [dashboard, setDashboard] =
        useState<DashboardConfig | null>(null);


    const [userName, setUserName] =
        useState("User");


    const [error, setError] =
        useState("");



    useEffect(() => {


        try {


            const storedUser =
                localStorage.getItem("user");


            if (!storedUser) {

                setError(
                    "User session not found."
                );

                return;

            }



            const user =
                JSON.parse(storedUser);



            setUserName(
                user.name || "User"
            );



            const config =
                getDashboardConfig(
                    user.tenant,
                    user.role
                );



            if (!config) {

                setError(
                    "Dashboard configuration not found for this tenant and role."
                );

                return;

            }



            setDashboard(config);


        } catch (error) {

            console.error(
                "Dashboard loading error:",
                error
            );

            setError(
                "Unable to load dashboard."
            );

        }


    }, []);





    if (error) {


        return (

            <CourseLayout>

                <div className={styles.error}>

                    <h2>
                        Dashboard unavailable
                    </h2>

                    <p>
                        {error}
                    </p>

                </div>

            </CourseLayout>

        );

    }





    if (!dashboard) {


        return (

            <CourseLayout>

                <div className={styles.loading}>

                    Loading dashboard...

                </div>

            </CourseLayout>

        );

    }





    return (

        <CourseLayout>


            <div className={styles.container}>


                {/* =========================
                    DASHBOARD HEADER
                ========================= */}

                <div className={styles.pageHeader}>

                    <div>

                        <h1>
                            {dashboard.title}
                        </h1>

                        <p>
                            Welcome back, {userName}
                        </p>

                    </div>


                    <div className={styles.headerActions}>

                        <button className={styles.headerButton}>

                            <Bell size={18} />

                            Notifications

                        </button>

                    </div>

                </div>



                {/* =========================
                    SUMMARY CARDS
                ========================= */}

                <div className={styles.summaryGrid}>


                    {dashboard.cards.map(
                        (item, index) => {


                            const Icon =
                                iconMap[item.title]
                                || BarChart3;


                            return (

                                <div
                                    className={styles.card}
                                    key={`${item.title}-${index}`}
                                >

                                    <div
                                        className={styles.cardIcon}
                                    >

                                        <Icon size={22} />

                                    </div>


                                    <div
                                        className={styles.cardContent}
                                    >

                                        <span>
                                            {item.title}
                                        </span>

                                        <strong>
                                            {item.value}
                                        </strong>

                                    </div>


                                </div>

                            );

                        }
                    )}


                </div>



                {/* =========================
                    MAIN DASHBOARD AREA
                ========================= */}

                <div className={styles.dashboardGrid}>


                    {/* MODULES */}

                    <section
                        className={styles.panel}
                    >

                        <div
                            className={styles.panelHeader}
                        >

                            <div>

                                <h2>
                                    Modules
                                </h2>

                                <p>
                                    Access your available platform modules
                                </p>

                            </div>

                        </div>



                        <div
                            className={styles.moduleGrid}
                        >


                            {dashboard.modules.map(
                                (item) => {


                                    return (

                                        <Link
                                            href={item.link}
                                            key={item.title}
                                            className={
                                                styles.moduleCard
                                            }
                                        >

                                            <div
                                                className={
                                                    styles.moduleIcon
                                                }
                                            >

                                                <BookOpen
                                                    size={22}
                                                />

                                            </div>


                                            <div
                                                className={
                                                    styles.moduleContent
                                                }
                                            >

                                                <h3>
                                                    {item.title}
                                                </h3>

                                                <p>
                                                    {item.description}
                                                </p>

                                            </div>


                                            <ArrowUpRight
                                                size={18}
                                                className={
                                                    styles.moduleArrow
                                                }
                                            />

                                        </Link>

                                    );

                                }
                            )}


                        </div>

                    </section>



                    {/* OVERVIEW */}

                    <section
                        className={styles.panel}
                    >

                        <div
                            className={styles.panelHeader}
                        >

                            <div>

                                <h2>
                                    Dashboard Overview
                                </h2>

                                <p>
                                    Key areas available for this role
                                </p>

                            </div>

                        </div>



                        <div
                            className={styles.sectionList}
                        >


                            {dashboard.sections.map(
                                (section, index) => (

                                    <div
                                        className={
                                            styles.sectionItem
                                        }
                                        key={`${section}-${index}`}
                                    >

                                        <div
                                            className={
                                                styles.sectionIcon
                                            }
                                        >

                                            <BarChart3
                                                size={18}
                                            />

                                        </div>


                                        <span>
                                            {section}
                                        </span>


                                    </div>

                                )
                            )}


                        </div>

                    </section>


                </div>


            </div>


        </CourseLayout>

    );

}