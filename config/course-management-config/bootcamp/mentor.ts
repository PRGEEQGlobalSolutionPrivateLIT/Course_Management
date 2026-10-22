import type {
    CourseManagementConfig
} from "@/types/course-management.types";

export const bootcampMentorCourseManagement:
    CourseManagementConfig = {

    title: "Mentor Workspace",
    subtitle: "Guide bootcamp learners through their learning journey",

    cards: [
        {
            title: "Assigned Bootcamps",
            value: "5"
        },
        {
            title: "Active Cohorts",
            value: "4"
        },
        {
            title: "Learners",
            value: "120"
        },
        {
            title: "Pending Reviews",
            value: "18"
        },
        {
            title: "Upcoming Sessions",
            value: "7"
        },
        {
            title: "Cohort Completion",
            value: "82%"
        }
    ],

    actions: [
        {
            title: "My Bootcamps",
            description: "Manage assigned bootcamp programs",
            link: "/course-management/my-courses"
        },
        {
            title: "Cohort Progress",
            description: "Monitor learner cohort progress",
            link: "/course-management/student-progress"
        },
        {
            title: "Assessments",
            description: "Review learner assessments",
            link: "/assessment"
        },
        {
            title: "Sessions",
            description: "Manage mentoring sessions",
            link: "/course-management/schedule"
        }
    ],

    sections: [
        "Cohort Progress",
        "Mentoring Sessions",
        "Learner Performance",
        "Assessment Reviews",
        "Upcoming Activities"
    ],

    permissions: {
        createCourse: true,
        editCourse: true,
        publishCourse: false,
        reviewCourse: false,
        assignTrainer: false,
        manageDelivery: true,
        viewReports: true
    }
};