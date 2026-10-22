export function timeToMinutes(
    time: string
): number {

    const [
        hours,
        minutes,
    ] = time
        .split(":")
        .map(Number);

    return (
        hours * 60 +
        minutes
    );

}


export function minutesToTime(
    totalMinutes: number
): string {

    const hours =
        Math.floor(
            totalMinutes / 60
        );

    const minutes =
        totalMinutes % 60;

    return `${String(hours).padStart(
        2,
        "0"
    )}:${String(minutes).padStart(
        2,
        "0"
    )}`;

}


export function calculateSessionMinutes(
    startTime: string,
    endTime: string
): number {

    const start =
        timeToMinutes(
            startTime
        );

    const end =
        timeToMinutes(
            endTime
        );

    return Math.max(
        0,
        end - start
    );

}


export function overlaps(
    startA: string,
    endA: string,
    startB: string,
    endB: string
): boolean {

    const aStart =
        timeToMinutes(startA);

    const aEnd =
        timeToMinutes(endA);

    const bStart =
        timeToMinutes(startB);

    const bEnd =
        timeToMinutes(endB);

    return (
        aStart < bEnd &&
        bStart < aEnd
    );

}