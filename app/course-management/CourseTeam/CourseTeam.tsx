"use client";

import { useEffect, useState } from "react";

import styles from "./CourseTeam.module.css";

import {
    getCourseDraft,
    saveCourseDraft,
} from "@/services/course-draft.service";


/* =========================================================
   PROPS
========================================================= */

type CourseTeamProps = {
    tenant: string;
    role: string;
    courseId: string;
    onBack: () => void;
    onNext: () => void;
};


/* =========================================================
   TEAM MEMBER
========================================================= */

type TeamMember = {
    id: string;
    name: string;
    role: string;
};


type TeamRoleOption = {
    value: string;
    label: string;
};

function normalizeTenant(value?: string | null): string {
    return String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/-/g, "_")
        .replace(/\s+/g, "_");
}

function getTenantTeamRoles(
    tenant: string
): TeamRoleOption[] {
    const normalizedTenant =
        normalizeTenant(tenant);

    if (
        normalizedTenant === "university" ||
        normalizedTenant === "college"
    ) {
        return [
            {
                value: "Faculty",
                label: "Faculty",
            },
            {
                value: "Coordinator",
                label: "Coordinator",
            },
            {
                value: "Mentor",
                label: "Mentor",
            },
            {
                value: "Course Coordinator",
                label: "Course Coordinator",
            },
            {
                value: "Programme Coordinator",
                label: "Programme Coordinator",
            },
            {
                value: "Reviewer",
                label: "Reviewer",
            },
        ];
    }

    if (
        normalizedTenant === "corporate" ||
        normalizedTenant ===
            "corporate_training"
    ) {
        return [
            {
                value: "Trainer",
                label: "Trainer",
            },
            {
                value: "Manager",
                label: "Manager",
            },
            {
                value: "Training Manager",
                label: "Training Manager",
            },
            {
                value: "Subject Matter Expert",
                label: "Subject Matter Expert",
            },
            {
                value: "Mentor",
                label: "Mentor",
            },
            {
                value: "Reviewer",
                label: "Reviewer",
            },
        ];
    }

    if (
        normalizedTenant === "skill_academy" ||
        normalizedTenant ===
            "skillacademy"
    ) {
        return [
            {
                value: "Trainer",
                label: "Trainer",
            },
            {
                value: "Faculty",
                label: "Faculty",
            },
            {
                value: "Program Coordinator",
                label: "Program Coordinator",
            },
            {
                value: "Mentor",
                label: "Mentor",
            },
            {
                value: "Assessor",
                label: "Assessor",
            },
            {
                value: "Reviewer",
                label: "Reviewer",
            },
        ];
    }

    if (
        normalizedTenant === "bootcamp" ||
        normalizedTenant === "boot_camp"
    ) {
        return [
            {
                value: "Instructor",
                label: "Instructor",
            },
            {
                value: "Trainer",
                label: "Trainer",
            },
            {
                value: "Bootcamp Manager",
                label: "Bootcamp Manager",
            },
            {
                value: "Mentor",
                label: "Mentor",
            },
            {
                value: "Teaching Assistant",
                label: "Teaching Assistant",
            },
            {
                value: "Reviewer",
                label: "Reviewer",
            },
        ];
    }

    if (normalizedTenant === "ngo") {
        return [
            {
                value: "Trainer",
                label: "Trainer",
            },
            {
                value: "Training Coordinator",
                label: "Training Coordinator",
            },
            {
                value: "Programme Manager",
                label: "Programme Manager",
            },
            {
                value: "Field Facilitator",
                label: "Field Facilitator",
            },
            {
                value: "Mentor",
                label: "Mentor",
            },
            {
                value: "Reviewer",
                label: "Reviewer",
            },
        ];
    }

    if (
        normalizedTenant === "government" ||
        normalizedTenant ===
            "government_training"
    ) {
        return [
            {
                value: "Trainer",
                label: "Trainer",
            },
            {
                value: "Training Coordinator",
                label: "Training Coordinator",
            },
            {
                value: "Programme Manager",
                label: "Programme Manager",
            },
            {
                value: "Department Coordinator",
                label: "Department Coordinator",
            },
            {
                value: "Subject Matter Expert",
                label: "Subject Matter Expert",
            },
            {
                value: "Reviewer",
                label: "Reviewer",
            },
        ];
    }

    return [
        {
            value: "Trainer",
            label: "Trainer",
        },
        {
            value: "Faculty",
            label: "Faculty",
        },
        {
            value: "Mentor",
            label: "Mentor",
        },
        {
            value: "Coordinator",
            label: "Coordinator",
        },
        {
            value: "Course Manager",
            label: "Course Manager",
        },
        {
            value: "Program Manager",
            label: "Program Manager",
        },
        {
            value: "Instructor",
            label: "Instructor",
        },
    ];
}


/* =========================================================
   COMPONENT
========================================================= */

export default function CourseTeam({
    tenant,
    role,
    courseId,
    onBack,
    onNext,
}: CourseTeamProps) {

    const [
        members,
        setMembers,
    ] = useState<TeamMember[]>([]);

    /*
     * Restore Course Team data from the existing course draft.
     * The same courseId is used throughout the Course Wizard.
     */
    useEffect(() => {
        if (!courseId) {
            return;
        }

        const draft = getCourseDraft(courseId);

        if (!draft) {
            return;
        }

        const savedMembers = (
            draft as typeof draft & {
                teamMembers?: TeamMember[];
            }
        ).teamMembers;

        if (Array.isArray(savedMembers)) {
            setMembers(savedMembers);
        }
    }, [courseId]);


    const [
        name,
        setName,
    ] = useState("");


    const tenantRoleOptions =
        getTenantTeamRoles(
            tenant
        );

    const [
        memberRole,
        setMemberRole,
    ] = useState(
        tenantRoleOptions[0]?.value ??
            "Trainer"
    );

    useEffect(() => {
        const options =
            getTenantTeamRoles(
                tenant
            );

        setMemberRole(
            options[0]?.value ??
                "Trainer"
        );
    }, [tenant]);


    /* =====================================================
       ADD MEMBER
    ===================================================== */

    function addMember() {

        if (!name.trim()) {

            return;

        }


        setMembers(
            (previous) => [

                ...previous,

                {
                    id:
                        `TEAM-${Date.now()}`,

                    name:
                        name.trim(),

                    role:
                        memberRole,
                },

            ]
        );


        setName("");

    }


    /* =====================================================
       REMOVE MEMBER
    ===================================================== */

    function removeMember(
        id: string
    ) {

        setMembers(
            (previous) =>
                previous.filter(
                    (member) =>
                        member.id !== id
                )
        );

    }


    /* =====================================================
       CONTINUE
    ===================================================== */

    function handleNext() {

        /*
         * Save Course Team into the SAME existing course draft.
         * Do not create another draft and do not rely only on
         * component state.
         */
        if (!courseId) {
            console.error(
                "Cannot save Course Team: courseId is missing."
            );
            return;
        }

        const draft = getCourseDraft(courseId);

        if (!draft) {
            console.error(
                "Cannot save Course Team: course draft not found.",
                courseId
            );
            return;
        }

        const updatedDraft = {
            ...draft,

            teamMembers: members,

            /*
             * Course Team is Step 6 in the nine-step wizard.
             * Preserve any progress already reached if the user
             * comes back to this step later.
             */
            currentStep: Math.max(
                draft.currentStep ?? 0,
                6
            ),

            completedThroughStep: Math.max(
                draft.completedThroughStep ?? 0,
                6
            ),

            updatedAt:
                new Date().toISOString(),
        };

        saveCourseDraft(updatedDraft);

        /*
         * Only navigate after the draft has been saved.
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

                <span className={styles.eyebrow}>
                    Step 6
                </span>


                <h2>
                    Course Team
                </h2>


                <p>
                    Assign the people responsible
                    for delivering and managing this
                    learning program.
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
                        Current Actor
                    </span>

                    <strong>
                        {role}
                    </strong>

                </div>

            </div>


            {/* =================================================
                ADD TEAM MEMBER
            ================================================= */}

            <div className={styles.card}>

                <div className={styles.sectionHeader}>

                    <h3>
                        Add Team Member
                    </h3>


                    <p>
                        The available responsibilities
                        can later be controlled by the
                        tenant-specific configuration.
                    </p>

                </div>


                <div className={styles.formGrid}>

                    {/* =========================================
                        NAME
                    ========================================= */}

                    <div className={styles.field}>

                        <label>
                            Name
                        </label>


                        <input
                            value={name}
                            onChange={(event) =>
                                setName(
                                    event.target.value
                                )
                            }
                            placeholder="Enter name"
                        />

                    </div>


                    {/* =========================================
                        RESPONSIBILITY
                    ========================================= */}

                    <div className={styles.field}>

                        <label>
                            Responsibility
                        </label>


                        <select
                            value={memberRole}
                            onChange={(event) =>
                                setMemberRole(
                                    event.target.value
                                )
                            }
                        >

                            {tenantRoleOptions.map(
                                (
                                    option
                                ) => (
                                    <option
                                        key={
                                            option.value
                                        }
                                        value={
                                            option.value
                                        }
                                    >
                                        {
                                            option.label
                                        }
                                    </option>
                                )
                            )}

                        </select>

                    </div>

                </div>


                <button
                    type="button"
                    className={styles.addButton}
                    onClick={addMember}
                >
                    Add Team Member
                </button>

            </div>


            {/* =================================================
                ASSIGNED TEAM
            ================================================= */}

            <div className={styles.card}>

                <div className={styles.sectionHeader}>

                    <h3>
                        Assigned Team
                    </h3>


                    <p>

                        {members.length} member
                        {members.length === 1
                            ? ""
                            : "s"} assigned

                    </p>

                </div>


                {members.length === 0 ? (

                    <div
                        className={
                            styles.emptyState
                        }
                    >
                        No course team members assigned
                        yet.
                    </div>

                ) : (

                    <div className={styles.list}>

                        {members.map(
                            (member) => (

                                <div
                                    key={
                                        member.id
                                    }
                                    className={
                                        styles.item
                                    }
                                >

                                    {/* AVATAR */}

                                    <div
                                        className={
                                            styles.avatar
                                        }
                                    >

                                        {member.name
                                            .charAt(0)
                                            .toUpperCase()}

                                    </div>


                                    {/* MEMBER INFORMATION */}

                                    <div
                                        className={
                                            styles.memberInfo
                                        }
                                    >

                                        <strong>
                                            {member.name}
                                        </strong>


                                        <span>
                                            {member.role}
                                        </span>

                                    </div>


                                    {/* REMOVE */}

                                    <button
                                        type="button"
                                        className={
                                            styles.removeButton
                                        }
                                        onClick={() =>
                                            removeMember(
                                                member.id
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