import type {
    CourseManagementConfig
} from "@/types/course-management.types";

export const governmentParticipantCourseManagement:
    CourseManagementConfig = {

    title: "My Training",
    subtitle: "Access your government training programs and development activities",

    cards: [
        {
            title: "Enrolled Programs",
            value: "5"
        },
        {
            title: "Active Training",
            value: "3"
        },
        {
            title: "Completed Programs",
            value: "2"
        },
        {
            title: "Upcoming Sessions",
            value: "3"
        },
        {
            title: "Pending Assessments",
            value: "2"
        },
        {
            title: "Training Progress",
            value: "81%"
        }
    ],

    actions: [
        {
            title: "My Training",
            description: "View your assigned government training",
            link: "/course-management/my-courses"
        },
        {
            title: "Learning Content",
            description: "Access training learning materials",
            link: "/course-management/content"
        },
        {
            title: "Assessments",
            description: "Complete assigned assessments",
            link: "/assessment"
        },
        {
            title: "My Progress",
            description: "Track your training progress",
            link: "/course-management/student-progress"
        },
        {
            title: "Certificates",
            description: "View completed training certificates",
            link: "/certificates"
        }
    ],

    sections: [
        "My Training Progress",
        "Upcoming Training",
        "Assessment Status",
        "Completed Training",
        "Certificates"
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