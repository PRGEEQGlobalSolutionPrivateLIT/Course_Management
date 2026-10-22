import type {
    CourseManagementConfig
} from "@/types/course-management.types";

export const skillAcademyLearnerCourseManagement:
    CourseManagementConfig = {

    title: "My Learning",
    subtitle: "Build skills through your assigned learning programs",

    cards: [
        {
            title: "Enrolled Programs",
            value: "6"
        },
        {
            title: "Active Programs",
            value: "3"
        },
        {
            title: "Completed Programs",
            value: "3"
        },
        {
            title: "Upcoming Sessions",
            value: "2"
        },
        {
            title: "Pending Assessments",
            value: "3"
        },
        {
            title: "Learning Progress",
            value: "84%"
        }
    ],

    actions: [
        {
            title: "My Programs",
            description: "View your skill development programs",
            link: "/course-management/my-courses"
        },
        {
            title: "Learning Content",
            description: "Access skill development content",
            link: "/course-management/content"
        },
        {
            title: "Assessments",
            description: "Complete your learning assessments",
            link: "/assessment"
        },
        {
            title: "My Progress",
            description: "Track your skill development",
            link: "/course-management/student-progress"
        },
        {
            title: "Certificates",
            description: "View your earned certificates",
            link: "/certificates"
        }
    ],

    sections: [
        "Skill Development",
        "Learning Progress",
        "Upcoming Sessions",
        "Assessment Status",
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