import type {
    CourseDuration,
    DeliveryDay,
    DeliveryPlan,
    DeliveryWeek,
    TenantType,
} from "@/types/course-engine.types";

import {
    calculateDurationDays,
} from "./duration-engine";


function addDays(
    date: Date,
    days: number
): Date {

    const result =
        new Date(date);

    result.setDate(
        result.getDate() + days
    );

    return result;

}


function formatDate(
    date: Date
): string {

    return date
        .toISOString()
        .split("T")[0];

}


export function generateDeliveryPlan(
    tenant: TenantType,
    duration: CourseDuration
): DeliveryPlan {

    if (
        !duration.startDate
    ) {

        throw new Error(
            "Start date is required."
        );

    }


    const totalDays =
        calculateDurationDays(
            duration
        );


    if (totalDays <= 0) {

        throw new Error(
            "Course duration must be greater than zero."
        );

    }


    const startDate =
        new Date(
            duration.startDate
        );


    const weeks:
        DeliveryWeek[] = [];


    let currentWeek:
        DeliveryWeek | null = null;


    for (
        let index = 0;
        index < totalDays;
        index++
    ) {

        const date =
            addDays(
                startDate,
                index
            );


        const weekNumber =
            Math.floor(
                index / 7
            ) + 1;


        const dayNumber =
            index + 1;


        if (
            !currentWeek ||
            currentWeek.weekNumber !==
                weekNumber
        ) {

            currentWeek = {

                id:
                    `WEEK-${weekNumber}`,

                weekNumber,

                startDate:
                    formatDate(
                        date
                    ),

                endDate:
                    formatDate(
                        date
                    ),

                days: [],

                totalLearningMinutes: 0,

            };

            weeks.push(
                currentWeek
            );

        }


        const day:
            DeliveryDay = {

            id:
                `DAY-${dayNumber}`,

            date:
                formatDate(
                    date
                ),

            dayNumber,

            weekNumber,

            sessions: [],

            totalLearningMinutes: 0,

            status: "planned",

        };


        currentWeek.days.push(
            day
        );


        currentWeek.endDate =
            formatDate(
                date
            );

    }


    return {

        id:
            `PLAN-${Date.now()}`,

        tenant,

        startDate:
            formatDate(
                startDate
            ),

        endDate:
            formatDate(
                addDays(
                    startDate,
                    totalDays - 1
                )
            ),

        timeZone:
            duration.timeZone,

        weeks,

        totalPlannedMinutes: 0,

        totalAvailableMinutes: 0,

    };

}