import type {
    CourseManagementConfig
} from "@/types/course-management.types";

export const ngoAdminCourseManagement:
    CourseManagementConfig = {

    title: "NGO Training Management",
    subtitle: "Manage community training and development programs",

    cards: [
        {
            title: "Training Programs",
            value: "42"
        },
        {
            title: "Active Programs",
            value: "28"
        },
        {
            title: "Trainers",
            value: "35"
        },
        {
            title: "Beneficiaries",
            value: "2,850"
        },
        {
            title: "Active Programs",
            value: "28"
        },
        {
            title: "Completion Rate",
            value: "76%"
        }
    ],

    actions: [
        {
            title: "Training Programs",
            description: "Manage community training programs",
            link: "/course-management/my-courses"
        },
        {
            title: "Create Program",
            description: "Create a new training program",
            link: "/course-management/create-course"
        },
        {
            title: "Trainer Allocation",
            description: "Assign trainers to programs",
            link: "/course-management/faculty"
        },
        {
            title: "Beneficiary Progress",
            description: "Monitor beneficiary learning",
            link: "/course-management/student-progress"
        },
        {
            title: "Program Reports",
            description: "View program reports",
            link: "/course-management/reports"
        }
    ],

    sections: [
        "Program Delivery",
        "Beneficiary Progress",
        "Trainer Allocation",
        "Training Completion",
        "Program Outcomes"
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