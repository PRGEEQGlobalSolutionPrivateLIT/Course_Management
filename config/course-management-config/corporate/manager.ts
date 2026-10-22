import type {
    CourseManagementConfig
} from "@/types/course-management.types";

export const corporateManagerCourseManagement:
    CourseManagementConfig = {

    title: "Team Training Management",
    subtitle: "Monitor training programs and employee development",

    cards: [
        {
            title: "Team Programs",
            value: "14"
        },
        {
            title: "Employees Enrolled",
            value: "186"
        },
        {
            title: "Active Cohorts",
            value: "9"
        },
        {
            title: "Completion Rate",
            value: "81%"
        },
        {
            title: "Pending Assessments",
            value: "18"
        },
        {
            title: "At-Risk Employees",
            value: "7"
        }
    ],

    actions: [
        {
            title: "Team Programs",
            description: "View training programs assigned to your teams",
            link: "/course-management/my-courses"
        },
        {
            title: "Employee Progress",
            description: "Monitor employee learning progress",
            link: "/course-management/student-progress"
        },
        {
            title: "Training Schedule",
            description: "View upcoming training sessions",
            link: "/course-management/schedule"
        },
        {
            title: "Training Reports",
            description: "View team training reports",
            link: "/course-management/reports"
        }
    ],

    sections: [
        "Team Learning Progress",
        "Employee Completion",
        "Upcoming Training",
        "Assessment Performance",
        "At-Risk Employees"
    ],

    permissions: {
        createCourse: false,
        editCourse: false,
        publishCourse: false,
        reviewCourse: true,
        assignTrainer: false,
        manageDelivery: true,
        viewReports: true
    }
};