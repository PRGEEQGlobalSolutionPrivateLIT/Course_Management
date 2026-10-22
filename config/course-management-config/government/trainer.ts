import type {
    CourseManagementConfig
} from "@/types/course-management.types";

export const governmentTrainerCourseManagement:
    CourseManagementConfig = {

    title: "Trainer Workspace",
    subtitle: "Deliver government training and monitor participant development",

    cards: [
        {
            title: "Assigned Programs",
            value: "9"
        },
        {
            title: "Active Batches",
            value: "7"
        },
        {
            title: "Participants",
            value: "260"
        },
        {
            title: "Pending Evaluation",
            value: "22"
        },
        {
            title: "Upcoming Sessions",
            value: "6"
        },
        {
            title: "Completion Rate",
            value: "83%"
        }
    ],

    actions: [
        {
            title: "My Programs",
            description: "Manage assigned government training programs",
            link: "/course-management/my-courses"
        },
        {
            title: "Training Sessions",
            description: "Manage training delivery sessions",
            link: "/course-management/schedule"
        },
        {
            title: "Assessments",
            description: "Evaluate participant assessments",
            link: "/assessment"
        },
        {
            title: "Participant Progress",
            description: "Monitor participant development",
            link: "/course-management/student-progress"
        },
        {
            title: "Training Reports",
            description: "View training delivery reports",
            link: "/course-management/reports"
        }
    ],

    sections: [
        "Training Delivery",
        "Participant Progress",
        "Upcoming Sessions",
        "Assessment Performance",
        "Training Completion"
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