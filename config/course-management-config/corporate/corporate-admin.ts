import type {
    CourseManagementConfig
} from "@/types/course-management.types";

export const corporateAdminCourseManagement:
    CourseManagementConfig = {

    title: "Corporate Training Management",
    subtitle: "Manage enterprise training programs and learning delivery",

    cards: [
        {
            title: "Training Programs",
            value: "86"
        },
        {
            title: "Published Programs",
            value: "62"
        },
        {
            title: "Draft Programs",
            value: "12"
        },
        {
            title: "Trainers",
            value: "48"
        },
        {
            title: "Employees Enrolled",
            value: "4,820"
        },
        {
            title: "Completion Rate",
            value: "84%"
        }
    ],

    actions: [
        {
            title: "Training Programs",
            description: "Manage corporate training programs",
            link: "/course-management/my-courses"
        },
        {
            title: "Create Program",
            description: "Create a new employee training program",
            link: "/course-management/create-course"
        },
        {
            title: "Trainer Allocation",
            description: "Assign trainers to training programs",
            link: "/course-management/faculty"
        },
        {
            title: "Training Reports",
            description: "View enterprise training reports",
            link: "/course-management/reports"
        }
    ],

    sections: [
        "Training Program Status",
        "Employee Enrollment",
        "Trainer Allocation",
        "Training Completion",
        "Pending Approvals"
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