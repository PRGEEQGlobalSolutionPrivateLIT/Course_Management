import type {
    CourseManagementConfig
} from "@/types/course-management.types";

export const corporateEmployeeCourseManagement:
    CourseManagementConfig = {

    title: "My Learning",
    subtitle: "Access your corporate training and development programs",

    cards: [
        {
            title: "Enrolled Programs",
            value: "7"
        },
        {
            title: "Active Training",
            value: "4"
        },
        {
            title: "Completed Programs",
            value: "3"
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
            title: "Learning Progress",
            value: "82%"
        }
    ],

    actions: [
        {
            title: "My Training",
            description: "View your assigned training programs",
            link: "/course-management/my-courses"
        },
        {
            title: "Learning Content",
            description: "Access corporate learning content",
            link: "/course-management/content"
        },
        {
            title: "Assessments",
            description: "Complete assigned assessments",
            link: "/assessment"
        },
        {
            title: "My Progress",
            description: "Track your learning progress",
            link: "/course-management/student-progress"
        }
    ],

    sections: [
        "My Learning Progress",
        "Upcoming Training",
        "Assessment Status",
        "Completed Training",
        "Skills Development"
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