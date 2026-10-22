import type {
    CourseManagementConfig
} from "@/types/course-management.types";

export const universityFacultyCourseManagement:
    CourseManagementConfig = {

    title: "My Courses",
    subtitle: "Manage your assigned courses and academic delivery",

    cards: [
        {
            title: "Assigned Courses",
            value: "8"
        },
        {
            title: "Active Courses",
            value: "5"
        },
        {
            title: "Active Batches",
            value: "6"
        },
        {
            title: "Pending Assessments",
            value: "12"
        },
        {
            title: "Students",
            value: "420"
        },
        {
            title: "Course Progress",
            value: "78%"
        }
    ],

    actions: [
        {
            title: "My Courses",
            description: "View and manage assigned courses",
            link: "/course-management/my-courses"
        },
        {
            title: "Syllabus Builder",
            description: "Manage course syllabus and learning units",
            link: "/course-management/syllabus"
        },
        {
            title: "Assessments",
            description: "Manage course assessments",
            link: "/assessment"
        },
        {
            title: "Student Progress",
            description: "Monitor student learning progress",
            link: "/course-management/student-progress"
        },
        {
            title: "Course Reports",
            description: "View course delivery reports",
            link: "/course-management/reports"
        }
    ],

    sections: [
        "Course Delivery",
        "Student Progress",
        "Assessment Status",
        "Upcoming Classes",
        "Course Completion"
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