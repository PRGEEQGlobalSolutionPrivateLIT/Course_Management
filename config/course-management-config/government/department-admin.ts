import type {
    CourseManagementConfig
} from "@/types/course-management.types";

export const governmentAdminCourseManagement:
    CourseManagementConfig = {

    title: "Government Training Management",
    subtitle: "Manage departmental learning and workforce development",

    cards: [
        {
            title: "Training Programs",
            value: "72"
        },
        {
            title: "Active Programs",
            value: "48"
        },
        {
            title: "Trainers",
            value: "64"
        },
        {
            title: "Participants",
            value: "5,820"
        },
        {
            title: "Active Batches",
            value: "36"
        },
        {
            title: "Completion Rate",
            value: "81%"
        }
    ],

    actions: [
        {
            title: "Training Programs",
            description: "Manage departmental training programs",
            link: "/course-management/my-courses"
        },
        {
            title: "Create Program",
            description: "Create a government training program",
            link: "/course-management/create-course"
        },
        {
            title: "Trainer Allocation",
            description: "Assign trainers to programs",
            link: "/course-management/faculty"
        },
        {
            title: "Participant Progress",
            description: "Monitor participant progress",
            link: "/course-management/student-progress"
        },
        {
            title: "Training Reports",
            description: "View departmental training reports",
            link: "/course-management/reports"
        }
    ],

    sections: [
        "Training Program Status",
        "Participant Progress",
        "Trainer Allocation",
        "Training Completion",
        "Department Performance"
    ],

    permissions: {
        createCourse: true,
        editCourse: true,
        publishCourse: true,
        reviewCourse: true,
        assignTrainer: true,
        manageDelivery: true,
        viewReports: true
    }
};