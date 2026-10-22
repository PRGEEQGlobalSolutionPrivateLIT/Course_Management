import type {
    CourseManagementConfig
} from "@/types/course-management.types";

export const bootcampLearnerCourseManagement:
    CourseManagementConfig = {

    title: "My Bootcamp",
    subtitle: "Track your bootcamp learning, projects and assessments",

    cards: [
        {
            title: "Enrolled Bootcamps",
            value: "2"
        },
        {
            title: "Active Cohorts",
            value: "1"
        },
        {
            title: "Completed Modules",
            value: "8"
        },
        {
            title: "Pending Assessments",
            value: "2"
        },
        {
            title: "Projects",
            value: "3"
        },
        {
            title: "Completion",
            value: "74%"
        }
    ],

    actions: [
        {
            title: "My Bootcamp",
            description: "Access your bootcamp program",
            link: "/course-management/my-courses"
        },
        {
            title: "Learning Content",
            description: "Access bootcamp learning materials",
            link: "/course-management/content"
        },
        {
            title: "Assessments",
            description: "Complete bootcamp assessments",
            link: "/assessment"
        },
        {
            title: "Projects",
            description: "View and manage assigned projects",
            link: "/course-management/projects"
        },
        {
            title: "My Progress",
            description: "Track your bootcamp progress",
            link: "/course-management/student-progress"
        }
    ],

    sections: [
        "Bootcamp Progress",
        "Module Completion",
        "Project Status",
        "Assessment Status",
        "Upcoming Sessions"
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