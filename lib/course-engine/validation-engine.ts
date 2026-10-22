import type {
    CourseDraft,
} from "@/types/course-engine.types";


export type ValidationIssue = {

    severity:
        | "error"
        | "warning";

    code: string;

    message: string;

};


export function validateCourse(
    course: CourseDraft
): ValidationIssue[] {

    const issues:
        ValidationIssue[] = [];


    /* Duration */

    if (
        !course.duration.startDate
    ) {

        issues.push({

            severity: "error",

            code: "START_DATE_REQUIRED",

            message:
                "Course start date is required.",

        });

    }


    if (
        course.duration.startDate &&
        course.duration.endDate
    ) {

        const start =
            new Date(
                course.duration.startDate
            );

        const end =
            new Date(
                course.duration.endDate
            );


        if (end < start) {

            issues.push({

                severity: "error",

                code: "INVALID_DATE_RANGE",

                message:
                    "Course end date cannot be before the start date.",

            });

        }

    }


    /* Structure */

    if (
        course.structure.length === 0
    ) {

        issues.push({

            severity: "error",

            code: "STRUCTURE_EMPTY",

            message:
                "At least one structure item is required.",

        });

    }


    /* Content */

    if (
        course.content.length === 0
    ) {

        issues.push({

            severity: "warning",

            code: "CONTENT_EMPTY",

            message:
                "No learning content has been added.",

        });

    }


    /* Content duration */

    const contentMinutes =
        course.content.reduce(
            (
                total,
                item
            ) =>
                total +
                item.durationMinutes,
            0
        );


    if (
        contentMinutes >
        course.duration.totalLearningMinutes &&
        course.duration.totalLearningMinutes >
            0
    ) {

        issues.push({

            severity: "error",

            code: "CONTENT_DURATION_EXCEEDED",

            message:
                "The learning content requires more time than the configured course duration.",

        });

    }


    /* Delivery */

    if (
        course.deliveryPlan
    ) {

        if (
            course.deliveryPlan
                .totalPlannedMinutes >
            course.deliveryPlan
                .totalAvailableMinutes
        ) {

            issues.push({

                severity: "error",

                code: "DELIVERY_TIME_EXCEEDED",

                message:
                    "Scheduled learning time exceeds available delivery time.",

            });

        }

    }


    return issues;

}