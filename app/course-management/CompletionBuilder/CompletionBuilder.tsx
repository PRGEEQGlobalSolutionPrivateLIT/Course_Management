"use client";

import { useEffect, useState } from "react";

import {
    getCourseDraft,
    saveCourseDraft,
} from "@/services/course-draft.service";

import styles from "./CompletionBuilder.module.css";


/* =========================================================
   PROPS
========================================================= */

type CompletionBuilderProps = {
    tenant: string;
    role: string;
    courseId: string;
    onBack: () => void;
    onNext: () => void;
};


/* =========================================================
   COMPLETION RULE
========================================================= */

type CompletionRule = {
    id: string;
    title: string;
    description: string;
    enabled: boolean;
};


/* =========================================================
   COMPONENT
========================================================= */

export default function CompletionBuilder({
    tenant,
    role,
    courseId,
    onBack,
    onNext,
}: CompletionBuilderProps) {

    const [rules, setRules] =
        useState<CompletionRule[]>([

            {
                id: "content",
                title: "Learning Content Completion",
                description:
                    "Learner must complete the required learning content.",
                enabled: true,
            },

            {
                id: "attendance",
                title: "Attendance Requirement",
                description:
                    "Learner must meet the configured attendance requirement.",
                enabled: true,
            },

            {
                id: "assessment",
                title: "Assessment Requirement",
                description:
                    "Learner must complete the required assessments.",
                enabled: true,
            },

            {
                id: "passing",
                title: "Passing Score Requirement",
                description:
                    "Learner must achieve the configured passing score.",
                enabled: true,
            },

        ]);


    const [
        attendancePercentage,
        setAttendancePercentage,
    ] = useState(75);


    const [
        passingPercentage,
        setPassingPercentage,
    ] = useState(50);


    const [
        certificateEnabled,
        setCertificateEnabled,
    ] = useState(true);


    /* =====================================================
       LOAD SAVED COMPLETION DATA

       Restore Step 9 whenever the user returns to this
       step after completing or reviewing later stages.
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

        const savedCompletion = (
            draft as typeof draft & {
                completion?: {
                    rules?: CompletionRule[];
                    attendancePercentage?: number;
                    passingPercentage?: number;
                    certificateEnabled?: boolean;
                };
            }
        ).completion;

        if (!savedCompletion) {
            return;
        }

        if (
            Array.isArray(
                savedCompletion.rules
            )
        ) {
            setRules(
                savedCompletion.rules as CompletionRule[]
            );
        }

        if (
            typeof savedCompletion.attendancePercentage ===
            "number"
        ) {
            setAttendancePercentage(
                savedCompletion.attendancePercentage
            );
        }

        if (
            typeof savedCompletion.passingPercentage ===
            "number"
        ) {
            setPassingPercentage(
                savedCompletion.passingPercentage
            );
        }

        if (
            typeof savedCompletion.certificateEnabled ===
            "boolean"
        ) {
            setCertificateEnabled(
                savedCompletion.certificateEnabled
            );
        }
    }, [courseId]);


    /*
     * Persist Step 9 changes to the SAME course draft.
     *
     * The guard prevents the initial default state from
     * overwriting an already saved completion configuration
     * before it is restored by the load effect.
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

        const savedCompletion = (
            draft as typeof draft & {
                completion?: {
                    rules?: CompletionRule[];
                    attendancePercentage?: number;
                    passingPercentage?: number;
                    certificateEnabled?: boolean;
                };
            }
        ).completion;

        if (
            savedCompletion &&
            rules.length === 4 &&
            attendancePercentage === 75 &&
            passingPercentage === 50 &&
            certificateEnabled === true
        ) {
            return;
        }

        saveCourseDraft({
            ...draft,
            completion: {
                rules: [...rules],
                attendancePercentage,
                passingPercentage,
                certificateEnabled,
            },
            updatedAt:
                new Date().toISOString(),
        });
    }, [
        courseId,
        rules,
        attendancePercentage,
        passingPercentage,
        certificateEnabled,
    ]);


    /* =====================================================
       TOGGLE RULE
    ===================================================== */

    function toggleRule(
        id: string
    ) {

        setRules(
            (previous) =>
                previous.map(
                    (rule) =>
                        rule.id === id
                            ? {
                                ...rule,
                                enabled:
                                    !rule.enabled,
                            }
                            : rule
                )
        );

    }


    /* =====================================================
       CONTINUE
    ===================================================== */

    function handleContinue() {
        if (!courseId) {
            console.error(
                "Cannot save Completion: courseId is missing."
            );
            return;
        }

        const draft =
            getCourseDraft(courseId);

        if (!draft) {
            console.error(
                "Cannot save Completion: course draft not found.",
                courseId
            );
            return;
        }

        const updatedDraft = {
            ...draft,

            completion: {
                rules: [...rules],
                attendancePercentage,
                passingPercentage,
                certificateEnabled,
            },

            /*
             * Completion is Step 9.
             * Never reduce completed progress when the user
             * returns to edit this step later.
             */
            currentStep:
                Math.max(
                    draft.currentStep ?? 0,
                    9
                ),

            completedThroughStep:
                Math.max(
                    draft.completedThroughStep ?? 0,
                    9
                ),

            updatedAt:
                new Date().toISOString(),
        };

        saveCourseDraft(
            updatedDraft
        );

        console.log(
            "Saved completion configuration for course:",
            courseId
        );

        /*
         * Move to Review only after the completion data
         * has been saved into the same course draft.
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

                    <span className={styles.eyebrow}>
                        Step 9
                    </span>

                    <h2>
                        Completion
                    </h2>

                    <p>
                        Define the requirements a
                        learner must satisfy to
                        complete the learning program.
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
                COMPLETION RULES
            ================================================= */}

            <div className={styles.card}>

                <div className={styles.sectionHeader}>

                    <div>

                        <h3>
                            Completion Rules
                        </h3>

                        <p>
                            Select the conditions that
                            must be satisfied before the
                            learner is marked complete.
                        </p>

                    </div>

                </div>


                <div className={styles.rules}>

                    {rules.map(
                        (rule) => (

                            <div
                                key={rule.id}
                                className={
                                    styles.rule
                                }
                            >

                                <div
                                    className={
                                        styles.ruleInfo
                                    }
                                >

                                    <h4>
                                        {rule.title}
                                    </h4>

                                    <p>
                                        {
                                            rule.description
                                        }
                                    </p>

                                </div>


                                <button
                                    type="button"
                                    className={`
                                        ${styles.toggle}
                                        ${
                                            rule.enabled
                                                ? styles.toggleActive
                                                : ""
                                        }
                                    `}
                                    onClick={() =>
                                        toggleRule(
                                            rule.id
                                        )
                                    }
                                    aria-label={
                                        `Toggle ${rule.title}`
                                    }
                                >

                                    <span />

                                </button>

                            </div>

                        )
                    )}

                </div>

            </div>


            {/* =================================================
                THRESHOLDS
            ================================================= */}

            <div className={styles.card}>

                <div className={styles.sectionHeader}>

                    <div>

                        <h3>
                            Completion Thresholds
                        </h3>

                        <p>
                            Configure the minimum
                            requirements for successful
                            completion.
                        </p>

                    </div>

                </div>


                <div className={styles.formGrid}>

                    <div className={styles.field}>

                        <label>
                            Minimum Attendance (%)
                        </label>

                        <input
                            type="number"
                            min={0}
                            max={100}
                            value={
                                attendancePercentage
                            }
                            onChange={(event) =>
                                setAttendancePercentage(
                                    Number(
                                        event.target.value
                                    )
                                )
                            }
                        />

                        <span
                            className={
                                styles.helpText
                            }
                        >
                            Minimum attendance required
                            for completion.
                        </span>

                    </div>


                    <div className={styles.field}>

                        <label>
                            Minimum Passing Score (%)
                        </label>

                        <input
                            type="number"
                            min={0}
                            max={100}
                            value={
                                passingPercentage
                            }
                            onChange={(event) =>
                                setPassingPercentage(
                                    Number(
                                        event.target.value
                                    )
                                )
                            }
                        />

                        <span
                            className={
                                styles.helpText
                            }
                        >
                            Minimum assessment score
                            required for completion.
                        </span>

                    </div>

                </div>

            </div>


            {/* =================================================
                CERTIFICATE
            ================================================= */}

            <div className={styles.card}>

                <div className={styles.certificateRow}>

                    <div>

                        <h3>
                            Completion Certificate
                        </h3>

                        <p>
                            Issue a certificate when
                            all completion requirements
                            have been satisfied.
                        </p>

                    </div>


                    <button
                        type="button"
                        className={`
                            ${styles.toggle}
                            ${
                                certificateEnabled
                                    ? styles.toggleActive
                                    : ""
                            }
                        `}
                        onClick={() =>
                            setCertificateEnabled(
                                (previous) =>
                                    !previous
                            )
                        }
                        aria-label={
                            "Toggle completion certificate"
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
                        Active Rules
                    </span>

                    <strong>
                        {
                            rules.filter(
                                (rule) =>
                                    rule.enabled
                            ).length
                        }
                    </strong>

                </div>


                <div>

                    <span>
                        Attendance
                    </span>

                    <strong>
                        {attendancePercentage}%
                    </strong>

                </div>


                <div>

                    <span>
                        Passing Score
                    </span>

                    <strong>
                        {passingPercentage}%
                    </strong>

                </div>


                <div>

                    <span>
                        Certificate
                    </span>

                    <strong>
                        {certificateEnabled
                            ? "Enabled"
                            : "Disabled"}
                    </strong>

                </div>

            </div>


            {/* =================================================
                NAVIGATION
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
                    onClick={handleContinue}
                >
                    Save & Continue
                </button>

            </div>

        </div>

    );

}