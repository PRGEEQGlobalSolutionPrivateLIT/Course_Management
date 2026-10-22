"use client";

import { useEffect, useState } from "react";

import {
    getCourseDraft,
    saveCourseDraft,
} from "@/services/course-draft.service";

import styles from "./OutcomesBuilder.module.css";


/* =========================================================
   OUTCOME
========================================================= */

type Outcome = {
    id: string;
    code: string;
    description: string;
    skills: string[];
    required: boolean;
};


/* =========================================================
   PROPS
========================================================= */

type OutcomesBuilderProps = {
    tenant: string;
    role: string;
    courseId: string;
    onBack: () => void;
    onNext: () => void;
};


/* =========================================================
   TENANT TERMINOLOGY
========================================================= */

const terminology: Record<
    string,
    {
        title: string;
        singular: string;
        plural: string;
        skillLabel: string;
    }
> = {

    university: {
        title: "Course Outcomes",
        singular: "Course Outcome",
        plural: "Course Outcomes",
        skillLabel: "Skills",
    },

    corporate: {
        title: "Competencies & Outcomes",
        singular: "Competency",
        plural: "Competencies",
        skillLabel: "Skills",
    },

    skill_academy: {
        title: "Skills & Competencies",
        singular: "Skill",
        plural: "Skills",
        skillLabel: "Competencies",
    },

    bootcamp: {
        title: "Learning Outcomes & Skills",
        singular: "Learning Outcome",
        plural: "Learning Outcomes",
        skillLabel: "Skills",
    },

    ngo: {
        title: "Program Learning Outcomes",
        singular: "Learning Outcome",
        plural: "Learning Outcomes",
        skillLabel: "Skills",
    },

    government: {
        title: "Competencies & Learning Outcomes",
        singular: "Competency",
        plural: "Competencies",
        skillLabel: "Skills",
    },

};


/* =========================================================
   COMPONENT
========================================================= */

export default function OutcomesBuilder({
    tenant,
    role,
    courseId,
    onBack,
    onNext,
}: OutcomesBuilderProps) {

    const config =
        terminology[tenant] ??
        terminology.university;


    /* =====================================================
       OUTCOMES
    ===================================================== */

    const [
        outcomes,
        setOutcomes,
    ] = useState<Outcome[]>([]);


    /* =====================================================
       FORM
    ===================================================== */

    const [
        code,
        setCode,
    ] = useState("");


    const [
        description,
        setDescription,
    ] = useState("");


    const [
        skills,
        setSkills,
    ] = useState("");


    const [
        required,
        setRequired,
    ] = useState(true);


    const [
        error,
        setError,
    ] = useState("");


    /* =====================================================
       LOAD SAVED OUTCOMES

       Restore Step 2 data whenever the user opens or
       returns to this step.
    ===================================================== */

    useEffect(() => {
        const draft =
            getCourseDraft(courseId);

        if (!draft) {
            return;
        }

        const savedOutcomes =
            Array.isArray(draft.outcomes)
                ? draft.outcomes
                : [];

        setOutcomes(
            savedOutcomes as Outcome[]
        );
    }, [courseId]);


    /* =====================================================
       ADD OUTCOME
    ===================================================== */

    function addOutcome() {

        setError("");


        if (!code.trim()) {

            setError(
                `${config.singular} code is required.`
            );

            return;
        }


        if (!description.trim()) {

            setError(
                `${config.singular} description is required.`
            );

            return;
        }


        const newOutcome: Outcome = {

            id:
                `OUT-${Date.now()}`,

            code:
                code.trim(),

            description:
                description.trim(),

            skills:
                skills
                    .split(",")
                    .map(
                        (item) =>
                            item.trim()
                    )
                    .filter(Boolean),

            required,

        };


        setOutcomes(
            (previous) => [

                ...previous,

                newOutcome,

            ]
        );


        setCode("");

        setDescription("");

        setSkills("");

        setRequired(true);

    }


    /* =====================================================
       REMOVE OUTCOME
    ===================================================== */

    function removeOutcome(
        id: string
    ) {

        setOutcomes(
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

    function handleNext() {

        setError("");


        if (outcomes.length === 0) {

            setError(
                `Add at least one ${config.singular.toLowerCase()}.`
            );

            return;
        }


        /*
         * Update the existing course draft.
         *
         * All wizard steps use the same courseId and the
         * same draft record. Do not create a separate
         * legacy "active draft" here.
         */

        const existingDraft =
            getCourseDraft(courseId);

        if (!existingDraft) {
            setError(
                "Course draft could not be found. Please restart the course creation."
            );

            return;
        }

        const updatedDraft = {
            ...existingDraft,

            courseId,

            tenant,

            role,

            outcomes: [
                ...outcomes,
            ],

            /*
             * Step 2 is complete after the save.
             *
             * Math.max prevents progress from being reduced
             * when the user returns later to edit Step 2.
             */
            currentStep:
                Math.max(
                    existingDraft.currentStep ?? 0,
                    2
                ),

            completedThroughStep:
                Math.max(
                    existingDraft.completedThroughStep ?? 0,
                    2
                ),

            updatedAt:
                new Date().toISOString(),
        };

        saveCourseDraft(
            updatedDraft
        );

        console.log(
            "Saved outcomes for course:",
            courseId
        );

        /*
         * Move forward only after the draft has been saved.
         */
        onNext();

    }


    /* =====================================================
       RENDER
    ===================================================== */

    return (

        <div className={styles.container}>

            {/* =================================================
                STEP HEADER
            ================================================= */}

            <header
                className={styles.heading}
            >

                <div
                    className={styles.stepLabel}
                >

                    <span
                        className={styles.stepNumber}
                    >
                        2
                    </span>

                    <span>
                        Step 2
                    </span>

                </div>


                <h2>
                    {config.title}
                </h2>


                <p>
                    Define the key outcomes and skills
                    for this learning offering.
                </p>

            </header>


            {/* =================================================
                ERROR
            ================================================= */}

            {error && (

                <div
                    className={styles.error}
                    role="alert"
                >

                    <span
                        className={styles.errorIcon}
                    >
                        !
                    </span>

                    <span>
                        {error}
                    </span>

                </div>

            )}


            {/* =================================================
                ADD OUTCOME
            ================================================= */}

            <section
                className={styles.formCard}
            >

                <div
                    className={styles.sectionHeader}
                >

                    <div>

                        <h3>
                            Add {config.singular}
                        </h3>

                        <p>
                            Define the outcome and associated skills.
                        </p>

                    </div>

                </div>


                <div
                    className={styles.grid}
                >

                    {/* =================================================
                        CODE
                    ================================================= */}

                    <div
                        className={styles.field}
                    >

                        <label
                            htmlFor="outcomeCode"
                        >
                            Code
                            <span className={styles.required}>
                                *
                            </span>
                        </label>


                        <input
                            id="outcomeCode"
                            type="text"
                            value={code}
                            onChange={(event) =>
                                setCode(
                                    event.target.value
                                )
                            }
                            placeholder={
                                tenant === "university"
                                    ? "CO1"
                                    : "C1"
                            }
                        />

                    </div>


                    {/* =================================================
                        DESCRIPTION
                    ================================================= */}

                    <div
                        className={styles.field}
                    >

                        <label
                            htmlFor="outcomeDescription"
                        >
                            {config.singular}
                            <span className={styles.required}>
                                *
                            </span>
                        </label>


                        <input
                            id="outcomeDescription"
                            type="text"
                            value={description}
                            onChange={(event) =>
                                setDescription(
                                    event.target.value
                                )
                            }
                            placeholder={
                                `Describe the ${config.singular.toLowerCase()}`
                            }
                        />

                    </div>


                    {/* =================================================
                        SKILLS
                    ================================================= */}

                    <div
                        className={`
                            ${styles.field}
                            ${styles.fullWidth}
                        `}
                    >

                        <label
                            htmlFor="outcomeSkills"
                        >
                            {config.skillLabel}
                        </label>


                        <input
                            id="outcomeSkills"
                            type="text"
                            value={skills}
                            onChange={(event) =>
                                setSkills(
                                    event.target.value
                                )
                            }
                            placeholder="Enter skills separated by commas"
                        />

                        <span
                            className={styles.helperText}
                        >
                            Separate multiple skills with commas.
                        </span>

                    </div>


                    {/* =================================================
                        REQUIRED
                    ================================================= */}

                    <div
                        className={styles.checkboxField}
                    >

                        <input
                            id="required"
                            type="checkbox"
                            checked={required}
                            onChange={(event) =>
                                setRequired(
                                    event.target.checked
                                )
                            }
                        />


                        <label
                            htmlFor="required"
                        >
                            Required
                        </label>

                    </div>

                </div>


                <div
                    className={styles.formActions}
                >

                    <button
                        type="button"
                        className={styles.addButton}
                        onClick={addOutcome}
                    >
                        + Add {config.singular}
                    </button>

                </div>

            </section>


            {/* =================================================
                OUTCOME LIST
            ================================================= */}

            <section
                className={styles.listCard}
            >

                <div
                    className={styles.listHeader}
                >

                    <div>

                        <h3>
                            {config.plural}
                        </h3>

                        <p>
                            Review the outcomes added to this offering.
                        </p>

                    </div>


                    <span
                        className={styles.count}
                    >
                        {outcomes.length}
                    </span>

                </div>


                {outcomes.length === 0 ? (

                    <div
                        className={styles.empty}
                    >

                        <div
                            className={styles.emptyIcon}
                        >
                            +
                        </div>

                        <strong>
                            No {config.plural.toLowerCase()} added
                        </strong>

                        <span>
                            Add your first {config.singular.toLowerCase()}
                            using the form above.
                        </span>

                    </div>

                ) : (

                    <div
                        className={styles.outcomeList}
                    >

                        {outcomes.map(
                            (outcome) => (

                                <article
                                    key={outcome.id}
                                    className={styles.outcomeItem}
                                >

                                    <div
                                        className={
                                            styles.outcomeMain
                                        }
                                    >

                                        <div
                                            className={
                                                styles.outcomeTop
                                            }
                                        >

                                            <span
                                                className={
                                                    styles.outcomeCode
                                                }
                                            >
                                                {outcome.code}
                                            </span>


                                            {outcome.required && (

                                                <span
                                                    className={
                                                        styles.requiredBadge
                                                    }
                                                >
                                                    Required
                                                </span>

                                            )}

                                        </div>


                                        <p>
                                            {
                                                outcome.description
                                            }
                                        </p>


                                        {outcome.skills.length > 0 && (

                                            <div
                                                className={
                                                    styles.skills
                                                }
                                            >

                                                {outcome.skills.map(
                                                    (
                                                        skill,
                                                        index
                                                    ) => (

                                                        <span
                                                            key={`${skill}-${index}`}
                                                        >
                                                            {skill}
                                                        </span>

                                                    )
                                                )}

                                            </div>

                                        )}

                                    </div>


                                    <button
                                        type="button"
                                        className={
                                            styles.removeButton
                                        }
                                        onClick={() =>
                                            removeOutcome(
                                                outcome.id
                                            )
                                        }
                                    >
                                        Remove
                                    </button>

                                </article>

                            )
                        )}

                    </div>

                )}

            </section>


            {/* =================================================
                ACTIONS
            ================================================= */}

            <div
                className={styles.actions}
            >

                <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={onBack}
                >
                    Back
                </button>


                <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={handleNext}
                >
                    Save & Continue
                </button>

            </div>

        </div>

    );

}