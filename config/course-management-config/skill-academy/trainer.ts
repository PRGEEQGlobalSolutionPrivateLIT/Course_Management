import type {
    CourseManagementConfig
} from "@/types/course-management.types";

export const skillAcademyTrainerCourseManagement:
    CourseManagementConfig = {

    title: "Trainer Workspace",
    subtitle: "Deliver skill-based training and monitor learner progress",

    cards: [
        {
            title: "Assigned Programs",
            value: "10"
        },
        {
            title: "Active Cohorts",
            value: "6"
        },
        {
            title: "Learners",
            value: "280"
        },
        {
            title: "Pending Evaluation",
            value: "24"
        },
        {
            title: "Upcoming Sessions",
            value: "5"
        },
        {
            title: "Completion Rate",
            value: "86%"
        }
    ],

    actions: [
        {
            title: "My Programs",
            description: "Manage assigned skill programs",
            link: "/course-management/my-courses"
        },
        {
            title: "Sessions",
            description: "Manage upcoming training sessions",
            link: "/course-management/schedule"
        },
        {
            title: "Assessments",
            description: "Evaluate learner assessments",
            link: "/assessment"
        },
        {
            title: "Learner Progress",
            description: "Monitor learner development",
            link: "/course-management/student-progress"
        }
    ],

    sections: [
        "Training Delivery",
        "Learner Progress",
        "Upcoming Sessions",
        "Assessment Results",
        "Skill Development"
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