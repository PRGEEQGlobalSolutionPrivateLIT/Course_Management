import type {
    CourseManagementConfig
} from "@/types/course-management.types";

export const ngoProgramManagerCourseManagement:
    CourseManagementConfig = {

    title: "Program Management",
    subtitle: "Coordinate community training programs and beneficiary outcomes",

    cards: [
        {
            title: "Assigned Programs",
            value: "12"
        },
        {
            title: "Active Programs",
            value: "8"
        },
        {
            title: "Beneficiaries",
            value: "640"
        },
        {
            title: "Trainers",
            value: "18"
        },
        {
            title: "Pending Activities",
            value: "14"
        },
        {
            title: "Completion Rate",
            value: "74%"
        }
    ],

    actions: [
        {
            title: "My Programs",
            description: "Manage assigned community programs",
            link: "/course-management/my-courses"
        },
        {
            title: "Beneficiary Mapping",
            description: "Manage beneficiaries assigned to programs",
            link: "/course-management/batches"
        },
        {
            title: "Trainer Allocation",
            description: "Coordinate trainer assignments",
            link: "/course-management/faculty"
        },
        {
            title: "Program Schedule",
            description: "Manage program delivery schedules",
            link: "/course-management/schedule"
        },
        {
            title: "Program Reports",
            description: "Review program outcomes",
            link: "/course-management/reports"
        }
    ],

    sections: [
        "Program Delivery",
        "Beneficiary Progress",
        "Trainer Activities",
        "Upcoming Sessions",
        "Program Outcomes"
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