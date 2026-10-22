import type {
    CourseManagementConfig
} from "@/types/course-management.types";

export const universityStudentCourseManagement:
    CourseManagementConfig = {

    title: "My Courses",
    subtitle: "View your enrolled courses and academic progress",

    cards: [
        {
            title: "Enrolled Courses",
            value: "8"
        },
        {
            title: "Active Courses",
            value: "5"
        },
        {
            title: "Completed Courses",
            value: "3"
        },
        {
            title: "Active Batches",
            value: "2"
        },
        {
            title: "Pending Assessments",
            value: "4"
        },
        {
            title: "Course Progress",
            value: "78%"
        }
    ],

    actions: [
        {
            title: "My Courses",
            description: "View your enrolled academic courses",
            link: "/course-management/my-courses"
        },
        {
            title: "Learning Content",
            description: "Access course learning materials",
            link: "/course-management/content"
        },
        {
            title: "Assessments",
            description: "Complete your assigned assessments",
            link: "/assessment"
        },
        {
            title: "My Progress",
            description: "Track your academic progress",
            link: "/course-management/student-progress"
        }
    ],

    sections: [
        "Course Progress",
        "Upcoming Classes",
        "Assessment Status",
        "Learning Content",
        "Academic Performance"
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