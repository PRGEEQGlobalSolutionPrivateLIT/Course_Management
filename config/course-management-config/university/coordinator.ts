import type {
    CourseManagementConfig
} from "@/types/course-management.types";

export const universityCoordinatorCourseManagement:
    CourseManagementConfig = {

    title: "Course Management",
    subtitle: "Plan, coordinate and monitor assigned academic courses",

    cards: [
        {
            title: "Assigned Courses",
            value: "28"
        },
        {
            title: "Active Offerings",
            value: "18"
        },
        {
            title: "Active Batches",
            value: "12"
        },
        {
            title: "Faculty Assigned",
            value: "34"
        },
        {
            title: "Pending Readiness",
            value: "5"
        },
        {
            title: "Delivery Progress",
            value: "76%"
        }
    ],

    actions: [
        {
            title: "My Courses",
            description: "Manage courses assigned to you",
            link: "/course-management/my-courses"
        },
        {
            title: "Course Offerings",
            description: "Plan course offerings for the academic term",
            link: "/course-management/offerings"
        },
        {
            title: "Batch & Section Mapping",
            description: "Map courses to academic batches and sections",
            link: "/course-management/batches"
        },
        {
            title: "Faculty Allocation",
            description: "Coordinate faculty allocation",
            link: "/course-management/faculty"
        },
        {
            title: "Delivery Schedule",
            description: "Manage course delivery schedules",
            link: "/course-management/schedule"
        },
        {
            title: "Readiness Check",
            description: "Verify course delivery readiness",
            link: "/course-management/readiness"
        }
    ],

    sections: [
        "Course Delivery Progress",
        "Faculty Allocation",
        "Batch Progress",
        "Readiness Status",
        "Student Progress"
    ],

    permissions: {
        createCourse: true,
        editCourse: true,
        publishCourse: false,
        reviewCourse: true,
        assignTrainer: true,
        manageDelivery: true,
        viewReports: true
    }
};