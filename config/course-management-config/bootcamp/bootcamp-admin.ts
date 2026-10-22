import type {
    CourseManagementConfig
} from "@/types/course-management.types";

export const bootcampAdminCourseManagement:
    CourseManagementConfig = {

    title: "Bootcamp Management",
    subtitle: "Manage bootcamp programs, cohorts and learner delivery",

    cards: [
        {
            title: "Bootcamp Programs",
            value: "32"
        },
        {
            title: "Active Cohorts",
            value: "14"
        },
        {
            title: "Mentors",
            value: "22"
        },
        {
            title: "Learners",
            value: "640"
        },
        {
            title: "Upcoming Cohorts",
            value: "6"
        },
        {
            title: "Completion Rate",
            value: "83%"
        }
    ],

    actions: [
        {
            title: "Bootcamp Programs",
            description: "Manage bootcamp programs",
            link: "/course-management/my-courses"
        },
        {
            title: "Create Bootcamp",
            description: "Create a new bootcamp program",
            link: "/course-management/create-course"
        },
        {
            title: "Cohort Management",
            description: "Manage bootcamp cohorts",
            link: "/course-management/batches"
        },
        {
            title: "Mentor Allocation",
            description: "Assign mentors to cohorts",
            link: "/course-management/faculty"
        },
        {
            title: "Bootcamp Reports",
            description: "View bootcamp performance",
            link: "/course-management/reports"
        }
    ],

    sections: [
        "Bootcamp Status",
        "Cohort Progress",
        "Mentor Allocation",
        "Learner Progress",
        "Completion Status"
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