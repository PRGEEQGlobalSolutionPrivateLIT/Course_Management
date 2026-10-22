"use client";

import { useEffect, useState } from "react";

import {
    getCourseDraft,
    saveCourseDraft,
} from "@/services/course-draft.service";

import styles from "./EnrollmentBuilder.module.css";


/* =========================================================
   PROPS
========================================================= */

type EnrollmentBuilderProps = {
    tenant: string;
    role: string;
    courseId: string;
    onBack: () => void;
    onNext: () => void;
};


/* =========================================================
   ENROLLMENT MODE
========================================================= */

type EnrollmentMode =
    | "open"
    | "approval"
    | "invitation"
    | "assigned";


/* =========================================================
   COMPONENT
========================================================= */

export default function EnrollmentBuilder({
    tenant,
    role,
    courseId,
    onBack,
    onNext,
}: EnrollmentBuilderProps) {

    const [mode, setMode] =
        useState<EnrollmentMode>("approval");


    const [capacity, setCapacity] =
        useState(30);


    const [waitlistEnabled, setWaitlistEnabled] =
        useState(true);


    const [enrollmentStart, setEnrollmentStart] =
        useState("");


    const [enrollmentEnd, setEnrollmentEnd] =
        useState("");


    const [eligibility, setEligibility] =
        useState("All eligible learners");


    /* =====================================================
       LOAD SAVED ENROLLMENT DATA

       Restore Step 8 whenever the user returns to this
       step after completing later steps.
    ===================================================== */

    useEffect(() => {
        if (!courseId) {
            return;
        }

        const draft =
            getCourseDraft(courseId);

        if (!draft) {
            return;
        }

        const savedEnrollment = (
            draft as typeof draft & {
                enrollment?: {
                    mode?: string;
                    capacity?: number;
                    waitlistEnabled?: boolean;
                    enrollmentStart?: string;
                    enrollmentEnd?: string;
                    eligibility?: string;
                };
            }
        ).enrollment;

        if (!savedEnrollment) {
            return;
        }

        if (
            savedEnrollment.mode === "open" ||
            savedEnrollment.mode === "approval" ||
            savedEnrollment.mode === "invitation" ||
            savedEnrollment.mode === "assigned"
        ) {
            setMode(
                savedEnrollment.mode
            );
        }

        if (
            typeof savedEnrollment.capacity ===
            "number"
        ) {
            setCapacity(
                savedEnrollment.capacity
            );
        }

        if (
            typeof savedEnrollment.waitlistEnabled ===
            "boolean"
        ) {
            setWaitlistEnabled(
                savedEnrollment.waitlistEnabled
            );
        }

        if (
            typeof savedEnrollment.enrollmentStart ===
            "string"
        ) {
            setEnrollmentStart(
                savedEnrollment.enrollmentStart
            );
        }

        if (
            typeof savedEnrollment.enrollmentEnd ===
            "string"
        ) {
            setEnrollmentEnd(
                savedEnrollment.enrollmentEnd
            );
        }

        if (
            typeof savedEnrollment.eligibility ===
            "string"
        ) {
            setEligibility(
                savedEnrollment.eligibility
            );
        }
    }, [courseId]);


    /*
     * Persist Step 8 changes into the SAME course draft.
     *
     * The guard prevents the initial default state from
     * overwriting an existing saved enrollment configuration
     * before it has been restored.
     */
    useEffect(() => {
        if (!courseId) {
            return;
        }

        const draft =
            getCourseDraft(courseId);

        if (!draft) {
            return;
        }

        const savedEnrollment = (
            draft as typeof draft & {
                enrollment?: {
                    mode?: string;
                    capacity?: number;
                    waitlistEnabled?: boolean;
                    enrollmentStart?: string;
                    enrollmentEnd?: string;
                    eligibility?: string;
                };
            }
        ).enrollment;

        if (
            savedEnrollment &&
            mode === "approval" &&
            capacity === 30 &&
            waitlistEnabled === true &&
            enrollmentStart === "" &&
            enrollmentEnd === "" &&
            eligibility === "All eligible learners"
        ) {
            return;
        }

        saveCourseDraft({
            ...draft,
            enrollment: {
                mode,
                capacity,
                waitlistEnabled,
                enrollmentStart,
                enrollmentEnd,
                eligibility,
            },
            updatedAt:
                new Date().toISOString(),
        });
    }, [
        courseId,
        mode,
        capacity,
        waitlistEnabled,
        enrollmentStart,
        enrollmentEnd,
        eligibility,
    ]);


    /* =====================================================
       SAVE & CONTINUE
    ===================================================== */

    function handleNext() {
        if (!courseId) {
            console.error(
                "Cannot save Enrollment: courseId is missing."
            );
            return;
        }

        const draft =
            getCourseDraft(courseId);

        if (!draft) {
            console.error(
                "Cannot save Enrollment: course draft not found.",
                courseId
            );
            return;
        }

        const updatedDraft = {
            ...draft,

            enrollment: {
                mode,
                capacity,
                waitlistEnabled,
                enrollmentStart,
                enrollmentEnd,
                eligibility,
            },

            /*
             * Enrollment is Step 8.
             * Never reduce the highest completed step when
             * the user returns to edit this step later.
             */
            currentStep:
                Math.max(
                    draft.currentStep ?? 0,
                    8
                ),

            completedThroughStep:
                Math.max(
                    draft.completedThroughStep ?? 0,
                    8
                ),

            updatedAt:
                new Date().toISOString(),
        };

        saveCourseDraft(
            updatedDraft
        );

        console.log(
            "Saved enrollment configuration for course:",
            courseId
        );

        onNext();
    }


    return (

        <div className={styles.container}>

            {/* =================================================
                HEADER
            ================================================= */}

            <div className={styles.header}>

                <div>

                    <span className={styles.eyebrow}>
                        Step 8
                    </span>

                    <h2>
                        Enrollment
                    </h2>

                    <p>
                        Configure learner eligibility,
                        enrollment rules, capacity,
                        and access settings.
                    </p>

                </div>

            </div>


            {/* =================================================
                CONTEXT
            ================================================= */}

            <div className={styles.contextCard}>

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
                ENROLLMENT MODE
            ================================================= */}

            <div className={styles.card}>

                <div className={styles.sectionHeader}>

                    <h3>
                        Enrollment Method
                    </h3>

                    <p>
                        Define how learners enter
                        this learning program.
                    </p>

                </div>


                <div className={styles.modeGrid}>

                    <button
                        type="button"
                        className={
                            mode === "open"
                                ? styles.modeActive
                                : styles.mode
                        }
                        onClick={() =>
                            setMode("open")
                        }
                    >

                        <strong>
                            Open Enrollment
                        </strong>

                        <span>
                            Eligible learners can
                            enroll directly.
                        </span>

                    </button>


                    <button
                        type="button"
                        className={
                            mode === "approval"
                                ? styles.modeActive
                                : styles.mode
                        }
                        onClick={() =>
                            setMode("approval")
                        }
                    >

                        <strong>
                            Approval Required
                        </strong>

                        <span>
                            Enrollment requires
                            approval.
                        </span>

                    </button>


                    <button
                        type="button"
                        className={
                            mode === "invitation"
                                ? styles.modeActive
                                : styles.mode
                        }
                        onClick={() =>
                            setMode("invitation")
                        }
                    >

                        <strong>
                            Invitation
                        </strong>

                        <span>
                            Learners join through
                            invitations.
                        </span>

                    </button>


                    <button
                        type="button"
                        className={
                            mode === "assigned"
                                ? styles.modeActive
                                : styles.mode
                        }
                        onClick={() =>
                            setMode("assigned")
                        }
                    >

                        <strong>
                            Assigned
                        </strong>

                        <span>
                            Learners are assigned
                            by an authorized user.
                        </span>

                    </button>

                </div>

            </div>


            {/* =================================================
                ELIGIBILITY AND CAPACITY
            ================================================= */}

            <div className={styles.card}>

                <div className={styles.sectionHeader}>

                    <h3>
                        Eligibility & Capacity
                    </h3>

                    <p>
                        Define who can enroll and
                        how many learners can join.
                    </p>

                </div>


                <div className={styles.formGrid}>

                    <div className={styles.field}>

                        <label>
                            Eligibility
                        </label>

                        <select
                            value={eligibility}
                            onChange={(event) =>
                                setEligibility(
                                    event.target.value
                                )
                            }
                        >

                            <option>
                                All eligible learners
                            </option>

                            <option>
                                Specific program learners
                            </option>

                            <option>
                                Specific department
                            </option>

                            <option>
                                Specific cohort
                            </option>

                            <option>
                                Invitation only
                            </option>

                        </select>

                    </div>


                    <div className={styles.field}>

                        <label>
                            Maximum Capacity
                        </label>

                        <input
                            type="number"
                            min={1}
                            value={capacity}
                            onChange={(event) =>
                                setCapacity(
                                    Number(
                                        event.target.value
                                    )
                                )
                            }
                        />

                    </div>


                    <div className={styles.field}>

                        <label>
                            Enrollment Start
                        </label>

                        <input
                            type="date"
                            value={enrollmentStart}
                            onChange={(event) =>
                                setEnrollmentStart(
                                    event.target.value
                                )
                            }
                        />

                    </div>


                    <div className={styles.field}>

                        <label>
                            Enrollment End
                        </label>

                        <input
                            type="date"
                            value={enrollmentEnd}
                            onChange={(event) =>
                                setEnrollmentEnd(
                                    event.target.value
                                )
                            }
                        />

                    </div>

                </div>

            </div>


            {/* =================================================
                WAITLIST
            ================================================= */}

            <div className={styles.card}>

                <div className={styles.optionRow}>

                    <div>

                        <h3>
                            Waitlist
                        </h3>

                        <p>
                            Allow additional learners
                            to join a waitlist when
                            the course reaches capacity.
                        </p>

                    </div>


                    <button
                        type="button"
                        className={`
                            ${styles.toggle}
                            ${
                                waitlistEnabled
                                    ? styles.toggleActive
                                    : ""
                            }
                        `}
                        onClick={() =>
                            setWaitlistEnabled(
                                (previous) =>
                                    !previous
                            )
                        }
                    >

                        <span />

                    </button>

                </div>

            </div>


            {/* =================================================
                SUMMARY
            ================================================= */}

            <div className={styles.summaryCard}>

                <div>

                    <span>
                        Enrollment
                    </span>

                    <strong>
                        {mode}
                    </strong>

                </div>


                <div>

                    <span>
                        Capacity
                    </span>

                    <strong>
                        {capacity}
                    </strong>

                </div>


                <div>

                    <span>
                        Eligibility
                    </span>

                    <strong>
                        Configured
                    </strong>

                </div>


                <div>

                    <span>
                        Waitlist
                    </span>

                    <strong>
                        {waitlistEnabled
                            ? "Enabled"
                            : "Disabled"}
                    </strong>

                </div>

            </div>


            {/* =================================================
                ACTIONS
            ================================================= */}

            <div className={styles.actions}>

                <button
                    type="button"
                    className={styles.backButton}
                    onClick={onBack}
                >
                    Back
                </button>


                <button
                    type="button"
                    className={styles.nextButton}
                    onClick={handleNext}
                >
                    Save & Continue
                </button>

            </div>

        </div>

    );

}