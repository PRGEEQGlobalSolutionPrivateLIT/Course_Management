"use client";

import { useState } from "react";

import styles from "./AssessmentBuilder.module.css";


/* =========================================================
   PROPS
========================================================= */

type AssessmentBuilderProps = {
    tenant: string;
    role: string;
    courseId: string;
    onBack: () => void;
    onNext: () => void;
};


/* =========================================================
   ASSESSMENT TYPE
========================================================= */

type Assessment = {
    id: string;
    title: string;
    type: string;
    duration: number;
    passingScore: number;
    required: boolean;
};


/* =========================================================
   COMPONENT
========================================================= */

export default function AssessmentBuilder({
    tenant,
    role,
    courseId,
    onBack,
    onNext,
}: AssessmentBuilderProps) {

    const [
        assessments,
        setAssessments,
    ] = useState<Assessment[]>([]);


    const [
        title,
        setTitle,
    ] = useState("");


    const [
        type,
        setType,
    ] = useState("Quiz");


    const [
        duration,
        setDuration,
    ] = useState(30);


    const [
        passingScore,
        setPassingScore,
    ] = useState(50);


    const [
        required,
        setRequired,
    ] = useState(true);


    /* =====================================================
       ADD ASSESSMENT
    ===================================================== */

    function addAssessment() {

        if (!title.trim()) {

            return;

        }


        if (duration <= 0) {

            return;

        }


        if (
            passingScore < 0 ||
            passingScore > 100
        ) {

            return;

        }


        const newAssessment: Assessment = {

            id:
                `ASSESSMENT-${Date.now()}`,

            title:
                title.trim(),

            type,

            duration,

            passingScore,

            required,

        };


        setAssessments(
            (previous) => [
                ...previous,
                newAssessment,
            ]
        );


        setTitle("");

        setType("Quiz");

        setDuration(30);

        setPassingScore(50);

        setRequired(true);

    }


    /* =====================================================
       REMOVE ASSESSMENT
    ===================================================== */

    function removeAssessment(
        id: string
    ) {

        setAssessments(
            (previous) =>
                previous.filter(
                    (item) =>
                        item.id !== id
                )
        );

    }


    /* =====================================================
       CONTINUE
    ===================================================== */

    function handleContinue() {

        /*
         * courseId is intentionally available here.
         *
         * In the next backend implementation,
         * assessments will be persisted against
         * this course ID.
         */

        console.log(
            "Saving assessments for course:",
            courseId
        );


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

                <span className={styles.eyebrow}>
                    STEP 5
                </span>


                <h2>
                    Assessment
                </h2>


                <p>
                    Configure the assessments and
                    evaluation requirements.
                </p>

            </div>


            {/* =================================================
                COURSE CONTEXT
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
                ASSESSMENT FORM
            ================================================= */}

            <div className={styles.formCard}>

                <div className={styles.formGrid}>

                    {/* =========================================
                        TITLE
                    ========================================= */}

                    <div className={styles.field}>

                        <label>
                            Assessment Title
                        </label>

                        <input
                            type="text"
                            value={title}
                            onChange={(event) =>
                                setTitle(
                                    event.target.value
                                )
                            }
                            placeholder="Enter assessment title"
                        />

                    </div>


                    {/* =========================================
                        TYPE
                    ========================================= */}

                    <div className={styles.field}>

                        <label>
                            Assessment Type
                        </label>

                        <select
                            value={type}
                            onChange={(event) =>
                                setType(
                                    event.target.value
                                )
                            }
                        >

                            <option value="Quiz">
                                Quiz
                            </option>

                            <option value="Assignment">
                                Assignment
                            </option>

                            <option value="Project">
                                Project
                            </option>

                            <option value="Coding Assessment">
                                Coding Assessment
                            </option>

                            <option value="Practical Assessment">
                                Practical Assessment
                            </option>

                            <option value="Case Study">
                                Case Study
                            </option>

                            <option value="Final Assessment">
                                Final Assessment
                            </option>

                        </select>

                    </div>


                    {/* =========================================
                        DURATION
                    ========================================= */}

                    <div className={styles.field}>

                        <label>
                            Duration (minutes)
                        </label>

                        <input
                            type="number"
                            min={1}
                            value={duration}
                            onChange={(event) =>
                                setDuration(
                                    Number(
                                        event.target.value
                                    )
                                )
                            }
                        />

                    </div>


                    {/* =========================================
                        PASSING SCORE
                    ========================================= */}

                    <div className={styles.field}>

                        <label>
                            Passing Score (%)
                        </label>

                        <input
                            type="number"
                            min={0}
                            max={100}
                            value={passingScore}
                            onChange={(event) =>
                                setPassingScore(
                                    Number(
                                        event.target.value
                                    )
                                )
                            }
                        />

                    </div>

                </div>


                {/* =================================================
                    REQUIRED
                ================================================= */}

                <label className={styles.checkbox}>

                    <input
                        type="checkbox"
                        checked={required}
                        onChange={(event) =>
                            setRequired(
                                event.target.checked
                            )
                        }
                    />

                    <span>
                        Required Assessment
                    </span>

                </label>


                {/* =================================================
                    ADD
                ================================================= */}

                <button
                    type="button"
                    className={styles.addButton}
                    onClick={addAssessment}
                >
                    Add Assessment
                </button>

            </div>


            {/* =================================================
                CONFIGURED ASSESSMENTS
            ================================================= */}

            <div className={styles.formCard}>

                <h3>
                    Configured Assessments
                </h3>


                {assessments.length === 0 ? (

                    <div
                        className={
                            styles.emptyState
                        }
                    >
                        No assessments configured.
                    </div>

                ) : (

                    <div className={styles.list}>

                        {assessments.map(
                            (
                                assessment,
                                index
                            ) => (

                                <div
                                    key={
                                        assessment.id
                                    }
                                    className={
                                        styles.item
                                    }
                                >

                                    <div
                                        className={
                                            styles.number
                                        }
                                    >
                                        {index + 1}
                                    </div>


                                    <div
                                        className={
                                            styles.itemInfo
                                        }
                                    >

                                        <strong>
                                            {
                                                assessment.title
                                            }
                                        </strong>

                                        <span>
                                            {
                                                assessment.type
                                            }
                                        </span>

                                    </div>


                                    <span>
                                        {
                                            assessment.duration
                                        }{" "}
                                        min
                                    </span>


                                    <span>
                                        Pass:{" "}
                                        {
                                            assessment.passingScore
                                        }%
                                    </span>


                                    <span>
                                        {
                                            assessment.required
                                                ? "Required"
                                                : "Optional"
                                        }
                                    </span>


                                    <button
                                        type="button"
                                        className={
                                            styles.removeButton
                                        }
                                        onClick={() =>
                                            removeAssessment(
                                                assessment.id
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
                    onClick={
                        handleContinue
                    }
                >
                    Continue
                </button>

            </div>

        </div>

    );

}