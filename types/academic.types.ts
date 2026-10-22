export interface AcademicMappingData {
    academicYearId: string;
    academicYearName: string;

    departmentId: string;
    departmentName: string;

    programmeId: string;
    programmeCode: string;
    programmeName: string;

    regulationId: string;
    regulationName: string;

    curriculumId: string;
    curriculumName: string;

    curriculumVersionId: string;
    curriculumVersionName: string;

    semesterId: string;
    semesterName: string;

    courseCategoryId: string;
    courseCategoryName: string;

    prerequisiteCourseIds: string[];
}

export interface AcademicOption {
    id: string;
    name: string;
    code?: string;
}