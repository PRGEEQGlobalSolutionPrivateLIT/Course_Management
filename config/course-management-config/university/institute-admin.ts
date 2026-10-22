import type {
    CourseManagementConfig
} from "@/types/course-management.types";

export const universityInstituteAdminCourseManagement:
    CourseManagementConfig = {

    title: "Course Management",
    subtitle: "Monitor and oversee academic course operations",

    cards: [
        {
            title: "Total Courses",
            value: "245"
        },
        {
            title: "Published Courses",
            value: "180"
        },
        {
            title: "Draft Courses",
            value: "25"
        },
        {
            title: "Courses Under Review",
            value: "16"
        },
        {
            title: "Faculty Assigned",
            value: "320"
        },
        {
            title: "Course Completion",
            value: "82%"
        }
    ],

    actions: [
        {
            title: "My Courses",
            description: "View institution course records",
            link: "/course-management/my-courses"
        },
        {
            title: "Courses for Review",
            description: "Review courses submitted for approval",
            link: "/course-management/review"
        },
        {
            title: "Course Versions",
            description: "Manage academic course versions",
            link: "/course-management/versions"
        },
        {
            title: "Course Reports",
            description: "View institution-level course reports",
            link: "/course-management/reports"
        }
    ],

    sections: [
        "Course Status Overview",
        "Academic Course Delivery",
        "Faculty Allocation",
        "Pending Approvals",
        "Course Completion"
    ],

    permissions: {
        createCourse: true,
        editCourse: false,
        publishCourse: false,
        reviewCourse: true,
        assignTrainer: false,
        manageDelivery: false,
        viewReports: true
    }
};