import type {
    CourseManagementConfig
} from "@/types/course-management.types";

export const ngoTrainerCourseManagement:
    CourseManagementConfig = {

    title: "Trainer Workspace",
    subtitle: "Deliver community training and support beneficiary development",

    cards: [
        {
            title: "Assigned Programs",
            value: "8"
        },
        {
            title: "Active Groups",
            value: "6"
        },
        {
            title: "Beneficiaries",
            value: "180"
        },
        {
            title: "Pending Evaluation",
            value: "16"
        },
        {
            title: "Upcoming Sessions",
            value: "5"
        },
        {
            title: "Completion Rate",
            value: "78%"
        }
    ],

    actions: [
        {
            title: "My Programs",
            description: "View assigned community training programs",
            link: "/course-management/my-courses"
        },
        {
            title: "Training Sessions",
            description: "Manage upcoming training sessions",
            link: "/course-management/schedule"
        },
        {
            title: "Assessments",
            description: "Evaluate beneficiary assessments",
            link: "/assessment"
        },
        {
            title: "Beneficiary Progress",
            description: "Monitor beneficiary learning",
            link: "/course-management/student-progress"
        }
    ],

    sections: [
        "Training Delivery",
        "Beneficiary Progress",
        "Upcoming Sessions",
        "Assessment Performance",
        "Program Participation"
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