import type {
    CourseManagementConfig
} from "@/types/course-management.types";

export const corporateTrainerCourseManagement:
    CourseManagementConfig = {

    title: "Trainer Workspace",
    subtitle: "Deliver training and monitor employee learning",

    cards: [
        {
            title: "Assigned Programs",
            value: "12"
        },
        {
            title: "Active Cohorts",
            value: "8"
        },
        {
            title: "Employees Trained",
            value: "420"
        },
        {
            title: "Pending Evaluation",
            value: "35"
        },
        {
            title: "Upcoming Sessions",
            value: "6"
        },
        {
            title: "Completion Rate",
            value: "88%"
        }
    ],

    actions: [
        {
            title: "My Training Programs",
            description: "Manage assigned corporate training programs",
            link: "/course-management/my-courses"
        },
        {
            title: "Training Sessions",
            description: "Manage upcoming training sessions",
            link: "/course-management/schedule"
        },
        {
            title: "Assessments",
            description: "Evaluate employee assessments",
            link: "/assessment"
        },
        {
            title: "Employee Progress",
            description: "Monitor employee learning progress",
            link: "/course-management/student-progress"
        },
        {
            title: "Training Reports",
            description: "View training delivery reports",
            link: "/course-management/reports"
        }
    ],

    sections: [
        "Training Delivery",
        "Employee Progress",
        "Upcoming Sessions",
        "Assessment Performance",
        "Employee Feedback"
    ],

    permissions: {
        createCourse: true,
        editCourse: true,
        publishCourse: false,
        reviewCourse: false,
        assignTrainer: false,
        manageDelivery: true,
        viewReports: true
    }
};