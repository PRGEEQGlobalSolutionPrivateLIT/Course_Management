"use client";

import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import {
    useSearchParams,
} from "next/navigation";

import {
    getCourseDraft,
} from "@/services/course-draft.service";

import type {
    CourseCreationState,
} from "@/types/course-creation.types";

import styles from "./learner-view.module.css";

/* =========================================================
   TYPES
========================================================= */

type LearnerNodeType =
    | "MODULE"
    | "LEARNING"
    | "CONTENT"
    | "ASSESSMENT";

type LearnerContentType =
    | "VIDEO"
    | "PDF"
    | "DOCUMENT"
    | "PRESENTATION"
    | "AUDIO"
    | "IMAGE"
    | "LINK"
    | "TEXT"
    | "ACTIVITY"
    | "SCORM"
    | "ASSESSMENT"
    | "OTHER";

type DeliveryTimingMode =
    | "scheduled"
    | "deadline"
    | "on_demand";

type ContentSchedule = {
    contentId: string;
    deliveryType?: DeliveryTimingMode;
    availableFrom?: string;
    availableUntil?: string;
};

type DeliveryConfiguration = {
    contentFlow?: "time_wise" | "sequential" | "flexible";
    timezone?: string;
    contentSchedules?: Record<string, ContentSchedule>;
};

interface LearnerNode {
    id: string;

    title: string;

    type: LearnerNodeType;

    contentType?: LearnerContentType;

    description?: string;

    url?: string;

    content?: string;

    duration?: string;

    /*
     * File/resource metadata created by Learning Structure Builder.
     * These fields are used only to resolve learner-facing content.
     */
    resourceKey?: string;
    resourceKind?: "BLOB" | "SCORM_PACKAGE";
    fileName?: string;
    fileType?: string;
    previewMode?:
        | "DOCUMENT"
        | "PRESENTATION"
        | "PDF"
        | "SCORM"
        | "MEDIA"
        | "WEB"
        | "DOWNLOAD";
    scormPackageId?: string;
    scormLaunchFile?: string;
    scormLaunchUrl?: string;
    scormVersion?: "SCORM_1_2" | "SCORM_2004";

    children: LearnerNode[];

    completed?: boolean;
}

interface LearnerCourse {
    title: string;

    code: string;

    description: string;

    level: string;

    deliveryMode: string;

    duration: string;

    category: string;

    language: string;

    modules: LearnerNode[];

    features: {
        notesEnabled: boolean;
        discussionEnabled: boolean;
        certificateEnabled: boolean;
        downloadEnabled: boolean;
    };
}

/* =========================================================
   GENERIC HELPERS
========================================================= */

function asRecord(
    value: unknown
): Record<string, unknown> | null {
    if (
        typeof value !== "object" ||
        value === null
    ) {
        return null;
    }

    return value as Record<string, unknown>;
}

function getString(
    object: Record<string, unknown> | null,
    keys: string[]
): string {
    if (!object) {
        return "";
    }

    for (const key of keys) {
        const value = object[key];

        if (
            typeof value === "string" &&
            value.trim()
        ) {
            return value.trim();
        }

        if (
            typeof value === "number"
        ) {
            return String(value);
        }
    }

    return "";
}

function getArray(
    object: Record<string, unknown> | null,
    keys: string[]
): unknown[] {
    if (!object) {
        return [];
    }

    for (const key of keys) {
        const value = object[key];

        if (
            Array.isArray(value)
        ) {
            return value;
        }
    }

    return [];
}

function getBoolean(
    object: Record<string, unknown> | null,
    keys: string[],
    fallback: boolean = false
): boolean {
    if (!object) {
        return fallback;
    }

    for (const key of keys) {
        const value = object[key];

        if (typeof value === "boolean") {
            return value;
        }

        if (typeof value === "string") {
            const normalized =
                value.trim().toLowerCase();

            if (
                [
                    "true",
                    "1",
                    "yes",
                    "enabled",
                    "on",
                ].includes(normalized)
            ) {
                return true;
            }

            if (
                [
                    "false",
                    "0",
                    "no",
                    "disabled",
                    "off",
                ].includes(normalized)
            ) {
                return false;
            }
        }

        if (typeof value === "number") {
            return value === 1;
        }
    }

    return fallback;
}

/* =========================================================
   LEARNER CONTENT STORAGE
========================================================= */

/*
 * Must match LearningStructureBuilder.
 * Normal uploaded files are stored as:
 *
 *     content:{contentId}
 *
 * in the "neurolxp-course-content" IndexedDB database.
 */
const CONTENT_STORAGE_DB =
    "neurolxp-course-content";

const CONTENT_STORAGE_VERSION = 1;

const CONTENT_FILE_STORE =
    "files";

type StoredLearnerResourceRecord = {
    key: string;
    blob?: Blob;

    /*
     * Older SCORM records may use `content`.
     * The corrected Learning Structure stores both blob/content,
     * so Learner View accepts either without changing other files.
     */
    content?: Blob;

    mimeType?: string;
    fileName?: string;
    packageId?: string;
    path?: string;
};

function openLearnerContentStorage():
    Promise<IDBDatabase> {
    return new Promise(
        (resolve, reject) => {
            if (
                typeof window === "undefined" ||
                !("indexedDB" in window)
            ) {
                reject(
                    new Error(
                        "IndexedDB is not available in this browser."
                    )
                );
                return;
            }

            /*
             * Learner View only reads this database.
             * Open the CURRENT database version so a future builder-side
             * IndexedDB upgrade cannot cause a VersionError here.
             */
            const request =
                window.indexedDB.open(
                    CONTENT_STORAGE_DB
                );

            request.onsuccess =
                () =>
                    resolve(
                        request.result
                    );

            request.onerror =
                () =>
                    reject(
                        request.error ??
                            new Error(
                                "Unable to open learner content storage."
                            )
                    );
        }
    );
}

async function readLearnerStoredResource(
    resourceKey: string
): Promise<StoredLearnerResourceRecord | null> {
    if (!resourceKey) {
        return null;
    }

    const database =
        await openLearnerContentStorage();

    try {
        const transaction =
            database.transaction(
                CONTENT_FILE_STORE,
                "readonly"
            );

        const request =
            transaction
                .objectStore(
                    CONTENT_FILE_STORE
                )
                .get(
                    resourceKey
                );

        return await new Promise(
            (resolve, reject) => {
                request.onsuccess =
                    () => {
                        const record =
                            request.result as
                                | StoredLearnerResourceRecord
                                | undefined;

                        resolve(
                            record ?? null
                        );
                    };

                request.onerror =
                    () =>
                        reject(
                            request.error ??
                                new Error(
                                    "Unable to read the uploaded learning resource."
                                )
                        );
            }
        );
    } finally {
        database.close();
    }
}

function getStoredResourceBlob(
    record: StoredLearnerResourceRecord | null
): Blob | null {
    if (!record) {
        return null;
    }

    if (record.blob instanceof Blob) {
        return record.blob;
    }

    if (record.content instanceof Blob) {
        return record.content;
    }

    return null;
}

function normalizeScormRelativePath(
    value: string
): string {
    return value
        .replace(/\\/g, "/")
        .split("/")
        .reduce<string[]>(
            (parts, part) => {
                if (
                    !part ||
                    part === "."
                ) {
                    return parts;
                }

                if (part === "..") {
                    parts.pop();
                    return parts;
                }

                parts.push(part);
                return parts;
            },
            []
        )
        .join("/");
}

function getScormLaunchResourceKey(
    node: LearnerNode
): string {
    if (
        node.resourceKey &&
        node.resourceKey.startsWith(
            "scorm:"
        )
    ) {
        return node.resourceKey;
    }

    if (
        node.scormPackageId &&
        node.scormLaunchFile
    ) {
        return (
            `scorm:${node.scormPackageId}:` +
            normalizeScormRelativePath(
                node.scormLaunchFile
            )
        );
    }

    return "";
}

/* =========================================================
   SCORM SERVICE WORKER READINESS
========================================================= */

async function ensureScormServiceWorker():
    Promise<ServiceWorkerRegistration> {
    if (
        typeof window === "undefined" ||
        !("serviceWorker" in navigator)
    ) {
        throw new Error(
            "SCORM preview requires browser Service Worker support."
        );
    }

    const registration =
        await navigator.serviceWorker.register(
            "/scorm-service-worker.js",
            {
                scope:
                    "/scorm-runtime/",
                updateViaCache:
                    "none",
            }
        );

    /*
     * Register in the background and do not block the SCORM iframe
     * behind worker activation state.
     */
    if (
        registration.waiting
    ) {
        registration.waiting.postMessage({
            type:
                "SKIP_WAITING",
        });
    }

    return registration;
}


/* =========================================================
   SCORM RUNTIME
========================================================= */

type Scorm12Api = {
    LMSInitialize:
        (value?: string) => string;
    LMSFinish:
        (value?: string) => string;
    LMSGetValue:
        (element: string) => string;
    LMSSetValue:
        (element: string, value: string) => string;
    LMSCommit:
        (value?: string) => string;
    LMSGetLastError:
        () => string;
    LMSGetErrorString:
        (errorCode: string) => string;
    LMSGetDiagnostic:
        (errorCode?: string) => string;
};

type Scorm2004Api = {
    Initialize:
        (value?: string) => string;
    Terminate:
        (value?: string) => string;
    GetValue:
        (element: string) => string;
    SetValue:
        (element: string, value: string) => string;
    Commit:
        (value?: string) => string;
    GetLastError:
        () => string;
    GetErrorString:
        (errorCode: string) => string;
    GetDiagnostic:
        (errorCode?: string) => string;
};

function safeJsonParse<T>(
    value: string | null,
    fallback: T
): T {
    if (!value) {
        return fallback;
    }

    try {
        return JSON.parse(
            value
        ) as T;
    } catch {
        return fallback;
    }
}

function createScorm12Api(
    packageId: string,
    learnerId: string,
    onComplete: () => void
): Scorm12Api {
    const storageKey =
        `neurolxp-scorm-runtime:${packageId}:${learnerId}`;

    const savedValues =
        safeJsonParse<
            Record<string, string>
        >(
            window.localStorage.getItem(
                storageKey
            ),
            {}
        );

    let initialized = false;
    let finished = false;
    let lastError = "0";

    const values:
        Record<string, string> = {
        "cmi.core.student_id":
            learnerId,
        "cmi.core.student_name":
            "Demo Learner",
        "cmi.core.lesson_status":
            "not attempted",
        "cmi.core.lesson_location":
            "",
        "cmi.core.score.raw":
            "",
        "cmi.core.score.min":
            "0",
        "cmi.core.score.max":
            "100",
        "cmi.core.session_time":
            "0000:00:00",
        "cmi.core.total_time":
            "0000:00:00",
        "cmi.suspend_data":
            "",
        "cmi.launch_data":
            "",
        "cmi.core.credit":
            "credit",
        "cmi.core.lesson_mode":
            "normal",
        ...savedValues,
    };

    function persist() {
        window.localStorage.setItem(
            storageKey,
            JSON.stringify(
                values
            )
        );
    }

    const api:
        Scorm12Api = {
        LMSInitialize() {
            if (finished) {
                lastError =
                    "101";
                return "false";
            }

            initialized =
                true;
            lastError =
                "0";

            return "true";
        },

        LMSFinish() {
            if (!initialized) {
                lastError =
                    "301";
                return "false";
            }

            persist();

            initialized =
                false;
            finished =
                true;
            lastError =
                "0";

            return "true";
        },

        LMSGetValue(element) {
            if (!initialized) {
                lastError =
                    "301";
                return "";
            }

            lastError =
                "0";

            return (
                values[element] ??
                ""
            );
        },

        LMSSetValue(
            element,
            value
        ) {
            if (!initialized) {
                lastError =
                    "301";
                return "false";
            }

            values[element] =
                String(
                    value
                );

            const normalized =
                String(
                    value
                )
                    .trim()
                    .toLowerCase();

            if (
                element ===
                    "cmi.core.lesson_status" &&
                [
                    "completed",
                    "passed",
                ].includes(
                    normalized
                )
            ) {
                onComplete();
            }

            lastError =
                "0";

            return "true";
        },

        LMSCommit() {
            if (!initialized) {
                lastError =
                    "301";
                return "false";
            }

            persist();

            lastError =
                "0";

            return "true";
        },

        LMSGetLastError() {
            return lastError;
        },

        LMSGetErrorString(
            errorCode
        ) {
            const errors:
                Record<string, string> = {
                "0":
                    "No error",
                "101":
                    "General exception",
                "201":
                    "Invalid argument error",
                "301":
                    "Not initialized",
                "401":
                    "Not implemented error",
            };

            return (
                errors[errorCode] ??
                "Unknown error"
            );
        },

        LMSGetDiagnostic(
            errorCode
        ) {
            return api.LMSGetErrorString(
                errorCode ??
                    lastError
            );
        },
    };

    return api;
}

function createScorm2004Api(
    packageId: string,
    learnerId: string,
    onComplete: () => void
): Scorm2004Api {
    const storageKey =
        `neurolxp-scorm-runtime:${packageId}:${learnerId}`;

    const savedValues =
        safeJsonParse<
            Record<string, string>
        >(
            window.localStorage.getItem(
                storageKey
            ),
            {}
        );

    let initialized = false;
    let terminated = false;
    let lastError = "0";

    const values:
        Record<string, string> = {
        "cmi.learner_id":
            learnerId,
        "cmi.learner_name":
            "Demo Learner",
        "cmi.completion_status":
            "unknown",
        "cmi.success_status":
            "unknown",
        "cmi.location":
            "",
        "cmi.score.raw":
            "",
        "cmi.score.min":
            "0",
        "cmi.score.max":
            "100",
        "cmi.session_time":
            "PT0H0M0S",
        "cmi.total_time":
            "PT0H0M0S",
        "cmi.suspend_data":
            "",
        "cmi.entry":
            savedValues[
                "cmi.suspend_data"
            ]
                ? "resume"
                : "ab-initio",
        "cmi.mode":
            "normal",
        "cmi.credit":
            "credit",
        ...savedValues,
    };

    function persist() {
        window.localStorage.setItem(
            storageKey,
            JSON.stringify(
                values
            )
        );
    }

    const api:
        Scorm2004Api = {
        Initialize() {
            if (terminated) {
                lastError =
                    "104";
                return "false";
            }

            initialized =
                true;
            lastError =
                "0";

            return "true";
        },

        Terminate() {
            if (!initialized) {
                lastError =
                    "132";
                return "false";
            }

            persist();

            initialized =
                false;
            terminated =
                true;
            lastError =
                "0";

            return "true";
        },

        GetValue(element) {
            if (!initialized) {
                lastError =
                    "122";
                return "";
            }

            lastError =
                "0";

            return (
                values[element] ??
                ""
            );
        },

        SetValue(
            element,
            value
        ) {
            if (!initialized) {
                lastError =
                    "132";
                return "false";
            }

            values[element] =
                String(
                    value
                );

            const normalized =
                String(
                    value
                )
                    .trim()
                    .toLowerCase();

            const completed =
                element ===
                    "cmi.completion_status" &&
                normalized ===
                    "completed";

            const passed =
                element ===
                    "cmi.success_status" &&
                normalized ===
                    "passed";

            if (
                completed ||
                passed
            ) {
                onComplete();
            }

            lastError =
                "0";

            return "true";
        },

        Commit() {
            if (!initialized) {
                lastError =
                    "142";
                return "false";
            }

            persist();

            lastError =
                "0";

            return "true";
        },

        GetLastError() {
            return lastError;
        },

        GetErrorString(
            errorCode
        ) {
            const errors:
                Record<string, string> = {
                "0":
                    "No error",
                "101":
                    "General exception",
                "102":
                    "General initialization failure",
                "103":
                    "Already initialized",
                "104":
                    "Content instance terminated",
                "111":
                    "General termination failure",
                "112":
                    "Termination before initialization",
                "113":
                    "Termination after termination",
                "122":
                    "Retrieve data before initialization",
                "132":
                    "Store data before initialization",
                "142":
                    "Commit before initialization",
            };

            return (
                errors[errorCode] ??
                "Unknown error"
            );
        },

        GetDiagnostic(
            errorCode
        ) {
            return api.GetErrorString(
                errorCode ??
                    lastError
            );
        },
    };

    return api;
}

/* =========================================================
   URL / FILE HELPERS
========================================================= */

function isPreviewableExternalUrl(
    url: string
): boolean {
    return /^https?:\/\//i.test(url);
}

/**
 * Microsoft Office web viewer.
 *
 * IMPORTANT:
 * This is used only for external DOC/DOCX/PPT/PPTX files.
 * We do NOT put the raw document URL directly into the iframe.
 *
 * This prevents the browser from treating the DOC/DOCX file
 * itself as an iframe document and downloading it because of
 * Content-Disposition: attachment.
 */
function getOfficeViewerUrl(
    url: string
): string {
    return (
        "https://view.officeapps.live.com/op/embed.aspx?src=" +
        encodeURIComponent(url)
    );
}

/**
 * Detect file extension from URL.
 *
 * Query strings are removed first so that URLs such as:
 *
 * https://example.com/file.docx?token=123
 *
 * are correctly detected as DOCX.
 */
function getFileExtension(
    url: string
): string {
    try {
        const cleanUrl =
            url.split("?")[0].split("#")[0];

        const lastPart =
            cleanUrl.split("/").pop() || "";

        const dotIndex =
            lastPart.lastIndexOf(".");

        if (dotIndex === -1) {
            return "";
        }

        return lastPart
            .slice(dotIndex + 1)
            .toLowerCase();
    } catch {
        return "";
    }
}

/**
 * Detect content type from the file URL.
 *
 * This is especially useful when the backend stores:
 *
 * type = "OTHER"
 *
 * but the URL itself clearly points to:
 *
 * .docx
 * .pdf
 * .pptx
 * .mp4
 * .mp3
 * .jpg
 * .html
 * etc.
 */
function inferContentTypeFromUrl(
    url: string
): LearnerContentType | null {
    const extension =
        getFileExtension(url);

    switch (extension) {
        case "mp4":
        case "webm":
        case "ogg":
        case "mov":
        case "m4v":
            return "VIDEO";

        case "mp3":
        case "wav":
        case "aac":
        case "m4a":
        case "flac":
            return "AUDIO";

        case "pdf":
            return "PDF";

        case "doc":
        case "docx":
            return "DOCUMENT";

        case "ppt":
        case "pptx":
        case "pps":
        case "ppsx":
            return "PRESENTATION";

        case "jpg":
        case "jpeg":
        case "png":
        case "gif":
        case "webp":
        case "svg":
            return "IMAGE";

        case "html":
        case "htm":
            return "SCORM";

        default:
            return null;
    }
}

/**
 * Returns whether the URL is probably a SCORM launch file.
 *
 * A raw .zip is NOT directly executed as SCORM.
 * The backend/upload process should extract the package and
 * provide the launch HTML URL.
 */
function isScormLaunchUrl(
    url: string
): boolean {
    const extension =
        getFileExtension(url);

    return (
        extension === "html" ||
        extension === "htm"
    );
}

/* =========================================================
   CONTENT TYPE NORMALIZATION
========================================================= */

function normalizeType(
    value: string
): LearnerContentType {
    const normalized =
        value
            .trim()
            .toUpperCase()
            .replace(
                /[\s-]+/g,
                "_"
            );

    switch (normalized) {
        case "VIDEO":
        case "VIDEOS":
        case "MP4":
        case "WEBM":
        case "MP4_VIDEO":
        case "INTERACTIVE_VIDEO":
        case "SHORT_FORM_VIDEO":
        case "DIGITAL_MEDIA":
            return "VIDEO";

        case "PDF":
        case "PDF_FILE":
        case "DIGITAL_MANUAL":
        case "DIGITAL_DOCUMENTATION":
            return "PDF";

        case "DOCUMENT":
        case "DOC":
        case "DOCX":
        case "WORD":
        case "WORD_DOCUMENT":
        case "WORD_FILE":
        case "DOC_DOCX":
            return "DOCUMENT";

        case "PRESENTATION":
        case "PPT":
        case "PPTX":
        case "PPS":
        case "PPSX":
        case "SLIDES":
        case "POWERPOINT":
        case "PPT_PPTX":
        case "GOOGLE_SLIDES":
        case "INTERACTIVE_PRESENTATION":
            return "PRESENTATION";

        case "AUDIO":
        case "MP3":
        case "WAV":
            return "AUDIO";

        case "IMAGE":
        case "PHOTO":
        case "JPG":
        case "JPEG":
        case "PNG":
            return "IMAGE";

        case "LINK":
        case "URL":
        case "WEB_LINK":
        case "WEB_PRESENTATION":
        case "PROGRESSIVE_WEB_APP":
        case "LIVE_STREAMING":
        case "MOBILE_LEARNING":
        case "WIKI":
        case "DYNAMIC_KNOWLEDGE_BASE":
        case "COLLABORATIVE_DOCUMENT":
            return "LINK";

        case "TEXT":
        case "ARTICLE":
        case "READING":
            return "TEXT";

        case "ACTIVITY":
        case "EXERCISE":
        case "PRACTICE":
            return "ACTIVITY";

        case "SCORM":
        case "SCORM_PACKAGE":
        case "SCORM_COURSE":
        case "SCORM_CONTENT":
        case "SCORM_1_2":
        case "SCORM_2004":
        case "SCORM12":
        case "SCORM2004":
            return "SCORM";

        case "ASSESSMENT":
        case "QUIZ":
        case "TEST":
            return "ASSESSMENT";

        default:
            return "OTHER";
    }
}

/* =========================================================
   CONTENT NORMALIZATION
========================================================= */

function normalizeContent(
    value: unknown,
    parentId: string,
    index: number
): LearnerNode {
    const object =
        asRecord(value);

    const rawType =
        getString(
            object,
            [
                "type",
                "contentType",
                "resourceType",
                "itemType",
                "kind",
                "format",
            ]
        );

    let contentType =
        normalizeType(rawType);

    const title =
        getString(
            object,
            [
                "title",
                "name",
                "label",
                "heading",
            ]
        ) ||
        `Content ${index + 1}`;

    const description =
        getString(
            object,
            [
                "description",
                "summary",
                "instructions",
            ]
        );

    /**
     * SCORM/content systems may use different URL property names.
     */
    const url =
        getString(
            object,
            [
                "url",
                "fileUrl",
                "resourceUrl",
                "src",
                "href",
                "launchUrl",
                "launchURL",
                "scormLaunchUrl",
                "scormLaunchURL",
                "launchFile",
                "entryPoint",
                "scormUrl",
                "scormURL",
                "packageUrl",
                "contentUrl",
            ]
        );

    /**
     * If the type was not correctly supplied by the backend,
     * infer it from the actual URL.
     */
    if (
        contentType === "OTHER" &&
        url
    ) {
        const inferred =
            inferContentTypeFromUrl(url);

        if (inferred) {
            contentType = inferred;
        }
    }

    /**
     * Explicit SCORM launch URLs should always be treated
     * as SCORM.
     */
    if (
        url &&
        isScormLaunchUrl(url) &&
        (
            contentType === "OTHER" ||
            contentType === "SCORM"
        )
    ) {
        contentType = "SCORM";
    }

    const content =
        getString(
            object,
            [
                "content",
                "text",
                "body",
                "html",
            ]
        );

    const duration =
        getString(
            object,
            [
                "duration",
                "estimatedDuration",
                "durationText",
            ]
        );

    const resourceKey =
        getString(
            object,
            [
                "resourceKey",
            ]
        );

    const resourceKind =
        getString(
            object,
            [
                "resourceKind",
            ]
        );

    const fileName =
        getString(
            object,
            [
                "fileName",
                "originalFileName",
            ]
        );

    const fileType =
        getString(
            object,
            [
                "fileType",
                "mimeType",
            ]
        );

    const previewMode =
        getString(
            object,
            [
                "previewMode",
            ]
        );

    const scormPackageId =
        getString(
            object,
            [
                "scormPackageId",
            ]
        );

    const scormLaunchFile =
        getString(
            object,
            [
                "scormLaunchFile",
            ]
        );

    const scormLaunchUrl =
        getString(
            object,
            [
                "scormLaunchUrl",
                "scormLaunchURL",
            ]
        );

    const scormVersion =
        getString(
            object,
            [
                "scormVersion",
            ]
        );

    /*
     * Builder content can have no public URL for locally uploaded files.
     * In that case the actual Blob is resolved later from resourceKey.
     */
    const normalizedUrl =
        scormLaunchUrl ||
        url;

    /*
     * File extension is available from fileName even when there is no URL.
     */
    if (
        contentType === "OTHER" &&
        fileName
    ) {
        const inferred =
            inferContentTypeFromUrl(
                fileName
            );

        if (inferred) {
            contentType =
                inferred;
        }
    }

    return {
        id:
            getString(
                object,
                [
                    "id",
                    "contentId",
                    "resourceId",
                ]
            ) ||
            `${parentId}-content-${index}`,

        title,

        type:
            contentType === "ASSESSMENT"
                ? "ASSESSMENT"
                : "CONTENT",

        contentType,

        description,

        url:
            normalizedUrl,

        content,

        duration,

        resourceKey:
            resourceKey ||
            undefined,

        resourceKind:
            resourceKind === "BLOB" ||
            resourceKind === "SCORM_PACKAGE"
                ? resourceKind
                : undefined,

        fileName:
            fileName ||
            undefined,

        fileType:
            fileType ||
            undefined,

        previewMode:
            (
                [
                    "DOCUMENT",
                    "PRESENTATION",
                    "PDF",
                    "SCORM",
                    "MEDIA",
                    "WEB",
                    "DOWNLOAD",
                ] as const
            ).includes(
                previewMode as
                    | "DOCUMENT"
                    | "PRESENTATION"
                    | "PDF"
                    | "SCORM"
                    | "MEDIA"
                    | "WEB"
                    | "DOWNLOAD"
            )
                ? (
                      previewMode as
                          | "DOCUMENT"
                          | "PRESENTATION"
                          | "PDF"
                          | "SCORM"
                          | "MEDIA"
                          | "WEB"
                          | "DOWNLOAD"
                  )
                : undefined,

        scormPackageId:
            scormPackageId ||
            undefined,

        scormLaunchFile:
            scormLaunchFile ||
            undefined,

        scormLaunchUrl:
            scormLaunchUrl ||
            undefined,

        scormVersion:
            scormVersion ===
                "SCORM_2004"
                ? "SCORM_2004"
                : scormVersion ===
                    "SCORM_1_2"
                    ? "SCORM_1_2"
                    : undefined,

        children: [],
    };
}

/* =========================================================
   LEARNING NORMALIZATION
========================================================= */

function normalizeLearning(
    value: unknown,
    moduleId: string,
    index: number
): LearnerNode {
    const object =
        asRecord(value);

    const id =
        getString(
            object,
            [
                "id",
                "learningId",
                "lessonId",
            ]
        ) ||
        `${moduleId}-learning-${index}`;

    const title =
        getString(
            object,
            [
                "title",
                "name",
                "label",
            ]
        ) ||
        `Learning ${index + 1}`;

    const description =
        getString(
            object,
            [
                "description",
                "summary",
            ]
        );

    const rawContent =
        getArray(
            object,
            [
                "content",
                "contents",
                "items",
                "resources",
                "learningContent",
                "contentItems",
            ]
        );

    const children =
        rawContent.map(
            (
                item,
                contentIndex
            ) =>
                normalizeContent(
                    item,
                    id,
                    contentIndex
                )
        );

    const assessments =
        getArray(
            object,
            [
                "assessments",
                "assessmentLinks",
                "linkedAssessments",
            ]
        );

    assessments.forEach(
        (
            assessment,
            assessmentIndex
        ) => {
            const assessmentObject =
                asRecord(
                    assessment
                );

            const assessmentTitle =
                getString(
                    assessmentObject,
                    [
                        "title",
                        "name",
                        "label",
                    ]
                ) ||
                `Assessment ${assessmentIndex + 1}`;

            children.push({
                id:
                    getString(
                        assessmentObject,
                        [
                            "id",
                            "assessmentId",
                        ]
                    ) ||
                    `${id}-assessment-${assessmentIndex}`,

                title:
                    assessmentTitle,

                type:
                    "ASSESSMENT",

                contentType:
                    "ASSESSMENT",

                description:
                    getString(
                        assessmentObject,
                        [
                            "description",
                            "summary",
                        ]
                    ),

                children: [],
            });
        }
    );

    return {
        id,

        title,

        type:
            "LEARNING",

        description,

        children,
    };
}

/* =========================================================
   MODULE NORMALIZATION
========================================================= */

function normalizeModule(
    value: unknown,
    index: number
): LearnerNode {
    const object =
        asRecord(value);

    const id =
        getString(
            object,
            [
                "id",
                "moduleId",
            ]
        ) ||
        `module-${index}`;

    const title =
        getString(
            object,
            [
                "title",
                "name",
                "label",
            ]
        ) ||
        `Module ${index + 1}`;

    const description =
        getString(
            object,
            [
                "description",
                "summary",
            ]
        );

    const rawLearnings =
        getArray(
            object,
            [
                "learnings",
                "learning",
                "lessons",
                "units",
                "topics",
                "items",
                "children",
            ]
        );

    const children =
        rawLearnings.map(
            (
                learning,
                learningIndex
            ) =>
                normalizeLearning(
                    learning,
                    id,
                    learningIndex
                )
        );

    const directContent =
        getArray(
            object,
            [
                "content",
                "contents",
                "resources",
                "contentItems",
                "learningContent",
            ]
        );

    if (
        children.length === 0 &&
        directContent.length > 0
    ) {
        const fallbackLearning:
            LearnerNode = {
                id:
                    `${id}-learning-1`,

                title:
                    "Learning Content",

                type:
                    "LEARNING",

                description:
                    "",

                children:
                    directContent.map(
                        (
                            item,
                            contentIndex
                        ) =>
                            normalizeContent(
                                item,
                                `${id}-learning-1`,
                                contentIndex
                            )
                    ),
            };

        children.push(
            fallbackLearning
        );
    }

    return {
        id,

        title,

        type:
            "MODULE",

        description,

        children,
    };
}

/* =========================================================
   BUILD COURSE TREE
========================================================= */

function buildCourseTree(
    draft: CourseCreationState
): LearnerCourse {
    const setup =
        draft.setup;

    const structure =
        Array.isArray(
            draft.structure
        )
            ? draft.structure
            : [];

    const modules =
        structure.map(
            (
                module,
                index
            ) =>
                normalizeModule(
                    module,
                    index
                )
        );

    if (
        modules.length === 0 &&
        Array.isArray(
            draft.content
        ) &&
        draft.content.length > 0
    ) {
        modules.push({
            id:
                "course-content",

            title:
                "Course Content",

            type:
                "MODULE",

            description:
                "",

            children: [
                {
                    id:
                        "course-content-learning",

                    title:
                        "Learning Content",

                    type:
                        "LEARNING",

                    description:
                        "",

                    children:
                        draft.content.map(
                            (
                                item,
                                index
                            ) =>
                                normalizeContent(
                                    item,
                                    "course-content-learning",
                                    index
                                )
                        ),
                },
            ],
        });
    }

    return {
        title:
            setup.title ||
            "Course",

        code:
            setup.code ||
            "",

        description:
            setup.description ||
            "",

        level:
            setup.level ||
            "",

        deliveryMode:
            setup.deliveryMode ||
            "",

        duration:
            setup.estimatedDuration
                ? `${setup.estimatedDuration} ${setup.estimatedDurationUnit.toLowerCase()}`
                : "",

        category:
            setup.category ||
            "",

        language:
            setup.language ||
            "",

        modules,

        features: {
            notesEnabled:
                getBoolean(
                    asRecord(setup),
                    [
                        "notesEnabled",
                        "enableNotes",
                        "notes",
                        "allowNotes",
                    ],
                    false
                ),

            discussionEnabled:
                getBoolean(
                    asRecord(setup),
                    [
                        "discussionEnabled",
                        "enableDiscussion",
                        "discussion",
                        "allowDiscussion",
                    ],
                    false
                ),

            certificateEnabled:
                getBoolean(
                    asRecord(setup),
                    [
                        "certificateEnabled",
                        "enableCertificate",
                        "certificate",
                        "allowCertificate",
                    ],
                    false
                ),

            downloadEnabled:
                getBoolean(
                    asRecord(setup),
                    [
                        "downloadEnabled",
                        "enableDownload",
                        "download",
                        "allowDownload",
                    ],
                    true
                ),
        },
    };
}

/* =========================================================
   FLATTEN TREE
========================================================= */

function flattenLearnerNodes(
    modules: LearnerNode[]
): LearnerNode[] {
    const result:
        LearnerNode[] = [];

    function visit(
        node: LearnerNode
    ) {
        result.push(
            node
        );

        node.children.forEach(
            visit
        );
    }

    modules.forEach(
        visit
    );

    return result;
}

/* =========================================================
   CONTENT ICON
========================================================= */

function getNodeIcon(
    node: LearnerNode
): string {
    if (
        node.type === "MODULE"
    ) {
        return "▾";
    }

    if (
        node.type === "LEARNING"
    ) {
        return "○";
    }

    if (
        node.type === "ASSESSMENT"
    ) {
        return "✓";
    }

    switch (
        node.contentType
    ) {
        case "VIDEO":
            return "▶";

        case "PDF":
            return "▤";

        case "DOCUMENT":
            return "▱";

        case "PRESENTATION":
            return "▥";

        case "AUDIO":
            return "♪";

        case "IMAGE":
            return "▧";

        case "LINK":
            return "↗";

        case "TEXT":
            return "≡";

        case "ACTIVITY":
            return "◆";

        case "SCORM":
            return "◈";

        default:
            return "•";
    }
}

/* =========================================================
   LEARNER VIEW
========================================================= */

type LearnerViewProps = {
    courseId?: string;
    onBack?: () => void;
};

export default function LearnerViewPage({
    courseId: courseIdProp,
    onBack,
}: LearnerViewProps) {
    const searchParams =
        useSearchParams();

    const courseId =
        courseIdProp ??
        searchParams.get("courseId");

    /*
     * Diagnostic marker only.
     * If this message appears in DevTools Console, this exact corrected
     * learner-view file is the one being rendered by Next.js.
     */
    useEffect(() => {
        console.info(
            "[NeuroLXP Learner View] DIRECT_SCORM_BUILD_20260826"
        );
    }, []);

    const [draft, setDraft] =
        useState<CourseCreationState | null>(
            null
        );

    const [selectedId, setSelectedId] =
        useState<string | null>(
            null
        );

    const [expandedModules, setExpandedModules] =
        useState<Set<string>>(
            new Set()
        );

    const [completedIds, setCompletedIds] =
        useState<Set<string>>(
            new Set()
        );

    const [error, setError] =
        useState<string>("");

    const [refreshKey, setRefreshKey] =
        useState(0);

    const [isFullscreen, setIsFullscreen] =
        useState(false);

    const [showNotes, setShowNotes] =
        useState(false);

    const [showDiscussion, setShowDiscussion] =
        useState(false);

    const [notes, setNotes] =
        useState("");

    const [discussion, setDiscussion] =
        useState("");

    /*
     * Object URLs generated from IndexedDB-backed uploaded files.
     * External URLs and SCORM launch URLs continue to use node.url.
     */
    const [resourceUrls, setResourceUrls] =
        useState<Record<string, string>>({});

    const [resourceLoadErrors, setResourceLoadErrors] =
        useState<Record<string, string>>({});

    const fullscreenRef =
        useRef<HTMLDivElement | null>(
            null
        );

    /* =====================================================
       SCORM SERVICE WORKER
    ===================================================== */

    useEffect(() => {
        /*
         * Register SCORM runtime in the background.
         * Learner rendering does not wait for preparation state.
         */
        void ensureScormServiceWorker()
            .catch(
                (serviceWorkerError) => {
                    console.error(
                        "SCORM service worker registration failed:",
                        serviceWorkerError
                    );
                }
            );
    }, []);

    /* =====================================================
       LOAD DRAFT
    ===================================================== */

    useEffect(() => {
        if (!courseId) {
            setError(
                "Course ID is missing."
            );
            return;
        }

        const loadedDraft =
            getCourseDraft(courseId);

        if (!loadedDraft) {
            setError(
                "The course draft could not be found."
            );
            return;
        }

        setDraft(
            loadedDraft
        );
    }, [courseId]);

    /* =====================================================
       BUILD COURSE
    ===================================================== */

    const course =
        useMemo(() => {
            if (!draft) {
                return null;
            }

            return buildCourseTree(
                draft
            );
        }, [draft]);

    /* =====================================================
       FLATTEN NAVIGATION
    ===================================================== */

    const flatNodes =
        useMemo(() => {
            if (!course) {
                return [];
            }

            return flattenLearnerNodes(
                course.modules
            );
        }, [course]);

    const contentNodes =
        useMemo(
            () =>
                flatNodes.filter(
                    (node) =>
                        node.type === "CONTENT" ||
                        node.type === "ASSESSMENT"
                ),
            [flatNodes]
        );

    /* =====================================================
       RESOLVE UPLOADED FILES
    ===================================================== */

    useEffect(() => {
        let cancelled = false;

        const createdObjectUrls:
            string[] = [];

        async function resolveUploadedFiles() {
            const nextUrls:
                Record<string, string> = {};

            const nextErrors:
                Record<string, string> = {};

            for (
                const node
                of contentNodes
            ) {
                /*
                 * External resources and SCORM already have a launch URL.
                 */
                if (
                    node.url ||
                    !node.resourceKey ||
                    node.resourceKind ===
                        "SCORM_PACKAGE"
                ) {
                    continue;
                }

                try {
                    const record =
                        await readLearnerStoredResource(
                            node.resourceKey
                        );

                    const storedBlob =
                        getStoredResourceBlob(
                            record
                        );

                    if (!storedBlob) {
                        nextErrors[
                            node.id
                        ] =
                            "The uploaded resource could not be found in browser storage.";

                        continue;
                    }

                    const objectUrl =
                        URL.createObjectURL(
                            storedBlob
                        );

                    createdObjectUrls.push(
                        objectUrl
                    );

                    nextUrls[
                        node.id
                    ] =
                        objectUrl;
                } catch (
                    resourceError
                ) {
                    console.error(
                        "Unable to resolve learner resource:",
                        resourceError
                    );

                    nextErrors[
                        node.id
                    ] =
                        resourceError instanceof
                        Error
                            ? resourceError.message
                            : "Unable to load the uploaded resource.";
                }
            }

            if (!cancelled) {
                setResourceUrls(
                    nextUrls
                );

                setResourceLoadErrors(
                    nextErrors
                );
            }
        }

        void resolveUploadedFiles();

        return () => {
            cancelled =
                true;

            createdObjectUrls.forEach(
                (objectUrl) =>
                    URL.revokeObjectURL(
                        objectUrl
                    )
            );
        };
    }, [
        contentNodes,
        refreshKey,
    ]);

    function getNodeResourceUrl(
        node: LearnerNode
    ): string {
        if (
            node.contentType ===
            "SCORM"
        ) {
            if (
                node.scormLaunchUrl
            ) {
                return node.scormLaunchUrl;
            }

            if (
                node.scormPackageId &&
                node.scormLaunchFile
            ) {
                const packagePart =
                    encodeURIComponent(
                        node.scormPackageId
                    );

                const filePart =
                    normalizeScormRelativePath(
                        node.scormLaunchFile
                    )
                        .split("/")
                        .filter(Boolean)
                        .map(
                            (part) =>
                                encodeURIComponent(
                                    part
                                )
                        )
                        .join("/");

                return (
                    `/scorm-runtime/` +
                    `${packagePart}/` +
                    `${filePart}`
                );
            }

            return node.url || "";
        }

        return (
            node.url ||
            resourceUrls[
                node.id
            ] ||
            ""
        );
    }


    /* =====================================================
       DELIVERY / LEARNER FLOW
    ===================================================== */

    const delivery =
        useMemo<DeliveryConfiguration>(() => {
            const raw =
                (
                    draft as unknown as {
                        delivery?: DeliveryConfiguration;
                    } | null
                )?.delivery;

            return raw ?? {};
        }, [draft]);

    const contentFlow =
        delivery.contentFlow ??
        "flexible";

    const deliveryTimezone =
        delivery.timezone ||
        "Asia/Kolkata";

    const [nowTick, setNowTick] =
        useState(() =>
            Date.now()
        );

    useEffect(() => {
        const timer =
            window.setInterval(
                () =>
                    setNowTick(
                        Date.now()
                    ),
                30000
            );

        return () =>
            window.clearInterval(
                timer
            );
    }, []);

    function getCurrentDateTimeInTimezone(
        timeZone: string
    ): string {
        try {
            const parts =
                new Intl.DateTimeFormat(
                    "en-CA",
                    {
                        timeZone,
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        hourCycle: "h23",
                    }
                ).formatToParts(
                    new Date(nowTick)
                );

            const values =
                Object.fromEntries(
                    parts
                        .filter(
                            (part) =>
                                part.type !==
                                "literal"
                        )
                        .map(
                            (part) => [
                                part.type,
                                part.value,
                            ]
                        )
                );

            return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
        } catch {
            const date =
                new Date(
                    nowTick
                );

            const pad =
                (value: number) =>
                    String(
                        value
                    ).padStart(
                        2,
                        "0"
                    );

            return `${date.getFullYear()}-${pad(
                date.getMonth() + 1
            )}-${pad(
                date.getDate()
            )}T${pad(
                date.getHours()
            )}:${pad(
                date.getMinutes()
            )}`;
        }
    }

    const currentDeliveryDateTime =
        getCurrentDateTimeInTimezone(
            deliveryTimezone
        );

    function formatScheduleDate(
        value?: string
    ): string {
        if (!value) return "";

        const [date, time] =
            value.split("T");

        if (!date) return value;

        const [
            year,
            month,
            day,
        ] =
            date.split("-");

        return `${day}/${month}/${year}${
            time
                ? ` ${time.slice(0, 5)}`
                : ""
        }`;
    }

    function getSchedule(
        node: LearnerNode
    ): ContentSchedule | null {
        return (
            delivery.contentSchedules?.[
                node.id
            ] ?? null
        );
    }

    function getScheduleStatus(
        node: LearnerNode
    ): {
        available: boolean;
        label: string;
    } {
        if (
            node.type !== "CONTENT" &&
            node.type !== "ASSESSMENT"
        ) {
            return {
                available: true,
                label: "",
            };
        }

        if (
            contentFlow !== "time_wise"
        ) {
            return {
                available: true,
                label: "",
            };
        }

        const schedule =
            getSchedule(node);

        if (!schedule) {
            return {
                available: false,
                label: "Not scheduled",
            };
        }

        const deliveryType =
            schedule.deliveryType ??
            "scheduled";

        if (
            deliveryType ===
            "on_demand"
        ) {
            return {
                available: true,
                label: "On-demand",
            };
        }

        if (
            deliveryType ===
                "deadline" &&
            schedule.availableFrom &&
            currentDeliveryDateTime <
                schedule.availableFrom.slice(
                    0,
                    16
                )
        ) {
            return {
                available: false,
                label: `Available ${formatScheduleDate(
                    schedule.availableFrom
                )}`,
            };
        }

        if (
            schedule.availableUntil &&
            currentDeliveryDateTime >
                schedule.availableUntil.slice(
                    0,
                    16
                )
        ) {
            return {
                available: false,
                label:
                    deliveryType ===
                    "deadline"
                        ? `Deadline passed ${formatScheduleDate(
                              schedule.availableUntil
                          )}`
                        : `Closed ${formatScheduleDate(
                              schedule.availableUntil
                          )}`,
            };
        }

        if (
            deliveryType ===
                "scheduled" &&
            !schedule.availableFrom
        ) {
            return {
                available: false,
                label:
                    "Release date not set",
            };
        }

        if (
            deliveryType ===
                "scheduled" &&
            schedule.availableFrom &&
            currentDeliveryDateTime <
                schedule.availableFrom.slice(
                    0,
                    16
                )
        ) {
            return {
                available: false,
                label: `Available ${formatScheduleDate(
                    schedule.availableFrom
                )}`,
            };
        }

        return {
            available: true,
            label:
                deliveryType ===
                "deadline"
                    ? "Available until deadline"
                    : "Available now",
        };
    }

    const accessibleContentNodes =
        useMemo(() => {
            if (
                contentFlow ===
                "flexible"
            ) {
                return contentNodes;
            }

            if (
                contentFlow ===
                "time_wise"
            ) {
                return contentNodes.filter(
                    (node) =>
                        getScheduleStatus(
                            node
                        ).available
                );
            }

            const firstIncomplete =
                contentNodes.findIndex(
                    (node) =>
                        !completedIds.has(
                            node.id
                        )
                );

            if (
                firstIncomplete ===
                -1
            ) {
                return contentNodes;
            }

            return contentNodes.slice(
                0,
                firstIncomplete + 1
            );
        }, [
            contentNodes,
            contentFlow,
            completedIds,
            nowTick,
            delivery.contentSchedules,
            deliveryTimezone,
        ]);

    function isNodeAccessible(
        node: LearnerNode
    ): boolean {
        if (
            node.type !== "CONTENT" &&
            node.type !== "ASSESSMENT"
        ) {
            return true;
        }

        if (
            contentFlow ===
            "flexible"
        ) {
            return true;
        }

        if (
            contentFlow ===
            "time_wise"
        ) {
            return getScheduleStatus(
                node
            ).available;
        }

        const index =
            contentNodes.findIndex(
                (item) =>
                    item.id ===
                    node.id
            );

        if (index < 0) return false;

        if (
            completedIds.has(
                node.id
            )
        ) {
            return true;
        }

        const firstIncomplete =
            contentNodes.findIndex(
                (item) =>
                    !completedIds.has(
                        item.id
                    )
            );

        return (
            index ===
            firstIncomplete
        );
    }

    function getNodeLockLabel(
        node: LearnerNode
    ): string {
        if (
            contentFlow ===
            "sequential"
        ) {
            return "Complete the previous item first";
        }

        return getScheduleStatus(
            node
        ).label;
    }

    /* =====================================================
       LOAD DEMO PROGRESS
    ===================================================== */

    useEffect(() => {
        if (!courseId) {
            return;
        }

        try {
            const raw =
                window.localStorage.getItem(
                    `neurolxp_learner_progress_${courseId}`
                );

            if (raw) {
                const parsed =
                    JSON.parse(raw);

                if (
                    Array.isArray(
                        parsed
                    )
                ) {
                    setCompletedIds(
                        new Set(
                            parsed.filter(
                                (
                                    value
                                ): value is string =>
                                    typeof value ===
                                    "string"
                            )
                        )
                    );
                }
            }

            const savedNotes =
                window.localStorage.getItem(
                    `neurolxp_learner_notes_${courseId}`
                );

            const savedDiscussion =
                window.localStorage.getItem(
                    `neurolxp_learner_discussion_${courseId}`
                );

            if (
                savedNotes !==
                null
            ) {
                setNotes(
                    savedNotes
                );
            }

            if (
                savedDiscussion !==
                null
            ) {
                setDiscussion(
                    savedDiscussion
                );
            }
        } catch {
            /* Demo progress is non-critical. */
        }
    }, [courseId]);

    /* =====================================================
       SAVE PROGRESS
    ===================================================== */

    useEffect(() => {
        if (!courseId) {
            return;
        }

        try {
            window.localStorage.setItem(
                `neurolxp_learner_progress_${courseId}`,
                JSON.stringify(
                    Array.from(
                        completedIds
                    )
                )
            );
        } catch {
            /* Demo progress is non-critical. */
        }
    }, [
        courseId,
        completedIds,
    ]);

    useEffect(() => {
        if (!courseId) {
            return;
        }

        try {
            window.localStorage.setItem(
                `neurolxp_learner_notes_${courseId}`,
                notes
            );
        } catch {
            /* Demo notes are non-critical. */
        }
    }, [
        courseId,
        notes,
    ]);

    useEffect(() => {
        if (!courseId) {
            return;
        }

        try {
            window.localStorage.setItem(
                `neurolxp_learner_discussion_${courseId}`,
                discussion
            );
        } catch {
            /* Demo discussion is non-critical. */
        }
    }, [
        courseId,
        discussion,
    ]);

    /* =====================================================
       INITIAL SELECTION
    ===================================================== */

    useEffect(() => {
        if (
            !course ||
            selectedId
        ) {
            return;
        }

        const firstContent =
            accessibleContentNodes[0];

        const firstLearning =
            flatNodes.find(
                (node) =>
                    node.type ===
                    "LEARNING"
            );

        const firstModule =
            course.modules[0];

        setSelectedId(
            firstContent?.id ??
                firstLearning?.id ??
                firstModule?.id ??
                null
        );

        if (firstModule) {
            setExpandedModules(
                new Set([
                    firstModule.id,
                ])
            );
        }
    }, [
        course,
        flatNodes,
        accessibleContentNodes,
        selectedId,
    ]);

    /* =====================================================
       SELECTED NODE
    ===================================================== */

    const selectedNode =
        useMemo(
            () =>
                flatNodes.find(
                    (node) =>
                        node.id ===
                        selectedId
                ) ?? null,
            [
                flatNodes,
                selectedId,
            ]
        );

    /* =====================================================
       NAVIGATION
    ===================================================== */

    const selectedIndex =
        selectedNode
            ? flatNodes.findIndex(
                  (node) =>
                      node.id ===
                      selectedNode.id
              )
            : -1;

    const previousNode =
        selectedIndex > 0
            ? flatNodes[
                  selectedIndex - 1
              ]
            : null;

    const nextNode =
        selectedIndex >= 0 &&
        selectedIndex <
            flatNodes.length - 1
            ? flatNodes[
                  selectedIndex + 1
              ]
            : null;

    const selectedContentIndex =
        selectedNode
            ? accessibleContentNodes.findIndex(
                  (node) =>
                      node.id ===
                      selectedNode.id
              )
            : -1;

    const previousContent =
        selectedContentIndex > 0
            ? accessibleContentNodes[
                  selectedContentIndex - 1
              ]
            : null;

    const nextContent =
        selectedContentIndex >= 0 &&
        selectedContentIndex <
            accessibleContentNodes.length -
                1
            ? accessibleContentNodes[
                  selectedContentIndex + 1
              ]
            : null;

    /* =====================================================
       COMPLETION
    ===================================================== */

    const completedCount =
        contentNodes.filter(
            (node) =>
                completedIds.has(
                    node.id
                )
        ).length;

    const completionPercentage =
        contentNodes.length === 0
            ? 0
            : Math.round(
                  (completedCount /
                      contentNodes.length) *
                      100
              );

    const courseCompleted =
        contentNodes.length > 0 &&
        completionPercentage === 100;

    function markComplete(
        nodeId: string
    ) {
        setCompletedIds(
            (previous) => {
                const next =
                    new Set(
                        previous
                    );

                next.add(
                    nodeId
                );

                return next;
            }
        );
    }

    function markSelectedComplete() {
        if (!selectedNode) {
            return;
        }

        if (
            selectedNode.type ===
                "CONTENT" ||
            selectedNode.type ===
                "ASSESSMENT"
        ) {
            markComplete(
                selectedNode.id
            );
        }
    }

    /* =====================================================
       NODE SELECTION
    ===================================================== */

    function selectNode(
        node: LearnerNode
    ) {
        if (
            !isNodeAccessible(
                node
            )
        ) {
            return;
        }

        setSelectedId(
            node.id
        );

        setRefreshKey(
            (value) =>
                value + 1
        );

        let moduleId:
            string | null = null;

        for (
            const module
            of course?.modules ??
            []
        ) {
            const containsNode =
                flattenLearnerNodes(
                    [module]
                ).some(
                    (item) =>
                        item.id ===
                        node.id
                );

            if (
                containsNode
            ) {
                moduleId =
                    module.id;

                break;
            }
        }

        if (moduleId) {
            setExpandedModules(
                (previous) => {
                    const next =
                        new Set(
                            previous
                        );

                    next.add(
                        moduleId as string
                    );

                    return next;
                }
            );
        }
    }

    function goPrevious() {
        if (
            previousContent
        ) {
            selectNode(
                previousContent
            );

            return;
        }

        if (
            previousNode
        ) {
            selectNode(
                previousNode
            );
        }
    }

    function goNext() {
        if (
            nextContent
        ) {
            selectNode(
                nextContent
            );

            return;
        }

        if (
            nextNode
        ) {
            selectNode(
                nextNode
            );
        }
    }

    function goPreviousTopic() {
        if (
            previousContent
        ) {
            selectNode(
                previousContent
            );
        }
    }

    function goNextTopic() {
        if (
            nextContent
        ) {
            selectNode(
                nextContent
            );
        }
    }

    function toggleModule(
        moduleId: string
    ) {
        setExpandedModules(
            (previous) => {
                const next =
                    new Set(
                        previous
                    );

                if (
                    next.has(
                        moduleId
                    )
                ) {
                    next.delete(
                        moduleId
                    );
                } else {
                    next.add(
                        moduleId
                    );
                }

                return next;
            }
        );
    }

    useEffect(() => {
        if (
            !selectedNode
        ) {
            return;
        }

        if (
            (
                selectedNode.type ===
                    "CONTENT" ||
                selectedNode.type ===
                    "ASSESSMENT"
            ) &&
            !isNodeAccessible(
                selectedNode
            )
        ) {
            setSelectedId(
                accessibleContentNodes[0]
                    ?.id ?? null
            );
        }
    }, [
        nowTick,
        contentFlow,
        accessibleContentNodes,
        selectedNode,
    ]);

    /* =====================================================
       FULL SCREEN
    ===================================================== */

    async function toggleFullscreen() {
        const element =
            fullscreenRef.current;

        if (!element) {
            return;
        }

        try {
            if (
                !document.fullscreenElement
            ) {
                await element.requestFullscreen();
            } else {
                await document.exitFullscreen();
            }
        } catch {
            /* Fullscreen may be blocked by the browser. */
        }
    }

    useEffect(() => {
        function handleFullscreenChange() {
            setIsFullscreen(
                document.fullscreenElement ===
                    fullscreenRef.current
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

    /* =====================================================
       RESET DEMO
    ===================================================== */

    function resetDemo() {
        setCompletedIds(
            new Set()
        );

        if (courseId) {
            try {
                window.localStorage.removeItem(
                    `neurolxp_learner_progress_${courseId}`
                );
            } catch {
                /* Ignore demo storage errors. */
            }
        }
    }

    /* =====================================================
       DOWNLOAD
    ===================================================== */

    /**
     * Manual download only.
     *
     * IMPORTANT:
     * This function is NOT called automatically when a
     * document is opened.
     *
     * DOC/DOCX/PPT/PPTX are displayed through Office Viewer
     * instead of directly navigating to the file URL.
     */
    function downloadCurrentContent() {
        if (
            !selectedNode ||
            !course?.features.downloadEnabled
        ) {
            return;
        }

        const resourceUrl =
            getNodeResourceUrl(
                selectedNode
            );

        if (!resourceUrl) {
            return;
        }

        const link =
            document.createElement(
                "a"
            );

        link.href =
            resourceUrl;

        link.download =
            selectedNode.fileName ||
            selectedNode.title ||
            "download";

        link.target =
            "_blank";

        link.rel =
            "noopener noreferrer";

        document.body.appendChild(
            link
        );

        link.click();

        link.remove();
    }

    /* =====================================================
       CONTENT VIEWER
    ===================================================== */

    function renderResource(
        node: LearnerNode
    ) {
        if (
            node.type ===
            "ASSESSMENT"
        ) {
            return (
                <div
                    className={
                        styles.assessmentCard
                    }
                >
                    <div
                        className={
                            styles.assessmentIcon
                        }
                    >
                        ✓
                    </div>

                    <div>
                        <span>
                            LINKED ASSESSMENT
                        </span>

                        <h3>
                            {node.title}
                        </h3>

                        <p>
                            {node.description ||
                                "This assessment is linked from the course and is ready for the learner."}
                        </p>

                        <button
                            type="button"
                            className={
                                styles.assessmentButton
                            }
                            onClick={
                                markSelectedComplete
                            }
                        >
                            Complete Assessment
                        </button>
                    </div>
                </div>
            );
        }

        if (
            node.type ===
            "MODULE"
        ) {
            return (
                <div
                    className={
                        styles.moduleOverview
                    }
                >
                    <div
                        className={
                            styles.moduleIcon
                        }
                    >
                        M
                    </div>

                    <div>
                        <span>
                            MODULE
                        </span>

                        <h3>
                            {node.title}
                        </h3>

                        <p>
                            Select a learning item
                            from this module to
                            continue.
                        </p>
                    </div>
                </div>
            );
        }

        if (
            node.type ===
            "LEARNING"
        ) {
            return (
                <div
                    className={
                        styles.learningOverview
                    }
                >
                    <div
                        className={
                            styles.learningIcon
                        }
                    >
                        L
                    </div>

                    <div>
                        <span>
                            LEARNING
                        </span>

                        <h3>
                            {node.title}
                        </h3>

                        <p>
                            {node.children.length}{" "}
                            learning resource
                            {node.children.length === 1
                                ? ""
                                : "s"}{" "}
                            available in this
                            learning section.
                        </p>
                    </div>
                </div>
            );
        }

        const resourceUrl =
            getNodeResourceUrl(
                node
            );

        const resourceError =
            resourceLoadErrors[
                node.id
            ];

        return (
            <div
                ref={
                    fullscreenRef
                }
                className={
                    styles.resourceFrame
                }
                key={`${node.id}-${refreshKey}`}
            >
                <div
                    className={
                        styles.resourceToolbar
                    }
                >
                    <div
                        className={
                            styles.resourceToolbarTitle
                        }
                    >
                        <span>
                            {node.contentType ||
                                "CONTENT"}
                        </span>

                        <strong>
                            {node.title}
                        </strong>
                    </div>

                    <div
                        className={
                            styles.resourceActions
                        }
                    >
                        <button
                            type="button"
                            className={
                                styles.frameButton
                            }
                            onClick={() =>
                                setRefreshKey(
                                    (value) =>
                                        value + 1
                                )
                            }
                        >
                            ↻ Refresh Content
                        </button>

                        {course?.features
                            .downloadEnabled &&
                            resourceUrl &&
                            node.contentType !==
                                "SCORM" && (
                                <button
                                    type="button"
                                    className={
                                        styles.frameButton
                                    }
                                    onClick={
                                        downloadCurrentContent
                                    }
                                >
                                    ↓ Download
                                </button>
                            )}

                        <button
                            type="button"
                            className={
                                styles.frameButtonPrimary
                            }
                            onClick={
                                toggleFullscreen
                            }
                        >
                            {isFullscreen
                                ? "Exit Full Screen"
                                : "Full Screen"}
                        </button>
                    </div>
                </div>

                <div
                    className={
                        styles.resourceViewport
                    }
                >
                    {/* =================================================
                       VIDEO
                    ================================================= */}

                    {node.contentType ===
                        "VIDEO" &&
                        resourceUrl && (
                            <video
                                className={
                                    styles.video
                                }
                                controls
                                playsInline
                                src={
                                    resourceUrl
                                }
                                onTimeUpdate={(
                                    event
                                ) => {
                                    const video =
                                        event.currentTarget;

                                    if (
                                        video.duration >
                                            0 &&
                                        video.currentTime /
                                            video.duration >=
                                            0.9
                                    ) {
                                        markComplete(
                                            node.id
                                        );
                                    }
                                }}
                                onEnded={() =>
                                    markComplete(
                                        node.id
                                    )
                                }
                            >
                                Your browser does not
                                support video playback.
                            </video>
                        )}

                    {/* =================================================
                       AUDIO
                    ================================================= */}

                    {node.contentType ===
                        "AUDIO" &&
                        resourceUrl && (
                            <div
                                className={
                                    styles.audioWrap
                                }
                            >
                                <div
                                    className={
                                        styles.mediaIcon
                                    }
                                >
                                    ♪
                                </div>

                                <h3>
                                    {node.title}
                                </h3>

                                <audio
                                    className={
                                        styles.audio
                                    }
                                    controls
                                    src={
                                        resourceUrl
                                    }
                                    onEnded={() =>
                                        markComplete(
                                            node.id
                                        )
                                    }
                                />
                            </div>
                        )}

                    {/* =================================================
                       IMAGE
                    ================================================= */}

                    {node.contentType ===
                        "IMAGE" &&
                        resourceUrl && (
                            <div
                                className={
                                    styles.imageViewport
                                }
                            >
                                <img
                                    className={
                                        styles.image
                                    }
                                    src={
                                        resourceUrl
                                    }
                                    alt={
                                        node.title
                                    }
                                    onLoad={() =>
                                        markComplete(
                                            node.id
                                        )
                                    }
                                />
                            </div>
                        )}

                    {/* =================================================
                       PDF

                       PDF is safe to open directly in iframe because
                       browsers have native PDF rendering support.
                    ================================================= */}

                    {node.contentType ===
                        "PDF" &&
                        resourceUrl && (
                            <iframe
                                className={
                                    styles.documentFrame
                                }
                                src={
                                    resourceUrl
                                }
                                title={
                                    node.title
                                }
                                loading="lazy"
                                onLoad={() => {
                                    /*
                                     * Loading SCORM is not completion.
                                     * Completion is reported through
                                     * window.API / window.API_1484_11.
                                     */
                                }}
                            />
                        )}

                    {/* =================================================
                       PRESENTATION

                       PPT/PPTX must NOT be directly loaded into iframe.
                       Office Viewer handles the preview.
                    ================================================= */}

                    {node.contentType ===
                        "PRESENTATION" &&
                        resourceUrl && (
                            isPreviewableExternalUrl(
                                resourceUrl
                            ) ? (
                                <iframe
                                    className={
                                        styles.documentFrame
                                    }
                                    src={getOfficeViewerUrl(
                                        resourceUrl
                                    )}
                                    title={
                                        node.title
                                    }
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    onLoad={() =>
                                        markComplete(
                                            node.id
                                        )
                                    }
                                />
                            ) : (
                                <div
                                    className={
                                        styles.viewerFallback
                                    }
                                >
                                    <span>
                                        PRESENTATION
                                    </span>

                                    <h3>
                                        {node.title}
                                    </h3>

                                    <p>
                                        This uploaded presentation is available,
                                        but PPT/PPTX files require a public HTTPS URL
                                        for the Office web preview. Use Open Presentation
                                        below.
                                    </p>

                                    <a
                                        href={
                                            resourceUrl
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={
                                            styles.openButton
                                        }
                                    >
                                        Open Presentation
                                    </a>
                                </div>
                            )
                        )}

                    {/* =================================================
                       DOCUMENT / DOC / DOCX

                       FIX:
                       Never use the raw DOC/DOCX URL as the iframe src.

                       The Office Viewer receives the document URL and
                       renders it in the browser.

                       This prevents the browser from treating the
                       DOC/DOCX response itself as a downloadable
                       document.
                    ================================================= */}

                    {node.contentType ===
                        "DOCUMENT" &&
                        resourceUrl && (
                            isPreviewableExternalUrl(
                                resourceUrl
                            ) ? (
                                <iframe
                                    className={
                                        styles.documentFrame
                                    }
                                    src={getOfficeViewerUrl(
                                        resourceUrl
                                    )}
                                    title={
                                        node.title
                                    }
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    onLoad={() =>
                                        markComplete(
                                            node.id
                                        )
                                    }
                                />
                            ) : (
                                <div
                                    className={
                                        styles.viewerFallback
                                    }
                                >
                                    <span>
                                        DOCUMENT
                                    </span>

                                    <h3>
                                        {node.title}
                                    </h3>

                                    <p>
                                        This uploaded Office document is available,
                                        but DOC/DOCX files cannot be rendered reliably
                                        inside a browser iframe without a public HTTPS
                                        document URL. Use Open Document below.
                                    </p>

                                    <a
                                        href={
                                            resourceUrl
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={
                                            styles.openButton
                                        }
                                    >
                                        Open Document
                                    </a>
                                </div>
                            )
                        )}

                    {/* =================================================
                       SCORM
                    ================================================= */}

                    {node.contentType ===
                        "SCORM" &&
                        resourceUrl && (
                            <iframe
                                key={`${node.id}-${refreshKey}`}
                                className={
                                    styles.documentFrame
                                }
                                src={
                                    resourceUrl
                                }
                                title={
                                    node.title
                                }
                                loading="eager"
                                allow="fullscreen; autoplay; clipboard-read; clipboard-write"
                                allowFullScreen
                                referrerPolicy="no-referrer-when-downgrade"
                            />
                        )}

                    {node.contentType ===
                        "SCORM" &&
                        !resourceUrl && (
                            <div
                                className={
                                    styles.viewerFallback
                                }
                            >
                                <span>
                                    SCORM
                                </span>

                                <h3>
                                    {node.title}
                                </h3>

                                <p>
                                    SCORM launch information is unavailable.
                                    Re-upload the SCORM ZIP from Learning Structure.
                                </p>
                            </div>
                        )}

                    {/* =================================================
                       LINK
                    ================================================= */}

                    {node.contentType ===
                        "LINK" &&
                        resourceUrl && (
                            <div
                                className={
                                    styles.linkViewer
                                }
                            >
                                <iframe
                                    className={
                                        styles.documentFrame
                                    }
                                    src={
                                        resourceUrl
                                    }
                                    title={
                                        node.title
                                    }
                                    loading="lazy"
                                    onLoad={() =>
                                        markComplete(
                                            node.id
                                        )
                                    }
                                />

                                <div
                                    className={
                                        styles.linkFallback
                                    }
                                >
                                    <a
                                        href={
                                            resourceUrl
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={
                                            styles.openButton
                                        }
                                    >
                                        Open Resource
                                    </a>
                                </div>
                            </div>
                        )}

                    {/* =================================================
                       TEXT
                    ================================================= */}

                    {(node.contentType ===
                        "TEXT" ||
                        node.content) && (
                        <div
                            className={
                                styles.textContent
                            }
                        >
                            {
                                node.content
                            }
                        </div>
                    )}

                    {/* =================================================
                       RESOURCE LOAD ERROR
                    ================================================= */}

                    {resourceError && (
                        <div
                            className={
                                styles.emptyResource
                            }
                        >
                            <div>
                                {getNodeIcon(
                                    node
                                )}
                            </div>

                            <h3>
                                {node.title}
                            </h3>

                            <p>
                                {resourceError}
                            </p>
                        </div>
                    )}

                    {/* =================================================
                       EMPTY RESOURCE
                    ================================================= */}

                    {!resourceUrl &&
                        !node.content &&
                        !resourceError &&
                        node.contentType !==
                            "SCORM" && (
                            <div
                                className={
                                    styles.emptyResource
                                }
                            >
                                <div>
                                    {getNodeIcon(
                                        node
                                    )}
                                </div>

                                <h3>
                                    {node.title}
                                </h3>

                                <p>
                                    This learning resource
                                    has been added to the
                                    course but no previewable
                                    content is available yet.
                                </p>
                            </div>
                        )}
                </div>

                <div
                    className={
                        styles.resourceFooter
                    }
                >
                    <div
                        className={
                            styles.completionStatus
                        }
                    >
                        <span
                            className={
                                completedIds.has(
                                    node.id
                                )
                                    ? styles.completedDot
                                    : styles.pendingDot
                            }
                        />

                        {completedIds.has(
                            node.id
                        )
                            ? "Completed"
                            : "Not completed"}
                    </div>

                    <button
                        type="button"
                        className={
                            completedIds.has(
                                node.id
                            )
                                ? styles.completedButton
                                : styles.completeButton
                        }
                        onClick={
                            markSelectedComplete
                        }
                    >
                        {completedIds.has(
                            node.id
                        )
                            ? "✓ Completed"
                            : "Complete Topic"}
                    </button>
                </div>
            </div>
        );
    }

    /* =====================================================
       ERROR / LOADING
    ===================================================== */

    if (error) {
        return (
            <main
                className={
                    styles.page
                }
            >
                <div
                    className={
                        styles.errorCard
                    }
                >
                    <h1>
                        Learner View
                    </h1>

                    <p>
                        {error}
                    </p>
                </div>
            </main>
        );
    }

    if (!course) {
        return (
            <main
                className={
                    styles.page
                }
            >
                <div
                    className={
                        styles.loadingCard
                    }
                >
                    Loading learner view...
                </div>
            </main>
        );
    }

    /* =====================================================
       RENDER
    ===================================================== */

    return (
        <main
            className={
                styles.page
            }
        >
            <div
                className={
                    styles.learnerShell
                }
            >
                <div
                    className={
                        styles.topToolbar
                    }
                >
                    <div
                        className={
                            styles.topToolbarLeft
                        }
                    >
                        <button
                            type="button"
                            className={
                                styles.toolbarButton
                            }
                            onClick={() => {
                                if (onBack) {
                                    onBack();
                                } else {
                                    window.history.back();
                                }
                            }}
                        >
                            ← My Courses
                        </button>

                        <button
                            type="button"
                            className={
                                styles.toolbarButton
                            }
                            onClick={() =>
                                setRefreshKey(
                                    (value) =>
                                        value + 1
                                )
                            }
                        >
                            ↻ Refresh Content
                        </button>

                        <button
                            type="button"
                            className={
                                styles.toolbarButton
                            }
                            disabled={
                                !previousContent
                            }
                            onClick={
                                goPreviousTopic
                            }
                        >
                            ← Previous
                        </button>

                        <button
                            type="button"
                            className={
                                styles.toolbarButton
                            }
                            disabled={
                                !nextContent
                            }
                            onClick={
                                goNextTopic
                            }
                        >
                            Next Topic →
                        </button>
                    </div>

                    <div
                        className={
                            styles.topToolbarRight
                        }
                    >
                        {course.features
                            .notesEnabled && (
                            <button
                                type="button"
                                className={
                                    styles.toolbarButton
                                }
                                onClick={() =>
                                    setShowNotes(
                                        (value) =>
                                            !value
                                    )
                                }
                            >
                                Notes
                            </button>
                        )}

                        {course.features
                            .discussionEnabled && (
                            <button
                                type="button"
                                className={
                                    styles.toolbarButton
                                }
                                onClick={() =>
                                    setShowDiscussion(
                                        (value) =>
                                            !value
                                    )
                                }
                            >
                                Discussion
                            </button>
                        )}

                        <button
                            type="button"
                            className={
                                styles.toolbarButton
                            }
                            onClick={
                                resetDemo
                            }
                        >
                            Reset Demo
                        </button>

                        <div
                            className={
                                styles.progressBadge
                            }
                        >
                            {
                                completionPercentage
                            }%
                        </div>
                    </div>
                </div>

                <header
                    className={
                        styles.courseHeader
                    }
                >
                    <div
                        className={
                            styles.courseHeaderMain
                        }
                    >
                        <span
                            className={
                                styles.eyebrow
                            }
                        >
                            LEARNER VIEW
                        </span>

                        <h1>
                            {
                                course.title
                            }
                        </h1>

                        <p>
                            {
                                course.description
                            }
                        </p>
                    </div>

                    <div
                        className={
                            styles.courseHeaderRight
                        }
                    >
                        <div
                            className={
                                styles.courseMeta
                            }
                        >
                            {course.code && (
                                <span>
                                    {
                                        course.code
                                    }
                                </span>
                            )}

                            {course.level && (
                                <span>
                                    {
                                        course.level
                                    }
                                </span>
                            )}

                            {course.duration && (
                                <span>
                                    {
                                        course.duration
                                    }
                                </span>
                            )}
                        </div>

                        <div
                            className={
                                styles.progressCard
                            }
                        >
                            <div
                                className={
                                    styles.progressHeader
                                }
                            >
                                <span>
                                    Course Progress
                                </span>

                                <strong>
                                    {
                                        completionPercentage
                                    }%
                                </strong>
                            </div>

                            <div
                                className={
                                    styles.progressTrack
                                }
                            >
                                <div
                                    className={
                                        styles.progressFill
                                    }
                                    style={{
                                        width: `${completionPercentage}%`,
                                    }}
                                />
                            </div>
                        </div>

                        <div
                            className={
                                styles.courseMeta
                            }
                            style={{
                                marginTop: 8,
                            }}
                        >
                            <span>
                                Flow:{" "}
                                {contentFlow ===
                                "time_wise"
                                    ? "Time-wise"
                                    : contentFlow ===
                                        "sequential"
                                      ? "Sequential-wise"
                                      : "Flexible"}
                            </span>

                            {contentFlow ===
                                "time_wise" && (
                                <span>
                                    Schedule:{" "}
                                    {
                                        deliveryTimezone
                                    }
                                </span>
                            )}
                        </div>
                    </div>
                </header>

                <section
                    className={
                        styles.learningWorkspace
                    }
                >
                    <aside
                        className={
                            styles.sidebar
                        }
                    >
                        <div
                            className={
                                styles.sidebarHeader
                            }
                        >
                            <div>
                                <span>
                                    COURSE CONTENT
                                </span>

                                <strong>
                                    {
                                        course
                                            .modules
                                            .length
                                    }{" "}
                                    Modules
                                </strong>
                            </div>

                            <span
                                className={
                                    styles.sidebarProgress
                                }
                            >
                                {
                                    completedCount
                                }
                                /
                                {
                                    contentNodes.length
                                }
                            </span>
                        </div>

                        <div
                            className={
                                styles.tree
                            }
                        >
                            {course.modules
                                .length ===
                            0 ? (
                                <div
                                    className={
                                        styles.emptyTree
                                    }
                                >
                                    No learning structure
                                    has been added yet.
                                </div>
                            ) : (
                                course.modules.map(
                                    (
                                        module,
                                        moduleIndex
                                    ) => {
                                        const expanded =
                                            expandedModules.has(
                                                module.id
                                            );

                                        return (
                                            <div
                                                key={
                                                    module.id
                                                }
                                                className={
                                                    styles.moduleGroup
                                                }
                                            >
                                                <button
                                                    type="button"
                                                    className={`
                                                        ${styles.moduleButton}
                                                        ${
                                                            selectedId ===
                                                            module.id
                                                                ? styles.selected
                                                                : ""
                                                        }
                                                    `}
                                                    onClick={() => {
                                                        toggleModule(
                                                            module.id
                                                        );

                                                        selectNode(
                                                            module
                                                        );
                                                    }}
                                                >
                                                    <span
                                                        className={
                                                            styles.expandIcon
                                                        }
                                                    >
                                                        {expanded
                                                            ? "▾"
                                                            : "▸"}
                                                    </span>

                                                    <span
                                                        className={
                                                            styles.nodeNumber
                                                        }
                                                    >
                                                        {
                                                            moduleIndex +
                                                            1
                                                        }
                                                    </span>

                                                    <span
                                                        className={
                                                            styles.nodeTitle
                                                        }
                                                    >
                                                        {
                                                            module.title
                                                        }
                                                    </span>
                                                </button>

                                                {expanded && (
                                                    <div
                                                        className={
                                                            styles.learningTree
                                                        }
                                                    >
                                                        {module.children.map(
                                                            (
                                                                learning
                                                            ) => (
                                                                <div
                                                                    key={
                                                                        learning.id
                                                                    }
                                                                >
                                                                    <button
                                                                        type="button"
                                                                        className={`
                                                                            ${styles.learningButton}
                                                                            ${
                                                                                selectedId ===
                                                                                learning.id
                                                                                    ? styles.selected
                                                                                    : ""
                                                                            }
                                                                        `}
                                                                        onClick={() =>
                                                                            selectNode(
                                                                                learning
                                                                            )
                                                                        }
                                                                    >
                                                                        <span
                                                                            className={
                                                                                styles.treeIcon
                                                                            }
                                                                        >
                                                                            {getNodeIcon(
                                                                                learning
                                                                            )}
                                                                        </span>

                                                                        <span
                                                                            className={
                                                                                styles.nodeTitle
                                                                            }
                                                                        >
                                                                            {
                                                                                learning.title
                                                                            }
                                                                        </span>
                                                                    </button>

                                                                    {learning.children.length >
                                                                        0 && (
                                                                        <div
                                                                            className={
                                                                                styles.contentTree
                                                                            }
                                                                        >
                                                                            {learning.children.map(
                                                                                (
                                                                                    content
                                                                                ) => (
                                                                                    <button
                                                                                        key={
                                                                                            content.id
                                                                                        }
                                                                                        type="button"
                                                                                        disabled={
                                                                                            !isNodeAccessible(
                                                                                                content
                                                                                            )
                                                                                        }
                                                                                        title={
                                                                                            isNodeAccessible(
                                                                                                content
                                                                                            )
                                                                                                ? undefined
                                                                                                : getNodeLockLabel(
                                                                                                      content
                                                                                                  )
                                                                                        }
                                                                                        className={`
                                                                                            ${styles.contentButton}
                                                                                            ${
                                                                                                selectedId ===
                                                                                                content.id
                                                                                                    ? styles.selected
                                                                                                    : ""
                                                                                            }
                                                                                        `}
                                                                                        onClick={() =>
                                                                                            selectNode(
                                                                                                content
                                                                                            )
                                                                                        }
                                                                                    >
                                                                                        <span
                                                                                            className={
                                                                                                styles.treeIcon
                                                                                            }
                                                                                        >
                                                                                            {getNodeIcon(
                                                                                                content
                                                                                            )}
                                                                                        </span>

                                                                                        <span
                                                                                            className={
                                                                                                styles.nodeTitle
                                                                                            }
                                                                                        >
                                                                                            {
                                                                                                content.title
                                                                                            }
                                                                                        </span>

                                                                                        {!isNodeAccessible(
                                                                                            content
                                                                                        ) && (
                                                                                            <span
                                                                                                className={
                                                                                                    styles.pendingMark
                                                                                                }
                                                                                                title={getNodeLockLabel(
                                                                                                    content
                                                                                                )}
                                                                                            >
                                                                                                🔒
                                                                                            </span>
                                                                                        )}

                                                                                        <span
                                                                                            className={
                                                                                                completedIds.has(
                                                                                                    content.id
                                                                                                )
                                                                                                    ? styles.checkMark
                                                                                                    : styles.pendingMark
                                                                                            }
                                                                                        >
                                                                                            {completedIds.has(
                                                                                                content.id
                                                                                            )
                                                                                                ? "✓"
                                                                                                : "○"}
                                                                                        </span>
                                                                                    </button>
                                                                                )
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }
                                )
                            )}
                        </div>
                    </aside>

                    <section
                        className={
                            styles.contentPanel
                        }
                    >
                        {!selectedNode ? (
                            <div
                                className={
                                    styles.welcome
                                }
                            >
                                <div
                                    className={
                                        styles.welcomeIcon
                                    }
                                >
                                    ▶
                                </div>

                                <h2>
                                    Welcome to{" "}
                                    {
                                        course.title
                                    }
                                </h2>

                                <p>
                                    {contentFlow ===
                                        "time_wise" &&
                                    accessibleContentNodes.length ===
                                        0
                                        ? "No content is available yet. Check the scheduled release date and time."
                                        : contentFlow ===
                                              "sequential" &&
                                          accessibleContentNodes.length ===
                                              0
                                        ? "Complete the previous learning item to unlock the next one."
                                        : "Select a learning item from the course structure to begin."}
                                </p>
                            </div>
                        ) : (
                            <>
                                <div
                                    className={
                                        styles.breadcrumb
                                    }
                                >
                                    <span>
                                        Course
                                    </span>

                                    <span>
                                        /
                                    </span>

                                    <strong>
                                        {
                                            selectedNode.title
                                        }
                                    </strong>
                                </div>

                                <div
                                    className={
                                        styles.contentBody
                                    }
                                >
                                    <span
                                        className={
                                            styles.contentType
                                        }
                                    >
                                        {selectedNode.type ===
                                        "MODULE"
                                            ? "MODULE"
                                            : selectedNode.type ===
                                                "LEARNING"
                                              ? "LEARNING"
                                              : selectedNode.type ===
                                                  "ASSESSMENT"
                                                ? "ASSESSMENT"
                                                : selectedNode.contentType ||
                                                  "CONTENT"}
                                    </span>

                                    <h2>
                                        {
                                            selectedNode.title
                                        }
                                    </h2>

                                    {selectedNode.description && (
                                        <p
                                            className={
                                                styles.description
                                            }
                                        >
                                            {
                                                selectedNode.description
                                            }
                                        </p>
                                    )}

                                    {(selectedNode.type ===
                                        "CONTENT" ||
                                        selectedNode.type ===
                                            "ASSESSMENT") &&
                                        contentFlow ===
                                            "time_wise" && (
                                            <p
                                                className={
                                                    styles.description
                                                }
                                            >
                                                {
                                                    getScheduleStatus(
                                                        selectedNode
                                                    ).label
                                                }
                                            </p>
                                        )}

                                    {renderResource(
                                        selectedNode
                                    )}
                                </div>

                                <div
                                    className={
                                        styles.navigation
                                    }
                                >
                                    <button
                                        type="button"
                                        className={
                                            styles.navButton
                                        }
                                        disabled={
                                            !previousContent
                                        }
                                        onClick={
                                            goPrevious
                                        }
                                    >
                                        ← Previous
                                    </button>

                                    <span
                                        className={
                                            styles.progressText
                                        }
                                    >
                                        {selectedContentIndex >=
                                        0
                                            ? selectedContentIndex +
                                              1
                                            : 0}{" "}
                                        /{" "}
                                        {
                                            accessibleContentNodes.length
                                        }
                                    </span>

                                    <button
                                        type="button"
                                        className={
                                            styles.primaryNavButton
                                        }
                                        disabled={
                                            !nextContent
                                        }
                                        onClick={
                                            goNext
                                        }
                                    >
                                        Next →
                                    </button>
                                </div>
                            </>
                        )}
                    </section>
                </section>

                <section
                    className={
                        styles.bottomActionBar
                    }
                >
                    <div>
                        <strong>
                            {courseCompleted
                                ? "Course completed"
                                : `${completionPercentage}% complete`}
                        </strong>

                        <span>
                            {
                                completedCount
                            }{" "}
                            of{" "}
                            {
                                contentNodes.length
                            }{" "}
                            topics completed
                        </span>
                    </div>

                    <div
                        className={
                            styles.bottomActions
                        }
                    >
                        <button
                            type="button"
                            className={
                                styles.completeCourseButton
                            }
                            disabled={
                                !courseCompleted
                            }
                            onClick={() => {
                                if (
                                    courseCompleted
                                ) {
                                    window.alert(
                                        "Course completed successfully."
                                    );
                                }
                            }}
                        >
                            ✓ Complete Course
                        </button>

                        {course.features
                            .certificateEnabled &&
                            courseCompleted && (
                                <button
                                    type="button"
                                    className={
                                        styles.certificateButton
                                    }
                                    onClick={() =>
                                        window.alert(
                                            "Certificate is available for this completed course."
                                        )
                                    }
                                >
                                    View Certificate
                                </button>
                            )}
                    </div>
                </section>

                {(showNotes ||
                    showDiscussion) && (
                    <section
                        className={
                            styles.utilityPanel
                        }
                    >
                        {showNotes &&
                            course.features
                                .notesEnabled && (
                                <div
                                    className={
                                        styles.utilityCard
                                    }
                                >
                                    <div
                                        className={
                                            styles.utilityCardHeader
                                        }
                                    >
                                        <strong>
                                            Notes
                                        </strong>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowNotes(
                                                    false
                                                )
                                            }
                                        >
                                            ×
                                        </button>
                                    </div>

                                    <textarea
                                        value={
                                            notes
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setNotes(
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        placeholder="Add your notes..."
                                    />
                                </div>
                            )}

                        {showDiscussion &&
                            course.features
                                .discussionEnabled && (
                                <div
                                    className={
                                        styles.utilityCard
                                    }
                                >
                                    <div
                                        className={
                                            styles.utilityCardHeader
                                        }
                                    >
                                        <strong>
                                            Discussion
                                        </strong>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowDiscussion(
                                                    false
                                                )
                                            }
                                        >
                                            ×
                                        </button>
                                    </div>

                                    <textarea
                                        value={
                                            discussion
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setDiscussion(
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        placeholder="Write a discussion note..."
                                    />
                                </div>
                            )}
                    </section>
                )}
            </div>
        </main>
    );
}