"use client";

import { useState } from "react";

import styles from "./StructureBuilder.module.css";


/* =========================================================
   STRUCTURE NODE
========================================================= */

type StructureNode = {
    id: string;
    title: string;
    type: string;
    description: string;
    children: StructureNode[];
};


/* =========================================================
   PROPS
========================================================= */

type StructureBuilderProps = {
    tenant: string;
    role: string;
    courseId: string;
    onBack: () => void;
    onNext: () => void;
};


/* =========================================================
   STRUCTURE CONFIGURATION
========================================================= */

type StructureConfiguration = {
    title: string;
    description: string;
    level1: string;
    level2: string;
    level3: string;
    level4?: string;
};


const structureConfigurations: Record<
    string,
    StructureConfiguration
> = {

    university: {
        title: "Course Structure",
        description:
            "Organize the academic structure of the course.",
        level1: "Module",
        level2: "Unit",
        level3: "Topic",
        level4: "Activity",
    },

    corporate: {
        title: "Learning Structure",
        description:
            "Organize the training into modules, learning activities, and practice.",
        level1: "Module",
        level2: "Learning Unit",
        level3: "Learning Activity",
        level4: "Practice",
    },

    skill_academy: {
        title: "Learning Path Structure",
        description:
            "Organize the learning path into skills and activities.",
        level1: "Module",
        level2: "Skill Area",
        level3: "Learning Activity",
        level4: "Practice",
    },

    bootcamp: {
        title: "Bootcamp Structure",
        description:
            "Organize the bootcamp into sessions, labs, and practical work.",
        level1: "Week",
        level2: "Session",
        level3: "Lab",
        level4: "Challenge",
    },

    ngo: {
        title: "Program Structure",
        description:
            "Organize the learning program into units and activities.",
        level1: "Module",
        level2: "Learning Unit",
        level3: "Activity",
        level4: "Field Activity",
    },

    government: {
        title: "Training Structure",
        description:
            "Organize the training program into learning units and activities.",
        level1: "Module",
        level2: "Training Unit",
        level3: "Session",
        level4: "Activity",
    },

};


/* =========================================================
   COMPONENT
========================================================= */

export default function StructureBuilder({
    tenant,
    role,
    courseId,
    onBack,
    onNext,
}: StructureBuilderProps) {

    const configuration =
        structureConfigurations[tenant] ??
        structureConfigurations.university;


    /* =====================================================
       STATE
    ===================================================== */

    const [
        nodes,
        setNodes,
    ] = useState<StructureNode[]>([]);


    const [
        title,
        setTitle,
    ] = useState("");


    const [
        description,
        setDescription,
    ] = useState("");


    const [
        selectedParentId,
        setSelectedParentId,
    ] = useState<string | null>(null);


    const [
        selectedLevel,
        setSelectedLevel,
    ] = useState(1);


    const [
        error,
        setError,
    ] = useState("");


    /* =====================================================
       LEVEL NAMES
    ===================================================== */

    const levelNames = [

        configuration.level1,

        configuration.level2,

        configuration.level3,

        configuration.level4,

    ].filter(Boolean) as string[];


    /* =====================================================
       CURRENT LEVEL
    ===================================================== */

    const currentLevelName =
        levelNames[
            selectedLevel - 1
        ];


    /* =====================================================
       CREATE NODE
    ===================================================== */

    function createNode() {

        setError("");


        if (!title.trim()) {

            setError(
                `${currentLevelName} title is required.`
            );

            return;
        }


        /*
         * Child levels require a parent.
         */

        if (
            selectedLevel > 1 &&
            !selectedParentId
        ) {

            const parentLevel =
                levelNames[
                    selectedLevel - 2
                ];


            setError(
                `Select a parent ${parentLevel.toLowerCase()}.`
            );

            return;
        }


        const newNode: StructureNode = {

            id:
                `STRUCT-${Date.now()}-${Math.random()
                    .toString(36)
                    .slice(2, 8)}`,

            title:
                title.trim(),

            type:
                currentLevelName,

            description:
                description.trim(),

            children: [],

        };


        /* -------------------------------------------------
           ROOT LEVEL
        ------------------------------------------------- */

        if (selectedLevel === 1) {

            setNodes(
                (previous) => [

                    ...previous,

                    newNode,

                ]
            );

        }


        /* -------------------------------------------------
           CHILD LEVEL
        ------------------------------------------------- */

        else {

            setNodes(
                (previous) =>
                    addChildToNode(
                        previous,
                        selectedParentId as string,
                        newNode
                    )
            );

        }


        /*
         * Reset the form after adding.
         */

        setTitle("");

        setDescription("");

        setSelectedParentId(null);

        setSelectedLevel(1);

    }


    /* =====================================================
       ADD CHILD NODE
    ===================================================== */

    function addChildToNode(
        currentNodes: StructureNode[],
        parentId: string,
        child: StructureNode
    ): StructureNode[] {

        return currentNodes.map(
            (node) => {

                if (
                    node.id === parentId
                ) {

                    return {

                        ...node,

                        children: [

                            ...node.children,

                            child,

                        ],

                    };

                }


                return {

                    ...node,

                    children:
                        addChildToNode(
                            node.children,
                            parentId,
                            child
                        ),

                };

            }
        );

    }


    /* =====================================================
       REMOVE NODE
    ===================================================== */

    function removeNode(
        nodeId: string
    ) {

        setNodes(
            (previous) =>
                removeNodeRecursive(
                    previous,
                    nodeId
                )
        );

    }


    /* =====================================================
       REMOVE NODE RECURSIVELY
    ===================================================== */

    function removeNodeRecursive(
        currentNodes: StructureNode[],
        nodeId: string
    ): StructureNode[] {

        return currentNodes
            .filter(
                (node) =>
                    node.id !== nodeId
            )
            .map(
                (node) => ({

                    ...node,

                    children:
                        removeNodeRecursive(
                            node.children,
                            nodeId
                        ),

                })
            );

    }


    /* =====================================================
       FLATTEN NODES
    ===================================================== */

    function flattenNodes(
        currentNodes: StructureNode[],
        result: StructureNode[] = []
    ): StructureNode[] {

        currentNodes.forEach(
            (node) => {

                result.push(node);

                flattenNodes(
                    node.children,
                    result
                );

            }
        );


        return result;

    }


    /* =====================================================
       AVAILABLE PARENTS
    ===================================================== */

    function getAvailableParents() {

        if (
            selectedLevel === 1
        ) {

            return [];

        }


        const flattened =
            flattenNodes(nodes);


        return flattened.filter(
            (node) =>
                node.type ===
                levelNames[
                    selectedLevel - 2
                ]
        );

    }


    /* =====================================================
       SAVE AND CONTINUE
    ===================================================== */

    function handleNext() {

        setError("");


        if (
            nodes.length === 0
        ) {

            setError(
                `Add at least one ${configuration.level1.toLowerCase()}.`
            );

            return;
        }


        /*
         * Save structure to the active draft.
         */

        const existing =
            localStorage.getItem(
                "neurolxp_active_course_draft"
            );


        if (existing) {

            try {

                const draft =
                    JSON.parse(
                        existing
                    ) as Record<
                        string,
                        unknown
                    >;


                draft.courseId =
                    courseId;


                draft.structure =
                    nodes;


                draft.updatedAt =
                    new Date().toISOString();


                localStorage.setItem(
                    "neurolxp_active_course_draft",
                    JSON.stringify(
                        draft
                    )
                );

            } catch {

                setError(
                    "Unable to save course structure."
                );

                return;

            }

        } else {

            const draft = {

                courseId,

                tenant,

                role,

                structure:
                    nodes,

                updatedAt:
                    new Date().toISOString(),

            };


            localStorage.setItem(
                "neurolxp_active_course_draft",
                JSON.stringify(
                    draft
                )
            );

        }


        onNext();

    }


    /* =====================================================
       RENDER TREE
    ===================================================== */

    function renderTree(
        currentNodes: StructureNode[]
    ) {

        return (

            <div
                className={
                    styles.treeLevel
                }
            >

                {currentNodes.map(
                    (node) => (

                        <div
                            key={
                                node.id
                            }
                            className={
                                styles.treeNode
                            }
                        >

                            <div
                                className={
                                    styles.nodeContent
                                }
                            >

                                <div
                                    className={
                                        styles.nodeDetails
                                    }
                                >

                                    <span
                                        className={
                                            styles.nodeType
                                        }
                                    >
                                        {node.type}
                                    </span>


                                    <h4>
                                        {node.title}
                                    </h4>


                                    {node.description && (

                                        <p>
                                            {
                                                node.description
                                            }
                                        </p>

                                    )}

                                </div>


                                <button
                                    type="button"
                                    className={
                                        styles.removeButton
                                    }
                                    onClick={() =>
                                        removeNode(
                                            node.id
                                        )
                                    }
                                >
                                    Remove
                                </button>

                            </div>


                            {node.children.length > 0 && (

                                <div
                                    className={
                                        styles.children
                                    }
                                >

                                    {renderTree(
                                        node.children
                                    )}

                                </div>

                            )}

                        </div>

                    )
                )}

            </div>

        );

    }


    const availableParents =
        getAvailableParents();


    /* =====================================================
       RENDER
    ===================================================== */

    return (

        <div
            className={
                styles.container
            }
        >

            {/* =================================================
                STEP HEADER
            ================================================= */}

            <header
                className={
                    styles.heading
                }
            >

                <div
                    className={
                        styles.stepLabel
                    }
                >

                    <span
                        className={
                            styles.stepNumber
                        }
                    >
                        3
                    </span>

                    <span>
                        Step 3
                    </span>

                </div>


                <h2>
                    {configuration.title}
                </h2>


                <p>
                    {configuration.description}
                </p>

            </header>


            {/* =================================================
                ERROR
            ================================================= */}

            {error && (

                <div
                    className={
                        styles.error
                    }
                    role="alert"
                >

                    <span
                        className={
                            styles.errorIcon
                        }
                    >
                        !
                    </span>

                    <span>
                        {error}
                    </span>

                </div>

            )}


            {/* =================================================
                STRUCTURE LEVELS
            ================================================= */}

            <section
                className={
                    styles.levelCard
                }
            >

                <div
                    className={
                        styles.sectionHeader
                    }
                >

                    <div>

                        <h3>
                            Structure Levels
                        </h3>

                        <p>
                            Define the hierarchy of your learning offering.
                        </p>

                    </div>

                </div>


                <div
                    className={
                        styles.levelList
                    }
                >

                    {levelNames.map(
                        (
                            levelName,
                            index
                        ) => (

                            <div
                                key={
                                    levelName
                                }
                                className={
                                    styles.levelItem
                                }
                            >

                                <span
                                    className={
                                        styles.levelNumber
                                    }
                                >
                                    {index + 1}
                                </span>


                                <div>

                                    <strong>
                                        {levelName}
                                    </strong>

                                    <small>
                                        Level {index + 1}
                                    </small>

                                </div>

                            </div>

                        )
                    )}

                </div>

            </section>


            {/* =================================================
                ADD STRUCTURE
            ================================================= */}

            <section
                className={
                    styles.formCard
                }
            >

                <div
                    className={
                        styles.sectionHeader
                    }
                >

                    <div>

                        <h3>
                            Add {currentLevelName}
                        </h3>

                        <p>
                            Enter the details for this structure level.
                        </p>

                    </div>

                </div>


                <div
                    className={
                        styles.grid
                    }
                >

                    {/* =================================================
                        LEVEL
                    ================================================= */}

                    <div
                        className={
                            styles.field
                        }
                    >

                        <label
                            htmlFor="structureLevel"
                        >
                            Level
                        </label>


                        <select
                            id="structureLevel"
                            value={
                                selectedLevel
                            }
                            onChange={
                                (event) => {

                                    setSelectedLevel(
                                        Number(
                                            event.target.value
                                        )
                                    );

                                    setSelectedParentId(
                                        null
                                    );

                                }
                            }
                        >

                            {levelNames.map(
                                (
                                    levelName,
                                    index
                                ) => (

                                    <option
                                        key={
                                            levelName
                                        }
                                        value={
                                            index + 1
                                        }
                                    >
                                        {levelName}
                                    </option>

                                )
                            )}

                        </select>

                    </div>


                    {/* =================================================
                        PARENT
                    ================================================= */}

                    {selectedLevel > 1 && (

                        <div
                            className={
                                styles.field
                            }
                        >

                            <label
                                htmlFor="structureParent"
                            >
                                Parent{" "}
                                {
                                    levelNames[
                                        selectedLevel - 2
                                    ]
                                }
                            </label>


                            <select
                                id="structureParent"
                                value={
                                    selectedParentId ??
                                    ""
                                }
                                onChange={
                                    (event) =>
                                        setSelectedParentId(
                                            event.target.value ||
                                            null
                                        )
                                }
                            >

                                <option value="">
                                    Select parent
                                </option>


                                {availableParents.map(
                                    (parent) => (

                                        <option
                                            key={
                                                parent.id
                                            }
                                            value={
                                                parent.id
                                            }
                                        >
                                            {
                                                parent.title
                                            }
                                        </option>

                                    )
                                )}

                            </select>

                        </div>

                    )}


                    {/* =================================================
                        TITLE
                    ================================================= */}

                    <div
                        className={
                            styles.field
                        }
                    >

                        <label
                            htmlFor="structureTitle"
                        >
                            {currentLevelName} Title

                            <span
                                className={
                                    styles.required
                                }
                            >
                                *
                            </span>

                        </label>


                        <input
                            id="structureTitle"
                            type="text"
                            value={
                                title
                            }
                            onChange={
                                (event) =>
                                    setTitle(
                                        event.target.value
                                    )
                            }
                            placeholder={
                                `Enter ${currentLevelName.toLowerCase()} title`
                            }
                        />

                    </div>


                    {/* =================================================
                        DESCRIPTION
                    ================================================= */}

                    <div
                        className={
                            styles.field
                        }
                    >

                        <label
                            htmlFor="structureDescription"
                        >
                            Description
                        </label>


                        <input
                            id="structureDescription"
                            type="text"
                            value={
                                description
                            }
                            onChange={
                                (event) =>
                                    setDescription(
                                        event.target.value
                                    )
                            }
                            placeholder="Enter a short description"
                        />

                    </div>

                </div>


                {/* =================================================
                    ADD BUTTON
                ================================================= */}

                <div
                    className={
                        styles.formFooter
                    }
                >

                    <button
                        type="button"
                        className={
                            styles.addButton
                        }
                        onClick={
                            createNode
                        }
                    >
                        + Add {currentLevelName}
                    </button>

                </div>

            </section>


            {/* =================================================
                CURRENT STRUCTURE
            ================================================= */}

            <section
                className={
                    styles.structureCard
                }
            >

                <div
                    className={
                        styles.structureHeader
                    }
                >

                    <div>

                        <h3>
                            Current Structure
                        </h3>

                        <p>
                            Review the hierarchy you have created.
                        </p>

                    </div>


                    <span
                        className={
                            styles.structureCount
                        }
                    >
                        {nodes.length}{" "}
                        {configuration.level1}
                        {nodes.length !== 1
                            ? "s"
                            : ""}
                    </span>

                </div>


                {nodes.length === 0 ? (

                    <div
                        className={
                            styles.empty
                        }
                    >

                        <div
                            className={
                                styles.emptyIcon
                            }
                        >
                            +
                        </div>

                        <strong>
                            No structure added
                        </strong>

                        <span>
                            Add your first{" "}
                            {
                                configuration.level1.toLowerCase()
                            }{" "}
                            above.
                        </span>

                    </div>

                ) : (

                    renderTree(
                        nodes
                    )

                )}

            </section>


            {/* =================================================
                ACTIONS
            ================================================= */}

            <div
                className={
                    styles.actions
                }
            >

                <button
                    type="button"
                    className={
                        styles.secondaryButton
                    }
                    onClick={
                        onBack
                    }
                >
                    Back
                </button>


                <button
                    type="button"
                    className={
                        styles.primaryButton
                    }
                    onClick={
                        handleNext
                    }
                >
                    Save & Continue
                </button>

            </div>

        </div>

    );

}