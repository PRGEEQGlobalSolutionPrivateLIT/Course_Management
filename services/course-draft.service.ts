import type {
    CourseCreationState,
} from "../types/course-creation.types";

import {
    defaultCourseSetup,
} from "../types/default-course-setup";

const COURSE_DRAFT_PREFIX =
    "course-draft-";

const TOTAL_STEPS = 9;
const LAST_STEP_INDEX = TOTAL_STEPS - 1;

function generateCourseId(): string {
    const timestamp =
        Date.now()
            .toString(36)
            .toUpperCase();

    const random =
        Math.random()
            .toString(36)
            .substring(2, 7)
            .toUpperCase();

    return `CRS-${timestamp}-${random}`;
}

function getDraftStorageKey(
    courseId: string
): string {
    return `${COURSE_DRAFT_PREFIX}${courseId}`;
}

function canUseLocalStorage(): boolean {
    return typeof window !== "undefined" &&
        typeof window.localStorage !== "undefined";
}

function clampStep(step: number): number {
    if (!Number.isFinite(step)) {
        return 0;
    }

    return Math.max(
        0,
        Math.min(
            Math.trunc(step),
            LAST_STEP_INDEX
        )
    );
}

/**
 * Normalize a draft loaded from localStorage.
 *
 * Important:
 * We do not reconstruct or replace the saved step data.
 * Existing setup, outcomes, structure, team, delivery,
 * enrollment, completion, and validation data are retained.
 */
function normalizeDraft(
    value: unknown,
    courseId?: string
): CourseCreationState | null {
    if (
        typeof value !== "object" ||
        value === null
    ) {
        return null;
    }

    const draft =
        value as Partial<CourseCreationState>;

    if (
        typeof draft.courseId !== "string" ||
        (courseId &&
            draft.courseId !== courseId)
    ) {
        return null;
    }

    if (
        !draft.tenant ||
        !draft.role ||
        !draft.setup ||
        !draft.createdAt ||
        !draft.updatedAt
    ) {
        return null;
    }

    const currentStep =
        clampStep(
            typeof draft.currentStep === "number"
                ? draft.currentStep
                : 0
        );

    /*
     * completedThroughStep is the number of steps
     * successfully completed, not a zero-based index.
     *
     * Therefore:
     * 0 = nothing completed
     * 1 = Step 1 completed
     * 7 = Steps 1-7 completed
     * 9 = all steps completed
     */
    const completedThroughStep =
        Math.max(
            0,
            Math.min(
                TOTAL_STEPS,
                typeof draft.completedThroughStep === "number"
                    ? Math.trunc(
                        draft.completedThroughStep
                    )
                    : currentStep
            )
        );

    return {
        ...draft,
        courseId: draft.courseId,
        tenant: draft.tenant,
        role: draft.role,
        status: draft.status ?? "DRAFT",
        currentStep,
        completedThroughStep,
        setup: draft.setup,
        createdAt: draft.createdAt,
        updatedAt: draft.updatedAt,
    } as CourseCreationState;
}

/* =========================================================
   CREATE COURSE DRAFT
========================================================= */

export function createCourseDraft(
    tenant: string,
    role: string
): CourseCreationState {
    const now =
        new Date().toISOString();

    const draft: CourseCreationState = {
        courseId:
            generateCourseId(),

        tenant,

        role,

        status:
            "DRAFT",

        currentStep:
            0,

        completedThroughStep:
            0,

        setup: {
            ...defaultCourseSetup,

            dates: {
                ...defaultCourseSetup.dates,
            },

            branding: {
                ...defaultCourseSetup.branding,
            },

            tags: [
                ...defaultCourseSetup.tags,
            ],

            supportedLanguages: [
                ...defaultCourseSetup
                    .supportedLanguages,
            ],

            instructorIds: [
                ...defaultCourseSetup
                    .instructorIds,
            ],
        },

        createdAt:
            now,

        updatedAt:
            now,
    };

    return draft;
}

/* =========================================================
   SAVE COMPLETE COURSE DRAFT
========================================================= */

/**
 * Persist the complete draft.
 *
 * This function NEVER creates another course when the same
 * courseId is supplied. It replaces the stored snapshot for
 * that courseId with the complete current snapshot.
 *
 * Each builder must therefore pass its complete draft object,
 * normally obtained from getCourseDraft(courseId) and merged
 * with only the fields changed by that builder.
 */
export function saveCourseDraft(
    draft: CourseCreationState
): CourseCreationState {
    if (!canUseLocalStorage()) {
        return draft;
    }

    const existingDraft =
        getCourseDraft(
            draft.courseId
        );

    /*
     * If an existing draft is present, preserve all of its
     * previously saved properties unless the incoming draft
     * explicitly supplies the new value.
     *
     * This prevents a later step from accidentally replacing
     * the earlier step data with an incomplete object.
     */
    const mergedDraft: CourseCreationState =
        existingDraft
            ? {
                ...existingDraft,
                ...draft,

                courseId:
                    existingDraft.courseId,

                tenant:
                    existingDraft.tenant,

                role:
                    existingDraft.role,

                setup:
                    draft.setup ??
                    existingDraft.setup,
            }
            : {
                ...draft,
            };

    const updatedDraft =
        normalizeDraft(
            {
                ...mergedDraft,

                status:
                    mergedDraft.status ??
                    "DRAFT",

                updatedAt:
                    new Date().toISOString(),
            },
            draft.courseId
        );

    if (!updatedDraft) {
        throw new Error(
            "Unable to save course draft: invalid draft data."
        );
    }

    localStorage.setItem(
        getDraftStorageKey(
            updatedDraft.courseId
        ),
        JSON.stringify(
            updatedDraft
        )
    );

    return updatedDraft;
}

/* =========================================================
   LOAD COURSE DRAFT
========================================================= */

export function getCourseDraft(
    courseId: string
): CourseCreationState | null {
    if (!canUseLocalStorage()) {
        return null;
    }

    const stored =
        localStorage.getItem(
            getDraftStorageKey(
                courseId
            )
        );

    if (!stored) {
        return null;
    }

    try {
        return normalizeDraft(
            JSON.parse(stored),
            courseId
        );
    } catch {
        return null;
    }
}

/* =========================================================
   UPDATE WIZARD STEP
========================================================= */

/**
 * Change only the resume location.
 *
 * IMPORTANT:
 * This does not modify completedThroughStep.
 * Going back to an earlier step therefore cannot reduce
 * the saved completion progress.
 */
export function updateCourseDraftStep(
    draft: CourseCreationState,
    step: number
): CourseCreationState {
    const safeStep =
        clampStep(step);

    return saveCourseDraft({
        ...draft,

        currentStep:
            safeStep,
    });
}

/* =========================================================
   UPDATE COURSE SETUP
========================================================= */

export function updateCourseSetup(
    draft: CourseCreationState,
    setup: CourseCreationState["setup"]
): CourseCreationState {
    return saveCourseDraft({
        ...draft,

        setup: {
            ...draft.setup,
            ...setup,

            dates: {
                ...draft.setup.dates,
                ...setup.dates,
            },

            branding: {
                ...draft.setup.branding,
                ...setup.branding,
            },

            tags: [
                ...(setup.tags ?? []),
            ],

            supportedLanguages: [
                ...(setup.supportedLanguages ?? []),
            ],

            instructorIds: [
                ...(setup.instructorIds ?? []),
            ],
        },
    });
}

/* =========================================================
   UPDATE ANY PART OF EXISTING DRAFT
========================================================= */

/**
 * Merge partial changes into the existing draft.
 *
 * This is the main function to use from individual builders.
 * It preserves everything already stored for earlier steps.
 */
export function updateCourseDraft(
    draft: CourseCreationState,
    updates: Partial<CourseCreationState>
): CourseCreationState {
    const previousCompleted =
        draft.completedThroughStep ?? 0;

    const requestedCompleted =
        typeof updates.completedThroughStep === "number"
            ? updates.completedThroughStep
            : previousCompleted;

    const updatedDraft: CourseCreationState = {
        ...draft,

        ...updates,

        courseId:
            draft.courseId,

        tenant:
            draft.tenant,

        role:
            draft.role,

        setup:
            updates.setup
                ? {
                    ...draft.setup,
                    ...updates.setup,

                    dates: {
                        ...draft.setup.dates,
                        ...updates.setup.dates,
                    },

                    branding: {
                        ...draft.setup.branding,
                        ...updates.setup.branding,
                    },
                }
                : draft.setup,

        completedThroughStep:
            Math.max(
                previousCompleted,
                Math.min(
                    TOTAL_STEPS,
                    Math.max(
                        0,
                        Math.trunc(
                            requestedCompleted
                        )
                    )
                )
            ),
    };

    return saveCourseDraft(
        updatedDraft
    );
}

/* =========================================================
   COMPLETE COURSE STEP
========================================================= */

/**
 * Save the data for a completed step and move the wizard
 * to the next step.
 *
 * completedStep is zero-based:
 * 0 = Step 1
 * 1 = Step 2
 * ...
 * 8 = Step 9
 *
 * completedThroughStep is a count:
 * 1 = Step 1 completed
 * 2 = Steps 1-2 completed
 * ...
 * 9 = all steps completed
 */
export function completeCourseStep(
    draft: CourseCreationState,
    completedStep: number,
    updates: Partial<CourseCreationState> = {}
): CourseCreationState {
    const safeCompletedStep =
        clampStep(
            completedStep
        );

    const previousCompleted =
        draft.completedThroughStep ?? 0;

    const completedCount =
        Math.max(
            previousCompleted,
            safeCompletedStep + 1
        );

    const nextStep =
        Math.min(
            safeCompletedStep + 1,
            LAST_STEP_INDEX
        );

    return saveCourseDraft({
        ...draft,

        ...updates,

        courseId:
            draft.courseId,

        tenant:
            draft.tenant,

        role:
            draft.role,

        status:
            "DRAFT",

        currentStep:
            nextStep,

        completedThroughStep:
            Math.min(
                TOTAL_STEPS,
                completedCount
            ),
    });
}

/* =========================================================
   UPDATE EXISTING DRAFT BY COURSE ID
========================================================= */

export function updateExistingCourseDraft(
    courseId: string,
    updates: Partial<CourseCreationState>
): CourseCreationState | null {
    const existingDraft =
        getCourseDraft(
            courseId
        );

    if (!existingDraft) {
        return null;
    }

    return updateCourseDraft(
        existingDraft,
        updates
    );
}

/* =========================================================
   PUBLISH COURSE
========================================================= */

export function publishCourseDraft(
    draft: CourseCreationState
): CourseCreationState {
    return saveCourseDraft({
        ...draft,

        status:
            "PUBLISHED",

        currentStep:
            LAST_STEP_INDEX,

        completedThroughStep:
            TOTAL_STEPS,
    });
}

/* =========================================================
   GET ALL LOCAL DRAFTS
========================================================= */

export function getCourseDrafts():
    CourseCreationState[] {
    if (!canUseLocalStorage()) {
        return [];
    }

    const drafts:
        CourseCreationState[] = [];

    try {
        const storage =
            window.localStorage;

        for (
            let index = 0;
            index < storage.length;
            index++
        ) {
            const key =
                storage.key(index);

            if (
                !key ||
                !key.startsWith(
                    COURSE_DRAFT_PREFIX
                )
            ) {
                continue;
            }

            const stored =
                storage.getItem(key);

            if (!stored) {
                continue;
            }

            try {
                const draft =
                    normalizeDraft(
                        JSON.parse(stored)
                    );

                if (
                    draft &&
                    draft.status === "DRAFT"
                ) {
                    drafts.push(
                        draft
                    );
                }
            } catch {
                // Ignore invalid localStorage records.
            }
        }

        drafts.sort(
            (first, second) =>
                new Date(
                    second.updatedAt
                ).getTime() -
                new Date(
                    first.updatedAt
                ).getTime()
        );

        return drafts;
    } catch {
        return [];
    }
}

/* =========================================================
   DELETE COURSE DRAFT
========================================================= */

export function deleteCourseDraft(
    courseId: string
): void {
    if (!canUseLocalStorage()) {
        return;
    }

    localStorage.removeItem(
        getDraftStorageKey(
            courseId
        )
    );
}

/* =========================================================
   CHECK WHETHER DRAFT EXISTS
========================================================= */

export function courseDraftExists(
    courseId: string
): boolean {
    return (
        getCourseDraft(
            courseId
        ) !== null
    );
}

/* =========================================================
   GET DRAFT PROGRESS
========================================================= */

/**
 * Progress is based on completedThroughStep.
 *
 * 0 completed = 0%
 * 1 completed = 11%
 * 7 completed = 78%
 * 9 completed = 100%
 */
export function getDraftProgress(
    draftOrStep:
        CourseCreationState | number
): number {
    const completedCount =
        typeof draftOrStep === "number"
            ? Math.max(
                0,
                Math.min(
                    TOTAL_STEPS,
                    Math.trunc(
                        draftOrStep
                    )
                )
            )
            : Math.max(
                0,
                Math.min(
                    TOTAL_STEPS,
                    Math.trunc(
                        draftOrStep.completedThroughStep ??
                        0
                    )
                )
            );

    return Math.round(
        (
            completedCount /
            TOTAL_STEPS
        ) * 100
    );
}