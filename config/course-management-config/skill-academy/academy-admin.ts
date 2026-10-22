import type {
    CourseManagementConfig
} from "@/types/course-management.types";

export const skillAcademyAdminCourseManagement:
    CourseManagementConfig = {

    title: "Academy Course Management",
    subtitle: "Manage professional learning programs and learner delivery",

    cards: [
        {
            title: "Learning Programs",
            value: "64"
        },
        {
            title: "Published Programs",
            value: "48"
        },
        {
            title: "Draft Programs",
            value: "8"
        },
        {
            title: "Trainers",
            value: "28"
        },
        {
            title: "Learners",
            value: "2,460"
        },
        {
            title: "Completion Rate",
            value: "79%"
        }
    ],

    actions: [
        {
            title: "Programs",
            description: "Manage academy learning programs",
            link: "/course-management/my-courses"
        },
        {
            title: "Create Program",
            description: "Create a professional learning program",
            link: "/course-management/create-course"
        },
        {
            title: "Trainer Allocation",
            description: "Assign trainers to programs",
            link: "/course-management/faculty"
        },
        {
            title: "Program Reports",
            description: "View academy learning reports",
            link: "/course-management/reports"
        }
    ],

    sections: [
        "Program Status",
        "Learner Enrollment",
        "Trainer Allocation",
        "Learning Completion",
        "Program Performance"
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