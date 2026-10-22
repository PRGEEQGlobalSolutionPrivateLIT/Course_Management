import type {
    CourseManagementConfig
} from "@/types/course-management.types";

export const ngoBeneficiaryCourseManagement:
    CourseManagementConfig = {

    title: "My Learning",
    subtitle: "Access your assigned community learning programs",

    cards: [
        {
            title: "Enrolled Programs",
            value: "5"
        },
        {
            title: "Active Programs",
            value: "3"
        },
        {
            title: "Completed Training",
            value: "2"
        },
        {
            title: "Upcoming Sessions",
            value: "4"
        },
        {
            title: "Pending Assessments",
            value: "2"
        },
        {
            title: "Completion Rate",
            value: "76%"
        }
    ],

    actions: [
        {
            title: "My Programs",
            description: "View your assigned development programs",
            link: "/course-management/my-courses"
        },
        {
            title: "Learning Content",
            description: "Access available learning materials",
            link: "/course-management/content"
        },
        {
            title: "Assessments",
            description: "Complete assigned assessments",
            link: "/assessment"
        },
        {
            title: "My Progress",
            description: "Track your development progress",
            link: "/course-management/student-progress"
        },
        {
            title: "Certificates",
            description: "View your completed training certificates",
            link: "/certificates"
        }
    ],

    sections: [
        "My Learning Progress",
        "Upcoming Training",
        "Assessment Status",
        "Training Completion",
        "Skills Developed"
    ],

    permissions: {
        createCourse: false,
        editCourse: false,
        publishCourse: false,
        reviewCourse: false,
        assignTrainer: false,
        manageDelivery: false,
        viewReports: false
    }
};