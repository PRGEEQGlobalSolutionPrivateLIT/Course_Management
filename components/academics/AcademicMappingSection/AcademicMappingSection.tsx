"use client";

import styles from "./AcademicMappingSection.module.css";

import type {
    AcademicMappingData,
} from "@/types/academic.types";

interface Option {
    id: string;
    name: string;
    code?: string;
}

interface AcademicMappingSectionProps {
    value: AcademicMappingData;

    academicYears: Option[];
    departments: Option[];
    programmes: Option[];
    regulations: Option[];
    curricula: Option[];
    curriculumVersions: Option[];
    semesters: Option[];
    courseCategories: Option[];
    prerequisiteCourses: Option[];

    onChange: (
        next: AcademicMappingData
    ) => void;
}

export default function AcademicMappingSection({
    value,

    academicYears,
    departments,
    programmes,
    regulations,
    curricula,
    curriculumVersions,
    semesters,
    courseCategories,
    prerequisiteCourses,

    onChange,
}: AcademicMappingSectionProps) {

    function updateField(
        field:
            keyof AcademicMappingData,
        fieldValue:
            string | string[]
    ) {
        onChange({
            ...value,
            [field]:
                fieldValue,
        });
    }

    function getName(
        options: Option[],
        id: string
    ) {
        return (
            options.find(
                (item) =>
                    item.id === id
            )?.name ?? ""
        );
    }

    return (

        <section
            className={
                styles.section
            }
        >

            <div
                className={
                    styles.sectionHeader
                }
            >

                <div>

                    <span
                        className={
                            styles.eyebrow
                        }
                    >
                        ACADEMIC MAPPING
                    </span>

                    <h2>
                        Academic Context
                    </h2>

                    <p>
                        Map this course to the applicable
                        academic structure and curriculum.
                    </p>

                </div>

            </div>


            <div
                className={
                    styles.grid
                }
            >

                {/* Academic Year */}

                <label
                    className={
                        styles.field
                    }
                >

                    <span>
                        Academic Year
                    </span>

                    <select
                        value={
                            value.academicYearId
                        }
                        onChange={(event) => {

                            const id =
                                event.target.value;

                            onChange({
                                ...value,

                                academicYearId:
                                    id,

                                academicYearName:
                                    getName(
                                        academicYears,
                                        id
                                    ),
                            });

                        }}
                    >

                        <option value="">
                            Select Academic Year
                        </option>

                        {academicYears.map(
                            (item) => (

                                <option
                                    key={
                                        item.id
                                    }
                                    value={
                                        item.id
                                    }
                                >
                                    {
                                        item.name
                                    }
                                </option>

                            )
                        )}

                    </select>

                </label>


                {/* Department */}

                <label
                    className={
                        styles.field
                    }
                >

                    <span>
                        Department
                    </span>

                    <select
                        value={
                            value.departmentId
                        }
                        onChange={(event) => {

                            const id =
                                event.target.value;

                            onChange({
                                ...value,

                                departmentId:
                                    id,

                                departmentName:
                                    getName(
                                        departments,
                                        id
                                    ),

                                programmeId:
                                    "",

                                programmeCode:
                                    "",

                                programmeName:
                                    "",

                                curriculumId:
                                    "",

                                curriculumName:
                                    "",

                                curriculumVersionId:
                                    "",

                                curriculumVersionName:
                                    "",

                                semesterId:
                                    "",

                                semesterName:
                                    "",
                            });

                        }}
                    >

                        <option value="">
                            Select Department
                        </option>

                        {departments.map(
                            (item) => (

                                <option
                                    key={
                                        item.id
                                    }
                                    value={
                                        item.id
                                    }
                                >
                                    {
                                        item.name
                                    }
                                </option>

                            )
                        )}

                    </select>

                </label>


                {/* Programme */}

                <label
                    className={
                        styles.field
                    }
                >

                    <span>
                        Programme
                    </span>

                    <select
                        value={
                            value.programmeId
                        }
                        onChange={(event) => {

                            const id =
                                event.target.value;

                            const selected =
                                programmes.find(
                                    (item) =>
                                        item.id === id
                                );

                            onChange({
                                ...value,

                                programmeId:
                                    id,

                                programmeCode:
                                    selected?.code ??
                                    "",

                                programmeName:
                                    selected?.name ??
                                    "",

                                curriculumId:
                                    "",

                                curriculumName:
                                    "",

                                curriculumVersionId:
                                    "",

                                curriculumVersionName:
                                    "",

                                semesterId:
                                    "",

                                semesterName:
                                    "",
                            });

                        }}
                    >

                        <option value="">
                            Select Programme
                        </option>

                        {programmes.map(
                            (item) => (

                                <option
                                    key={
                                        item.id
                                    }
                                    value={
                                        item.id
                                    }
                                >
                                    {
                                        item.code
                                            ? `${item.code} - ${item.name}`
                                            : item.name
                                    }
                                </option>

                            )
                        )}

                    </select>

                </label>


                {/* Regulation */}

                <label
                    className={
                        styles.field
                    }
                >

                    <span>
                        Regulation / Scheme
                    </span>

                    <select
                        value={
                            value.regulationId
                        }
                        onChange={(event) => {

                            const id =
                                event.target.value;

                            onChange({
                                ...value,

                                regulationId:
                                    id,

                                regulationName:
                                    getName(
                                        regulations,
                                        id
                                    ),
                            });

                        }}
                    >

                        <option value="">
                            Select Regulation
                        </option>

                        {regulations.map(
                            (item) => (

                                <option
                                    key={
                                        item.id
                                    }
                                    value={
                                        item.id
                                    }
                                >
                                    {
                                        item.name
                                    }
                                </option>

                            )
                        )}

                    </select>

                </label>


                {/* Curriculum */}

                <label
                    className={
                        styles.field
                    }
                >

                    <span>
                        Curriculum
                    </span>

                    <select
                        value={
                            value.curriculumId
                        }
                        onChange={(event) => {

                            const id =
                                event.target.value;

                            onChange({
                                ...value,

                                curriculumId:
                                    id,

                                curriculumName:
                                    getName(
                                        curricula,
                                        id
                                    ),

                                curriculumVersionId:
                                    "",

                                curriculumVersionName:
                                    "",
                            });

                        }}
                    >

                        <option value="">
                            Select Curriculum
                        </option>

                        {curricula.map(
                            (item) => (

                                <option
                                    key={
                                        item.id
                                    }
                                    value={
                                        item.id
                                    }
                                >
                                    {
                                        item.name
                                    }
                                </option>

                            )
                        )}

                    </select>

                </label>


                {/* Curriculum Version */}

                <label
                    className={
                        styles.field
                    }
                >

                    <span>
                        Curriculum Version
                    </span>

                    <select
                        value={
                            value.curriculumVersionId
                        }
                        onChange={(event) => {

                            const id =
                                event.target.value;

                            onChange({
                                ...value,

                                curriculumVersionId:
                                    id,

                                curriculumVersionName:
                                    getName(
                                        curriculumVersions,
                                        id
                                    ),
                            });

                        }}
                    >

                        <option value="">
                            Select Version
                        </option>

                        {curriculumVersions.map(
                            (item) => (

                                <option
                                    key={
                                        item.id
                                    }
                                    value={
                                        item.id
                                    }
                                >
                                    {
                                        item.name
                                    }
                                </option>

                            )
                        )}

                    </select>

                </label>


                {/* Semester */}

                <label
                    className={
                        styles.field
                    }
                >

                    <span>
                        Semester
                    </span>

                    <select
                        value={
                            value.semesterId
                        }
                        onChange={(event) => {

                            const id =
                                event.target.value;

                            onChange({
                                ...value,

                                semesterId:
                                    id,

                                semesterName:
                                    getName(
                                        semesters,
                                        id
                                    ),
                            });

                        }}
                    >

                        <option value="">
                            Select Semester
                        </option>

                        {semesters.map(
                            (item) => (

                                <option
                                    key={
                                        item.id
                                    }
                                    value={
                                        item.id
                                    }
                                >
                                    {
                                        item.name
                                    }
                                </option>

                            )
                        )}

                    </select>

                </label>


                {/* Course Category */}

                <label
                    className={
                        styles.field
                    }
                >

                    <span>
                        Course Category
                    </span>

                    <select
                        value={
                            value.courseCategoryId
                        }
                        onChange={(event) => {

                            const id =
                                event.target.value;

                            onChange({
                                ...value,

                                courseCategoryId:
                                    id,

                                courseCategoryName:
                                    getName(
                                        courseCategories,
                                        id
                                    ),
                            });

                        }}
                    >

                        <option value="">
                            Select Category
                        </option>

                        {courseCategories.map(
                            (item) => (

                                <option
                                    key={
                                        item.id
                                    }
                                    value={
                                        item.id
                                    }
                                >
                                    {
                                        item.name
                                    }
                                </option>

                            )
                        )}

                    </select>

                </label>


                {/* Prerequisites */}

                <label
                    className={`${styles.field} ${styles.fullWidth}`}
                >

                    <span>
                        Prerequisite Courses
                    </span>

                    <select
                        multiple
                        value={
                            value.prerequisiteCourseIds
                        }
                        onChange={(event) => {

                            const selected =
                                Array.from(
                                    event.target
                                        .selectedOptions
                                ).map(
                                    (option) =>
                                        option.value
                                );

                            updateField(
                                "prerequisiteCourseIds",
                                selected
                            );

                        }}
                    >

                        {prerequisiteCourses.map(
                            (item) => (

                                <option
                                    key={
                                        item.id
                                    }
                                    value={
                                        item.id
                                    }
                                >
                                    {
                                        item.code
                                            ? `${item.code} - ${item.name}`
                                            : item.name
                                    }
                                </option>

                            )
                        )}

                    </select>

                    <small>
                        Hold Ctrl / Cmd to select multiple prerequisites.
                    </small>

                </label>

            </div>

        </section>

    );
}