"use client";

import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import JSZip from "jszip";
import { init as initPptxPreview } from "pptx-preview";

import CourseSetup from "../CourseSetup/CourseSetup";
import OutcomesBuilder from "../OutcomesBuilder/OutcomesBuilder";
import AcademicCreditsOutcomesBuilder from "@/app/course-management/AcademicCreditsOutcomesBuilder/AcademicCreditsOutcomesBuilder";
import LearningStructureBuilder, {
    getStoredLearningContentBlob,
} from "@/app/course-management/LearningStructureBuilder/LearningStructureBuilder";
import CourseTeam from "../CourseTeam/CourseTeam";
import DeliveryBuilder from "../DeliveryBuilder/DeliveryBuilder";
import EnrollmentBuilder from "../EnrollmentBuilder/EnrollmentBuilder";
import CompletionBuilder from "../CompletionBuilder/CompletionBuilder";
import ValidationBuilder from "../ValidationBuilder/ValidationBuilder";
import ReviewBuilder from "../ReviewBuilder/ReviewBuilder";

import {
    getCourseDraft,
    saveCourseDraft,
} from "@/services/course-draft.service";

import styles from "./CourseWizard.module.css";

/* =========================================================
   COURSE WIZARD PROPS
========================================================= */

type CourseWizardProps = {
    tenant: string;
    role: string;

    /*
     * IMPORTANT:
     *
     * courseId is supplied ONLY when opening an existing
     * course/draft.
     *
     * For a brand-new course this must be undefined.
     */
    courseId?: string;

    /*
     * Used only when opening an existing draft from an
     * external navigation source.
     *
     * The saved draft.currentStep remains the primary
     * source of truth.
     */
    initialStep?: number;
};

function isUniversityOrCollegeTenant(
    tenant: string
): boolean {

    const normalizedTenant =
        String(tenant ?? "")
            .trim()
            .toLowerCase()
            .replace(/-/g, "_")
            .replace(/\s+/g, "_");

    return (
        normalizedTenant === "university" ||
        normalizedTenant === "college"
    );
}

/* =========================================================
   COURSE CREATION STEPS
========================================================= */

const steps = [
    {
        id: "setup",
        label: "Basic Setup",
    },
    {
        id: "outcomes",
        label: "Outcomes & Skills",
    },
    {
        id: "learning-structure",
        label: "Learning Structure",
    },
    {
        id: "team",
        label: "Course Team",
    },
    {
        id: "delivery",
        label: "Delivery",
    },
    {
        id: "enrollment",
        label: "Enrollment",
    },
    {
        id: "completion",
        label: "Completion",
    },
    {
        id: "validation",
        label: "Validation",
    },
    {
        id: "review",
        label: "Review",
    },
];

const academicSteps = [
    {
        id: "setup",
        label: "Course Setup & Academic Mapping",
    },
    {
        id: "outcomes",
        label: "Credits & Outcome Mapping",
    },
    {
        id: "learning-structure",
        label: "Learning Structure",
    },
    {
        id: "team",
        label: "Course Team",
    },
    {
        id: "delivery",
        label: "Delivery",
    },
    {
        id: "enrollment",
        label: "Enrollment",
    },
    {
        id: "completion",
        label: "Completion",
    },
    {
        id: "validation",
        label: "Validation",
    },
    {
        id: "review",
        label: "Review",
    },
];

/*
 * Step indexes:
 *
 * 0 = Basic Setup
 * 1 = Outcomes & Skills
 * 2 = Learning Structure
 * 3 = Course Team
 * 4 = Delivery
 * 5 = Enrollment
 * 6 = Completion
 * 7 = Validation
 * 8 = Review
 */

const LAST_STEP_INDEX =
    steps.length - 1;

/* =========================================================
   SAFE STEP NORMALIZATION
========================================================= */

function normalizeStep(
    value: number | undefined,
    fallback = 0,
    maxStepIndex = LAST_STEP_INDEX
): number {

    const numericValue =
        typeof value === "number" &&
        Number.isFinite(value)
            ? value
            : fallback;

    return Math.min(
        Math.max(
            Math.floor(numericValue),
            0
        ),
        maxStepIndex
    );
}

function normalizeCompletedStep(
    value: number | undefined,
    maxSteps = steps.length
): number {

    const numericValue =
        typeof value === "number" &&
        Number.isFinite(value)
            ? value
            : 0;

    return Math.min(
        Math.max(
            Math.floor(numericValue),
            0
        ),
        maxSteps
    );
}

/* =========================================================
   INLINE LEARNER VIEW

   Uses the SAME course draft that the builders save.
   Structure:
       structure[]
         -> learnings[]
              -> contents[]
              -> assessments[]

   No second course ID and no second storage model are created.
========================================================= */

type LearnerPreviewContent = {
    id?: string;
    title?: string;
    description?: string;
    type?: string;
    fileName?: string;
    url?: string;
    source?: string;
    storage?: string;
    required?: boolean;
    estimatedMinutes?: string;
    mimeType?: string;
    fileDataUrl?: string;
    dataUrl?: string;
    blobUrl?: string;
    fileUrl?: string;
    resourceUrl?: string;
    launchUrl?: string;
    fileStorageKey?: string;
    storageKey?: string;
    resourceKey?: string;
    scormUrl?: string;
    scormPackageId?: string;
    scormVersion?: "1.2" | "2004";
    scormLaunchFile?: string;
    scormLaunchUrl?: string;
    scormTitle?: string;
};

type LearnerPreviewAssessment = {
    id?: string;
    title?: string;
    name?: string;
    assessmentId?: string;
    type?: string;
};

type LearnerPreviewLearning = {
    id?: string;
    title?: string;
    description?: string;
    contents?: LearnerPreviewContent[];
    assessments?: LearnerPreviewAssessment[];
};

type LearnerPreviewModule = {
    id?: string;
    title?: string;
    description?: string;
    learnings?: LearnerPreviewLearning[];
};

/*
 * Learner content viewport.
 *
 * The previous learner preview used one shared media viewport for
 * SCORM, external resources, video, and document content. Keep one
 * consistent viewport here instead of giving every resource a
 * different arbitrary height.
 */
const LEARNER_CONTENT_FRAME_HEIGHT = 620;
const SCORM_SERVICE_WORKER_VERSION = "v4";


/* =========================================================
   LEARNER RESOURCE HELPERS

   The learner view must render the actual resource, not only
   its file name. The builder may store:
   - an external URL
   - a data/blob URL
   - a file storage key
   - a file name + MIME type

   These helpers resolve the best available source.
========================================================= */

function normalizeResourceType(
    content: LearnerPreviewContent
): string {
    return (
        String(
            content.type ??
            content.storage ??
            ""
        )
            .trim()
            .toLowerCase()
    );
}

function getFileExtension(
    value: string
): string {
    const cleanValue =
        value
            .split("?")[0]
            .split("#")[0]
            .trim()
            .toLowerCase();

    const match =
        cleanValue.match(
            /\.([a-z0-9]+)$/
        );

    return match?.[1] ?? "";
}

function getMimeType(
    content: LearnerPreviewContent
): string {
    const explicitMime =
        String(
            (content as any).mimeType ??
            ""
        )
            .trim()
            .toLowerCase();

    if (explicitMime) {
        return explicitMime;
    }

    const extension =
        getFileExtension(
            content.fileName ??
            content.url ??
            content.source ??
            ""
        );

    const mimeByExtension: Record<
        string,
        string
    > = {
        pdf: "application/pdf",
        mp4: "video/mp4",
        webm: "video/webm",
        ogg: "video/ogg",
        mov: "video/quicktime",
        m4v: "video/x-m4v",
        mp3: "audio/mpeg",
        wav: "audio/wav",
        m4a: "audio/mp4",
        aac: "audio/aac",
        flac: "audio/flac",
        png: "image/png",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        gif: "image/gif",
        webp: "image/webp",
        svg: "image/svg+xml",
        html: "text/html",
        htm: "text/html",
        txt: "text/plain",
        csv: "text/csv",
        doc: "application/msword",
        docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ppt: "application/vnd.ms-powerpoint",
        pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        pptm: "application/vnd.ms-powerpoint.presentation.macroEnabled.12",
    };

    return mimeByExtension[
        extension
    ] ?? "";
}

function getResourceUrl(
    content: LearnerPreviewContent
): string {
    const possibleValues = [
        content.url,
        content.source,
        (content as any).fileDataUrl,
        (content as any).dataUrl,
        (content as any).blobUrl,
        (content as any).fileUrl,
        (content as any).resourceUrl,
        (content as any).launchUrl,
        (content as any).scormLaunchUrl,
        (content as any).scormUrl,
    ];

    return (
        possibleValues.find(
            (value) =>
                typeof value === "string" &&
                value.trim().length > 0
        ) ?? ""
    ).trim();
}

function isYouTubeUrl(
    url: string
): boolean {
    return /(^|\/\/)(www\.)?(youtube\.com|youtu\.be)\//i.test(
        url
    );
}

function getYouTubeEmbedUrl(
    url: string
): string {
    try {
        const parsed =
            new URL(url);

        if (
            parsed.hostname.includes(
                "youtu.be"
            )
        ) {
            return `https://www.youtube.com/embed/${parsed.pathname.replace("/", "")}`;
        }

        const videoId =
            parsed.searchParams.get(
                "v"
            );

        if (videoId) {
            return `https://www.youtube.com/embed/${videoId}`;
        }

        const embedMatch =
            parsed.pathname.match(
                /\/embed\/([^/]+)/i
            );

        if (embedMatch?.[1]) {
            return `https://www.youtube.com/embed/${embedMatch[1]}`;
        }
    } catch {
        // Fall through to the original URL.
    }

    return url;
}

/* =========================================================
   SCORM PREVIEW RUNTIME

   The Learning Structure Builder stores extracted SCORM files in
   the "neurolxp-scorm-demo" IndexedDB database and serves them
   through /scorm-runtime/.

   The API is installed BEFORE the launch iframe is created.
   This prevents the common "Unable to acquire LMS API" error.
========================================================= */

type Scorm12Api = {
    LMSInitialize: (value?: string) => string;
    LMSFinish: (value?: string) => string;
    LMSGetValue: (element: string) => string;
    LMSSetValue: (element: string, value: string) => string;
    LMSCommit: (value?: string) => string;
    LMSGetLastError: () => string;
    LMSGetErrorString: (errorCode: string) => string;
    LMSGetDiagnostic: (errorCode?: string) => string;
};

type Scorm2004Api = {
    Initialize: (value?: string) => string;
    Terminate: (value?: string) => string;
    GetValue: (element: string) => string;
    SetValue: (element: string, value: string) => string;
    Commit: (value?: string) => string;
    GetLastError: () => string;
    GetErrorString: (errorCode: string) => string;
    GetDiagnostic: (errorCode?: string) => string;
};

type ScormVersion = "SCORM_1_2" | "SCORM_2004";

function getScormVersion(
    content: LearnerPreviewContent
): ScormVersion {
    const raw = String(
        content.scormVersion ?? content.type ?? ""
    )
        .trim()
        .toUpperCase();

    if (
        raw === "SCORM_2004" ||
        raw === "2004" ||
        raw.includes("SCORM 2004")
    ) {
        return "SCORM_2004";
    }

    return "SCORM_1_2";
}

function createScorm12Api(
    packageId: string,
    learnerId: string
): Scorm12Api {
    const storageKey =
        `neurolxp-scorm-runtime:${packageId}:${learnerId}`;

    let savedValues: Record<string, string> = {};

    try {
        const stored =
            window.localStorage.getItem(storageKey);

        savedValues = stored
            ? (JSON.parse(stored) as Record<string, string>)
            : {};
    } catch {
        savedValues = {};
    }

    let initialized = false;
    let finished = false;
    let lastError = "0";

    const values: Record<string, string> = {
        "cmi.core.student_id": learnerId,
        "cmi.core.student_name": "Preview Learner",
        "cmi.core.lesson_status": "not attempted",
        "cmi.core.lesson_location": "",
        "cmi.core.score.raw": "",
        "cmi.core.score.min": "0",
        "cmi.core.score.max": "100",
        "cmi.core.session_time": "0000:00:00",
        "cmi.core.total_time": "0000:00:00",
        "cmi.suspend_data": "",
        "cmi.launch_data": "",
        "cmi.core.credit": "credit",
        "cmi.core.lesson_mode": "normal",
        ...savedValues,
    };

    function persist() {
        try {
            window.localStorage.setItem(
                storageKey,
                JSON.stringify(values)
            );
        } catch {
            // Preview persistence is best effort.
        }
    }

    const api: Scorm12Api = {
        LMSInitialize() {
            if (finished || initialized) {
                lastError = "101";
                return "false";
            }

            initialized = true;
            lastError = "0";
            return "true";
        },

        LMSFinish() {
            if (!initialized) {
                lastError = "301";
                return "false";
            }

            persist();
            initialized = false;
            finished = true;
            lastError = "0";
            return "true";
        },

        LMSGetValue(element) {
            if (!initialized) {
                lastError = "301";
                return "";
            }

            lastError = "0";
            return values[element] ?? "";
        },

        LMSSetValue(element, value) {
            if (!initialized) {
                lastError = "301";
                return "false";
            }

            values[element] = String(value);
            lastError = "0";
            return "true";
        },

        LMSCommit() {
            if (!initialized) {
                lastError = "301";
                return "false";
            }

            persist();
            lastError = "0";
            return "true";
        },

        LMSGetLastError() {
            return lastError;
        },

        LMSGetErrorString(errorCode) {
            const errors: Record<string, string> = {
                "0": "No error",
                "101": "General exception",
                "201": "Invalid argument error",
                "301": "Not initialized",
                "401": "Not implemented error",
            };

            return errors[errorCode] ?? "Unknown error";
        },

        LMSGetDiagnostic(errorCode) {
            return api.LMSGetErrorString(
                errorCode || lastError
            );
        },
    };

    return api;
}

function createScorm2004Api(
    packageId: string,
    learnerId: string
): Scorm2004Api {
    const storageKey =
        `neurolxp-scorm-runtime:${packageId}:${learnerId}`;

    let savedValues: Record<string, string> = {};

    try {
        const stored =
            window.localStorage.getItem(storageKey);

        savedValues = stored
            ? (JSON.parse(stored) as Record<string, string>)
            : {};
    } catch {
        savedValues = {};
    }

    let initialized = false;
    let terminated = false;
    let lastError = "0";

    const values: Record<string, string> = {
        "cmi.learner_id": learnerId,
        "cmi.learner_name": "Preview Learner",
        "cmi.completion_status": "unknown",
        "cmi.success_status": "unknown",
        "cmi.location": "",
        "cmi.score.raw": "",
        "cmi.score.min": "0",
        "cmi.score.max": "100",
        "cmi.session_time": "PT0H0M0S",
        "cmi.total_time": "PT0H0M0S",
        "cmi.suspend_data": "",
        "cmi.entry":
            savedValues["cmi.suspend_data"]
                ? "resume"
                : "ab-initio",
        "cmi.mode": "normal",
        "cmi.credit": "credit",
        ...savedValues,
    };

    function persist() {
        try {
            window.localStorage.setItem(
                storageKey,
                JSON.stringify(values)
            );
        } catch {
            // Preview persistence is best effort.
        }
    }

    const api: Scorm2004Api = {
        Initialize() {
            if (terminated || initialized) {
                lastError = "103";
                return "false";
            }

            initialized = true;
            lastError = "0";
            return "true";
        },

        Terminate() {
            if (!initialized) {
                lastError = "132";
                return "false";
            }

            persist();
            initialized = false;
            terminated = true;
            lastError = "0";
            return "true";
        },

        GetValue(element) {
            if (!initialized) {
                lastError = "122";
                return "";
            }

            lastError = "0";
            return values[element] ?? "";
        },

        SetValue(element, value) {
            if (!initialized) {
                lastError = "132";
                return "false";
            }

            values[element] = String(value);
            lastError = "0";
            return "true";
        },

        Commit() {
            if (!initialized) {
                lastError = "142";
                return "false";
            }

            persist();
            lastError = "0";
            return "true";
        },

        GetLastError() {
            return lastError;
        },

        GetErrorString(errorCode) {
            const errors: Record<string, string> = {
                "0": "No error",
                "101": "General exception",
                "102": "General initialization failure",
                "103": "Already initialized",
                "104": "Content instance terminated",
                "111": "General termination failure",
                "112": "Termination before initialization",
                "113": "Termination after termination",
                "122": "Retrieve data before initialization",
                "132": "Store data before initialization",
                "142": "Commit before initialization",
            };

            return errors[errorCode] ?? "Unknown error";
        },

        GetDiagnostic(errorCode) {
            return api.GetErrorString(
                errorCode || lastError
            );
        },
    };

    return api;
}

function ScormPlayer({
    content,
    scormUrl,
}: {
    content: LearnerPreviewContent;
    scormUrl: string;
}) {
    /*
     * SCORM uses the SAME learner frame as every other resource.
     *
     * Do not force an assumed 1280x720/960x540 package size here.
     * The iframe receives the exact dimensions of the common learner
     * viewport and the SCORM package can respond to that viewport.
     */

    useEffect(() => {
        let cancelled =
            false;

        async function registerRuntimeWorker() {
            if (
                typeof navigator === "undefined" ||
                !("serviceWorker" in navigator)
            ) {
                return;
            }

            try {
                const registration =
                    await navigator.serviceWorker.register(
                        `/scorm-service-worker.js?${SCORM_SERVICE_WORKER_VERSION}`,
                        {
                            scope:
                                "/scorm-runtime/",
                            updateViaCache:
                                "none",
                        }
                    );

                if (!cancelled) {
                    void registration
                        .update()
                        .catch(
                            () =>
                                undefined
                        );
                }
            } catch (error) {
                console.error(
                    "Unable to register SCORM service worker:",
                    error
                );
            }
        }

        void registerRuntimeWorker();

        return () => {
            cancelled =
                true;
        };
    }, []);

    /*
     * Expose both common SCORM API variants.
     */
    useEffect(() => {
        if (
            typeof window === "undefined" ||
            !scormUrl
        ) {
            return;
        }

        const packageId =
            String(
                content.scormPackageId ??
                "preview-package"
            ).trim() ||
            "preview-package";

        const learnerId =
            "preview-learner";

        const scorm12Api =
            createScorm12Api(
                packageId,
                learnerId
            );

        const scorm2004Api =
            createScorm2004Api(
                packageId,
                learnerId
            );

        const runtimeWindow =
            window as Window & {
                API?: Scorm12Api;
                API_1484_11?: Scorm2004Api;
            };

        runtimeWindow.API =
            scorm12Api;

        runtimeWindow.API_1484_11 =
            scorm2004Api;

        try {
            if (
                window.parent &&
                window.parent !==
                    window
            ) {
                const parentWindow =
                    window.parent as Window & {
                        API?: Scorm12Api;
                        API_1484_11?: Scorm2004Api;
                    };

                parentWindow.API =
                    scorm12Api;

                parentWindow.API_1484_11 =
                    scorm2004Api;
            }
        } catch {
            // Ignore cross-origin parent access.
        }

        return () => {
            try {
                scorm12Api.LMSCommit("");
            } catch {
                // Ignore cleanup errors.
            }

            try {
                scorm2004Api.Commit("");
            } catch {
                // Ignore cleanup errors.
            }

            if (
                runtimeWindow.API ===
                    scorm12Api
            ) {
                delete runtimeWindow.API;
            }

            if (
                runtimeWindow.API_1484_11 ===
                    scorm2004Api
            ) {
                delete runtimeWindow.API_1484_11;
            }
        };
    }, [
        content.scormPackageId,
        content.scormVersion,
        content.type,
        scormUrl,
    ]);

    if (!scormUrl) {
        return (
            <div
                style={{
                    width:
                        "100%",
                    height:
                        "100%",
                    display:
                        "flex",
                    alignItems:
                        "center",
                    justifyContent:
                        "center",
                    padding:
                        24,
                    boxSizing:
                        "border-box",
                    textAlign:
                        "center",
                    color:
                        "#9b3d3d",
                    fontSize:
                        12,
                    background:
                        "#ffffff",
                }}
            >
                <div>
                    <strong>
                        SCORM content cannot be launched.
                    </strong>

                    <p
                        style={{
                            margin:
                                "8px 0 0",
                        }}
                    >
                        The SCORM launch URL is not available.
                        Re-upload the SCORM ZIP in Learning Structure.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div
            style={{
                width:
                    "100%",
                height:
                    "100%",
                minWidth:
                    0,
                minHeight:
                    0,
                position:
                    "relative",
                overflow:
                    "hidden",
                background:
                    "#ffffff",
            }}
        >
            <iframe
                key={`${content.scormPackageId ?? content.id ?? "scorm"}-${scormUrl}`}
                title={
                    content.scormTitle ??
                    content.title ??
                    "SCORM learning content"
                }
                src={
                    scormUrl
                }
                allow="autoplay; fullscreen; clipboard-read; clipboard-write"
                allowFullScreen
                scrolling="auto"
                referrerPolicy="no-referrer-when-downgrade"
                style={{
                    display:
                        "block",
                    position:
                        "absolute",
                    inset:
                        0,
                    width:
                        "100%",
                    height:
                        "100%",
                    minWidth:
                        0,
                    minHeight:
                        0,
                    border:
                        0,
                    margin:
                        0,
                    padding:
                        0,
                    background:
                        "#ffffff",
                }}
            />
        </div>
    );
}

function isExternalHttpUrl(
    url: string
): boolean {
    return /^https?:\/\//i.test(
        url
    );
}

function isPdfContent(
    content: LearnerPreviewContent,
    url: string
): boolean {
    const mime =
        getMimeType(content);

    return (
        mime === "application/pdf" ||
        /\.pdf(?:$|[?#])/i.test(url)
    );
}

function isImageContent(
    content: LearnerPreviewContent,
    url: string
): boolean {
    const mime =
        getMimeType(content);

    return (
        mime.startsWith("image/") ||
        /\.(png|jpe?g|gif|webp|svg)(?:$|[?#])/i.test(
            url
        )
    );
}

function isVideoContent(
    content: LearnerPreviewContent,
    url: string
): boolean {
    const mime =
        getMimeType(content);

    return (
        mime.startsWith("video/") ||
        /\.(mp4|webm|ogg|mov|m4v)(?:$|[?#])/i.test(
            url
        )
    );
}

function isAudioContent(
    content: LearnerPreviewContent,
    url: string
): boolean {
    const mime =
        getMimeType(content);

    return (
        mime.startsWith("audio/") ||
        /\.(mp3|wav|ogg|m4a|aac|flac)(?:$|[?#])/i.test(
            url
        )
    );
}

function getScormRuntimeUrl(
    content: LearnerPreviewContent
): string {
    /*
     * The SCORM importer already extracts the ZIP and saves the
     * package metadata. Prefer the saved runtime URL exactly as
     * the old learner preview does.
     */
    const directUrl =
        content.scormLaunchUrl ??
        content.scormUrl ??
        content.launchUrl ??
        "";

    if (
        typeof directUrl === "string" &&
        directUrl.trim()
    ) {
        return directUrl.trim();
    }

    /*
     * Fallback for drafts that contain the extracted package ID
     * and launch file but not the precomputed launch URL.
     */
    const packageId =
        typeof content.scormPackageId === "string"
            ? content.scormPackageId.trim()
            : "";

    const launchFile =
        typeof content.scormLaunchFile === "string"
            ? content.scormLaunchFile
                  .trim()
                  .replace(/^\/+/, "")
            : "";

    if (
        !packageId ||
        !launchFile
    ) {
        return "";
    }

    return `/scorm-runtime/${encodeURIComponent(
        packageId
    )}/${launchFile
        .split("/")
        .map((segment) =>
            encodeURIComponent(segment)
        )
        .join("/")}`;
}

function isScormContent(
    content: LearnerPreviewContent
): boolean {
    const type =
        normalizeResourceType(
            content
        );

    return (
        type.includes("scorm") ||
        Boolean(
            (content as any).scormPackageId
        ) ||
        Boolean(
            (content as any).scormLaunchFile
        ) ||
        Boolean(
            (content as any).scormLaunchUrl
        ) ||
        Boolean(
            (content as any).scormUrl
        ) ||
        Boolean(
            (content as any).launchUrl &&
            String(
                (content as any).launchUrl
            ).includes("scorm")
        )
    );
}

function isOfficeDocument(
    content: LearnerPreviewContent,
    url: string
): boolean {
    const mime = getMimeType(content);

    return (
        mime === "application/msword" ||
        mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        mime === "application/vnd.ms-powerpoint" ||
        mime === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
        mime === "application/vnd.ms-powerpoint.presentation.macroEnabled.12" ||
        /\.(doc|docx|ppt|pptx|pptm)(?:$|[?#])/i.test(url)
    );
}


function isWordDocument(
    content: LearnerPreviewContent,
    url: string
): boolean {
    const mime =
        getMimeType(content);

    return (
        mime ===
            "application/msword" ||
        mime ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        /\.(doc|docx)(?:$|[?#])/i.test(
            content.fileName ??
            url
        )
    );
}

function isDocxContent(
    content: LearnerPreviewContent,
    url: string
): boolean {
    const mime =
        getMimeType(content);

    return (
        mime ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        /\.docx(?:$|[?#])/i.test(
            content.fileName ??
            url
        )
    );
}

function isLegacyDocContent(
    content: LearnerPreviewContent,
    url: string
): boolean {
    const mime =
        getMimeType(content);

    return (
        mime ===
            "application/msword" ||
        /\.doc(?:$|[?#])/i.test(
            content.fileName ??
            url
        )
    );
}

/* =========================================================
   DOCX PREVIEW

   DOCX is an OOXML ZIP package. We already use JSZip in this
   CourseWizard, so Learner View can extract word/document.xml,
   relationships and embedded media without opening/downloading
   the original file.

   This is a learner preview renderer, not a Word editor.
========================================================= */


type InFramePagerProps = {
    current: number;
    total?: number;
    label: string;
    onPrevious: () => void;
    onNext: () => void;
    disablePrevious?: boolean;
    disableNext?: boolean;
};

function InFramePager({
    current,
    total,
    label,
    onPrevious,
    onNext,
    disablePrevious = false,
    disableNext = false,
}: InFramePagerProps) {
    return (
        <div
            style={{
                flex:
                    "0 0 46px",
                height:
                    46,
                display:
                    "grid",
                gridTemplateColumns:
                    "1fr auto 1fr",
                alignItems:
                    "center",
                gap:
                    12,
                padding:
                    "0 14px",
                boxSizing:
                    "border-box",
                borderTop:
                    "1px solid rgba(104,115,134,0.14)",
                background:
                    "#f7f9fa",
                color:
                    "#556170",
                fontSize:
                    12,
            }}
        >
            <button
                type="button"
                onClick={
                    onPrevious
                }
                disabled={
                    disablePrevious
                }
                style={{
                    justifySelf:
                        "start",
                    minWidth:
                        92,
                    height:
                        32,
                    padding:
                        "0 13px",
                    border:
                        "none",
                    borderRadius:
                        9,
                    background:
                        disablePrevious
                            ? "#edf0f2"
                            : "#ffffff",
                    color:
                        disablePrevious
                            ? "#a7afb8"
                            : "#174f84",
                    cursor:
                        disablePrevious
                            ? "not-allowed"
                            : "pointer",
                    boxShadow:
                        disablePrevious
                            ? "none"
                            : "2px 2px 5px rgba(197,198,204,0.55), -2px -2px 5px #ffffff",
                    fontSize:
                        12,
                    fontWeight:
                        700,
                }}
            >
                ← Previous
            </button>

            <div
                style={{
                    minWidth:
                        120,
                    textAlign:
                        "center",
                    whiteSpace:
                        "nowrap",
                    fontWeight:
                        700,
                    color:
                        "#3f4b5f",
                }}
            >
                {label}{" "}
                {current}
                {typeof total ===
                    "number" &&
                    total > 0
                    ? ` / ${total}`
                    : ""}
            </div>

            <button
                type="button"
                onClick={
                    onNext
                }
                disabled={
                    disableNext
                }
                style={{
                    justifySelf:
                        "end",
                    minWidth:
                        92,
                    height:
                        32,
                    padding:
                        "0 13px",
                    border:
                        "none",
                    borderRadius:
                        9,
                    background:
                        disableNext
                            ? "#edf0f2"
                            : "#ffffff",
                    color:
                        disableNext
                            ? "#a7afb8"
                            : "#174f84",
                    cursor:
                        disableNext
                            ? "not-allowed"
                            : "pointer",
                    boxShadow:
                        disableNext
                            ? "none"
                            : "2px 2px 5px rgba(197,198,204,0.55), -2px -2px 5px #ffffff",
                    fontSize:
                        12,
                    fontWeight:
                        700,
                }}
            >
                Next →
            </button>
        </div>
    );
}

function estimatePdfPageCount(
    buffer: ArrayBuffer
): number {
    try {
        const bytes =
            new Uint8Array(
                buffer
            );

        /*
         * PDF syntax markers are ASCII even when stream bodies are binary.
         * Count actual /Type /Page objects and exclude /Pages tree nodes.
         * This gives a dependable page count for normal uploaded PDFs
         * without adding a second PDF rendering dependency.
         */
        let source =
            "";

        const chunkSize =
            65536;

        for (
            let offset = 0;
            offset < bytes.length;
            offset += chunkSize
        ) {
            source +=
                String.fromCharCode(
                    ...bytes.subarray(
                        offset,
                        Math.min(
                            offset +
                                chunkSize,
                            bytes.length
                        )
                    )
                );
        }

        const matches =
            source.match(
                /\/Type\s*\/Page(?!s)\b/g
            );

        return Math.max(
            1,
            matches?.length ??
                1
        );
    } catch {
        return 1;
    }
}

function PdfPagedPreview({
    resourceUrl,
    title,
    onLoaded,
}: {
    resourceUrl: string;
    title?: string;
    onLoaded?: () => void;
}) {
    const [
        currentPage,
        setCurrentPage,
    ] =
        useState(1);

    const [
        totalPages,
        setTotalPages,
    ] =
        useState(1);

    const onLoadedRef =
        useRef(onLoaded);

    useEffect(() => {
        onLoadedRef.current =
            onLoaded;
    }, [
        onLoaded,
    ]);

    useEffect(() => {
        let cancelled =
            false;

        setCurrentPage(
            1
        );

        async function readPageCount() {
            try {
                const response =
                    await fetch(
                        resourceUrl
                    );

                if (
                    !response.ok
                ) {
                    return;
                }

                const buffer =
                    await response.arrayBuffer();

                if (
                    !cancelled
                ) {
                    setTotalPages(
                        estimatePdfPageCount(
                            buffer
                        )
                    );
                }
            } catch {
                if (
                    !cancelled
                ) {
                    setTotalPages(
                        1
                    );
                }
            }
        }

        void readPageCount();

        return () => {
            cancelled =
                true;
        };
    }, [
        resourceUrl,
    ]);

    const pageUrl =
        `${resourceUrl}#page=${currentPage}&view=FitH&toolbar=0&navpanes=0&scrollbar=0`;

    return (
        <div
            style={{
                width:
                    "100%",
                height:
                    "100%",
                minHeight:
                    0,
                display:
                    "flex",
                flexDirection:
                    "column",
                overflow:
                    "hidden",
                background:
                    "#eef2f4",
            }}
        >
            <div
                style={{
                    flex:
                        "1 1 auto",
                    minHeight:
                        0,
                    overflow:
                        "hidden",
                    background:
                        "#ffffff",
                }}
            >
                <iframe
                    key={
                        `${resourceUrl}-${currentPage}`
                    }
                    title={
                        title ??
                        "PDF document"
                    }
                    src={
                        pageUrl
                    }
                    style={{
                        width:
                            "100%",
                        height:
                            "100%",
                        border:
                            "none",
                        display:
                            "block",
                        background:
                            "#ffffff",
                    }}
                    onLoad={() =>
                        onLoadedRef.current?.()
                    }
                />
            </div>

            <InFramePager
                current={
                    currentPage
                }
                total={
                    totalPages
                }
                label="Page"
                disablePrevious={
                    currentPage <=
                    1
                }
                disableNext={
                    currentPage >=
                    totalPages
                }
                onPrevious={() =>
                    setCurrentPage(
                        (
                            page
                        ) =>
                            Math.max(
                                1,
                                page -
                                    1
                            )
                    )
                }
                onNext={() =>
                    setCurrentPage(
                        (
                            page
                        ) =>
                            Math.min(
                                totalPages,
                                page +
                                    1
                            )
                    )
                }
            />
        </div>
    );
}

type DocxPreviewProps = {
    resourceUrl: string;
    title?: string;
    onLoaded?: () => void;
    onError?: (
        message: string
    ) => void;
};

function escapeHtml(
    value: string
): string {
    return value
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}

function getXmlLocalName(
    node: Node
): string {
    /*
     * TypeScript's generic Node type does not expose localName.
     * localName belongs to Element, so narrow the node first.
     */
    if (
        node instanceof Element
    ) {
        return (
            node.localName ||
            node.nodeName
                .split(":")
                .pop() ||
            node.nodeName
        );
    }

    return (
        node.nodeName
            .split(":")
            .pop() ||
        node.nodeName
    );
}

function getElementChildren(
    node: Node
): Element[] {
    return Array.from(
        node.childNodes
    ).filter(
        (
            child
        ): child is Element =>
            child.nodeType ===
            Node.ELEMENT_NODE
    );
}

function getDescendantsByLocalName(
    root: Element | Document,
    localName: string
): Element[] {
    return Array.from(
        root.getElementsByTagName("*")
    ).filter(
        (element) =>
            getXmlLocalName(
                element
            ) === localName
    );
}

function firstDescendantByLocalName(
    root: Element,
    localName: string
): Element | null {
    return (
        getDescendantsByLocalName(
            root,
            localName
        )[0] ??
        null
    );
}

function getRelationshipId(
    element: Element
): string {
    for (
        const attribute
        of Array.from(
            element.attributes
        )
    ) {
        if (
            attribute.localName ===
                "embed" ||
            attribute.localName ===
                "id"
        ) {
            if (
                attribute.name ===
                    "r:embed" ||
                attribute.name ===
                    "r:id" ||
                attribute.namespaceURI?.includes(
                    "relationships"
                )
            ) {
                return (
                    attribute.value ??
                    ""
                );
            }
        }
    }

    return "";
}

function normalizeDocxTarget(
    target: string
): string {
    const clean =
        target
            .replace(
                /\\/g,
                "/"
            )
            .replace(
                /^\.\//,
                ""
            );

    if (
        clean.startsWith(
            "/"
        )
    ) {
        return clean.replace(
            /^\/+/,
            ""
        );
    }

    if (
        clean.startsWith(
            "word/"
        )
    ) {
        return clean;
    }

    return `word/${clean}`;
}

function renderDocxRun(
    run: Element,
    imageUrls: Record<
        string,
        string
    >
): string {
    const properties =
        getElementChildren(
            run
        ).find(
            (element) =>
                getXmlLocalName(
                    element
                ) ===
                "rPr"
        );

    const bold =
        properties
            ? Boolean(
                  firstDescendantByLocalName(
                      properties,
                      "b"
                  )
              )
            : false;

    const italic =
        properties
            ? Boolean(
                  firstDescendantByLocalName(
                      properties,
                      "i"
                  )
              )
            : false;

    const underline =
        properties
            ? Boolean(
                  firstDescendantByLocalName(
                      properties,
                      "u"
                  )
              )
            : false;

    let inner =
        "";

    for (
        const child
        of getElementChildren(
            run
        )
    ) {
        const name =
            getXmlLocalName(
                child
            );

        if (
            name ===
            "t"
        ) {
            inner +=
                escapeHtml(
                    child.textContent ??
                        ""
                );

            continue;
        }

        if (
            name ===
            "tab"
        ) {
            inner +=
                "&emsp;";

            continue;
        }

        if (
            name ===
                "br" ||
            name ===
                "cr"
        ) {
            inner +=
                "<br />";

            continue;
        }

        /*
         * Embedded image. Search this run for a:blip r:embed="rId...".
         */
        const blips =
            getDescendantsByLocalName(
                child,
                "blip"
            );

        for (
            const blip
            of blips
        ) {
            const relationshipId =
                getRelationshipId(
                    blip
                );

            const imageUrl =
                imageUrls[
                    relationshipId
                ];

            if (
                imageUrl
            ) {
                inner +=
                    `<img src="${escapeHtml(
                        imageUrl
                    )}" alt="" style="max-width:100%;height:auto;display:block;margin:10px auto;" />`;
            }
        }
    }

    if (!inner) {
        return "";
    }

    if (underline) {
        inner =
            `<u>${inner}</u>`;
    }

    if (italic) {
        inner =
            `<em>${inner}</em>`;
    }

    if (bold) {
        inner =
            `<strong>${inner}</strong>`;
    }

    return inner;
}

function renderDocxParagraph(
    paragraph: Element,
    imageUrls: Record<
        string,
        string
    >
): string {
    const properties =
        getElementChildren(
            paragraph
        ).find(
            (element) =>
                getXmlLocalName(
                    element
                ) ===
                "pPr"
        );

    const styleElement =
        properties
            ? firstDescendantByLocalName(
                  properties,
                  "pStyle"
              )
            : null;

    let styleValue =
        "";

    if (
        styleElement
    ) {
        for (
            const attribute
            of Array.from(
                styleElement.attributes
            )
        ) {
            if (
                attribute.localName ===
                    "val"
            ) {
                styleValue =
                    attribute.value ??
                    "";

                break;
            }
        }
    }

    const runs =
        getElementChildren(
            paragraph
        ).filter(
            (element) =>
                getXmlLocalName(
                    element
                ) ===
                "r" ||
            getXmlLocalName(
                element
            ) ===
                "hyperlink"
        );

    let html =
        "";

    for (
        const item
        of runs
    ) {
        if (
            getXmlLocalName(
                item
            ) ===
            "r"
        ) {
            html +=
                renderDocxRun(
                    item,
                    imageUrls
                );

            continue;
        }

        for (
            const run
            of getElementChildren(
                item
            ).filter(
                (element) =>
                    getXmlLocalName(
                        element
                    ) ===
                    "r"
            )
        ) {
            html +=
                renderDocxRun(
                    run,
                    imageUrls
                );
        }
    }

    if (!html.trim()) {
        html =
            "&nbsp;";
    }

    if (
        /^heading1$/i.test(
            styleValue
        )
    ) {
        return `<h1>${html}</h1>`;
    }

    if (
        /^heading2$/i.test(
            styleValue
        )
    ) {
        return `<h2>${html}</h2>`;
    }

    if (
        /^heading3$/i.test(
            styleValue
        )
    ) {
        return `<h3>${html}</h3>`;
    }

    if (
        /^title$/i.test(
            styleValue
        )
    ) {
        return `<h1 class="docx-title">${html}</h1>`;
    }

    return `<p>${html}</p>`;
}

function renderDocxTable(
    table: Element,
    imageUrls: Record<
        string,
        string
    >
): string {
    const rows =
        getElementChildren(
            table
        ).filter(
            (element) =>
                getXmlLocalName(
                    element
                ) ===
                "tr"
        );

    const htmlRows =
        rows.map(
            (row) => {
                const cells =
                    getElementChildren(
                        row
                    ).filter(
                        (element) =>
                            getXmlLocalName(
                                element
                            ) ===
                                "tc"
                    );

                const htmlCells =
                    cells.map(
                        (cell) => {
                            const contents =
                                getElementChildren(
                                    cell
                                )
                                    .map(
                                        (
                                            child
                                        ) => {
                                            const name =
                                                getXmlLocalName(
                                                    child
                                                );

                                            if (
                                                name ===
                                                "p"
                                            ) {
                                                return renderDocxParagraph(
                                                    child,
                                                    imageUrls
                                                );
                                            }

                                            if (
                                                name ===
                                                "tbl"
                                            ) {
                                                return renderDocxTable(
                                                    child,
                                                    imageUrls
                                                );
                                            }

                                            return "";
                                        }
                                    )
                                    .join(
                                        ""
                                    );

                            return `<td>${contents}</td>`;
                        }
                    )
                    .join(
                        ""
                    );

                return `<tr>${htmlCells}</tr>`;
            }
        )
        .join(
            ""
        );

    return `<table>${htmlRows}</table>`;
}

function DocxPreview({
    resourceUrl,
    title,
    onLoaded,
    onError,
}: DocxPreviewProps) {
    const [
        pages,
        setPages,
    ] =
        useState<string[]>(
            []
        );

    const [
        currentPage,
        setCurrentPage,
    ] =
        useState<number>(
            1
        );

    const [
        loading,
        setLoading,
    ] =
        useState<boolean>(
            true
        );

    const [
        previewError,
        setPreviewError,
    ] =
        useState<string>(
            ""
        );

    /*
     * Keep callback props stable without making the DOCX loading effect
     * depend on newly-created inline functions from the parent.
     *
     * Without this, markComplete()/setResourceErrors() causes a parent
     * render, new callback identities, and a full DOCX reload/flicker.
     */
    const onLoadedRef =
        useRef(onLoaded);

    const onErrorRef =
        useRef(onError);

    useEffect(() => {
        onLoadedRef.current =
            onLoaded;

        onErrorRef.current =
            onError;
    }, [
        onLoaded,
        onError,
    ]);

    useEffect(() => {
        let cancelled =
            false;

        const createdUrls:
            string[] =
            [];

        async function loadDocx() {
            setLoading(
                true
            );

            setPreviewError(
                ""
            );

            try {
                const response =
                    await fetch(
                        resourceUrl
                    );

                if (
                    !response.ok
                ) {
                    throw new Error(
                        `Unable to load Word document (${response.status}).`
                    );
                }

                const buffer =
                    await response.arrayBuffer();

                const zip =
                    await JSZip.loadAsync(
                        buffer
                    );

                const documentEntry =
                    zip.file(
                        "word/document.xml"
                    );

                if (
                    !documentEntry
                ) {
                    throw new Error(
                        "This DOCX file does not contain word/document.xml."
                    );
                }

                const relationshipEntry =
                    zip.file(
                        "word/_rels/document.xml.rels"
                    );

                const relationships =
                    new Map<
                        string,
                        string
                    >();

                if (
                    relationshipEntry
                ) {
                    const relationshipXml =
                        await relationshipEntry.async(
                            "string"
                        );

                    const relationshipDocument =
                        new DOMParser().parseFromString(
                            relationshipXml,
                            "application/xml"
                        );

                    for (
                        const relationship
                        of Array.from(
                            relationshipDocument.getElementsByTagName(
                                "*"
                            )
                        ).filter(
                            (element) =>
                                getXmlLocalName(
                                    element
                                ) ===
                                "Relationship"
                        )
                    ) {
                        const id =
                            relationship.getAttribute(
                                "Id"
                            ) ??
                            "";

                        const target =
                            relationship.getAttribute(
                                "Target"
                            ) ??
                            "";

                        if (
                            id &&
                            target
                        ) {
                            relationships.set(
                                id,
                                normalizeDocxTarget(
                                    target
                                )
                            );
                        }
                    }
                }

                const imageUrls:
                    Record<
                        string,
                        string
                    > =
                    {};

                for (
                    const [
                        relationshipId,
                        target,
                    ]
                    of relationships
                ) {
                    if (
                        !target.startsWith(
                            "word/media/"
                        )
                    ) {
                        continue;
                    }

                    const mediaEntry =
                        zip.file(
                            target
                        );

                    if (
                        !mediaEntry
                    ) {
                        continue;
                    }

                    const blob =
                        await mediaEntry.async(
                            "blob"
                        );

                    const objectUrl =
                        URL.createObjectURL(
                            blob
                        );

                    createdUrls.push(
                        objectUrl
                    );

                    imageUrls[
                        relationshipId
                    ] =
                        objectUrl;
                }

                const documentXml =
                    await documentEntry.async(
                        "string"
                    );

                const document =
                    new DOMParser().parseFromString(
                        documentXml,
                        "application/xml"
                    );

                const parserErrors =
                    document.getElementsByTagName(
                        "parsererror"
                    );

                if (
                    parserErrors.length >
                    0
                ) {
                    throw new Error(
                        "Unable to parse the DOCX document."
                    );
                }

                const body =
                    Array.from(
                        document.getElementsByTagName(
                            "*"
                        )
                    ).find(
                        (element) =>
                            getXmlLocalName(
                                element
                            ) ===
                            "body"
                    );

                if (
                    !body
                ) {
                    throw new Error(
                        "DOCX document body was not found."
                    );
                }

                const blocks =
                    getElementChildren(
                        body
                    )
                        .map(
                            (
                                child
                            ) => {
                                const name =
                                    getXmlLocalName(
                                        child
                                    );

                                if (
                                    name ===
                                    "p"
                                ) {
                                    return renderDocxParagraph(
                                        child,
                                        imageUrls
                                    );
                                }

                                if (
                                    name ===
                                    "tbl"
                                ) {
                                    return renderDocxTable(
                                        child,
                                        imageUrls
                                    );
                                }

                                return "";
                            }
                        )
                        .filter(
                            (
                                block
                            ) =>
                                Boolean(
                                    block.trim()
                                )
                        );

                /*
                 * DOCX does not expose reliable rendered page boundaries
                 * after conversion to HTML. Build stable learner pages from
                 * logical document blocks instead of one long scroll.
                 *
                 * Approximate one Word page by content weight while always
                 * keeping tables/paragraphs intact.
                 */
                const pagedHtml:
                    string[] =
                    [];

                let pageBlocks:
                    string[] =
                    [];

                let pageWeight =
                    0;

                const PAGE_WEIGHT =
                    4200;

                for (
                    const block
                    of blocks
                ) {
                    const textWeight =
                        block
                            .replace(
                                /<[^>]+>/g,
                                ""
                            )
                            .replace(
                                /&nbsp;/g,
                                " "
                            )
                            .length;

                    const structuralWeight =
                        /<table/i.test(
                            block
                        )
                            ? 1800
                            : /<img/i.test(
                                  block
                              )
                                ? 1400
                                : 300;

                    const blockWeight =
                        textWeight +
                        structuralWeight;

                    if (
                        pageBlocks.length >
                            0 &&
                        pageWeight +
                            blockWeight >
                            PAGE_WEIGHT
                    ) {
                        pagedHtml.push(
                            pageBlocks.join(
                                ""
                            )
                        );

                        pageBlocks =
                            [];

                        pageWeight =
                            0;
                    }

                    pageBlocks.push(
                        block
                    );

                    pageWeight +=
                        blockWeight;
                }

                if (
                    pageBlocks.length >
                    0
                ) {
                    pagedHtml.push(
                        pageBlocks.join(
                            ""
                        )
                    );
                }

                if (
                    cancelled
                ) {
                    return;
                }

                setPages(
                    pagedHtml.length >
                        0
                        ? pagedHtml
                        : [
                              "<p>This document does not contain previewable text.</p>",
                          ]
                );

                setCurrentPage(
                    1
                );

                setLoading(
                    false
                );

                onLoadedRef.current?.();
            } catch (error) {
                if (
                    cancelled
                ) {
                    return;
                }

                const message =
                    error instanceof
                    Error
                        ? error.message
                        : "Unable to preview the DOCX document.";

                setPreviewError(
                    message
                );

                setLoading(
                    false
                );

                onErrorRef.current?.(
                    message
                );
            }
        }

        void loadDocx();

        return () => {
            cancelled =
                true;

            for (
                const url
                of createdUrls
            ) {
                URL.revokeObjectURL(
                    url
                );
            }
        };
    }, [
        resourceUrl,
    ]);

    if (
        loading
    ) {
        return (
            <div
                style={{
                    width:
                        "100%",
                    height:
                        "100%",
                    display:
                        "flex",
                    alignItems:
                        "center",
                    justifyContent:
                        "center",
                    background:
                        "#ffffff",
                    color:
                        "#687386",
                    fontSize:
                        13,
                }}
            >
                Preparing Word document preview...
            </div>
        );
    }

    if (
        previewError
    ) {
        return (
            <div
                style={{
                    width:
                        "100%",
                    height:
                        "100%",
                    display:
                        "flex",
                    alignItems:
                        "center",
                    justifyContent:
                        "center",
                    padding:
                        28,
                    boxSizing:
                        "border-box",
                    background:
                        "#ffffff",
                    color:
                        "#9b3d3d",
                    textAlign:
                        "center",
                }}
            >
                <div>
                    <strong>
                        Word document preview unavailable
                    </strong>

                    <p>
                        {previewError}
                    </p>
                </div>
            </div>
        );
    }

    const totalPages =
        Math.max(
            1,
            pages.length
        );

    const safeCurrentPage =
        Math.min(
            Math.max(
                currentPage,
                1
            ),
            totalPages
        );

    const currentHtml =
        pages[
            safeCurrentPage -
                1
        ] ??
        "";

    return (
        <div
            style={{
                width:
                    "100%",
                height:
                    "100%",
                minHeight:
                    0,
                display:
                    "flex",
                flexDirection:
                    "column",
                overflow:
                    "hidden",
                background:
                    "#eef2f4",
            }}
        >
            <div
                style={{
                    flex:
                        "1 1 auto",
                    minHeight:
                        0,
                    overflow:
                        "hidden",
                    boxSizing:
                        "border-box",
                    background:
                        "#eef2f4",
                    padding:
                        "16px 20px",
                }}
            >
                <article
                    aria-label={
                        title ??
                        "Word document"
                    }
                    style={{
                        width:
                            "min(100%, 850px)",
                        height:
                            "100%",
                        margin:
                            "0 auto",
                        padding:
                            "38px 48px",
                        overflow:
                            "auto",
                        scrollbarGutter:
                            "stable",
                        boxSizing:
                            "border-box",
                        background:
                            "#ffffff",
                        color:
                            "#202938",
                        fontFamily:
                            "Arial, Helvetica, sans-serif",
                        fontSize:
                            15,
                        lineHeight:
                            1.6,
                        boxShadow:
                            "0 1px 8px rgba(0,0,0,0.12)",
                    }}
                >
                    <style>{`
                        .neurolxp-docx-preview h1 {
                            font-size: 28px;
                            line-height: 1.25;
                            margin: 0 0 20px;
                        }

                        .neurolxp-docx-preview h2 {
                            font-size: 23px;
                            line-height: 1.3;
                            margin: 22px 0 13px;
                        }

                        .neurolxp-docx-preview h3 {
                            font-size: 19px;
                            line-height: 1.35;
                            margin: 18px 0 11px;
                        }

                        .neurolxp-docx-preview p {
                            margin: 0 0 11px;
                        }

                        .neurolxp-docx-preview table {
                            width: 100%;
                            border-collapse: collapse;
                            margin: 14px 0;
                        }

                        .neurolxp-docx-preview td,
                        .neurolxp-docx-preview th {
                            border: 1px solid #cfd7dd;
                            padding: 7px 9px;
                            vertical-align: top;
                        }

                        .neurolxp-docx-preview img {
                            max-width: 100%;
                            max-height: 360px;
                            object-fit: contain;
                            height: auto;
                        }

                        @media (max-width: 700px) {
                            .neurolxp-docx-preview {
                                padding: 24px 20px !important;
                            }
                        }
                    `}</style>

                    <div
                        className="neurolxp-docx-preview"
                        dangerouslySetInnerHTML={{
                            __html:
                                currentHtml,
                        }}
                    />
                </article>
            </div>

            <InFramePager
                current={
                    safeCurrentPage
                }
                total={
                    totalPages
                }
                label="Page"
                disablePrevious={
                    safeCurrentPage <=
                    1
                }
                disableNext={
                    safeCurrentPage >=
                    totalPages
                }
                onPrevious={() =>
                    setCurrentPage(
                        (
                            page
                        ) =>
                            Math.max(
                                1,
                                page -
                                    1
                            )
                    )
                }
                onNext={() =>
                    setCurrentPage(
                        (
                            page
                        ) =>
                            Math.min(
                                totalPages,
                                page +
                                    1
                            )
                    )
                }
            />
        </div>
    );
}

function isPowerPointContent(
    content: LearnerPreviewContent,
    url: string
): boolean {
    const mime = getMimeType(content);

    return (
        mime === "application/vnd.ms-powerpoint" ||
        mime === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
        mime === "application/vnd.ms-powerpoint.presentation.macroEnabled.12" ||
        /\.(ppt|pptx|pptm)(?:$|[?#])/i.test(url)
    );
}

function isMacroEnabledPowerPoint(
    content: LearnerPreviewContent,
    url: string
): boolean {
    const mime = getMimeType(content);

    return (
        mime === "application/vnd.ms-powerpoint.presentation.macroEnabled.12" ||
        /\.pptm(?:$|[?#])/i.test(url)
    );
}

/*
 * PPTM is an OOXML presentation with a VBA project.
 *
 * For learner preview we create a temporary in-memory PPTX copy:
 * remove the VBA binary and its relationship, then switch the
 * macro-enabled presentation content type to the normal PPTX type.
 *
 * The original uploaded PPTM is never modified.
 */
async function convertPptmToPptx(
    input: ArrayBuffer
): Promise<ArrayBuffer> {
    const zip = await JSZip.loadAsync(input);

    for (const name of Object.keys(zip.files)) {
        if (/(^|\/)vbaProject\.bin$/i.test(name)) {
            zip.remove(name);
        }
    }

    for (const name of Object.keys(zip.files)) {
        if (!/(^|\/)\.rels$/i.test(name)) {
            continue;
        }

        const entry = zip.file(name);
        if (!entry) continue;

        const xml = await entry.async("string");

        if (/vbaProject/i.test(xml)) {
            zip.file(
                name,
                xml.replace(
                    /<Relationship\b[^>]*(?:vbaProject|vbaProject\.bin)[^>]*\/?>/gi,
                    ""
                )
            );
        }
    }

    const contentTypes = zip.file("[Content_Types].xml");

    if (contentTypes) {
        const xml = await contentTypes.async("string");

        zip.file(
            "[Content_Types].xml",
            xml
                .replace(
                    /<Override\b[^>]*(?:vbaProject|vbaProject\.bin)[^>]*\/?>/gi,
                    ""
                )
                .replace(
                    /application\/vnd\.ms-powerpoint\.presentation\.macroEnabled\.main\+xml/gi,
                    "application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"
                )
        );
    }

    return zip.generateAsync({
        type: "arraybuffer",
        compression: "DEFLATE",
    });
}

function PowerPointPreview({
    resourceUrl,
    isPptm,
    onLoaded,
    onError,
}: {
    resourceUrl: string;
    isPptm: boolean;
    onLoaded?: () => void;
    onError?: (
        message: string
    ) => void;
}) {
    const containerRef =
        useRef<HTMLDivElement | null>(
            null
        );

    const onLoadedRef =
        useRef(onLoaded);

    const onErrorRef =
        useRef(onError);

    const [
        currentSlide,
        setCurrentSlide,
    ] =
        useState(1);

    const [
        totalSlides,
        setTotalSlides,
    ] =
        useState(1);

    useEffect(() => {
        onLoadedRef.current =
            onLoaded;

        onErrorRef.current =
            onError;
    }, [
        onLoaded,
        onError,
    ]);

    useEffect(() => {
        let cancelled =
            false;

        let resizeObserver:
            ResizeObserver | null =
            null;

        let renderTimer:
            ReturnType<typeof setTimeout> | null =
            null;

        async function renderPresentation() {
            const container =
                containerRef.current;

            if (
                !container ||
                !resourceUrl
            ) {
                return;
            }

            try {
                const response =
                    await fetch(
                        resourceUrl
                    );

                if (
                    !response.ok
                ) {
                    throw new Error(
                        `Unable to load PowerPoint (${response.status}).`
                    );
                }

                let buffer =
                    await response.arrayBuffer();

                if (
                    isPptm
                ) {
                    buffer =
                        await convertPptmToPptx(
                            buffer
                        );
                }

                if (
                    cancelled
                ) {
                    return;
                }

                const render =
                    () => {
                        if (
                            cancelled ||
                            !containerRef.current
                        ) {
                            return;
                        }

                        const host =
                            containerRef.current;

                        host.innerHTML =
                            "";

                        const width =
                            Math.max(
                                320,
                                Math.floor(
                                    host.clientWidth ||
                                        960
                                )
                            );

                        const height =
                            Math.max(
                                180,
                                Math.floor(
                                    host.clientHeight ||
                                        (width *
                                            9) /
                                            16
                                )
                            );

                        try {
                            const previewer =
                                initPptxPreview(
                                    host,
                                    {
                                        width,
                                        height,
                                    }
                                );

                            previewer.preview(
                                buffer
                            );

                            /*
                             * pptx-preview renders slide nodes into the host.
                             * Wait for those nodes, then keep exactly one
                             * slide visible at a time.
                             */
                            setTimeout(
                                () => {
                                    if (
                                        cancelled ||
                                        !containerRef.current
                                    ) {
                                        return;
                                    }

                                    const currentHost =
                                        containerRef.current;

                                    const candidates =
                                        Array.from(
                                            currentHost.children
                                        ).filter(
                                            (
                                                child
                                            ) =>
                                                child instanceof
                                                    HTMLElement
                                        ) as HTMLElement[];

                                    const slides =
                                        candidates.length >
                                            0
                                            ? candidates
                                            : [];

                                    setTotalSlides(
                                        Math.max(
                                            1,
                                            slides.length
                                        )
                                    );

                                    setCurrentSlide(
                                        1
                                    );

                                    onLoadedRef.current?.();
                                },
                                120
                            );
                        } catch (error) {
                            onErrorRef.current?.(
                                error instanceof
                                    Error
                                    ? error.message
                                    : "Unable to render the PowerPoint presentation."
                            );
                        }
                    };

                render();

                if (
                    typeof ResizeObserver !==
                    "undefined"
                ) {
                    resizeObserver =
                        new ResizeObserver(
                            () => {
                                if (
                                    renderTimer
                                ) {
                                    clearTimeout(
                                        renderTimer
                                    );
                                }

                                renderTimer =
                                    setTimeout(
                                        render,
                                        160
                                    );
                            }
                        );

                    resizeObserver.observe(
                        container
                    );
                }
            } catch (error) {
                if (
                    cancelled
                ) {
                    return;
                }

                onErrorRef.current?.(
                    error instanceof
                        Error
                        ? error.message
                        : "Unable to preview the PowerPoint presentation."
                );
            }
        }

        void renderPresentation();

        return () => {
            cancelled =
                true;

            resizeObserver?.disconnect();

            if (
                renderTimer
            ) {
                clearTimeout(
                    renderTimer
                );
            }

            if (
                containerRef.current
            ) {
                containerRef.current.innerHTML =
                    "";
            }
        };
    }, [
        resourceUrl,
        isPptm,
    ]);

    useEffect(() => {
        const host =
            containerRef.current;

        if (!host) {
            return;
        }

        const slides =
            Array.from(
                host.children
            ).filter(
                (
                    child
                ): child is HTMLElement =>
                    child instanceof
                    HTMLElement
            );

        if (
            slides.length ===
            0
        ) {
            return;
        }

        slides.forEach(
            (
                slide,
                index
            ) => {
                const active =
                    index ===
                    currentSlide -
                        1;

                slide.style.display =
                    active
                        ? "block"
                        : "none";

                slide.style.margin =
                    "0 auto";

                slide.style.maxWidth =
                    "100%";

                slide.style.maxHeight =
                    "100%";
            }
        );
    }, [
        currentSlide,
        totalSlides,
    ]);

    return (
        <div
            style={{
                width:
                    "100%",
                height:
                    "100%",
                minHeight:
                    0,
                display:
                    "flex",
                flexDirection:
                    "column",
                overflow:
                    "hidden",
                background:
                    "#ffffff",
            }}
        >
            <div
                ref={
                    containerRef
                }
                style={{
                    flex:
                        "1 1 auto",
                    minHeight:
                        0,
                    overflow:
                        "hidden",
                    background:
                        "#ffffff",
                    display:
                        "flex",
                    alignItems:
                        "center",
                    justifyContent:
                        "center",
                }}
            />

            <InFramePager
                current={
                    currentSlide
                }
                total={
                    totalSlides
                }
                label="Slide"
                disablePrevious={
                    currentSlide <=
                    1
                }
                disableNext={
                    currentSlide >=
                    totalSlides
                }
                onPrevious={() =>
                    setCurrentSlide(
                        (
                            slide
                        ) =>
                            Math.max(
                                1,
                                slide -
                                    1
                            )
                    )
                }
                onNext={() =>
                    setCurrentSlide(
                        (
                            slide
                        ) =>
                            Math.min(
                                totalSlides,
                                slide +
                                    1
                            )
                    )
                }
            />
        </div>
    );
}

function isHtmlContent(
    content: LearnerPreviewContent,
    url: string
): boolean {
    const mime =
        getMimeType(content);

    return (
        mime === "text/html" ||
        /\.(html?|php)(?:$|[?#])/i.test(
            url
        )
    );
}

/*
 * SCORM packages are NOT rendered by loading the ZIP itself.
 *
 * During content import, LearningStructureBuilder extracts the ZIP
 * with JSZip, validates imsmanifest.xml, stores the extracted package
 * in the existing SCORM browser storage, and persists:
 *   scormPackageId
 *   scormVersion
 *   scormLaunchFile
 *   scormLaunchUrl
 *
 * Learner View only launches the prepared SCORM runtime:
 *   /scorm-runtime/{packageId}/{launchFile}
 *
 * Therefore Sample_SCORM.zip is never passed directly to iframe src.
 * The iframe receives the extracted launch source.

 */
/* =========================================================
   LOCAL FILE PAYLOAD RESOLUTION

   If the builder saved the actual file in IndexedDB, retrieve
   it here. If it saved a data/blob URL directly, use that.
========================================================= */

async function resolveStoredFileUrl(
    content: LearnerPreviewContent
): Promise<string> {

    const directUrl =
        getResourceUrl(
            content
        );

    if (directUrl) {
        return directUrl;
    }

    /*
     * Normal uploaded files are stored by LearningStructureBuilder
     * in its course-content IndexedDB using the stable resourceKey
     * (for example: content:<contentId>).  Learner View must use the
     * same storage implementation.  Do not open guessed database
     * names here because that can return a different/empty database
     * and causes:
     * "The uploaded resource could not be resolved."
     */
    const resourceKey = String(
        (content as any).resourceKey ??
        (content as any).fileStorageKey ??
        (content as any).storageKey ??
        ""
    ).trim();

    if (!resourceKey) {
        return "";
    }

    try {
        const storedBlob =
            await getStoredLearningContentBlob(
                resourceKey
            );

        if (storedBlob) {
            return URL.createObjectURL(
                storedBlob
            );
        }
    } catch (error) {
        console.error(
            "Unable to resolve stored learning content:",
            error
        );
    }

    return "";
}

function openLearnerFileDatabase(): Promise<IDBDatabase | null> {
    return new Promise(
        (resolve) => {
            if (
                typeof window ===
                "undefined" ||
                !("indexedDB" in window)
            ) {
                resolve(null);
                return;
            }

            /*
             * The exact DB/store names can differ between builders.
             * Try the known course-content names first.
             */
            const databaseNames = [
                "neurolxp-course-content",
                "course-content",
                "courseFiles",
                "course-files",
                "course_uploads",
            ];

            let index = 0;

            const tryNext =
                () => {
                    if (
                        index >=
                        databaseNames.length
                    ) {
                        resolve(null);
                        return;
                    }

                    const name =
                        databaseNames[index++];

                    let settled =
                        false;

                    const request =
                        indexedDB.open(
                            name
                        );

                    request.onsuccess =
                        () => {
                            if (
                                settled
                            ) {
                                return;
                            }

                            settled = true;
                            resolve(
                                request.result
                            );
                        };

                    request.onerror =
                        () => {
                            if (
                                settled
                            ) {
                                return;
                            }

                            settled = true;
                            tryNext();
                        };

                    request.onupgradeneeded =
                        () => {
                            /*
                             * Never create a new database/store from
                             * Learner View. If it does not already
                             * exist, close and continue.
                             */
                            try {
                                request.result.close();
                            } catch {
                                // Ignore close failures.
                            }

                            if (
                                !settled
                            ) {
                                settled = true;
                                tryNext();
                            }
                        };
                };

            tryNext();
        }
    );
}

function readLearnerFile(
    db: IDBDatabase,
    key: string
): Promise<any> {
    return new Promise(
        (resolve) => {
            const storeNames =
                Array.from(
                    db.objectStoreNames
                );

            if (
                storeNames.length ===
                0
            ) {
                resolve(null);
                return;
            }

            let index = 0;

            const tryStore =
                () => {
                    if (
                        index >=
                        storeNames.length
                    ) {
                        resolve(null);
                        return;
                    }

                    const storeName =
                        storeNames[index++];

                    try {
                        const transaction =
                            db.transaction(
                                storeName,
                                "readonly"
                            );

                        const request =
                            transaction
                                .objectStore(
                                    storeName
                                )
                                .get(
                                    key
                                );

                        request.onsuccess =
                            () => {
                                if (
                                    request.result !==
                                    undefined
                                ) {
                                    resolve(
                                        request.result
                                    );
                                } else {
                                    tryStore();
                                }
                            };

                        request.onerror =
                            () => {
                                tryStore();
                            };
                    } catch {
                        tryStore();
                    }
                };

            tryStore();
        }
    );
}


function InlineLearnerPreview({
    courseId,
    onBack,
}: {
    courseId: string;
    onBack: () => void;
}) {
    const [modules, setModules] =
        useState<LearnerPreviewModule[]>([]);

    const [selectedLearningId, setSelectedLearningId] =
        useState<string>("");

    const [selectedContentId, setSelectedContentId] =
        useState<string>("");

    const [reloadKey, setReloadKey] =
        useState(0);

    const [resolvedResourceUrls, setResolvedResourceUrls] =
        useState<Record<string, string>>({});

    const [resourceErrors, setResourceErrors] =
        useState<Record<string, string>>({});

    const [completedResources, setCompletedResources] =
        useState<Set<string>>(new Set());

    const [notes, setNotes] =
        useState("");

    const [showNotes, setShowNotes] =
        useState(false);

    const [isFullscreen, setIsFullscreen] =
        useState(false);

    const frameRef =
        useRef<HTMLDivElement | null>(null);

    /*
     * ---------------------------------------------------------
     * LOAD THE SAME COURSE DRAFT USED BY THE WIZARD
     * ---------------------------------------------------------
     */
    useEffect(() => {
        const draft =
            getCourseDraft(courseId);

        if (!draft) {
            setModules([]);
            setSelectedLearningId("");
            setSelectedContentId("");
            return;
        }

        const savedStructure =
            Array.isArray(draft.structure)
                ? draft.structure
                : [];

        const normalizedModules =
            savedStructure.map(
                (
                    module: any,
                    moduleIndex: number
                ) => ({
                    id:
                        typeof module?.id === "string"
                            ? module.id
                            : `module-${moduleIndex + 1}`,

                    title:
                        typeof module?.title === "string" &&
                        module.title.trim()
                            ? module.title
                            : `Module ${moduleIndex + 1}`,

                    description:
                        typeof module?.description === "string"
                            ? module.description
                            : "",

                    learnings:
                        Array.isArray(module?.learnings)
                            ? module.learnings
                            : [],
                })
            );

        setModules(normalizedModules);

        const allLearnings =
            normalizedModules.flatMap(
                (module) =>
                    Array.isArray(module.learnings)
                        ? module.learnings
                        : []
            );

        const firstLearning =
            allLearnings[0];

        setSelectedLearningId(
            (current) =>
                current &&
                allLearnings.some(
                    (learning) =>
                        learning?.id === current
                )
                    ? current
                    : firstLearning?.id ?? ""
        );

        const allContents =
            allLearnings.flatMap(
                (learning) =>
                    Array.isArray(learning.contents)
                        ? learning.contents
                        : []
            );

        const firstContent =
            allContents[0];

        setSelectedContentId(
            (current) =>
                current &&
                allContents.some(
                    (content) =>
                        content?.id === current
                )
                    ? current
                    : firstContent?.id ?? ""
        );

        try {
            const savedProgress =
                window.localStorage.getItem(
                    `neurolxp_learner_preview_progress_${courseId}`
                );

            if (savedProgress) {
                const parsed =
                    JSON.parse(savedProgress);

                if (Array.isArray(parsed)) {
                    setCompletedResources(
                        new Set(
                            parsed.filter(
                                (item): item is string =>
                                    typeof item === "string"
                            )
                        )
                    );
                }
            }

            const savedNotes =
                window.localStorage.getItem(
                    `neurolxp_learner_preview_notes_${courseId}`
                );

            if (savedNotes !== null) {
                setNotes(savedNotes);
            }
        } catch {
            // Demo progress is non-critical.
        }
    }, [courseId, reloadKey]);

    /*
     * ---------------------------------------------------------
     * RESOLVE UPLOADED FILES / URLS
     * ---------------------------------------------------------
     */
    useEffect(() => {
        let cancelled = false;

        async function resolveResources() {
            const allContents =
                modules.flatMap(
                    (module) =>
                        (module.learnings ?? []).flatMap(
                            (learning) =>
                                learning.contents ?? []
                        )
                );

            const entries =
                await Promise.all(
                    allContents.map(
                        async (
                            content,
                            index
                        ) => {
                            const key =
                                content.id ??
                                `${content.fileName ?? "content"}-${index}`;

                            const url =
                                await resolveStoredFileUrl(
                                    content
                                );

                            return [
                                key,
                                url,
                            ] as const;
                        }
                    )
                );

            if (!cancelled) {
                setResolvedResourceUrls(
                    Object.fromEntries(entries)
                );
            }
        }

        resolveResources();

        return () => {
            cancelled = true;
        };
    }, [modules, reloadKey]);

    /*
     * ---------------------------------------------------------
     * PERSIST LEARNER DEMO STATE
     * ---------------------------------------------------------
     */
    useEffect(() => {
        try {
            window.localStorage.setItem(
                `neurolxp_learner_preview_progress_${courseId}`,
                JSON.stringify(
                    Array.from(completedResources)
                )
            );
        } catch {
            // Ignore demo storage failures.
        }
    }, [courseId, completedResources]);

    useEffect(() => {
        try {
            window.localStorage.setItem(
                `neurolxp_learner_preview_notes_${courseId}`,
                notes
            );
        } catch {
            // Ignore demo storage failures.
        }
    }, [courseId, notes]);

    /*
     * ---------------------------------------------------------
     * LEARNING / CONTENT INDEX
     * ---------------------------------------------------------
     */
    const allLearnings =
        useMemo(
            () =>
                modules.flatMap(
                    (module) =>
                        Array.isArray(module.learnings)
                            ? module.learnings
                            : []
                ),
            [modules]
        );

    const selectedLearning =
        allLearnings.find(
            (learning) =>
                learning?.id ===
                selectedLearningId
        );

    const selectedContents =
        Array.isArray(
            selectedLearning?.contents
        )
            ? selectedLearning.contents
            : [];

    const selectedContent =
        selectedContents.find(
            (content) =>
                content?.id ===
                selectedContentId
        ) ?? selectedContents[0];

    /*
     * Select first resource whenever a learning unit changes.
     */
    useEffect(() => {
        if (!selectedLearning) {
            setSelectedContentId("");
            return;
        }

        const first =
            Array.isArray(
                selectedLearning.contents
            )
                ? selectedLearning.contents[0]
                : undefined;

        setSelectedContentId(
            (current) =>
                current &&
                selectedContents.some(
                    (content) =>
                        content?.id === current
                )
                    ? current
                    : first?.id ?? ""
        );
    }, [
        selectedLearningId,
        selectedLearning,
        selectedContents,
    ]);

    const flatContentItems =
        useMemo(
            () =>
                modules.flatMap(
                    (module) =>
                        (module.learnings ?? []).flatMap(
                            (learning) =>
                                (learning.contents ?? []).map(
                                    (content) => ({
                                        module,
                                        learning,
                                        content,
                                    })
                                )
                        )
                ),
            [modules]
        );

    const selectedFlatIndex =
        selectedContent
            ? flatContentItems.findIndex(
                (item) =>
                    item.content?.id ===
                    selectedContent.id
            )
            : -1;

    const previousItem =
        selectedFlatIndex > 0
            ? flatContentItems[
                selectedFlatIndex - 1
            ]
            : null;

    const nextItem =
        selectedFlatIndex >= 0 &&
        selectedFlatIndex <
            flatContentItems.length - 1
            ? flatContentItems[
                selectedFlatIndex + 1
            ]
            : null;

    const totalContentCount =
        flatContentItems.length;

    const completedCount =
        flatContentItems.filter(
            (item) =>
                item.content?.id &&
                completedResources.has(
                    item.content.id
                )
        ).length;

    const progress =
        totalContentCount === 0
            ? 0
            : Math.round(
                (completedCount /
                    totalContentCount) *
                100
            );

    /*
     * ---------------------------------------------------------
     * SELECTION / NAVIGATION
     * ---------------------------------------------------------
     */
    function selectContent(
        moduleId: string,
        learningId: string,
        contentId: string
    ) {
        setSelectedLearningId(
            learningId
        );

        setSelectedContentId(
            contentId
        );

        setResourceErrors({});
    }

    function goToItem(
        item:
            | {
                module: LearnerPreviewModule;
                learning: LearnerPreviewLearning;
                content: LearnerPreviewContent;
            }
            | null
    ) {
        if (!item) {
            return;
        }

        selectContent(
            item.module.id ?? "",
            item.learning.id ?? "",
            item.content.id ?? ""
        );
    }

    function goPrevious() {
        goToItem(previousItem);
    }

    function goNext() {
        goToItem(nextItem);
    }

    /*
     * ---------------------------------------------------------
     * COMPLETION
     * ---------------------------------------------------------
     */
    function markComplete(
        contentId?: string
    ) {
        if (!contentId) {
            return;
        }

        setCompletedResources(
            (previous) => {
                const next =
                    new Set(previous);

                next.add(contentId);

                return next;
            }
        );
    }

    function resetProgress() {
        setCompletedResources(
            new Set()
        );

        try {
            window.localStorage.removeItem(
                `neurolxp_learner_preview_progress_${courseId}`
            );
        } catch {
            // Ignore demo storage failures.
        }
    }

    /*
     * ---------------------------------------------------------
     * FULLSCREEN
     *
     * IMPORTANT: fullscreen is limited to the learner content
     * frame, not the entire CourseWizard.
     * ---------------------------------------------------------
     */
    async function toggleContentFullscreen() {
        const frame = frameRef.current;

        if (!frame) {
            return;
        }

        try {
            if (document.fullscreenElement === frame) {
                await document.exitFullscreen();
                return;
            }

            if (document.fullscreenElement) {
                await document.exitFullscreen();
            }

            await frame.requestFullscreen();
        } catch (error) {
            console.error(
                "Unable to enter content fullscreen:",
                error
            );
        }
    }

    useEffect(() => {
        function handleFullscreenChange() {
            setIsFullscreen(
                document.fullscreenElement ===
                frameRef.current
            );
        }

        document.addEventListener(
            "fullscreenchange",
            handleFullscreenChange
        );

        return () => {
            document.removeEventListener(
                "fullscreenchange",
                handleFullscreenChange
            );
        };
    }, []);

    useEffect(() => {
        function handleEscape(event: KeyboardEvent) {
            if (event.key !== "Escape") return;
            if (document.fullscreenElement) {
                void document.exitFullscreen();
            }
        }

        window.addEventListener("keydown", handleEscape);
        return () => window.removeEventListener("keydown", handleEscape);
    }, []);

    /*
     * ---------------------------------------------------------
     * RESOURCE RENDERER
     * ---------------------------------------------------------
     */
    function renderSelectedResource() {
        if (!selectedContent) {
            return (
                <div
                    style={{
                        height: "100%",
                        minHeight: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "column",
                        gap: 8,
                        color: "#687386",
                        textAlign: "center",
                    }}
                >
                    <strong>
                        No content selected
                    </strong>

                    <span>
                        Select a content item from
                        the course structure.
                    </span>
                </div>
            );
        }

        const content =
            selectedContent;

        const contentKey =
            content.id ??
            `${content.fileName ?? "content"}-selected`;

        const resourceUrl =
            resolvedResourceUrls[
                contentKey
            ] ??
            getResourceUrl(
                content
            ) ??
            "";

        const scormRuntimeUrl =
            isScormContent(
                content
            )
                ? getScormRuntimeUrl(
                    content
                )
                : "";

        const mime =
            getMimeType(
                content
            );

        const errorMessage =
            resourceErrors[
                contentKey
            ];

        if (
            !resourceUrl &&
            !scormRuntimeUrl
        ) {
            return (
                <div
                    style={{
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "column",
                        gap: 10,
                        padding: 30,
                        boxSizing: "border-box",
                        color: "#687386",
                        textAlign: "center",
                    }}
                >
                    <strong>
                        Content unavailable
                    </strong>

                    <span>
                        The uploaded resource could
                        not be resolved.
                    </span>

                    {content.fileName && (
                        <small>
                            {content.fileName}
                        </small>
                    )}
                </div>
            );
        }

        if (
            isScormContent(
                content
            )
        ) {
            return scormRuntimeUrl ? (
                <ScormPlayer
                    content={content}
                    scormUrl={scormRuntimeUrl}
                />
            ) : (
                <div
                    style={{
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#687386",
                    }}
                >
                    SCORM launch content is unavailable.
                </div>
            );
        }

        if (
            isPdfContent(
                content,
                resourceUrl
            )
        ) {
            return (
                <PdfPagedPreview
                    resourceUrl={
                        resourceUrl
                    }
                    title={
                        content.title ??
                        content.fileName ??
                        "PDF document"
                    }
                    onLoaded={() =>
                        markComplete(
                            content.id
                        )
                    }
                />
            );
        }

        if (
            isYouTubeUrl(
                resourceUrl
            )
        ) {
            return (
                <iframe
                    title={
                        content.title ??
                        "YouTube learning video"
                    }
                    src={getYouTubeEmbedUrl(
                        resourceUrl
                    )}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    style={{
                        width: "100%",
                        height: "100%",
                        border: "none",
                        display: "block",
                        background:
                            "#000000",
                    }}
                    onLoad={() =>
                        markComplete(
                            content.id
                        )
                    }
                />
            );
        }

        if (
            isVideoContent(
                content,
                resourceUrl
            )
        ) {
            return (
                <video
                    controls
                    preload="metadata"
                    style={{
                        width: "100%",
                        height: "100%",
                        display: "block",
                        objectFit: "contain",
                        background:
                            "#111827",
                    }}
                    onEnded={() =>
                        markComplete(
                            content.id
                        )
                    }
                    onError={() =>
                        setResourceErrors(
                            (previous) => ({
                                ...previous,
                                [contentKey]:
                                    "This video could not be loaded.",
                            })
                        )
                    }
                >
                    <source
                        src={resourceUrl}
                        type={
                            mime ||
                            undefined
                        }
                    />
                </video>
            );
        }

        if (
            isAudioContent(
                content,
                resourceUrl
            )
        ) {
            return (
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "column",
                        gap: 18,
                        padding: 30,
                        boxSizing: "border-box",
                        background:
                            "#ffffff",
                    }}
                >
                    <div
                        style={{
                            width: 62,
                            height: 62,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: "50%",
                            background:
                                "#dfe6e9",
                            color: "#174f84",
                            fontSize: 25,
                            boxShadow:
                                "inset 4px 4px 9px #c5c6cc, inset -4px -4px 9px #ffffff",
                        }}
                    >
                        ♪
                    </div>

                    <strong
                        style={{
                            color: "#2a354f",
                            fontSize: 15,
                        }}
                    >
                        {content.title ??
                            "Audio Resource"}
                    </strong>

                    <audio
                        controls
                        preload="metadata"
                        style={{
                            width:
                                "min(620px, 100%)",
                        }}
                        onEnded={() =>
                            markComplete(
                                content.id
                            )
                        }
                        onError={() =>
                            setResourceErrors(
                                (previous) => ({
                                    ...previous,
                                    [contentKey]:
                                        "This audio could not be loaded.",
                                })
                            )
                        }
                    >
                        <source
                            src={resourceUrl}
                            type={
                                mime ||
                                undefined
                            }
                        />
                    </audio>
                </div>
            );
        }

        if (
            isImageContent(
                content,
                resourceUrl
            )
        ) {
            return (
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "auto",
                        background:
                            "#ffffff",
                    }}
                >
                    <img
                        src={resourceUrl}
                        alt={
                            content.title ??
                            content.fileName ??
                            "Learning image"
                        }
                        style={{
                            maxWidth:
                                "100%",
                            maxHeight:
                                "100%",
                            width: "auto",
                            height: "auto",
                            objectFit:
                                "contain",
                        }}
                        onLoad={() =>
                            markComplete(
                                content.id
                            )
                        }
                    />
                </div>
            );
        }

        /*
         * =====================================================
         * WORD DOCUMENTS
         *
         * DOCX:
         *   Read the local Blob/URL, unpack OOXML with JSZip and
         *   render it inside the common learner frame.
         *
         * DOC:
         *   Public HTTPS files can use Office Web Viewer.
         *   Local binary .doc files cannot be decoded natively by
         *   the browser, so keep the learner inside the frame and
         *   never pass the Blob URL to iframe (which downloads it).
         * =====================================================
         */
        if (
            isWordDocument(
                content,
                resourceUrl
            )
        ) {
            if (
                isDocxContent(
                    content,
                    resourceUrl
                )
            ) {
                return (
                    <DocxPreview
                        resourceUrl={
                            resourceUrl
                        }
                        title={
                            content.title ??
                            content.fileName ??
                            "Word document"
                        }
                        onLoaded={() =>
                            markComplete(
                                content.id
                            )
                        }
                        onError={(
                            message
                        ) =>
                            setResourceErrors(
                                (
                                    previous
                                ) => ({
                                    ...previous,
                                    [contentKey]:
                                        message,
                                })
                            )
                        }
                    />
                );
            }

            if (
                isLegacyDocContent(
                    content,
                    resourceUrl
                ) &&
                isExternalHttpUrl(
                    resourceUrl
                )
            ) {
                return (
                    <iframe
                        title={
                            content.title ??
                            content.fileName ??
                            "Word document"
                        }
                        src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
                            resourceUrl
                        )}`}
                        allowFullScreen
                        style={{
                            width:
                                "100%",
                            height:
                                "100%",
                            border:
                                "none",
                            display:
                                "block",
                            background:
                                "#ffffff",
                        }}
                        onLoad={() =>
                            markComplete(
                                content.id
                            )
                        }
                        onError={() =>
                            setResourceErrors(
                                (
                                    previous
                                ) => ({
                                    ...previous,
                                    [contentKey]:
                                        "This Word document could not be loaded by the Office viewer.",
                                })
                            )
                        }
                    />
                );
            }

            /*
             * A local legacy .doc Blob must NOT be sent to iframe.
             * Chrome otherwise downloads it because .doc has no native
             * browser renderer.
             */
            return (
                <div
                    style={{
                        width:
                            "100%",
                        height:
                            "100%",
                        display:
                            "flex",
                        alignItems:
                            "center",
                        justifyContent:
                            "center",
                        padding:
                            32,
                        boxSizing:
                            "border-box",
                        background:
                            "#ffffff",
                        color:
                            "#556170",
                        textAlign:
                            "center",
                    }}
                >
                    <div
                        style={{
                            maxWidth:
                                560,
                        }}
                    >
                        <strong
                            style={{
                                display:
                                    "block",
                                marginBottom:
                                    10,
                                color:
                                    "#23324a",
                            }}
                        >
                            Legacy DOC preview
                        </strong>

                        <p
                            style={{
                                margin:
                                    0,
                                lineHeight:
                                    1.6,
                            }}
                        >
                            This is the older binary .doc format.
                            The browser cannot render a locally stored
                            .doc file inside the learner frame without
                            converting it first. Upload the document as
                            DOCX or convert it to PDF for an in-frame
                            learner preview.
                        </p>
                    </div>
                </div>
            );
        }

        if (
            isPowerPointContent(
                content,
                resourceUrl
            )
        ) {
            const pptm =
                isMacroEnabledPowerPoint(
                    content,
                    resourceUrl
                );

            if (
                isExternalHttpUrl(
                    resourceUrl
                )
            ) {
                return (
                    <iframe
                        title={
                            content.title ??
                            content.fileName ??
                            "PowerPoint presentation"
                        }
                        src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
                            resourceUrl
                        )}`}
                        allowFullScreen
                        style={{
                            width: "100%",
                            height: "100%",
                            border: "none",
                            display: "block",
                            background: "#ffffff",
                        }}
                        onLoad={() =>
                            markComplete(content.id)
                        }
                        onError={() =>
                            setResourceErrors(
                                (previous) => ({
                                    ...previous,
                                    [contentKey]:
                                        "This PowerPoint could not be loaded by the Office viewer.",
                                })
                            )
                        }
                    />
                );
            }

            return (
                <PowerPointPreview
                    resourceUrl={resourceUrl}
                    isPptm={pptm}
                    onLoaded={() =>
                        markComplete(content.id)
                    }
                    onError={(message) =>
                        setResourceErrors(
                            (previous) => ({
                                ...previous,
                                [contentKey]: message,
                            })
                        )
                    }
                />
            );
        }

        if (
            isOfficeDocument(
                content,
                resourceUrl
            ) &&
            !isWordDocument(
                content,
                resourceUrl
            ) &&
            isExternalHttpUrl(
                resourceUrl
            )
        ) {
            return (
                <iframe
                    title={
                        content.title ??
                        content.fileName ??
                        "Office document"
                    }
                    src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
                        resourceUrl
                    )}`}
                    allowFullScreen
                    style={{
                        width: "100%",
                        height: "100%",
                        border: "none",
                        display: "block",
                        background: "#ffffff",
                    }}
                    onLoad={() =>
                        markComplete(content.id)
                    }
                />
            );
        }

        if (
            isHtmlContent(
                content,
                resourceUrl
            ) ||
            isExternalHttpUrl(
                resourceUrl
            )
        ) {
            return (
                <iframe
                    title={
                        content.title ??
                        "External learning resource"
                    }
                    src={
                        resourceUrl
                    }
                    sandbox={
                        isHtmlContent(
                            content,
                            resourceUrl
                        )
                            ? "allow-scripts allow-same-origin allow-forms allow-popups"
                            : undefined
                    }
                    allowFullScreen
                    style={{
                        width: "100%",
                        height: "100%",
                        border: "none",
                        display: "block",
                        background:
                            "#ffffff",
                    }}
                    onLoad={() =>
                        markComplete(
                            content.id
                        )
                    }
                    onError={() =>
                        setResourceErrors(
                            (previous) => ({
                                ...previous,
                                [contentKey]:
                                    "This external resource could not be embedded by the provider.",
                            })
                        )
                    }
                />
            );
        }

        return (
            <iframe
                title={
                    content.title ??
                    content.fileName ??
                    "Learning resource"
                }
                src={resourceUrl}
                allowFullScreen
                style={{
                    width: "100%",
                    height: "100%",
                    border: "none",
                    display: "block",
                    background:
                        "#ffffff",
                }}
                onLoad={() =>
                    markComplete(
                        content.id
                    )
                }
            />
        );
    }

    if (modules.length === 0) {
        return (
            <section
                style={{
                    width: "100%",
                    padding: 24,
                    boxSizing: "border-box",
                }}
            >
                <div
                    style={{
                        padding: 35,
                        borderRadius: 18,
                        background:
                            "#dfe6e9",
                        color: "#687386",
                        textAlign:
                            "center",
                        boxShadow:
                            "6px 6px 12px #c5c6cc, -6px -6px 12px #ffffff",
                    }}
                >
                    <strong>
                        No learning structure found.
                    </strong>

                    <p
                        style={{
                            margin:
                                "8px 0 0",
                            fontSize: 12,
                        }}
                    >
                        Add modules, learning units,
                        and content in Learning Structure
                        and save the step.
                    </p>
                </div>
            </section>
        );
    }

    return (
        <>
            <style jsx global>{`
                .neurolxp-learner-content-frame:fullscreen {
                    width: 100vw !important;
                    height: 100vh !important;
                    max-width: none !important;
                    max-height: none !important;
                    margin: 0 !important;
                    border-radius: 0 !important;
                    border: none !important;
                    background: #ffffff !important;
                }

                .neurolxp-learner-content-frame:fullscreen > button {
                    position: fixed !important;
                    top: 14px !important;
                    right: 14px !important;
                }
            `}</style>

            <section
                style={{
                    width: "100%",
                    minWidth: 0,
                    height: "calc(100dvh - 80px)",
                maxHeight: "calc(100dvh - 80px)",
                minHeight: 0,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                gap: 14,
                boxSizing: "border-box",
            }}
        >
            {/* TOP LEARNER TOOLBAR */}
            <header
                style={{
                    width: "100%",
                    minHeight: 52,
                    display: "flex",
                    alignItems: "center",
                    justifyContent:
                        "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                    padding:
                        "10px 14px",
                    boxSizing:
                        "border-box",
                    borderRadius: 14,
                    background:
                        "#dfe6e9",
                    boxShadow:
                        "5px 5px 10px #c5c6cc, -5px -5px 10px #ffffff",
                }}
            >
                <div
                    style={{
                        display:
                            "flex",
                        alignItems:
                            "center",
                        gap: 8,
                        flexWrap:
                            "wrap",
                    }}
                >
                    <button
                        type="button"
                        onClick={onBack}
                        style={{
                            border: "none",
                            borderRadius: 9,
                            minHeight: 32,
                            padding:
                                "0 12px",
                            background:
                                "#dfe6e9",
                            color:
                                "#687386",
                            fontSize: 10,
                            fontWeight: 700,
                            cursor:
                                "pointer",
                            boxShadow:
                                "3px 3px 7px #c5c6cc, -3px -3px 7px #ffffff",
                        }}
                    >
                        ← Back to Review
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            setReloadKey(
                                (value) =>
                                    value + 1
                            )
                        }
                        style={{
                            border: "none",
                            borderRadius: 9,
                            minHeight: 32,
                            padding:
                                "0 12px",
                            background:
                                "#dfe6e9",
                            color:
                                "#687386",
                            fontSize: 10,
                            fontWeight: 700,
                            cursor:
                                "pointer",
                            boxShadow:
                                "3px 3px 7px #c5c6cc, -3px -3px 7px #ffffff",
                        }}
                    >
                        ↻ Refresh Content
                    </button>

                    <button
                        type="button"
                        disabled={!previousItem}
                        onClick={
                            goPrevious
                        }
                        style={{
                            border: "none",
                            borderRadius: 9,
                            minHeight: 32,
                            padding:
                                "0 12px",
                            background:
                                "#dfe6e9",
                            color:
                                "#687386",
                            fontSize: 10,
                            fontWeight: 700,
                            cursor:
                                previousItem
                                    ? "pointer"
                                    : "default",
                            opacity:
                                previousItem
                                    ? 1
                                    : 0.4,
                            boxShadow:
                                "3px 3px 7px #c5c6cc, -3px -3px 7px #ffffff",
                        }}
                    >
                        ← Previous
                    </button>

                    <button
                        type="button"
                        disabled={!nextItem}
                        onClick={
                            goNext
                        }
                        style={{
                            border: "none",
                            borderRadius: 9,
                            minHeight: 32,
                            padding:
                                "0 12px",
                            background:
                                "#174f84",
                            color:
                                "#ffffff",
                            fontSize: 10,
                            fontWeight: 700,
                            cursor:
                                nextItem
                                    ? "pointer"
                                    : "default",
                            opacity:
                                nextItem
                                    ? 1
                                    : 0.4,
                        }}
                    >
                        Next Topic →
                    </button>
                </div>

                <div
                    style={{
                        display:
                            "flex",
                        alignItems:
                            "center",
                        gap: 8,
                    }}
                >
                    <button
                        type="button"
                        onClick={() =>
                            setShowNotes(
                                (value) =>
                                    !value
                            )
                        }
                        style={{
                            border: "none",
                            borderRadius: 9,
                            minHeight: 32,
                            padding:
                                "0 12px",
                            background:
                                "#dfe6e9",
                            color:
                                "#687386",
                            fontSize: 10,
                            fontWeight: 700,
                            cursor:
                                "pointer",
                            boxShadow:
                                "3px 3px 7px #c5c6cc, -3px -3px 7px #ffffff",
                        }}
                    >
                        Notes
                    </button>

                    <button
                        type="button"
                        onClick={
                            resetProgress
                        }
                        style={{
                            border: "none",
                            borderRadius: 9,
                            minHeight: 32,
                            padding:
                                "0 12px",
                            background:
                                "#dfe6e9",
                            color:
                                "#687386",
                            fontSize: 10,
                            fontWeight: 700,
                            cursor:
                                "pointer",
                            boxShadow:
                                "3px 3px 7px #c5c6cc, -3px -3px 7px #ffffff",
                        }}
                    >
                        Reset Progress
                    </button>

                    <div
                        style={{
                            minWidth:
                                52,
                            height: 32,
                            display:
                                "flex",
                            alignItems:
                                "center",
                            justifyContent:
                                "center",
                            padding:
                                "0 8px",
                            boxSizing:
                                "border-box",
                            borderRadius:
                                9,
                            background:
                                "#174f84",
                            color:
                                "#ffffff",
                            fontSize: 10,
                            fontWeight: 800,
                        }}
                    >
                        {progress}%
                    </div>
                </div>
            </header>

            {/* COURSE HEADER */}
            <div
                style={{
                    display:
                        "flex",
                    alignItems:
                        "flex-start",
                    justifyContent:
                        "space-between",
                    gap: 18,
                    padding:
                        "12px 2px 2px",
                }}
            >
                <div>
                    <span
                        style={{
                            display:
                                "block",
                            marginBottom:
                                4,
                            color:
                                "#687386",
                            fontSize:
                                9,
                            fontWeight:
                                750,
                            letterSpacing:
                                "0.14em",
                        }}
                    >
                        LEARNER VIEW
                    </span>

                    <h2
                        style={{
                            margin: 0,
                            color:
                                "#2a354f",
                            fontSize:
                                24,
                            lineHeight:
                                1.2,
                        }}
                    >
                        Course Preview
                    </h2>

                    <p
                        style={{
                            margin:
                                "5px 0 0",
                            color:
                                "#687386",
                            fontSize:
                                11,
                        }}
                    >
                        Course ID: {courseId}
                    </p>
                </div>

                <div
                    style={{
                        minWidth:
                            220,
                        padding:
                            "10px 12px",
                        boxSizing:
                            "border-box",
                        borderRadius:
                            11,
                        background:
                            "#dfe6e9",
                        boxShadow:
                            "4px 4px 9px #c5c6cc, -4px -4px 9px #ffffff",
                    }}
                >
                    <div
                        style={{
                            display:
                                "flex",
                            justifyContent:
                                "space-between",
                            marginBottom:
                                6,
                            color:
                                "#687386",
                            fontSize:
                                9,
                            fontWeight:
                                700,
                        }}
                    >
                        <span>
                            Course Progress
                        </span>

                        <strong
                            style={{
                                color:
                                    "#174f84",
                            }}
                        >
                            {completedCount}/
                            {totalContentCount}
                        </strong>
                    </div>

                    <div
                        style={{
                            width:
                                "100%",
                            height: 6,
                            overflow:
                                "hidden",
                            borderRadius:
                                999,
                            background:
                                "rgba(104,115,134,0.16)",
                        }}
                    >
                        <div
                            style={{
                                width:
                                    `${progress}%`,
                                height:
                                    "100%",
                                borderRadius:
                                    999,
                                background:
                                    "#174f84",
                                transition:
                                    "width 0.2s ease",
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* MAIN LEARNER WORKSPACE */}
            <div
                style={{
                    width:
                        "100%",
                    display:
                        "grid",
                    gridTemplateColumns:
                        "minmax(260px, 310px) minmax(0, 1fr)",
                    gap: 14,
                    alignItems:
                        "stretch",
                    height: "calc(100dvh - 235px)",
                    minHeight: 0,
                }}
            >
                {/* STRUCTURE */}
                <aside
                    style={{
                        minWidth: 0,
                        height: "100%",
                        minHeight: 0,
                        overflow:
                            "hidden",
                        display:
                            "flex",
                        flexDirection:
                            "column",
                        borderRadius:
                            14,
                        background:
                            "#dfe6e9",
                        boxShadow:
                            "5px 5px 10px #c5c6cc, -5px -5px 10px #ffffff",
                    }}
                >
                    <div
                        style={{
                            flexShrink: 0,
                            padding:
                                "13px 14px",
                            borderBottom:
                                "1px solid rgba(104,115,134,0.16)",
                        }}
                    >
                        <span
                            style={{
                                display:
                                    "block",
                                color:
                                    "#687386",
                                fontSize:
                                    9,
                                fontWeight:
                                    750,
                                letterSpacing:
                                    "0.13em",
                            }}
                        >
                            COURSE CONTENT
                        </span>

                        <strong
                            style={{
                                display:
                                    "block",
                                marginTop:
                                    4,
                                color:
                                    "#2a354f",
                                fontSize:
                                    13,
                            }}
                        >
                            {modules.length} Modules
                        </strong>
                    </div>

                    <div
                        style={{
                            flex:
                                1,
                            minHeight:
                                0,
                            overflowY:
                                "auto",
                            padding:
                                10,
                        }}
                    >
                        {modules.map(
                            (
                                module,
                                moduleIndex
                            ) => (
                                <div
                                    key={
                                        module.id ??
                                        `module-${moduleIndex}`
                                    }
                                    style={{
                                        marginBottom:
                                            6,
                                    }}
                                >
                                    <div
                                        style={{
                                            padding:
                                                "9px 10px",
                                            borderRadius:
                                                9,
                                            background:
                                                "#dfe6e9",
                                            color:
                                                "#174f84",
                                            fontSize:
                                                10,
                                            fontWeight:
                                                800,
                                            boxShadow:
                                                "inset 2px 2px 5px #c5c6cc, inset -2px -2px 5px #ffffff",
                                        }}
                                    >
                                        {moduleIndex +
                                            1}.{" "}
                                        {module.title}
                                    </div>

                                    <div
                                        style={{
                                            paddingLeft:
                                                10,
                                            borderLeft:
                                                "1px solid rgba(104,115,134,0.20)",
                                            marginTop:
                                                4,
                                        }}
                                    >
                                        {(module.learnings ??
                                            []).map(
                                            (
                                                learning,
                                                learningIndex
                                            ) => {
                                                const learningSelected =
                                                    learning.id ===
                                                    selectedLearningId;

                                                return (
                                                    <div
                                                        key={
                                                            learning.id ??
                                                            `${moduleIndex}-${learningIndex}`
                                                        }
                                                        style={{
                                                            marginTop:
                                                                4,
                                                        }}
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedLearningId(
                                                                    learning.id ??
                                                                    ""
                                                                );

                                                                const first =
                                                                    learning.contents?.[0];

                                                                if (
                                                                    first?.id
                                                                ) {
                                                                    setSelectedContentId(
                                                                        first.id
                                                                    );
                                                                }
                                                            }}
                                                            style={{
                                                                width:
                                                                    "100%",
                                                                border:
                                                                    "none",
                                                                borderRadius:
                                                                    8,
                                                                padding:
                                                                    "8px 9px",
                                                                display:
                                                                    "flex",
                                                                alignItems:
                                                                    "center",
                                                                justifyContent:
                                                                    "space-between",
                                                                gap: 6,
                                                                background:
                                                                    learningSelected
                                                                        ? "#174f84"
                                                                        : "transparent",
                                                                color:
                                                                    learningSelected
                                                                        ? "#ffffff"
                                                                        : "#35425d",
                                                                fontSize:
                                                                    10,
                                                                fontWeight:
                                                                    650,
                                                                textAlign:
                                                                    "left",
                                                                cursor:
                                                                    "pointer",
                                                            }}
                                                        >
                                                            <span
                                                                style={{
                                                                    minWidth:
                                                                        0,
                                                                    overflow:
                                                                        "hidden",
                                                                    textOverflow:
                                                                        "ellipsis",
                                                                    whiteSpace:
                                                                        "nowrap",
                                                                }}
                                                            >
                                                                {moduleIndex +
                                                                    1}.
                                                                {learningIndex +
                                                                    1}{" "}
                                                                {learning.title}
                                                            </span>

                                                            <span
                                                                style={{
                                                                    flexShrink:
                                                                        0,
                                                                    fontSize:
                                                                        8,
                                                                    opacity:
                                                                        0.8,
                                                                }}
                                                            >
                                                                {learning.contents?.length ??
                                                                    0}
                                                            </span>
                                                        </button>

                                                        {learningSelected && (
                                                            <div
                                                                style={{
                                                                    marginLeft:
                                                                        8,
                                                                    paddingLeft:
                                                                        8,
                                                                    borderLeft:
                                                                        "1px dashed rgba(104,115,134,0.25)",
                                                                }}
                                                            >
                                                                {(
                                                                    learning.contents ??
                                                                    []
                                                                ).map(
                                                                    (
                                                                        content,
                                                                        contentIndex
                                                                    ) => {
                                                                        const isSelected =
                                                                            content.id ===
                                                                            selectedContentId;

                                                                        const isCompleted =
                                                                            content.id
                                                                                ? completedResources.has(
                                                                                    content.id
                                                                                )
                                                                                : false;

                                                                        return (
                                                                            <button
                                                                                key={
                                                                                    content.id ??
                                                                                    `${learningIndex}-${contentIndex}`
                                                                                }
                                                                                type="button"
                                                                                onClick={() =>
                                                                                    selectContent(
                                                                                        module.id ??
                                                                                        "",
                                                                                        learning.id ??
                                                                                        "",
                                                                                        content.id ??
                                                                                        ""
                                                                                    )
                                                                                }
                                                                                style={{
                                                                                    width:
                                                                                        "100%",
                                                                                    minHeight:
                                                                                        30,
                                                                                    marginTop:
                                                                                        3,
                                                                                    display:
                                                                                        "flex",
                                                                                    alignItems:
                                                                                        "center",
                                                                                    gap: 6,
                                                                                    border:
                                                                                        "none",
                                                                                    borderRadius:
                                                                                        7,
                                                                                    padding:
                                                                                        "5px 7px",
                                                                                    background:
                                                                                        isSelected
                                                                                            ? "rgba(23,79,132,0.10)"
                                                                                            : "transparent",
                                                                                    color:
                                                                                        isSelected
                                                                                            ? "#174f84"
                                                                                            : "#687386",
                                                                                    textAlign:
                                                                                        "left",
                                                                                    fontSize:
                                                                                        9,
                                                                                    fontWeight:
                                                                                        isSelected
                                                                                            ? 750
                                                                                            : 600,
                                                                                    cursor:
                                                                                        "pointer",
                                                                                }}
                                                                            >
                                                                                <span>
                                                                                    {getContentIcon(
                                                                                        content
                                                                                    )}
                                                                                </span>

                                                                                <span
                                                                                    style={{
                                                                                        flex:
                                                                                            1,
                                                                                        minWidth:
                                                                                            0,
                                                                                        overflow:
                                                                                            "hidden",
                                                                                        textOverflow:
                                                                                            "ellipsis",
                                                                                        whiteSpace:
                                                                                            "nowrap",
                                                                                    }}
                                                                                >
                                                                                    {content.title ??
                                                                                        content.fileName ??
                                                                                        `Content ${contentIndex + 1}`}
                                                                                </span>

                                                                                <span
                                                                                    style={{
                                                                                        color:
                                                                                            isCompleted
                                                                                                ? "#10ab7c"
                                                                                                : "#9aa2ae",
                                                                                    }}
                                                                                >
                                                                                    {isCompleted
                                                                                        ? "✓"
                                                                                        : "○"}
                                                                                </span>
                                                                            </button>
                                                                        );
                                                                    }
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            }
                                        )}
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                </aside>

                {/* LEARNER CONTENT */}
                <main
                    style={{
                        minWidth: 0,
                        height: "100%",
                        minHeight: 0,
                        display:
                            "flex",
                        flexDirection:
                            "column",
                        padding:
                            14,
                        boxSizing:
                            "border-box",
                        borderRadius:
                            14,
                        background:
                            "#dfe6e9",
                        boxShadow:
                            "5px 5px 10px #c5c6cc, -5px -5px 10px #ffffff",
                    }}
                >
                    {selectedContent ? (
                        <>
                            <div
                                style={{
                                    flexShrink: 0,
                                    display:
                                        "flex",
                                    alignItems:
                                        "center",
                                    justifyContent:
                                        "space-between",
                                    gap: 10,
                                    minHeight:
                                        42,
                                    marginBottom:
                                        9,
                                }}
                            >
                                <div
                                    style={{
                                        minWidth:
                                            0,
                                    }}
                                >
                                    <span
                                        style={{
                                            color:
                                                "#687386",
                                            fontSize:
                                                8,
                                            fontWeight:
                                                750,
                                            letterSpacing:
                                                "0.13em",
                                        }}
                                    >
                                        {selectedContent.type ??
                                            "CONTENT"}
                                    </span>

                                    <strong
                                        style={{
                                            display:
                                                "block",
                                            marginTop:
                                                3,
                                            overflow:
                                                "hidden",
                                            textOverflow:
                                                "ellipsis",
                                            whiteSpace:
                                                "nowrap",
                                            color:
                                                "#2a354f",
                                            fontSize:
                                                13,
                                        }}
                                    >
                                        {selectedContent.title ??
                                            selectedContent.fileName ??
                                            "Learning Content"}
                                    </strong>
                                </div>

                                <button
                                    type="button"
                                    onClick={
                                        toggleContentFullscreen
                                    }
                                    style={{
                                        flexShrink:
                                            0,
                                        border:
                                            "none",
                                        borderRadius:
                                            8,
                                        minHeight:
                                            30,
                                        padding:
                                            "0 10px",
                                        background:
                                            "#174f84",
                                        color:
                                            "#ffffff",
                                        fontSize:
                                            9,
                                        fontWeight:
                                            700,
                                        cursor:
                                            "pointer",
                                    }}
                                >
                                    {isFullscreen
                                        ? "Exit Full Screen (Esc)"
                                        : "Full Screen"}
                                </button>
                            </div>

                            <div
                                ref={
                                    frameRef
                                }
                                className="neurolxp-learner-content-frame"
                                style={{
                                    /*
                                     * ONE COMMON VIEWPORT FOR ALL CONTENT.
                                     *
                                     * Normal learner mode:
                                     *     fixed 16:9 presentation frame.
                                     *
                                     * Fullscreen:
                                     *     entire browser viewport.
                                     *
                                     * SCORM/PDF/PPT/video/image/document/link
                                     * all render inside these same dimensions.
                                     */
                                    width:
                                        "100%",

                                    height:
                                        isFullscreen
                                            ? "100vh"
                                            : "auto",

                                    aspectRatio:
                                        isFullscreen
                                            ? "auto"
                                            : "16 / 9",

                                    minHeight:
                                        0,

                                    maxHeight:
                                        isFullscreen
                                            ? "100vh"
                                            : "none",

                                    flex:
                                        "0 0 auto",

                                    overflow:
                                        "hidden",

                                    position:
                                        "relative",

                                    borderRadius:
                                        isFullscreen
                                            ? 0
                                            : 11,

                                    background:
                                        "#ffffff",

                                    border:
                                        isFullscreen
                                            ? "none"
                                            : "1px solid rgba(104,115,134,0.16)",

                                    boxSizing:
                                        "border-box",

                                    boxShadow:
                                        isFullscreen
                                            ? "none"
                                            : "inset 2px 2px 5px rgba(197,198,204,0.55), inset -2px -2px 5px rgba(255,255,255,0.9)",
                                }}
                            >
                                {isFullscreen && (
                                    <button
                                        type="button"
                                        aria-label="Close full screen"
                                        title="Close full screen (Esc)"
                                        onClick={() => void document.exitFullscreen()}
                                        style={{
                                            position: "absolute",
                                            top: 14,
                                            right: 14,
                                            zIndex: 100000,
                                            width: 38,
                                            height: 38,
                                            border: "none",
                                            borderRadius: 10,
                                            background: "rgba(20,30,45,0.88)",
                                            color: "#ffffff",
                                            fontSize: 20,
                                            lineHeight: 1,
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        ×
                                    </button>
                                )}
                                {renderSelectedResource()}
                            </div>

                            <div
                                style={{
                                    flexShrink:
                                        0,
                                    minHeight:
                                        42,
                                    display:
                                        "flex",
                                    alignItems:
                                        "center",
                                    justifyContent:
                                        "space-between",
                                    gap: 10,
                                    marginTop:
                                        9,
                                }}
                            >
                                <span
                                    style={{
                                        color:
                                            completedResources.has(
                                                selectedContent.id ??
                                                ""
                                            )
                                                ? "#10ab7c"
                                                : "#687386",
                                        fontSize:
                                            9,
                                        fontWeight:
                                            700,
                                    }}
                                >
                                    {completedResources.has(
                                        selectedContent.id ??
                                        ""
                                    )
                                        ? "✓ Completed"
                                        : "Not completed"}
                                </span>

                                <div
                                    style={{
                                        display:
                                            "flex",
                                        alignItems:
                                            "center",
                                        gap: 6,
                                    }}
                                >
                                    <button
                                        type="button"
                                        disabled={
                                            !previousItem
                                        }
                                        onClick={
                                            goPrevious
                                        }
                                        style={{
                                            border:
                                                "none",
                                            borderRadius:
                                                8,
                                            minHeight:
                                                30,
                                            padding:
                                                "0 10px",
                                            background:
                                                "#dfe6e9",
                                            color:
                                                "#687386",
                                            fontSize:
                                                9,
                                            fontWeight:
                                                700,
                                            cursor:
                                                previousItem
                                                    ? "pointer"
                                                    : "default",
                                            opacity:
                                                previousItem
                                                    ? 1
                                                    : 0.4,
                                        }}
                                    >
                                        ← Previous
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            markComplete(
                                                selectedContent.id
                                            )
                                        }
                                        style={{
                                            border:
                                                "none",
                                            borderRadius:
                                                8,
                                            minHeight:
                                                30,
                                            padding:
                                                "0 11px",
                                            background:
                                                "#10ab7c",
                                            color:
                                                "#ffffff",
                                            fontSize:
                                                9,
                                            fontWeight:
                                                750,
                                            cursor:
                                                "pointer",
                                        }}
                                    >
                                        {completedResources.has(
                                            selectedContent.id ??
                                            ""
                                        )
                                            ? "✓ Completed"
                                            : "Complete Topic"}
                                    </button>

                                    <button
                                        type="button"
                                        disabled={
                                            !nextItem
                                        }
                                        onClick={
                                            goNext
                                        }
                                        style={{
                                            border:
                                                "none",
                                            borderRadius:
                                                8,
                                            minHeight:
                                                30,
                                            padding:
                                                "0 10px",
                                            background:
                                                "#174f84",
                                            color:
                                                "#ffffff",
                                            fontSize:
                                                9,
                                            fontWeight:
                                                700,
                                            cursor:
                                                nextItem
                                                    ? "pointer"
                                                    : "default",
                                            opacity:
                                                nextItem
                                                    ? 1
                                                    : 0.4,
                                        }}
                                    >
                                        Next →
                                    </button>
                                </div>
                            </div>

                            {resourceErrors[
                                selectedContent.id ??
                                ""
                            ] && (
                                <div
                                    style={{
                                        marginTop:
                                            4,
                                        color:
                                            "#9b3d3d",
                                        fontSize:
                                            9,
                                    }}
                                >
                                    {
                                        resourceErrors[
                                            selectedContent.id ??
                                            ""
                                        ]
                                    }
                                </div>
                            )}
                        </>
                    ) : (
                        <div
                            style={{
                                flex:
                                    1,
                                display:
                                    "flex",
                                alignItems:
                                    "center",
                                justifyContent:
                                    "center",
                                color:
                                    "#687386",
                                fontSize:
                                    12,
                            }}
                        >
                            Select a content item to begin.
                        </div>
                    )}
                </main>
            </div>

            {/* NOTES */}
            {showNotes && (
                <section
                    style={{
                        padding:
                            13,
                        borderRadius:
                            12,
                        background:
                            "#dfe6e9",
                        boxShadow:
                            "5px 5px 10px #c5c6cc, -5px -5px 10px #ffffff",
                    }}
                >
                    <div
                        style={{
                            display:
                                "flex",
                            justifyContent:
                                "space-between",
                            alignItems:
                                "center",
                            marginBottom:
                                7,
                        }}
                    >
                        <strong
                            style={{
                                color:
                                    "#2a354f",
                                fontSize:
                                    11,
                            }}
                        >
                            Learner Notes
                        </strong>

                        <button
                            type="button"
                            onClick={() =>
                                setShowNotes(
                                    false
                                )
                            }
                            style={{
                                border:
                                    "none",
                                background:
                                    "transparent",
                                color:
                                    "#687386",
                                cursor:
                                    "pointer",
                            }}
                        >
                            ×
                        </button>
                    </div>

                    <textarea
                        value={notes}
                        onChange={(
                            event
                        ) =>
                            setNotes(
                                event.target
                                    .value
                            )
                        }
                        placeholder="Add notes for this course..."
                        style={{
                            width:
                                "100%",
                            minHeight:
                                90,
                            resize:
                                "vertical",
                            border:
                                "none",
                            outline:
                                "none",
                            borderRadius:
                                9,
                            padding:
                                10,
                            boxSizing:
                                "border-box",
                            background:
                                "#dfe6e9",
                            color:
                                "#35425d",
                            fontFamily:
                                "inherit",
                            fontSize:
                                10,
                            boxShadow:
                                "inset 2px 2px 5px #c5c6cc, inset -2px -2px 5px #ffffff",
                        }}
                    />
                </section>
            )}
            </section>
        </>
    );
}

function getContentIcon(
    content: LearnerPreviewContent
): string {
    const type =
        String(
            content.type ??
            ""
        ).toLowerCase();

    if (
        type.includes("video") ||
        isVideoContent(
            content,
            getResourceUrl(content)
        )
    ) {
        return "▶";
    }

    if (
        type.includes("pdf") ||
        isPdfContent(
            content,
            getResourceUrl(content)
        )
    ) {
        return "▤";
    }

    if (
        type.includes("audio") ||
        isAudioContent(
            content,
            getResourceUrl(content)
        )
    ) {
        return "♪";
    }

    if (
        type.includes("image") ||
        isImageContent(
            content,
            getResourceUrl(content)
        )
    ) {
        return "▧";
    }

    if (
        type.includes("scorm")
    ) {
        return "◈";
    }

    if (
        type.includes("ppt") ||
        type.includes("presentation")
    ) {
        return "▥";
    }

    if (
        type.includes("doc")
    ) {
        return "▱";
    }

    if (
        type.includes("link") ||
        type.includes("url")
    ) {
        return "↗";
    }

    return "•";
}

/* =========================================================
   COURSE WIZARD
========================================================= */

export default function CourseWizard({
    tenant,
    role,
    courseId,
    initialStep = 0,
}: CourseWizardProps) {

    /*
     * Academic tenants reuse the same wizard indexes.
     * Only Step 2 content/label changes for University/College.
     */
    const isAcademicTenant =
        isUniversityOrCollegeTenant(
            tenant
        );

    /*
     * University/College uses the academic step labels/components.
     * Other tenants continue to use the existing step list unchanged.
     */
    const activeSteps =
        isAcademicTenant
            ? academicSteps
            : steps;

    const activeLastStepIndex =
        activeSteps.length - 1;


    /*
     * =====================================================
     * ACTIVE COURSE ID
     *
     * IMPORTANT:
     *
     * New Course:
     *     activeCourseId = ""
     *
     * Existing Draft:
     *     activeCourseId = existing courseId
     *
     * CourseWizard NEVER creates a Course ID.
     *
     * Step 1 / CourseSetup creates the ID when the user
     * actually presses Save & Continue.
     * =====================================================
     */

    const [
        activeCourseId,
        setActiveCourseId,
    ] = useState<string>(
        courseId?.trim() || ""
    );

    /*
     * =====================================================
     * DRAFT READY
     *
     * New course:
     *     true immediately
     *
     * Existing course:
     *     true only after the existing draft is found
     * =====================================================
     */

    const [
        draftReady,
        setDraftReady,
    ] = useState<boolean>(
        !courseId?.trim()
    );

    /*
     * =====================================================
     * CURRENT STEP
     * =====================================================
     */

    const [
        currentStep,
        setCurrentStep,
    ] = useState<number>(
        courseId?.trim()
            ? normalizeStep(
                initialStep,
                0,
                activeLastStepIndex
            )
            : 0
    );

    /*
     * =====================================================
     * COMPLETED THROUGH STEP
     *
     * This is the highest completed step.
     *
     * Example:
     *
     * Step 1 complete:
     *     1
     *
     * Step 5 complete:
     *     5
     *
     * User goes back to Step 2:
     *     currentStep = 1
     *     completedThroughStep = 5
     *
     * It must never decrease simply because the user
     * navigates backward.
     * =====================================================
     */

    const [
        completedThroughStep,
        setCompletedThroughStep,
    ] = useState<number>(0);

    /*
     * Learner View is rendered inside the wizard.
     * It always uses the same activeCourseId and the same
     * saved course draft as the course-creation steps.
     */
    const [
        showLearnerView,
        setShowLearnerView,
    ] = useState<boolean>(false);

    /*
     * =====================================================
     * ERROR MESSAGE
     * =====================================================
     */

    const [
        loadError,
        setLoadError,
    ] = useState<string>("");

    /* =====================================================
       INITIALIZE WIZARD

       THERE ARE ONLY TWO POSSIBLE MODES:

       1. NEW COURSE
          courseId is empty/undefined

          → Do NOT create ID
          → Do NOT create draft
          → Show Step 1

       2. EXISTING COURSE/DRAFT
          courseId is supplied

          → Find existing draft
          → Restore saved state
          → Continue editing

       NEVER create a missing draft here.
    ===================================================== */

    useEffect(() => {

        const resolvedCourseId =
            courseId?.trim() || "";

        /*
         * -------------------------------------------------
         * NEW COURSE MODE
         * -------------------------------------------------
         *
         * This is /create without ?courseId=...
         *
         * Absolutely nothing is saved here.
         */

        if (!resolvedCourseId) {

            setActiveCourseId("");

            setCurrentStep(0);

            setCompletedThroughStep(0);

            setDraftReady(true);

            setLoadError("");

            return;
        }

        /*
         * -------------------------------------------------
         * EXISTING COURSE / DRAFT MODE
         * -------------------------------------------------
         */

        setActiveCourseId(
            resolvedCourseId
        );

        setDraftReady(false);

        setLoadError("");

        const existingDraft =
            getCourseDraft(
                resolvedCourseId
            );

        /*
         * IMPORTANT:
         *
         * An explicit courseId means the user is trying
         * to edit/resume an existing course.
         *
         * If it does not exist, DO NOT create another one.
         */

        if (!existingDraft) {

            console.error(
                "Course draft not found:",
                resolvedCourseId
            );

            setLoadError(
                "Course draft could not be found. It may have been deleted or the link is no longer valid."
            );

            setDraftReady(false);

            return;
        }

        /*
         * Restore the exact saved step.
         */

        const savedCurrentStep =
            normalizeStep(
                existingDraft.currentStep,
                normalizeStep(
                    initialStep,
                    0,
                    activeLastStepIndex
                ),
                activeLastStepIndex
            );

        /*
         * Restore the highest completed step.
         */

        const savedCompletedStep =
            normalizeCompletedStep(
                existingDraft.completedThroughStep,
                activeSteps.length
            );

        /*
         * Prevent the current screen from going beyond
         * the saved progress.
         *
         * A user can always open the next available step:
         *
         * completedThroughStep = 3
         * maximum allowed currentStep = 3
         *
         * because index 3 represents Step 4.
         */

        const maximumAllowedStep =
            Math.min(
                savedCompletedStep,
                activeLastStepIndex
            );

        const restoredStep =
            Math.min(
                savedCurrentStep,
                maximumAllowedStep
            );

        setCurrentStep(
            restoredStep
        );

        setCompletedThroughStep(
            savedCompletedStep
        );

        setDraftReady(true);

    }, [
        courseId,
        initialStep,
    ]);

    /* =========================================================
       SAVE EXISTING COURSE PROGRESS

       IMPORTANT:

       This function ONLY updates an existing draft.

       It NEVER creates a new draft.
    ========================================================= */

    function saveExistingDraftProgress(
        nextStep: number,
        completedStep: number
    ) {

        if (!activeCourseId) {
            return null;
        }

        const existingDraft =
            getCourseDraft(
                activeCourseId
            );

        if (!existingDraft) {

            console.error(
                "Cannot update course because draft was not found:",
                activeCourseId
            );

            return null;
        }

        const updatedDraft = {
            ...existingDraft,

            currentStep:
                normalizeStep(
                    nextStep,
                    existingDraft.currentStep ?? 0
                ),

            completedThroughStep:
                Math.max(
                    normalizeCompletedStep(
                        existingDraft.completedThroughStep,
                        activeSteps.length
                    ),
                    normalizeCompletedStep(
                        completedStep
                    )
                ),

            updatedAt:
                new Date().toISOString(),
        };

        saveCourseDraft(
            updatedDraft
        );

        setCompletedThroughStep(
            updatedDraft.completedThroughStep
        );

        return updatedDraft;
    }

    /* =========================================================
       NEXT

       There are two cases.

       CASE A: Step 1 creates a NEW course.

       CourseSetup will call:

           onNext(newCourseId)

       The Wizard receives that ID and starts using it.

       IMPORTANT:
       The Wizard does NOT create the draft again.

       CASE B: Existing course.

       Later builders call:

           onNext()

       The Wizard updates progress on the existing draft.
    ========================================================= */

    function handleNext(
        createdOrExistingCourseId?: string
    ) {

        /*
         * =====================================================
         * CASE A:
         *
         * A builder supplied a Course ID.
         *
         * This is normally Step 1 after it has created
         * the course/draft.
         * =====================================================
         */

        if (
            createdOrExistingCourseId &&
            createdOrExistingCourseId.trim()
        ) {

            const resolvedId =
                createdOrExistingCourseId.trim();

            /*
             * If this is a NEW course ID, verify that
             * CourseSetup actually saved the draft.
             *
             * This prevents the Wizard from moving forward
             * with an ID that has never been persisted.
             */

            const createdDraft =
                getCourseDraft(
                    resolvedId
                );

            if (!createdDraft) {

                console.error(
                    "Course was not saved before wizard navigation:",
                    resolvedId
                );

                setLoadError(
                    "The course could not be saved. Please save Step 1 again."
                );

                return;
            }

            /*
             * The ID is now the permanent identity of this
             * course creation session.
             */

            setActiveCourseId(
                resolvedId
            );

            /*
             * Do NOT call createCourseDraft().
             *
             * Do NOT save another draft here.
             *
             * CourseSetup already created/saved it.
             */

            const completedAfterCurrentStep =
                Math.max(
                    normalizeCompletedStep(
                        createdDraft.completedThroughStep
                    ),
                    currentStep + 1
                );

            /*
             * Update only the navigation metadata.
             *
             * This is still the SAME draft.
             */

            const updatedDraft = {
                ...createdDraft,

                currentStep:
                    Math.min(
                        currentStep + 1,
                        activeLastStepIndex
                    ),

                completedThroughStep:
                    Math.min(
                        completedAfterCurrentStep,
                        activeSteps.length
                    ),

                updatedAt:
                    new Date().toISOString(),
            };

            saveCourseDraft(
                updatedDraft
            );

            setCompletedThroughStep(
                updatedDraft.completedThroughStep
            );

            /*
             * If Step 1 has just created the course,
             * move to Step 2.
             */

            if (
                currentStep <
                activeLastStepIndex
            ) {

                const nextStep =
                    currentStep + 1;

                setCurrentStep(
                    nextStep
                );

                setDraftReady(true);

                window.scrollTo({
                    top: 0,
                    behavior: "smooth",
                });

                return;
            }

            /*
             * Safety fallback for the final step.
             */

            setCurrentStep(
                activeLastStepIndex
            );

            return;
        }

        /*
         * =====================================================
         * CASE B:
         *
         * No ID supplied.
         *
         * Therefore this is an existing course whose current
         * builder has already saved its own data.
         *
         * The Wizard only updates navigation/progress.
         * =====================================================
         */

        if (!activeCourseId) {

            /*
             * This should only happen if Step 1 failed to
             * create the Course.
             *
             * Never create a draft here.
             */

            console.error(
                "Cannot continue because no Course ID exists."
            );

            setLoadError(
                "Please save the Basic Setup before continuing."
            );

            return;
        }

        const nextStep =
            Math.min(
                currentStep + 1,
                activeLastStepIndex
            );

        const nextCompletedStep =
            Math.max(
                completedThroughStep,
                currentStep + 1
            );

        const savedDraft =
            saveExistingDraftProgress(
                nextStep,
                nextCompletedStep
            );

        if (!savedDraft) {
            return;
        }

        setCurrentStep(
            nextStep
        );

        setDraftReady(true);

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    }

    /* =========================================================
       BACK

       Back only changes currentStep.

       It does NOT decrease completedThroughStep.

       It does NOT create a draft.

       It does NOT generate a Course ID.
    ========================================================= */

    function handleBack() {

        setShowLearnerView(false);

        const previousStep =
            Math.max(
                currentStep - 1,
                0
            );

        /*
         * For a brand-new Step 1, simply remain on Step 1.
         */

        if (!activeCourseId) {

            setCurrentStep(
                previousStep
            );

            window.scrollTo({
                top: 0,
                behavior: "smooth",
            });

            return;
        }

        /*
         * Existing course:
         * update only navigation state.
         */

        const existingDraft =
            getCourseDraft(
                activeCourseId
            );

        if (!existingDraft) {

            console.error(
                "Cannot navigate back because course draft was not found:",
                activeCourseId
            );

            return;
        }

        const updatedDraft = {
            ...existingDraft,

            currentStep:
                previousStep,

            /*
             * NEVER decrease this value.
             */

            completedThroughStep:
                Math.max(
                    normalizeCompletedStep(
                        existingDraft.completedThroughStep,
                        activeSteps.length
                    ),
                    completedThroughStep
                ),

            updatedAt:
                new Date().toISOString(),
        };

        saveCourseDraft(
            updatedDraft
        );

        setCurrentStep(
            previousStep
        );

        setCompletedThroughStep(
            updatedDraft.completedThroughStep
        );

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    }

    /* =========================================================
       STEP NAVIGATION

       Allowed:

       - current step
       - previously completed steps
       - next step after completed progress

       Not allowed:

       - jumping over incomplete steps
    ========================================================= */

    function goToStep(
        index: number
    ) {

        if (
            index < 0 ||
            index > activeLastStepIndex
        ) {
            return;
        }

        /*
         * New course:
         *
         * Only Step 1 is accessible because no Course
         * exists yet.
         */

        if (!activeCourseId) {

            if (index !== 0) {
                return;
            }

            setCurrentStep(0);

            window.scrollTo({
                top: 0,
                behavior: "smooth",
            });

            return;
        }

        /*
         * Existing course:
         *
         * A step can be opened if:
         *
         * 1. It is already completed, OR
         * 2. It is the next step to complete.
         */

        const isCompletedStep =
            index <
            completedThroughStep;

        const isNextAvailableStep =
            index ===
            completedThroughStep;

        if (
            !isCompletedStep &&
            !isNextAvailableStep
        ) {
            return;
        }

        const existingDraft =
            getCourseDraft(
                activeCourseId
            );

        if (!existingDraft) {

            console.error(
                "Cannot navigate because course draft was not found:",
                activeCourseId
            );

            return;
        }

        /*
         * Navigation does not reduce progress.
         */

        const updatedDraft = {
            ...existingDraft,

            currentStep:
                index,

            completedThroughStep:
                Math.max(
                    normalizeCompletedStep(
                        existingDraft.completedThroughStep,
                        activeSteps.length
                    ),
                    completedThroughStep
                ),

            updatedAt:
                new Date().toISOString(),
        };

        saveCourseDraft(
            updatedDraft
        );

        setCurrentStep(
            index
        );

        setCompletedThroughStep(
            updatedDraft.completedThroughStep
        );

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    }

    /* =========================================================
       CURRENT STEP
    ========================================================= */

    function renderCurrentStep() {

        switch (
            activeSteps[currentStep]?.id
        ) {

            /* =================================================
               STEP 1
               BASIC SETUP
            ================================================= */

            case "setup":

                return (
                    <CourseSetup
                        tenant={
                            tenant
                        }

                        role={
                            role
                        }

                        /*
                         * IMPORTANT:
                         *
                         * For a NEW course this is "".
                         *
                         * CourseSetup must create the new Course
                         * and return the generated ID through
                         * onNext(courseId) only after Save &
                         * Continue.
                         */

                        courseId={
                            activeCourseId
                        }

                        onBack={
                            handleBack
                        }

                        onNext={
                            handleNext
                        }
                    />
                );

            /* =================================================
               STEP 2
               OUTCOMES & SKILLS
            ================================================= */

            case "outcomes":

                if (isAcademicTenant) {

                    return (
                        <AcademicCreditsOutcomesBuilder
                            tenant={
                                tenant
                            }

                            role={
                                role
                            }

                            courseId={
                                activeCourseId
                            }

                            onBack={
                                handleBack
                            }

                            onNext={
                                handleNext
                            }
                        />
                    );

                }

                return (
                    <OutcomesBuilder
                        tenant={
                            tenant
                        }

                        role={
                            role
                        }

                        courseId={
                            activeCourseId
                        }

                        onBack={
                            handleBack
                        }

                        onNext={
                            handleNext
                        }
                    />
                );

            /* =================================================
               LEARNING STRUCTURE
            ================================================= */

            case "learning-structure":

                return (
                    <LearningStructureBuilder
                        tenant={
                            tenant
                        }

                        role={
                            role
                        }

                        courseId={
                            activeCourseId
                        }

                        onBack={
                            handleBack
                        }

                        onNext={
                            handleNext
                        }
                    />
                );

            /* =================================================
               STEP 4
               COURSE TEAM
            ================================================= */

            case "team":

                return (
                    <CourseTeam
                        tenant={
                            tenant
                        }

                        role={
                            role
                        }

                        courseId={
                            activeCourseId
                        }

                        onBack={
                            handleBack
                        }

                        onNext={
                            handleNext
                        }
                    />
                );

            /* =================================================
               STEP 5
               DELIVERY
            ================================================= */

            case "delivery":

                return (
                    <DeliveryBuilder
                        tenant={
                            tenant
                        }

                        role={
                            role
                        }

                        courseId={
                            activeCourseId
                        }

                        onBack={
                            handleBack
                        }

                        onNext={
                            handleNext
                        }
                    />
                );

            /* =================================================
               STEP 6
               ENROLLMENT
            ================================================= */

            case "enrollment":

                return (
                    <EnrollmentBuilder
                        tenant={
                            tenant
                        }

                        role={
                            role
                        }

                        courseId={
                            activeCourseId
                        }

                        onBack={
                            handleBack
                        }

                        onNext={
                            handleNext
                        }
                    />
                );

            /* =================================================
               STEP 7
               COMPLETION
            ================================================= */

            case "completion":

                return (
                    <CompletionBuilder
                        tenant={
                            tenant
                        }

                        role={
                            role
                        }

                        courseId={
                            activeCourseId
                        }

                        onBack={
                            handleBack
                        }

                        onNext={
                            handleNext
                        }
                    />
                );

            /* =================================================
               STEP 8
               VALIDATION
            ================================================= */

            case "validation":

                return (
                    <ValidationBuilder
                        tenant={
                            tenant
                        }

                        role={
                            role
                        }

                        courseId={
                            activeCourseId
                        }

                        onBack={
                            handleBack
                        }

                        onNext={
                            handleNext
                        }
                    />
                );

            /* =================================================
               STEP 9
               REVIEW
            ================================================= */

            case "review":

                return (
                    showLearnerView ? (
                        <InlineLearnerPreview
                            courseId={
                                activeCourseId
                            }

                            onBack={() =>
                                setShowLearnerView(false)
                            }
                        />
                    ) : (
                        <ReviewBuilder
                            courseId={
                                activeCourseId
                            }

                            onBack={
                                handleBack
                            }

                            onLearnerView={() =>
                                setShowLearnerView(true)
                            }
                        />
                    )
                );

            /* =================================================
               DEFAULT
            ================================================= */

            default:

                return null;
        }
    }

    /* =========================================================
       ERROR / INVALID EXISTING COURSE
    ========================================================= */

    if (
        !draftReady &&
        loadError
    ) {

        return (
            <main
                className={
                    styles.container
                }
            >

                <section
                    className={
                        styles.content
                    }
                    aria-live="polite"
                >

                    <div>
                        {loadError}
                    </div>

                </section>

            </main>
        );
    }

    /* =========================================================
       RENDER
    ========================================================= */

    return (
        <main
            className={
                styles.container
            }
        >

            {/* =================================================
                STEP NAVIGATION
            ================================================= */}

            <nav
                className={
                    styles.stepper
                }
                aria-label="Course creation steps"
            >

                <div
                    className={
                        styles.stepperInner
                    }
                >

                    {activeSteps.map(
                        (
                            step,
                            index
                        ) => {

                            const isActive =
                                index ===
                                currentStep;

                            const isCompleted =
                                index <
                                completedThroughStep;

                            /*
                             * New course:
                             * only Step 1 is available.
                             *
                             * Existing course:
                             * completed steps + current step
                             * are available.
                             */

                            const isAccessible =
                                !activeCourseId
                                    ? index === 0
                                    : (
                                        index <
                                            completedThroughStep ||
                                        index ===
                                            completedThroughStep ||
                                        index ===
                                            currentStep
                                    );

                            return (

                                <div
                                    key={
                                        step.id
                                    }
                                    className={
                                        styles.stepWrapper
                                    }
                                >

                                    <button
                                        type="button"
                                        className={`
                                            ${styles.step}
                                            ${
                                                isActive
                                                    ? styles.active
                                                    : ""
                                            }
                                            ${
                                                isCompleted
                                                    ? styles.completed
                                                    : ""
                                            }
                                        `}
                                        onClick={() => {

                                            if (
                                                isAccessible
                                            ) {

                                                goToStep(
                                                    index
                                                );

                                            }

                                        }}
                                        disabled={
                                            !isAccessible
                                        }
                                        aria-current={
                                            isActive
                                                ? "step"
                                                : undefined
                                        }
                                    >

                                        <span
                                            className={
                                                styles.stepNumber
                                            }
                                        >

                                            {
                                                isCompleted
                                                    ? "✓"
                                                    : index + 1
                                            }

                                        </span>

                                        <span
                                            className={
                                                styles.stepLabel
                                            }
                                        >

                                            {
                                                step.label
                                            }

                                        </span>

                                    </button>

                                    {index <
                                        activeSteps.length - 1 && (

                                        <span
                                            className={`
                                                ${styles.stepConnector}
                                                ${
                                                    index <
                                                    completedThroughStep
                                                        ? styles.connectorCompleted
                                                        : ""
                                                }
                                            `}
                                        />

                                    )}

                                </div>

                            );
                        }
                    )}

                </div>

            </nav>

            {/* =================================================
                CURRENT STEP
            ================================================= */}

            <section
                className={
                    styles.content
                }
                aria-label="Current course creation step"
            >

                {
                    renderCurrentStep()
                }

            </section>

        </main>
    );
}