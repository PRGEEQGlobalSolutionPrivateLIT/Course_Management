import type {
    CourseManagementConfig
} from "@/types/course-management.types";

export const governmentProgramOfficerCourseManagement:
    CourseManagementConfig = {

    title: "Program Officer Workspace",
    subtitle: "Coordinate government training programs and participant delivery",

    cards: [
        {
            title: "Assigned Programs",
            value: "16"
        },
        {
            title: "Active Batches",
            value: "12"
        },
        {
            title: "Participants",
            value: "840"
        },
        {
            title: "Trainers",
            value: "28"
        },
        {
            title: "Pending Readiness",
            value: "6"
        },
        {
            title: "Completion Rate",
            value: "79%"
        }
    ],

    actions: [
        {
            title: "My Programs",
            description: "Manage assigned government programs",
            link: "/course-management/my-courses"
        },
        {
            title: "Batch Management",
            description: "Manage participant batches",
            link: "/course-management/batches"
        },
        {
            title: "Trainer Allocation",
            description: "Coordinate trainer assignments",
            link: "/course-management/faculty"
        },
        {
            title: "Program Schedule",
            description: "Manage training schedules",
            link: "/course-management/schedule"
        },
        {
            title: "Program Reports",
            description: "View program performance",
            link: "/course-management/reports"
        }
    ],

    sections: [
        "Program Delivery",
        "Participant Progress",
        "Trainer Activities",
        "Training Schedule",
        "Program Completion"
    ],

    permissions: {
        createCourse: true,
        editCourse: true,
        publishCourse: false,
        reviewCourse: true,
        assignTrainer: true,
        manageDelivery: true,
        viewReports: true
    }
};