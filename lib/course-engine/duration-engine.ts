import type {
    CourseDuration,
} from "@/types/course-engine.types";


export function calculateDurationDays(
    duration: CourseDuration
): number {

    if (
        duration.startDate &&
        duration.endDate
    ) {

        const start =
            new Date(
                duration.startDate
            );

        const end =
            new Date(
                duration.endDate
            );

        const difference =
            end.getTime() -
            start.getTime();

        return (
            Math.floor(
                difference /
                (1000 * 60 * 60 * 24)
            ) + 1
        );

    }


    if (duration.numberOfDays) {

        return duration.numberOfDays;

    }


    if (duration.numberOfWeeks) {

        return duration.numberOfWeeks * 7;

    }


    if (duration.numberOfMonths) {

        return duration.numberOfMonths * 30;

    }


    return 0;

}


export function calculateTotalLearningMinutes(
    contentMinutes: number[]
): number {

    return contentMinutes.reduce(
        (
            total,
            minutes
        ) =>
            total + minutes,
        0
    );

}


export function hasEnoughTime(
    requiredMinutes: number,
    availableMinutes: number
): boolean {

    return (
        requiredMinutes <=
        availableMinutes
    );

}