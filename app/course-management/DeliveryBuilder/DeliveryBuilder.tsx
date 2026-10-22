"use client";

import { useEffect, useState } from "react";

import {
    getCourseDraft,
    saveCourseDraft,
} from "@/services/course-draft.service";

import styles from "./DeliveryBuilder.module.css";


/* =========================================================
   PROPS
========================================================= */

type DeliveryBuilderProps = {
    tenant: string;
    role: string;
    courseId: string;
    onBack: () => void;
    onNext: () => void;
};


/* =========================================================
   DELIVERY MODE
========================================================= */

type DeliveryMode =
    | "onsite"
    | "online"
    | "hybrid"
    | "self_paced";

/* =========================================================
   CONTENT FLOW
========================================================= */

type ContentFlowMode =
    | "time_wise"
    | "sequential"
    | "flexible";

/*
 * Delivery timing is configured against the exact item created in
 * Learning Structure. This lets the coordinator decide how that
 * particular item should be delivered.
 */
type DeliveryTimingMode =
    | "scheduled"
    | "deadline"
    | "on_demand";

type ContentSchedule = {
    contentId: string;
    deliveryType: DeliveryTimingMode;
    availableFrom: string;
    availableUntil?: string;
};

type StructureContentItem = {
    id: string;
    title: string;
    type?: string;
    kind: "content" | "assessment";
    moduleIndex: number;
    learningIndex: number;
    itemIndex: number;
    moduleTitle: string;
    learningTitle: string;
};


/* =========================================================
   SCHEDULE UNIT
========================================================= */

type ScheduleUnit =
    | "days"
    | "weeks"
    | "months";


/* =========================================================
   DAY SCHEDULE
========================================================= */

type DaySchedule = {
    id: string;
    day: string;
    startTime: string;
    endTime: string;
    breakMinutes: number;
};


/* =========================================================
   COMPONENT
========================================================= */

export default function DeliveryBuilder({
    tenant,
    role,
    courseId,
    onBack,
    onNext,
}: DeliveryBuilderProps) {

    /* =====================================================
       DELIVERY MODE
    ===================================================== */

    const [
        deliveryMode,
        setDeliveryMode,
    ] = useState<DeliveryMode>("onsite");

    /* =====================================================
       CONTENT FLOW

       The Learning Structure defines the tree/order.
       Delivery only controls how that existing structure
       becomes available to learners.
    ===================================================== */

    const [
        contentFlow,
        setContentFlow,
    ] = useState<ContentFlowMode>("flexible");

    const [
        contentSchedules,
        setContentSchedules,
    ] = useState<Record<string, ContentSchedule>>({});

    /*
     * Default delivery type for newly scheduled items.
     * Individual items can still be changed independently.
     */
    const [
        defaultDeliveryType,
        setDefaultDeliveryType,
    ] = useState<DeliveryTimingMode>("scheduled");


    /* =====================================================
       PROGRAM DURATION
    ===================================================== */

    const [
        durationValue,
        setDurationValue,
    ] = useState(3);


    const [
        durationUnit,
        setDurationUnit,
    ] = useState<ScheduleUnit>("months");


    /* =====================================================
       START DATE
    ===================================================== */

    const [
        startDate,
        setStartDate,
    ] = useState("");


    /* =====================================================
       DAILY TIME
    ===================================================== */

    const [
        startTime,
        setStartTime,
    ] = useState("09:00");


    const [
        endTime,
        setEndTime,
    ] = useState("17:00");


    /* =====================================================
       TIME ZONE
    ===================================================== */

    const [
        timezone,
        setTimezone,
    ] = useState("Asia/Kolkata");


    /* =====================================================
       WORKING DAYS
    ===================================================== */

    const [
        workingDays,
        setWorkingDays,
    ] = useState<string[]>([
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
    ]);


    /* =====================================================
       CUSTOM DAY SCHEDULES
    ===================================================== */

    const [
        daySchedules,
        setDaySchedules,
    ] = useState<DaySchedule[]>([]);

    const [
        structureItems,
        setStructureItems,
    ] = useState<StructureContentItem[]>([]);


    /* =====================================================
       LOAD SAVED DELIVERY DATA

       Step 7 always uses the same course draft. When the user
       returns from a later step, restore the saved delivery
       configuration into the local form state.
    ===================================================== */

    useEffect(() => {
        if (!courseId) {
            return;
        }

        const draft = getCourseDraft(courseId);

        if (!draft) {
            return;
        }

        const savedDelivery = (
            draft as typeof draft & {
                delivery?: {
                    deliveryMode?: string;
                    durationValue?: number;
                    durationUnit?: string;
                    startDate?: string;
                    startTime?: string;
                    endTime?: string;
                    timezone?: string;
                    workingDays?: string[];
                    daySchedules?: DaySchedule[];
                    contentFlow?: ContentFlowMode;
                    defaultDeliveryType?: DeliveryTimingMode;
                    contentSchedules?: Record<string, ContentSchedule>;
                };
            }
        ).delivery;

        if (!savedDelivery) {
            return;
        }

        if (
            savedDelivery.deliveryMode === "onsite" ||
            savedDelivery.deliveryMode === "online" ||
            savedDelivery.deliveryMode === "hybrid" ||
            savedDelivery.deliveryMode === "self_paced"
        ) {
            setDeliveryMode(
                savedDelivery.deliveryMode
            );
        }

        if (
            typeof savedDelivery.durationValue ===
            "number"
        ) {
            setDurationValue(
                savedDelivery.durationValue
            );
        }

        if (
            savedDelivery.durationUnit === "days" ||
            savedDelivery.durationUnit === "weeks" ||
            savedDelivery.durationUnit === "months"
        ) {
            setDurationUnit(
                savedDelivery.durationUnit
            );
        }

        if (
            typeof savedDelivery.startDate ===
            "string"
        ) {
            setStartDate(
                savedDelivery.startDate
            );
        }

        if (
            typeof savedDelivery.startTime ===
            "string"
        ) {
            setStartTime(
                savedDelivery.startTime
            );
        }

        if (
            typeof savedDelivery.endTime ===
            "string"
        ) {
            setEndTime(
                savedDelivery.endTime
            );
        }

        if (
            typeof savedDelivery.timezone ===
            "string"
        ) {
            setTimezone(
                savedDelivery.timezone
            );
        }

        if (
            Array.isArray(
                savedDelivery.workingDays
            )
        ) {
            setWorkingDays([
                ...savedDelivery.workingDays,
            ]);
        }

        if (
            Array.isArray(
                savedDelivery.daySchedules
            )
        ) {
            setDaySchedules(
                savedDelivery.daySchedules as DaySchedule[]
            );
        }

        if (
            savedDelivery.contentFlow === "time_wise" ||
            savedDelivery.contentFlow === "sequential" ||
            savedDelivery.contentFlow === "flexible"
        ) {
            setContentFlow(
                savedDelivery.contentFlow
            );
        }

        if (
            savedDelivery.contentSchedules &&
            typeof savedDelivery.contentSchedules === "object"
        ) {
            setContentSchedules(
                savedDelivery.contentSchedules as Record<string, ContentSchedule>
            );
        }

        if (
            savedDelivery.defaultDeliveryType === "scheduled" ||
            savedDelivery.defaultDeliveryType === "deadline" ||
            savedDelivery.defaultDeliveryType === "on_demand"
        ) {
            setDefaultDeliveryType(
                savedDelivery.defaultDeliveryType
            );
        }
    }, [courseId]);


    /* =====================================================
       DAYS
    ===================================================== */

    const days = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
    ];


    /* =====================================================
       TOGGLE WORKING DAY
    ===================================================== */

    function toggleWorkingDay(day: string) {

        setWorkingDays(
            (previous) => {

                if (
                    previous.includes(day)
                ) {

                    return previous.filter(
                        (item) =>
                            item !== day
                    );

                }


                return [
                    ...previous,
                    day,
                ];

            }
        );

    }


    /* =====================================================
       ADD DAY SCHEDULE
    ===================================================== */

    function addDaySchedule() {

        const newSchedule: DaySchedule = {

            id:
                `DAY-${Date.now()}`,

            day:
                workingDays[0] ||
                "Monday",

            startTime,

            endTime,

            breakMinutes: 60,

        };


        setDaySchedules(
            (previous) => [

                ...previous,

                newSchedule,

            ]
        );

    }


    /* =====================================================
       REMOVE DAY SCHEDULE
    ===================================================== */

    function removeDaySchedule(
        id: string
    ) {

        setDaySchedules(
            (previous) =>
                previous.filter(
                    (item) =>
                        item.id !== id
                )
        );

    }


    /* =====================================================
       UPDATE DAY SCHEDULE
    ===================================================== */

    function updateDaySchedule(
        id: string,
        field: keyof DaySchedule,
        value: string | number
    ) {

        setDaySchedules(
            (previous) =>
                previous.map(
                    (item) => {

                        if (
                            item.id !== id
                        ) {

                            return item;

                        }


                        return {
                            ...item,
                            [field]: value,
                        };

                    }
                )
        );

    }


    /* =====================================================
       STRUCTURE EXTRACTION

       Read the exact structure created in Learning Structure.
       Delivery never creates or reorders that structure.
    ===================================================== */

    function getStructureItemsFromDraft(
        draft: any
    ): StructureContentItem[] {

        const structure =
            Array.isArray(draft?.structure)
                ? draft.structure
                : [];

        const result: StructureContentItem[] = [];

        structure.forEach(
            (module: any, moduleIndex: number) => {

                const moduleTitle =
                    typeof module?.title === "string" &&
                    module.title.trim()
                        ? module.title
                        : `Module ${moduleIndex + 1}`;

                const learnings =
                    Array.isArray(module?.learnings)
                        ? module.learnings
                        : [];

                learnings.forEach(
                    (learning: any, learningIndex: number) => {

                        const learningTitle =
                            typeof learning?.title === "string" &&
                            learning.title.trim()
                                ? learning.title
                                : `Learning ${learningIndex + 1}`;

                        const contents =
                            Array.isArray(learning?.contents)
                                ? learning.contents
                                : [];

                        contents.forEach(
                            (content: any, itemIndex: number) => {

                                const id =
                                    typeof content?.id === "string" &&
                                    content.id.trim()
                                        ? content.id
                                        : `module-${moduleIndex + 1}-learning-${learningIndex + 1}-content-${itemIndex + 1}`;

                                result.push({
                                    id,
                                    title:
                                        typeof content?.title === "string" &&
                                        content.title.trim()
                                            ? content.title
                                            : content?.fileName ||
                                              `Content ${itemIndex + 1}`,
                                    type:
                                        typeof content?.type === "string"
                                            ? content.type
                                            : undefined,
                                    kind: "content",
                                    moduleIndex,
                                    learningIndex,
                                    itemIndex,
                                    moduleTitle,
                                    learningTitle,
                                });
                            }
                        );

                        const assessments =
                            Array.isArray(learning?.assessments)
                                ? learning.assessments
                                : [];

                        assessments.forEach(
                            (assessment: any, itemIndex: number) => {

                                const id =
                                    typeof assessment?.id === "string" &&
                                    assessment.id.trim()
                                        ? assessment.id
                                        : `module-${moduleIndex + 1}-learning-${learningIndex + 1}-assessment-${itemIndex + 1}`;

                                result.push({
                                    id,
                                    title:
                                        typeof assessment?.title === "string" &&
                                        assessment.title.trim()
                                            ? assessment.title
                                            : assessment?.name ||
                                              `Assessment ${itemIndex + 1}`,
                                    type:
                                        typeof assessment?.type === "string"
                                            ? assessment.type
                                            : undefined,
                                    kind: "assessment",
                                    moduleIndex,
                                    learningIndex,
                                    itemIndex,
                                    moduleTitle,
                                    learningTitle,
                                });
                            }
                        );
                    }
                );
            }
        );

        return result;
    }

    useEffect(() => {
        if (!courseId) {
            setStructureItems([]);
            return;
        }

        const draft = getCourseDraft(courseId);

        if (!draft) {
            setStructureItems([]);
            return;
        }

        setStructureItems(
            getStructureItemsFromDraft(draft)
        );
    }, [courseId]);

    function updateContentSchedule(
        contentId: string,
        field:
            | "deliveryType"
            | "availableFrom"
            | "availableUntil",
        value: string
    ) {
        setContentSchedules(
            (previous) => ({
                ...previous,
                [contentId]: {
                    contentId,
                    deliveryType:
                        previous[contentId]?.deliveryType ??
                        defaultDeliveryType,
                    availableFrom:
                        previous[contentId]?.availableFrom ?? "",
                    availableUntil:
                        previous[contentId]?.availableUntil ?? "",
                    [field]: value,
                },
            })
        );
    }

    function getDeliveryTypeLabel(
        value: DeliveryTimingMode
    ) {
        if (value === "scheduled") {
            return "Scheduled";
        }

        if (value === "deadline") {
            return "Deadline";
        }

        return "On-demand";
    }

    function getDeliveryTypeDescription(
        value: DeliveryTimingMode
    ) {
        if (value === "scheduled") {
            return "Release at a specific date and time.";
        }

        if (value === "deadline") {
            return "Available from the course start and close at a set deadline.";
        }

        return "Available whenever the learner is allowed to access it.";
    }

    function applyDefaultDeliveryTypeToItems(
        value: DeliveryTimingMode
    ) {
        setDefaultDeliveryType(value);

        if (contentFlow !== "time_wise") {
            return;
        }

        setContentSchedules((previous) => {
            const next = { ...previous };

            structureItems.forEach((item) => {
                next[item.id] = {
                    contentId: item.id,
                    deliveryType:
                        previous[item.id]?.deliveryType ?? value,
                    availableFrom:
                        previous[item.id]?.availableFrom ?? "",
                    availableUntil:
                        previous[item.id]?.availableUntil ?? "",
                };
            });

            return next;
        });
    }

    function clearContentSchedule(
        contentId: string
    ) {
        setContentSchedules(
            (previous) => {
                const next = {
                    ...previous,
                };

                delete next[contentId];

                return next;
            }
        );
    }

    function formatContentFlowLabel(
        value: ContentFlowMode
    ) {
        if (value === "time_wise") {
            return "Time-wise";
        }

        if (value === "sequential") {
            return "Sequential-wise";
        }

        return "Flexible";
    }

    /*
     * The schedule is attached to the exact content ID from
     * Learning Structure. The structure itself is untouched.
     */
    const hasMissingTimeWiseSchedule =
        contentFlow === "time_wise" &&
        structureItems.some((item) => {
            const schedule = contentSchedules[item.id];
            const type =
                schedule?.deliveryType ??
                defaultDeliveryType;

            if (type === "on_demand") {
                return false;
            }

            if (type === "deadline") {
                return !schedule?.availableUntil;
            }

            return !schedule?.availableFrom;
        });

    /*
     * Persist delivery changes to the same draft while the
     * user is editing Step 7. This keeps Review/Learner View
     * in sync even before Save & Continue is clicked.
     */
    useEffect(() => {
        if (!courseId) {
            return;
        }

        const draft = getCourseDraft(courseId);

        if (!draft) {
            return;
        }

        const savedDelivery = (
            draft as typeof draft & {
                delivery?: {
                    deliveryMode?: string;
                    durationValue?: number;
                    durationUnit?: string;
                    startDate?: string;
                    startTime?: string;
                    endTime?: string;
                    timezone?: string;
                    workingDays?: string[];
                    daySchedules?: DaySchedule[];
                    contentFlow?: ContentFlowMode;
                    defaultDeliveryType?: DeliveryTimingMode;
                    contentSchedules?: Record<string, ContentSchedule>;
                };
            }
        ).delivery;

        /*
         * Prevent the initial default state from overwriting
         * an existing saved delivery configuration before it
         * has been restored.
         */
        if (
            savedDelivery &&
            deliveryMode === "onsite" &&
            durationValue === 3 &&
            durationUnit === "months" &&
            startDate === "" &&
            startTime === "09:00" &&
            endTime === "17:00" &&
            timezone === "Asia/Kolkata" &&
            workingDays.length === 5 &&
            daySchedules.length === 0
        ) {
            return;
        }

        saveCourseDraft({
            ...draft,
            delivery: {
                deliveryMode,
                durationValue,
                durationUnit,
                startDate,
                startTime,
                endTime,
                timezone,
                workingDays: [
                    ...workingDays,
                ],
                daySchedules: [
                    ...daySchedules,
                ],
                contentFlow,
                defaultDeliveryType,
                contentSchedules: {
                    ...contentSchedules,
                },
            },
            updatedAt: new Date().toISOString(),
        });
    }, [
        courseId,
        deliveryMode,
        durationValue,
        durationUnit,
        startDate,
        startTime,
        endTime,
        timezone,
        workingDays,
        daySchedules,
        contentFlow,
        defaultDeliveryType,
        contentSchedules,
    ]);


    /* =====================================================
       DURATION UNIT CHANGE
    ===================================================== */

    function handleDurationUnitChange(
        value: string
    ) {

        if (
            value === "days" ||
            value === "weeks" ||
            value === "months"
        ) {

            setDurationUnit(value);

        }

    }


    /* =====================================================
       SAVE & CONTINUE
    ===================================================== */

    function handleNext() {
        if (
            contentFlow === "time_wise" &&
            structureItems.length > 0 &&
            hasMissingTimeWiseSchedule
        ) {
            console.error(
                "Cannot save Delivery: every Time-wise item must have the required date/time or deadline based on its delivery type."
            );
            return;
        }

        if (!courseId) {
            console.error(
                "Cannot save Delivery: courseId is missing."
            );
            return;
        }

        const draft = getCourseDraft(
            courseId
        );

        if (!draft) {
            console.error(
                "Cannot save Delivery: course draft not found.",
                courseId
            );
            return;
        }

        const updatedDraft = {
            ...draft,

            delivery: {
                deliveryMode,
                durationValue,
                durationUnit,
                startDate,
                startTime,
                endTime,
                timezone,
                workingDays: [
                    ...workingDays,
                ],
                daySchedules: [
                    ...daySchedules,
                ],
                contentFlow,
                defaultDeliveryType,
                contentSchedules: {
                    ...contentSchedules,
                },
            },

            /*
             * Delivery is Step 7 in the wizard.
             * Never reduce progress when returning to edit
             * this step after completing later steps.
             */
            currentStep:
                Math.max(
                    draft.currentStep ?? 0,
                    7
                ),

            completedThroughStep:
                Math.max(
                    draft.completedThroughStep ?? 0,
                    7
                ),

            updatedAt:
                new Date().toISOString(),
        };

        saveCourseDraft(
            updatedDraft
        );

        console.log(
            "Saved delivery configuration for course:",
            courseId
        );

        /*
         * Navigate only after the current delivery data
         * has been persisted into the same course draft.
         */
        onNext();
    }


    /* =====================================================
       RENDER
    ===================================================== */

    return (

        <div className={styles.container}>

            {/* =================================================
                HEADER
            ================================================= */}

            <div className={styles.header}>

                <div>

                    <span
                        className={
                            styles.eyebrow
                        }
                    >
                        Step 7
                    </span>


                    <h2>
                        Delivery Planning
                    </h2>


                    <p>
                        Configure the duration,
                        schedule, delivery mode,
                        working days, and time
                        allocation for the learning
                        program.
                    </p>

                </div>

            </div>


            {/* =================================================
                CONTEXT
            ================================================= */}

            <div
                className={
                    styles.contextCard
                }
            >

                <div>

                    <span>
                        Course ID
                    </span>

                    <strong>
                        {courseId}
                    </strong>

                </div>


                <div>

                    <span>
                        Tenant
                    </span>

                    <strong>
                        {tenant}
                    </strong>

                </div>


                <div>

                    <span>
                        Actor
                    </span>

                    <strong>
                        {role}
                    </strong>

                </div>

            </div>


            {/* =================================================
                DELIVERY MODE
            ================================================= */}

            <div className={styles.card}>

                <div
                    className={
                        styles.sectionHeader
                    }
                >

                    <h3>
                        Delivery Mode
                    </h3>

                    <p>
                        Select how the learning
                        program will be delivered.
                    </p>

                </div>


                <div
                    className={
                        styles.modeGrid
                    }
                >

                    <button
                        type="button"
                        className={
                            deliveryMode === "onsite"
                                ? styles.modeActive
                                : styles.mode
                        }
                        onClick={() =>
                            setDeliveryMode(
                                "onsite"
                            )
                        }
                    >

                        <strong>
                            On-site
                        </strong>

                        <span>
                            Physical classroom
                            delivery
                        </span>

                    </button>


                    <button
                        type="button"
                        className={
                            deliveryMode === "online"
                                ? styles.modeActive
                                : styles.mode
                        }
                        onClick={() =>
                            setDeliveryMode(
                                "online"
                            )
                        }
                    >

                        <strong>
                            Online
                        </strong>

                        <span>
                            Instructor-led
                            online delivery
                        </span>

                    </button>


                    <button
                        type="button"
                        className={
                            deliveryMode === "hybrid"
                                ? styles.modeActive
                                : styles.mode
                        }
                        onClick={() =>
                            setDeliveryMode(
                                "hybrid"
                            )
                        }
                    >

                        <strong>
                            Hybrid
                        </strong>

                        <span>
                            Online and physical
                            delivery
                        </span>

                    </button>


                    <button
                        type="button"
                        className={
                            deliveryMode === "self_paced"
                                ? styles.modeActive
                                : styles.mode
                        }
                        onClick={() =>
                            setDeliveryMode(
                                "self_paced"
                            )
                        }
                    >

                        <strong>
                            Self-paced
                        </strong>

                        <span>
                            Learner-controlled
                            schedule
                        </span>

                    </button>

                </div>

            </div>


            {/* =================================================
                CONTENT FLOW
            ================================================= */}

            <div className={styles.card}>

                <div className={styles.sectionHeader}>

                    <h3>
                        Content Flow
                    </h3>

                    <p>
                        Choose how the learning structure created in
                        Learning Structure will become available to learners.
                    </p>

                </div>

                <div className={styles.modeGrid}>

                    <button
                        type="button"
                        className={
                            contentFlow === "time_wise"
                                ? styles.modeActive
                                : styles.mode
                        }
                        onClick={() =>
                            setContentFlow("time_wise")
                        }
                    >
                        <strong>
                            Time-wise
                        </strong>

                        <span>
                            Release each content item according to
                            its scheduled date and time.
                        </span>
                    </button>

                    <button
                        type="button"
                        className={
                            contentFlow === "sequential"
                                ? styles.modeActive
                                : styles.mode
                        }
                        onClick={() =>
                            setContentFlow("sequential")
                        }
                    >
                        <strong>
                            Sequential-wise
                        </strong>

                        <span>
                            Learners follow the existing module,
                            learning, and content order.
                        </span>
                    </button>

                    <button
                        type="button"
                        className={
                            contentFlow === "flexible"
                                ? styles.modeActive
                                : styles.mode
                        }
                        onClick={() =>
                            setContentFlow("flexible")
                        }
                    >
                        <strong>
                            Flexible
                        </strong>

                        <span>
                            Learners can access available content
                            without sequence or time gating.
                        </span>
                    </button>

                </div>

                {contentFlow === "time_wise" && (
                    <div
                        style={{
                            marginTop: 18,
                            display: "flex",
                            flexDirection: "column",
                            gap: 14,
                        }}
                    >
                        <div
                            style={{
                                padding: "12px 14px",
                                borderRadius: 10,
                                background: "rgba(23,79,132,0.07)",
                                color: "#687386",
                                fontSize: 11,
                                lineHeight: 1.5,
                            }}
                        >
                            Set the delivery type for each existing
                            Learning Structure item. Date and time are
                            required only when that delivery type needs
                            them.
                        </div>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns:
                                    "minmax(220px, 1fr) minmax(180px, 260px)",
                                gap: 12,
                                alignItems: "end",
                            }}
                        >
                            <div>
                                <div
                                    style={{
                                        color: "#2a354f",
                                        fontSize: 12,
                                        fontWeight: 750,
                                    }}
                                >
                                    Default delivery type
                                </div>
                                <div
                                    style={{
                                        color: "#687386",
                                        fontSize: 10,
                                        marginTop: 3,
                                    }}
                                >
                                    Used for items that do not have an
                                    individual delivery type yet.
                                </div>
                            </div>

                            <div className={styles.field} style={{ margin: 0 }}>
                                <label>Delivery Type</label>
                                <select
                                    value={defaultDeliveryType}
                                    onChange={(event) =>
                                        applyDefaultDeliveryTypeToItems(
                                            event.target.value as DeliveryTimingMode
                                        )
                                    }
                                >
                                    <option value="scheduled">
                                        Scheduled
                                    </option>
                                    <option value="deadline">
                                        Deadline
                                    </option>
                                    <option value="on_demand">
                                        On-demand
                                    </option>
                                </select>
                            </div>
                        </div>

                        {structureItems.length === 0 ? (
                            <div className={styles.emptyState}>
                                No content is available in the Learning
                                Structure yet.
                            </div>
                        ) : (
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 10,
                                }}
                            >
                                {structureItems.map((item, index) => {
                                    const schedule =
                                        contentSchedules[item.id];

                                    const deliveryType =
                                        schedule?.deliveryType ??
                                        defaultDeliveryType;

                                    return (
                                        <div
                                            key={item.id}
                                            style={{
                                                display: "grid",
                                                gridTemplateColumns:
                                                    "minmax(220px, 1.5fr) minmax(150px, 0.8fr) minmax(150px, 0.8fr) minmax(120px, 0.7fr) auto",
                                                gap: 10,
                                                alignItems: "center",
                                                padding: 12,
                                                borderRadius: 10,
                                                background: "#dfe6e9",
                                                boxShadow:
                                                    "inset 2px 2px 5px #c5c6cc, inset -2px -2px 5px #ffffff",
                                            }}
                                        >
                                            <div style={{ minWidth: 0 }}>
                                                <div
                                                    style={{
                                                        color: "#174f84",
                                                        fontSize: 9,
                                                        fontWeight: 750,
                                                        letterSpacing: "0.08em",
                                                    }}
                                                >
                                                    {item.kind === "assessment"
                                                        ? "ASSESSMENT"
                                                        : "CONTENT"}{" "}
                                                    · {index + 1}
                                                </div>

                                                <strong
                                                    style={{
                                                        display: "block",
                                                        marginTop: 3,
                                                        color: "#2a354f",
                                                        fontSize: 12,
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                        whiteSpace: "nowrap",
                                                    }}
                                                    title={item.title}
                                                >
                                                    {item.title}
                                                </strong>

                                                <span
                                                    style={{
                                                        display: "block",
                                                        marginTop: 3,
                                                        color: "#687386",
                                                        fontSize: 10,
                                                    }}
                                                >
                                                    {item.moduleTitle}
                                                    {" → "}
                                                    {item.learningTitle}
                                                </span>
                                            </div>

                                            <div
                                                className={styles.field}
                                                style={{ margin: 0 }}
                                            >
                                                <label>Delivery Type</label>
                                                <select
                                                    value={deliveryType}
                                                    onChange={(event) =>
                                                        updateContentSchedule(
                                                            item.id,
                                                            "deliveryType",
                                                            event.target.value
                                                        )
                                                    }
                                                >
                                                    <option value="scheduled">
                                                        Scheduled
                                                    </option>
                                                    <option value="deadline">
                                                        Deadline
                                                    </option>
                                                    <option value="on_demand">
                                                        On-demand
                                                    </option>
                                                </select>
                                            </div>

                                            {deliveryType === "scheduled" ? (
                                                <>
                                                    <div
                                                        className={styles.field}
                                                        style={{ margin: 0 }}
                                                    >
                                                        <label>Release Date</label>
                                                        <input
                                                            type="date"
                                                            value={
                                                                schedule?.availableFrom
                                                                    ? schedule.availableFrom.slice(
                                                                          0,
                                                                          10
                                                                      )
                                                                    : ""
                                                            }
                                                            onChange={(event) => {
                                                                const date =
                                                                    event.target
                                                                        .value;
                                                                const existingTime =
                                                                    schedule?.availableFrom?.slice(
                                                                        11,
                                                                        16
                                                                    ) ||
                                                                    startTime ||
                                                                    "09:00";

                                                                updateContentSchedule(
                                                                    item.id,
                                                                    "availableFrom",
                                                                    date
                                                                        ? `${date}T${existingTime}`
                                                                        : ""
                                                                );
                                                            }}
                                                        />
                                                    </div>

                                                    <div
                                                        className={styles.field}
                                                        style={{ margin: 0 }}
                                                    >
                                                        <label>Release Time</label>
                                                        <input
                                                            type="time"
                                                            value={
                                                                schedule?.availableFrom?.slice(
                                                                    11,
                                                                    16
                                                                ) || ""
                                                            }
                                                            onChange={(event) => {
                                                                const time =
                                                                    event.target
                                                                        .value;
                                                                const existingDate =
                                                                    schedule?.availableFrom?.slice(
                                                                        0,
                                                                        10
                                                                    ) ||
                                                                    startDate ||
                                                                    "";

                                                                updateContentSchedule(
                                                                    item.id,
                                                                    "availableFrom",
                                                                    existingDate &&
                                                                        time
                                                                        ? `${existingDate}T${time}`
                                                                        : ""
                                                                );
                                                            }}
                                                        />
                                                    </div>
                                                </>
                                            ) : deliveryType === "deadline" ? (
                                                <>
                                                    <div
                                                        className={styles.field}
                                                        style={{ margin: 0 }}
                                                    >
                                                        <label>Available From</label>
                                                        <input
                                                            type="date"
                                                            value={
                                                                schedule?.availableFrom
                                                                    ? schedule.availableFrom.slice(
                                                                          0,
                                                                          10
                                                                      )
                                                                    : startDate
                                                            }
                                                            onChange={(event) => {
                                                                const date =
                                                                    event.target
                                                                        .value;
                                                                updateContentSchedule(
                                                                    item.id,
                                                                    "availableFrom",
                                                                    date
                                                                        ? `${date}T00:00`
                                                                        : ""
                                                                );
                                                            }}
                                                        />
                                                    </div>

                                                    <div
                                                        className={styles.field}
                                                        style={{ margin: 0 }}
                                                    >
                                                        <label>Deadline</label>
                                                        <input
                                                            type="date"
                                                            value={
                                                                schedule?.availableUntil
                                                                    ? schedule.availableUntil.slice(
                                                                          0,
                                                                          10
                                                                      )
                                                                    : ""
                                                            }
                                                            onChange={(event) =>
                                                                updateContentSchedule(
                                                                    item.id,
                                                                    "availableUntil",
                                                                    event.target
                                                                        .value
                                                                        ? `${event.target.value}T23:59`
                                                                        : ""
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                </>
                                            ) : (
                                                <div
                                                    style={{
                                                        gridColumn:
                                                            "span 2",
                                                        padding: "10px 12px",
                                                        borderRadius: 8,
                                                        background:
                                                            "rgba(16,171,124,0.08)",
                                                        color: "#687386",
                                                        fontSize: 10,
                                                        lineHeight: 1.45,
                                                    }}
                                                >
                                                    On-demand: learner access is
                                                    controlled by the selected
                                                    delivery mode and course
                                                    availability. No individual
                                                    date or time is required.
                                                </div>
                                            )}

                                            <button
                                                type="button"
                                                className={styles.removeButton}
                                                onClick={() =>
                                                    clearContentSchedule(
                                                        item.id
                                                    )
                                                }
                                            >
                                                Clear
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {hasMissingTimeWiseSchedule &&
                            structureItems.length > 0 && (
                                <div
                                    style={{
                                        padding: "10px 12px",
                                        borderRadius: 9,
                                        background: "rgba(180,60,60,0.08)",
                                        color: "#9b3d3d",
                                        fontSize: 11,
                                    }}
                                >
                                    Complete the required date/time or
                                    deadline for each scheduled item before
                                    continuing. On-demand items do not require
                                    a date or time.
                                </div>
                            )}
                    </div>
                )}

                {contentFlow === "sequential" && (
                    <div
                        style={{
                            marginTop: 16,
                            padding: "12px 14px",
                            borderRadius: 10,
                            background: "rgba(16,171,124,0.08)",
                            color: "#687386",
                            fontSize: 11,
                            lineHeight: 1.5,
                        }}
                    >
                        Learner View will follow the exact structure
                        order: Module → Learning → Content/Assessment.
                        The next item is unlocked after the required
                        previous item is completed.
                    </div>
                )}

                {contentFlow === "flexible" && (
                    <div
                        style={{
                            marginTop: 16,
                            padding: "12px 14px",
                            borderRadius: 10,
                            background: "rgba(23,79,132,0.07)",
                            color: "#687386",
                            fontSize: 11,
                            lineHeight: 1.5,
                        }}
                    >
                        Learners can access the existing content
                        structure without time or sequence gating.
                    </div>
                )}

            </div>

            {/* =================================================
                PROGRAM DURATION
            ================================================= */}

            <div className={styles.card}>

                <div
                    className={
                        styles.sectionHeader
                    }
                >

                    <h3>
                        Program Duration
                    </h3>

                    <p>
                        Define the overall duration
                        of the learning program.
                    </p>

                </div>


                <div className={styles.formGrid}>

                    <div className={styles.field}>

                        <label>
                            Duration
                        </label>

                        <input
                            type="number"
                            min={1}
                            value={durationValue}
                            onChange={(event) =>
                                setDurationValue(
                                    Number(
                                        event.target.value
                                    )
                                )
                            }
                        />

                    </div>


                    <div className={styles.field}>

                        <label>
                            Duration Unit
                        </label>

                        <select
                            value={durationUnit}
                            onChange={(event) =>
                                handleDurationUnitChange(
                                    event.target.value
                                )
                            }
                        >

                            <option value="days">
                                Days
                            </option>

                            <option value="weeks">
                                Weeks
                            </option>

                            <option value="months">
                                Months
                            </option>

                        </select>

                    </div>


                    <div className={styles.field}>

                        <label>
                            Start Date
                        </label>

                        <input
                            type="date"
                            value={startDate}
                            onChange={(event) =>
                                setStartDate(
                                    event.target.value
                                )
                            }
                        />

                    </div>


                    <div className={styles.field}>

                        <label>
                            Time Zone
                        </label>

                        <select
                            value={timezone}
                            onChange={(event) =>
                                setTimezone(
                                    event.target.value
                                )
                            }
                        >

                            <option value="Asia/Kolkata">
                                India Standard Time
                            </option>

                            <option value="UTC">
                                UTC
                            </option>

                            <option value="America/New_York">
                                Eastern Time
                            </option>

                            <option value="America/Chicago">
                                Central Time
                            </option>

                            <option value="America/Denver">
                                Mountain Time
                            </option>

                            <option value="America/Los_Angeles">
                                Pacific Time
                            </option>

                            <option value="Europe/London">
                                UK Time
                            </option>

                            <option value="Europe/Berlin">
                                Central European Time
                            </option>

                            <option value="Asia/Singapore">
                                Singapore Time
                            </option>

                            <option value="Australia/Sydney">
                                Australian Eastern Time
                            </option>

                        </select>

                    </div>

                </div>

            </div>


            {/* =================================================
                WORKING DAYS
            ================================================= */}

            {deliveryMode !== "self_paced" && (

                <div className={styles.card}>

                    <div
                        className={
                            styles.sectionHeader
                        }
                    >

                        <h3>
                            Working Days
                        </h3>

                        <p>
                            Select the days on which
                            learning activities can
                            be scheduled.
                        </p>

                    </div>


                    <div className={styles.dayGrid}>

                        {days.map(
                            (day) => (

                                <button
                                    type="button"
                                    key={day}
                                    className={
                                        workingDays.includes(
                                            day
                                        )
                                            ? styles.dayActive
                                            : styles.day
                                    }
                                    onClick={() =>
                                        toggleWorkingDay(
                                            day
                                        )
                                    }
                                >
                                    {day}
                                </button>

                            )
                        )}

                    </div>

                </div>

            )}


            {/* =================================================
                DAILY LEARNING TIME
            ================================================= */}

            {deliveryMode !== "self_paced" && (

                <div className={styles.card}>

                    <div
                        className={
                            styles.sectionHeader
                        }
                    >

                        <h3>
                            Daily Learning Time
                        </h3>

                        <p>
                            Define the normal daily
                            delivery window.
                        </p>

                    </div>


                    <div className={styles.formGrid}>

                        <div className={styles.field}>

                            <label>
                                Start Time
                            </label>

                            <input
                                type="time"
                                value={startTime}
                                onChange={(event) =>
                                    setStartTime(
                                        event.target.value
                                    )
                                }
                            />

                        </div>


                        <div className={styles.field}>

                            <label>
                                End Time
                            </label>

                            <input
                                type="time"
                                value={endTime}
                                onChange={(event) =>
                                    setEndTime(
                                        event.target.value
                                    )
                                }
                            />

                        </div>

                    </div>

                </div>

            )}


            {/* =================================================
                DAY-WISE SCHEDULE
            ================================================= */}

            {deliveryMode !== "self_paced" && (

                <div className={styles.card}>

                    <div
                        className={
                            styles.sectionHeaderWithButton
                        }
                    >

                        <div>

                            <h3>
                                Day-wise Schedule
                            </h3>

                            <p>
                                Add specific delivery
                                windows where the
                                default schedule needs
                                to be overridden.
                            </p>

                        </div>


                        <button
                            type="button"
                            className={
                                styles.addButton
                            }
                            onClick={
                                addDaySchedule
                            }
                        >
                            Add Schedule
                        </button>

                    </div>


                    {daySchedules.length === 0 ? (

                        <div
                            className={
                                styles.emptyState
                            }
                        >
                            No custom day schedules
                            configured.
                        </div>

                    ) : (

                        <div
                            className={
                                styles.scheduleList
                            }
                        >

                            {daySchedules.map(
                                (schedule) => (

                                    <div
                                        key={
                                            schedule.id
                                        }
                                        className={
                                            styles.scheduleRow
                                        }
                                    >

                                        <select
                                            value={
                                                schedule.day
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                updateDaySchedule(
                                                    schedule.id,
                                                    "day",
                                                    event.target.value
                                                )
                                            }
                                        >

                                            {days.map(
                                                (day) => (

                                                    <option
                                                        key={
                                                            day
                                                        }
                                                        value={
                                                            day
                                                        }
                                                    >
                                                        {day}
                                                    </option>

                                                )
                                            )}

                                        </select>


                                        <input
                                            type="time"
                                            value={
                                                schedule.startTime
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                updateDaySchedule(
                                                    schedule.id,
                                                    "startTime",
                                                    event.target.value
                                                )
                                            }
                                        />


                                        <input
                                            type="time"
                                            value={
                                                schedule.endTime
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                updateDaySchedule(
                                                    schedule.id,
                                                    "endTime",
                                                    event.target.value
                                                )
                                            }
                                        />


                                        <input
                                            type="number"
                                            min={0}
                                            value={
                                                schedule.breakMinutes
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                updateDaySchedule(
                                                    schedule.id,
                                                    "breakMinutes",
                                                    Number(
                                                        event.target.value
                                                    )
                                                )
                                            }
                                            placeholder="Break"
                                        />


                                        <button
                                            type="button"
                                            className={
                                                styles.removeButton
                                            }
                                            onClick={() =>
                                                removeDaySchedule(
                                                    schedule.id
                                                )
                                            }
                                        >
                                            Remove
                                        </button>

                                    </div>

                                )
                            )}

                        </div>

                    )}

                </div>

            )}


            {/* =================================================
                SUMMARY
            ================================================= */}

            <div
                className={
                    styles.summaryCard
                }
            >

                <div>

                    <span>
                        Duration
                    </span>

                    <strong>
                        {durationValue}{" "}
                        {durationUnit}
                    </strong>

                </div>


                <div>

                    <span>
                        Delivery
                    </span>

                    <strong>
                        {deliveryMode === "self_paced"
                            ? "Self-paced"
                            : deliveryMode === "onsite"
                              ? "On-site"
                              : deliveryMode === "online"
                                ? "Online"
                                : "Hybrid"}
                    </strong>

                </div>

                <div>

                    <span>
                        Content Flow
                    </span>

                    <strong>
                        {formatContentFlowLabel(contentFlow)}
                    </strong>

                </div>


                <div>

                    <span>
                        Working Days
                    </span>

                    <strong>
                        {workingDays.length}
                    </strong>

                </div>


                <div>

                    <span>
                        Time Zone
                    </span>

                    <strong>
                        {timezone}
                    </strong>

                </div>

            </div>


            {/* =================================================
                ACTIONS
            ================================================= */}

            <div className={styles.actions}>

                <button
                    type="button"
                    className={
                        styles.backButton
                    }
                    onClick={onBack}
                >
                    Back
                </button>


                <button
                    type="button"
                    className={
                        styles.nextButton
                    }
                    onClick={handleNext}
                >
                    Save & Continue
                </button>

            </div>

        </div>

    );

}