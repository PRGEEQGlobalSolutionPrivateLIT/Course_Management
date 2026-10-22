export interface CourseManagementCard {
    title: string;
    value: string;
}

export interface CourseManagementAction {
    title: string;
    description: string;
    link: string;
}

export interface CourseManagementPermissions {
    createCourse: boolean;
    editCourse: boolean;
    publishCourse: boolean;
    reviewCourse: boolean;
    assignTrainer: boolean;
    manageDelivery: boolean;
    viewReports: boolean;
}

export interface CourseManagementConfig {
    title: string;
    subtitle: string;

    cards: CourseManagementCard[];

    actions: CourseManagementAction[];

    sections: string[];

    permissions: CourseManagementPermissions;
}