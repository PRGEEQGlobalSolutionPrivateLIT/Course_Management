"use client";

import { useState } from "react";

import styles from "./ContentBuilder.module.css";


/* =========================================================
   PROPS
========================================================= */

type ContentBuilderProps = {
    tenant: string;
    role: string;
    courseId: string;
    onBack: () => void;
    onNext: () => void;
};


/* =========================================================
   CONTENT TYPE
========================================================= */

type ContentType =
    | "video"
    | "document"
    | "presentation"
    | "reading"
    | "link"
    | "interactive"
    | "lab";


/* =========================================================
   CONTENT ITEM
========================================================= */

type ContentItem = {
    id: string;
    title: string;
    type: ContentType;
    duration: number;
    required: boolean;
};


/* =========================================================
   CONTENT TYPES
========================================================= */

const contentTypes: {
    value: ContentType;
    label: string;
}[] = [

    {
        value: "video",
        label: "Video",
    },

    {
        value: "document",
        label: "Document",
    },

    {
        value: "presentation",
        label: "Presentation",
    },

    {
        value: "reading",
        label: "Reading",
    },

    {
        value: "link",
        label: "External Resource",
    },

    {
        value: "interactive",
        label: "Interactive Activity",
    },

    {
        value: "lab",
        label: "Lab / Practice",
    },

];


/* =========================================================
   COMPONENT
========================================================= */

export default function ContentBuilder({
    tenant,
    role,
    courseId,
    onBack,
    onNext,
}: ContentBuilderProps) {

    const [items, setItems] =
        useState<ContentItem[]>([]);


    const [title, setTitle] =
        useState("");


    const [type, setType] =
        useState<ContentType>("video");


    const [duration, setDuration] =
        useState(30);


    const [required, setRequired] =
        useState(true);


    /* =====================================================
       ADD CONTENT
    ===================================================== */

    function addContent() {

        if (!title.trim()) {
            return;
        }


        const item: ContentItem = {

            id:
                `CONTENT-${Date.now()}`,

            title:
                title.trim(),

            type,

            duration,

            required,

        };


        setItems(
            (previous) => [

                ...previous,

                item,

            ]
        );


        setTitle("");

        setDuration(30);

        setRequired(true);

    }


    /* =====================================================
       REMOVE CONTENT
    ===================================================== */

    function removeContent(
        id: string
    ) {

        setItems(
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

        /*
         * courseId identifies the course draft
         * to which these content items belong.
         *
         * The backend persistence layer can use
         * this ID to save the content against the
         * correct course.
         */

        console.log(
            "Saving content for course:",
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
                    Step 4
                </span>


                <h2>
                    Learning Content
                </h2>


                <p>
                    Add and organize the learning
                    resources used in the course.
                </p>

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
                ADD LEARNING CONTENT
            ================================================= */}

            <div className={styles.card}>

                <div className={styles.sectionHeader}>

                    <h3>
                        Add Learning Content
                    </h3>


                    <p>
                        Define the resources that
                        learners will use.
                    </p>

                </div>


                <div className={styles.formGrid}>

                    {/* CONTENT TITLE */}

                    <div className={styles.field}>

                        <label>
                            Content Title
                        </label>


                        <input
                            type="text"
                            value={title}
                            onChange={(event) =>
                                setTitle(
                                    event.target.value
                                )
                            }
                            placeholder="Enter content title"
                        />

                    </div>


                    {/* CONTENT TYPE */}

                    <div className={styles.field}>

                        <label>
                            Content Type
                        </label>


                        <select
                            value={type}
                            onChange={(event) =>
                                setType(
                                    event.target
                                        .value as ContentType
                                )
                            }
                        >

                            {contentTypes.map(
                                (item) => (

                                    <option
                                        key={item.value}
                                        value={item.value}
                                    >
                                        {item.label}
                                    </option>

                                )
                            )}

                        </select>

                    </div>


                    {/* DURATION */}

                    <div className={styles.field}>

                        <label>
                            Estimated Duration (minutes)
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


                    {/* REQUIRED */}

                    <div
                        className={
                            styles.checkboxField
                        }
                    >

                        <label>

                            <input
                                type="checkbox"
                                checked={required}
                                onChange={(event) =>
                                    setRequired(
                                        event.target.checked
                                    )
                                }
                            />

                            Required Content

                        </label>

                    </div>

                </div>


                <div className={styles.addRow}>

                    <button
                        type="button"
                        className={styles.addButton}
                        onClick={addContent}
                    >
                        Add Content
                    </button>

                </div>

            </div>


            {/* =================================================
                CONTENT ITEMS
            ================================================= */}

            <div className={styles.card}>

                <div className={styles.sectionHeader}>

                    <h3>
                        Content Items
                    </h3>


                    <p>

                        {items.length} item
                        {items.length === 1
                            ? ""
                            : "s"} configured

                    </p>

                </div>


                {items.length === 0 ? (

                    <div
                        className={
                            styles.emptyState
                        }
                    >
                        No learning content has been
                        added yet.
                    </div>

                ) : (

                    <div className={styles.list}>

                        {items.map(
                            (item, index) => (

                                <div
                                    key={item.id}
                                    className={styles.item}
                                >

                                    {/* NUMBER */}

                                    <div
                                        className={
                                            styles.number
                                        }
                                    >
                                        {index + 1}
                                    </div>


                                    {/* CONTENT INFORMATION */}

                                    <div
                                        className={
                                            styles.itemInfo
                                        }
                                    >

                                        <h4>
                                            {item.title}
                                        </h4>


                                        <span>

                                            {
                                                contentTypes.find(
                                                    (
                                                        contentType
                                                    ) =>
                                                        contentType.value ===
                                                        item.type
                                                )?.label
                                            }

                                        </span>

                                    </div>


                                    {/* DURATION */}

                                    <div
                                        className={
                                            styles.meta
                                        }
                                    >
                                        {item.duration} min
                                    </div>


                                    {/* REQUIRED STATUS */}

                                    <div
                                        className={
                                            item.required
                                                ? styles.required
                                                : styles.optional
                                        }
                                    >

                                        {item.required
                                            ? "Required"
                                            : "Optional"}

                                    </div>


                                    {/* REMOVE */}

                                    <button
                                        type="button"
                                        className={
                                            styles.removeButton
                                        }
                                        onClick={() =>
                                            removeContent(
                                                item.id
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
                    onClick={handleNext}
                >
                    Continue
                </button>

            </div>

        </div>

    );

}