"use client";

import {
    useEffect,
    useMemo,
    useState,
} from "react";
import styles from "./LearningStructureBuilder.module.css";
import JSZip from "jszip";

import {
    getCourseDraft,
    saveCourseDraft,
} from "@/services/course-draft.service";

type LearningStructureBuilderProps = {
    tenant: string;
    role: string;
    courseId: string;
    onBack: () => void;
    onNext: () => void;
};

type ContentStorage =
    | "FILE"
    | "URL"
    | "INTEGRATION";

type ContentCategory =
    | "DOCUMENTS_PRESENTATIONS"
    | "VIDEO_MEDIA"
    | "ELEARNING_STANDARDS"
    | "WEB_MODERN_CONTENT"
    | "INTERACTIVE_LEARNING"
    | "KNOWLEDGE_CONTENT";

type ContentType =
    | "DOC_DOCX"
    | "PPT_PPTX"
    | "GOOGLE_SLIDES"
    | "DIGITAL_MANUAL"
    | "COLLABORATIVE_DOCUMENT"
    | "MP4_VIDEO"
    | "INTERACTIVE_VIDEO"
    | "SHORT_FORM_VIDEO"
    | "LIVE_STREAMING"
    | "DIGITAL_MEDIA"
    | "SCORM_1_2"
    | "SCORM_2004"
    | "XAPI"
    | "CMI5"
    | "LTI"
    | "WEB_PRESENTATION"
    | "PROGRESSIVE_WEB_APP"
    | "API_DRIVEN_CONTENT"
    | "MOBILE_LEARNING"
    | "MICROLEARNING"
    | "GAMIFIED_CONTENT"
    | "SCENARIO_BASED"
    | "INTERACTIVE_PRESENTATION"
    | "VISUAL_STORYTELLING"
    | "WIKI"
    | "DYNAMIC_KNOWLEDGE_BASE"
    | "DIGITAL_DOCUMENTATION";

interface LearningContent {
    id: string;
    title: string;
    description: string;
    category: ContentCategory;
    type: ContentType;
    storage: ContentStorage;
    fileName?: string;
    fileSize?: number;
    fileType?: string;
    url?: string;

    /*
     * File resources are persisted outside the course draft.
     * The draft stores only the stable resourceKey.
     */
    resourceKey?: string;
    resourceKind?: "BLOB" | "SCORM_PACKAGE";

    /*
     * Learner View presentation mode.
     */
    previewMode?:
        | "DOCUMENT"
        | "PRESENTATION"
        | "PDF"
        | "SCORM"
        | "MEDIA"
        | "WEB"
        | "DOWNLOAD";

    /*
     * SCORM packages are extracted at import time.
     * The learner runtime uses these values to launch the
     * extracted entry file without trying to load the ZIP.
     */
    scormPackageId?: string;
    scormLaunchFile?: string;
    scormLaunchUrl?: string;
    scormVersion?: "SCORM_1_2" | "SCORM_2004";

    duration?: number;
    required: boolean;
    status: "READY" | "PENDING";

    /* Text Editor integration. */
    editorContent?: string;
    outputFormat?: "docx" | "txt" | "pdf";
    editorManaged?: boolean;
}

interface AssessmentLink {
    id: string;
    title: string;
    assessmentId: string;
    status: "LINKED";
}

interface LearningItem {
    id: string;
    title: string;
    description: string;
    contents: LearningContent[];
    assessments: AssessmentLink[];
}

interface ModuleItem {
    id: string;
    title: string;
    description: string;
    learnings: LearningItem[];
}

/* =========================================================
   UNIVERSITY / COLLEGE ACADEMIC HIERARCHY

   IMPORTANT:
   - This hierarchy is used only for University / College.
   - Existing tenants continue to use Module -> Learning unchanged.
   - Topic IDs point to the existing LearningItem records so all current
     content, SCORM, assessment, learner-preview and persistence logic
     continues to work without a second content model.
========================================================= */

interface AcademicUnitItem {
    id: string;
    title: string;
    description: string;
    topicIds: string[];
}

interface AcademicChapterItem {
    id: string;
    title: string;
    description: string;
    units: AcademicUnitItem[];
}

interface AcademicModuleHierarchy {
    moduleId: string;
    chapters: AcademicChapterItem[];
}

interface ContentOption {
    type: ContentType;
    label: string;
    description: string;
    storage: ContentStorage;
    accept?: string;
}

interface ContentCategoryOption {
    category: ContentCategory;
    title: string;
    description: string;
    options: ContentOption[];
}

/* =========================================================
   CONTENT CATALOG
========================================================= */

const contentCatalog: ContentCategoryOption[] = [
    {
        category: "DOCUMENTS_PRESENTATIONS",
        title: "Documents & Presentations",
        description:
            "Documents, presentations, manuals, and collaborative resources.",
        options: [
            {
                type: "DOC_DOCX",
                label: "DOC / DOCX",
                description: "Microsoft Word documents.",
                storage: "FILE",
                accept: ".doc,.docx",
            },
            {
                type: "PPT_PPTX",
                label: "PPT / PPTX",
                description: "Microsoft PowerPoint presentations.",
                storage: "FILE",
                accept: ".ppt,.pptx,.pptm",
            },
            {
                type: "GOOGLE_SLIDES",
                label: "Google Slides",
                description: "Presentation hosted in Google Slides.",
                storage: "URL",
            },
            {
                type: "DIGITAL_MANUAL",
                label: "Digital Manuals",
                description: "Digital manuals and reference documents.",
                storage: "FILE",
                accept: ".pdf,.doc,.docx",
            },
            {
                type: "COLLABORATIVE_DOCUMENT",
                label: "Collaborative Documents",
                description: "External collaborative documents.",
                storage: "URL",
            },
        ],
    },
    {
        category: "VIDEO_MEDIA",
        title: "Video & Media",
        description:
            "Video, streaming, and digital media learning resources.",
        options: [
            {
                type: "MP4_VIDEO",
                label: "MP4 Video",
                description: "Standard video learning content.",
                storage: "FILE",
                accept: ".mp4,.webm,.mov",
            },
            {
                type: "INTERACTIVE_VIDEO",
                label: "Interactive Video",
                description: "Interactive video-based learning.",
                storage: "FILE",
                accept: ".mp4,.webm",
            },
            {
                type: "SHORT_FORM_VIDEO",
                label: "Short-form Video",
                description: "Short video learning content.",
                storage: "FILE",
                accept: ".mp4,.webm,.mov",
            },
            {
                type: "LIVE_STREAMING",
                label: "Live Streaming",
                description: "Live or scheduled streaming content.",
                storage: "URL",
            },
            {
                type: "DIGITAL_MEDIA",
                label: "Digital Media Content",
                description: "Audio, video, and other digital media.",
                storage: "FILE",
                accept: "audio/*,video/*",
            },
        ],
    },
    {
        category: "ELEARNING_STANDARDS",
        title: "E-Learning Standards",
        description:
            "Standards-based learning packages and integrations.",
        options: [
            {
                type: "SCORM_1_2",
                label: "SCORM 1.2",
                description: "SCORM 1.2 learning package.",
                storage: "FILE",
                accept: ".zip,application/zip,application/x-zip-compressed",
            },
            {
                type: "SCORM_2004",
                label: "SCORM 2004",
                description: "SCORM 2004 learning package.",
                storage: "FILE",
                accept: ".zip,application/zip,application/x-zip-compressed",
            },
            {
                type: "XAPI",
                label: "xAPI",
                description: "Experience API learning resource.",
                storage: "INTEGRATION",
            },
            {
                type: "CMI5",
                label: "cmi5",
                description: "cmi5 learning package or activity.",
                storage: "INTEGRATION",
            },
            {
                type: "LTI",
                label: "LTI",
                description: "Learning Tools Interoperability resource.",
                storage: "INTEGRATION",
            },
        ],
    },
    {
        category: "WEB_MODERN_CONTENT",
        title: "Web & Modern Content",
        description:
            "Web-based and application-driven learning resources.",
        options: [
            {
                type: "WEB_PRESENTATION",
                label: "Web-based Presentations",
                description: "Presentation delivered through the web.",
                storage: "URL",
            },
            {
                type: "PROGRESSIVE_WEB_APP",
                label: "Progressive Web Apps",
                description: "Web application used for learning.",
                storage: "URL",
            },
            {
                type: "API_DRIVEN_CONTENT",
                label: "API-driven Content",
                description: "Content delivered through an API.",
                storage: "INTEGRATION",
            },
            {
                type: "MOBILE_LEARNING",
                label: "Mobile Learning",
                description: "Mobile-oriented learning experience.",
                storage: "URL",
            },
        ],
    },
    {
        category: "INTERACTIVE_LEARNING",
        title: "Interactive Learning",
        description:
            "Interactive and activity-driven learning experiences.",
        options: [
            {
                type: "MICROLEARNING",
                label: "Microlearning",
                description: "Short focused learning experience.",
                storage: "FILE",
                accept: ".mp4,.pdf,.html,.zip",
            },
            {
                type: "GAMIFIED_CONTENT",
                label: "Gamified Content",
                description: "Game-based or gamified learning.",
                storage: "FILE",
                accept: ".zip,.html,.mp4",
            },
            {
                type: "SCENARIO_BASED",
                label: "Scenario-based Learning",
                description: "Scenario-driven learning activity.",
                storage: "FILE",
                accept: ".zip,.html,.mp4,.pdf",
            },
            {
                type: "INTERACTIVE_PRESENTATION",
                label: "Interactive Presentations",
                description: "Interactive presentation content.",
                storage: "FILE",
                accept: ".zip,.html,.pptx",
            },
        ],
    },
    {
        category: "KNOWLEDGE_CONTENT",
        title: "Knowledge Content",
        description:
            "Knowledge bases, documentation, and reference resources.",
        options: [
            {
                type: "VISUAL_STORYTELLING",
                label: "Visual Storytelling",
                description: "Visual narrative learning content.",
                storage: "FILE",
                accept: "image/*,.pdf,.mp4",
            },
            {
                type: "WIKI",
                label: "Wikis",
                description: "Wiki-based knowledge resource.",
                storage: "URL",
            },
            {
                type: "DYNAMIC_KNOWLEDGE_BASE",
                label: "Dynamic Knowledge Bases",
                description:
                    "Continuously updated knowledge resource.",
                storage: "URL",
            },
            {
                type: "DIGITAL_DOCUMENTATION",
                label: "Digital Documentation",
                description: "Digital reference documentation.",
                storage: "FILE",
                accept: ".pdf,.doc,.docx,.html",
            },
        ],
    },
];

/* =========================================================
   FRONTEND FILE STORAGE
========================================================= */

/*
 * Course drafts are intentionally kept small.  Binary files are
 * therefore stored in IndexedDB and the draft stores only a stable
 * resourceKey.
 *
 * The same database and object store are used by the learner
 * preview and the SCORM service worker. SCORM files use:
 *
 *     scorm:{packageId}:{relative/path}
 *
 * Normal uploaded files use:
 *
 *     content:{contentId}
 */

const CONTENT_STORAGE_DB = "neurolxp-course-content";
const CONTENT_STORAGE_VERSION = 1;
const CONTENT_FILE_STORE = "files";

type StoredResourceRecord = {
    key: string;
    blob: Blob;
    mimeType: string;
    fileName: string;
    packageId?: string;
    path?: string;
    createdAt: string;
};

function openContentStorage(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        if (typeof window === "undefined" || !("indexedDB" in window)) {
            reject(
                new Error(
                    "IndexedDB is not available in this browser."
                )
            );
            return;
        }

        const request = window.indexedDB.open(
            CONTENT_STORAGE_DB,
            CONTENT_STORAGE_VERSION
        );

        request.onupgradeneeded = () => {
            const database = request.result;

            if (
                !database.objectStoreNames.contains(
                    CONTENT_FILE_STORE
                )
            ) {
                database.createObjectStore(
                    CONTENT_FILE_STORE,
                    {
                        keyPath: "key",
                    }
                );
            }
        };

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            reject(
                request.error ??
                    new Error(
                        "Unable to open course content storage."
                    )
            );
        };
    });
}

async function putStoredResource(
    record: StoredResourceRecord
): Promise<void> {
    const database = await openContentStorage();

    await new Promise<void>((resolve, reject) => {
        const transaction = database.transaction(
            CONTENT_FILE_STORE,
            "readwrite"
        );

        transaction.objectStore(
            CONTENT_FILE_STORE
        ).put(record);

        transaction.oncomplete = () => resolve();

        transaction.onerror = () => {
            reject(
                transaction.error ??
                    new Error(
                        "Unable to store course content."
                    )
            );
        };

        transaction.onabort = () => {
            reject(
                transaction.error ??
                    new Error(
                        "Course content storage transaction was aborted."
                    )
            );
        };
    });

    database.close();
}

async function deleteStoredResource(
    key: string
): Promise<void> {
    const database = await openContentStorage();

    await new Promise<void>((resolve, reject) => {
        const transaction = database.transaction(
            CONTENT_FILE_STORE,
            "readwrite"
        );

        transaction.objectStore(
            CONTENT_FILE_STORE
        ).delete(key);

        transaction.oncomplete = () => resolve();

        transaction.onerror = () => {
            reject(
                transaction.error ??
                    new Error(
                        "Unable to delete course content."
                    )
            );
        };
    });

    database.close();
}

/*
 * Exported for Learner View.  It returns the actual uploaded file
 * rather than only the file name stored in the course draft.
 */
export async function getStoredLearningContentBlob(
    resourceKey: string
): Promise<Blob | null> {
    if (!resourceKey) {
        return null;
    }

    const database = await openContentStorage();

    const record = await new Promise<
        StoredResourceRecord | undefined
    >((resolve, reject) => {
        const transaction = database.transaction(
            CONTENT_FILE_STORE,
            "readonly"
        );

        const request = transaction.objectStore(
            CONTENT_FILE_STORE
        ).get(resourceKey);

        request.onsuccess = () => {
            resolve(
                request.result as
                    | StoredResourceRecord
                    | undefined
            );
        };

        request.onerror = () => {
            reject(
                request.error ??
                    new Error(
                        "Unable to read stored course content."
                    )
            );
        };
    });

    database.close();

    return record?.blob ?? null;
}

/*
 * Normalize paths so ../ cannot escape the SCORM package root.
 */
function normalizePackagePath(
    input: string
): string {
    return input
        .replace(/\\/g, "/")
        .split("/")
        .reduce<string[]>((parts, part) => {
            if (!part || part === ".") {
                return parts;
            }

            if (part === "..") {
                parts.pop();
                return parts;
            }

            parts.push(part);
            return parts;
        }, [])
        .join("/");
}

function getZipMimeType(
    path: string
): string {
    const extension =
        path
            .split(".")
            .pop()
            ?.toLowerCase() ?? "";

    const mimeTypes: Record<string, string> = {
        html: "text/html",
        htm: "text/html",
        css: "text/css",
        js: "application/javascript",
        mjs: "application/javascript",
        json: "application/json",
        xml: "application/xml",
        svg: "image/svg+xml",
        png: "image/png",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        gif: "image/gif",
        webp: "image/webp",
        ico: "image/x-icon",
        mp4: "video/mp4",
        webm: "video/webm",
        ogv: "video/ogg",
        mp3: "audio/mpeg",
        wav: "audio/wav",
        ogg: "audio/ogg",
        m4a: "audio/mp4",
        pdf: "application/pdf",
        wasm: "application/wasm",
        woff: "font/woff",
        woff2: "font/woff2",
        ttf: "font/ttf",
        otf: "font/otf",
    };

    return (
        mimeTypes[extension] ??
        "application/octet-stream"
    );
}

/*
 * SCORM and normal uploaded files use the SAME frontend storage.
 *
 * IndexedDB:
 *     neurolxp-course-content
 *
 * Object store:
 *     files
 *
 * Normal resource key:
 *     content:{contentId}
 *
 * SCORM resource key:
 *     scorm:{packageId}:{relative/path}
 *
 * This keeps the Learning Structure and Learner View on one
 * browser-side content table.
 */
const SCORM_RUNTIME_DB = CONTENT_STORAGE_DB;
const SCORM_RUNTIME_STORE = CONTENT_FILE_STORE;

function openScormRuntimeStorage(): Promise<IDBDatabase> {
    return openContentStorage();
}

async function putScormRuntimeFile(
    packageId: string,
    relativePath: string,
    blob: Blob,
    mimeType: string,
): Promise<void> {
    const database = await openScormRuntimeStorage();
    const normalizedPath = normalizePackagePath(relativePath);
    const key =
        `scorm:${packageId}:${normalizedPath}`;

    await new Promise<void>((resolve, reject) => {
        const transaction = database.transaction(
            SCORM_RUNTIME_STORE,
            "readwrite",
        );

        transaction.objectStore(SCORM_RUNTIME_STORE).put({
            key,
            packageId,
            path: normalizedPath,

            /*
             * `blob` is the canonical payload used by the common
             * frontend files table.
             *
             * `content` is retained so older SCORM service-worker
             * versions can still read the same record.
             */
            blob,
            content: blob,

            mimeType,
            fileName:
                normalizedPath.split("/").pop() ||
                normalizedPath,
            createdAt: new Date().toISOString(),
        });

        transaction.oncomplete = () => resolve();
        transaction.onerror = () =>
            reject(
                transaction.error ??
                    new Error(
                        `Unable to store SCORM resource: ${relativePath}`,
                    ),
            );
        transaction.onabort = () =>
            reject(
                transaction.error ??
                    new Error(
                        `SCORM storage transaction aborted: ${relativePath}`,
                    ),
            );
    });

    database.close();
}

async function deleteScormPackage(
    packageId: string,
): Promise<void> {
    if (!packageId) {
        return;
    }

    const database = await openScormRuntimeStorage();

    await new Promise<void>((resolve, reject) => {
        const transaction = database.transaction(
            SCORM_RUNTIME_STORE,
            "readwrite",
        );
        const store = transaction.objectStore(
            SCORM_RUNTIME_STORE,
        );
        const request = store.openCursor();

        request.onsuccess = () => {
            const cursor = request.result;

            if (!cursor) {
                return;
            }

            const record = cursor.value as
                | { packageId?: string }
                | undefined;

            if (record?.packageId === packageId) {
                cursor.delete();
            }

            cursor.continue();
        };

        request.onerror = () => {
            reject(
                request.error ??
                    new Error(
                        `Unable to clean up SCORM package: ${packageId}`,
                    ),
            );
        };

        transaction.oncomplete = () => resolve();
        transaction.onerror = () =>
            reject(
                transaction.error ??
                    new Error(
                        `Unable to clean up SCORM package: ${packageId}`,
                    ),
            );
        transaction.onabort = () =>
            reject(
                transaction.error ??
                    new Error(
                        `SCORM cleanup transaction aborted: ${packageId}`,
                    ),
            );
    });

    database.close();
}

function buildScormLaunchUrl(
    packageId: string,
    launchFile: string,
): string {
    const packagePart = encodeURIComponent(packageId);
    const filePart = normalizePackagePath(launchFile)
        .split("/")
        .filter(Boolean)
        .map((part) => encodeURIComponent(part))
        .join("/");

    return `/scorm-runtime/${packagePart}/${filePart}`;
}

async function ensureScormServiceWorker(): Promise<void> {
    if (
        typeof window === "undefined" ||
        !("serviceWorker" in navigator)
    ) {
        throw new Error(
            "SCORM preview requires browser Service Worker support.",
        );
    }

    const registration =
        await navigator.serviceWorker.register(
            "/scorm-service-worker.js",
            { scope: "/scorm-runtime/" },
        );

    await navigator.serviceWorker.ready;

    if (!registration.active && !registration.waiting) {
        throw new Error(
            "The SCORM service worker could not be activated.",
        );
    }
}

function isScormZipFile(file: File): boolean {
    return (
        /\.zip$/i.test(file.name) ||
        file.type === "application/zip" ||
        file.type === "application/x-zip-compressed"
    );
}

function stripScormUrlSuffix(value: string): string {
    return value.split("#")[0].split("?")[0];
}

function resolveScormPackagePath(
    basePath: string,
    targetPath: string,
): string {
    const cleanTarget =
        stripScormUrlSuffix(targetPath.trim());

    if (cleanTarget.startsWith("/")) {
        return normalizePackagePath(
            cleanTarget.slice(1),
        );
    }

    const baseDirectory =
        basePath.includes("/")
            ? basePath.slice(
                  0,
                  basePath.lastIndexOf("/"),
              )
            : "";

    return normalizePackagePath(
        baseDirectory
            ? `${baseDirectory}/${cleanTarget}`
            : cleanTarget,
    );
}

async function extractScormPackage(
    file: File,
    contentId: string,
    requestedType: ContentType
): Promise<{
    packageId: string;
    launchFile: string;
    version: "SCORM_1_2" | "SCORM_2004";
    fileCount: number;
}> {
    const zip = await JSZip.loadAsync(
        file
    );

    const allPaths = Object.keys(
        zip.files
    )
        .filter(
            (path) =>
                !zip.files[path].dir
        )
        .map(normalizePackagePath)
        .filter(Boolean);

    if (allPaths.length === 0) {
        throw new Error(
            "The SCORM ZIP contains no files."
        );
    }

    /*
     * SCORM packages require imsmanifest.xml.
     * It is normally at the root, but some authoring tools
     * place the package inside one folder. We support both.
     */
    const manifestPath =
        allPaths.find(
            (path) =>
                path.toLowerCase() ===
                "imsmanifest.xml"
        ) ??
        allPaths.find(
            (path) =>
                path
                    .split("/")
                    .pop()
                    ?.toLowerCase() ===
                "imsmanifest.xml"
        );

    if (!manifestPath) {
        throw new Error(
            "Invalid SCORM package: imsmanifest.xml was not found."
        );
    }

    const manifestFile =
        zip.file(manifestPath);

    if (!manifestFile) {
        throw new Error(
            "Unable to read imsmanifest.xml from the SCORM package."
        );
    }

    const manifestXml =
        await manifestFile.async(
            "text"
        );

    const xmlDocument =
        new DOMParser().parseFromString(
            manifestXml,
            "application/xml"
        );

    if (
        xmlDocument.querySelector(
            "parsererror"
        )
    ) {
        throw new Error(
            "The SCORM imsmanifest.xml file is invalid."
        );
    }

    const root =
        xmlDocument.documentElement;

    const manifestNamespace =
        root.getAttribute(
            "xmlns"
        ) ??
        "";

    const detectedVersion =
        requestedType === "SCORM_2004" ||
        /2004/i.test(
            manifestNamespace
        ) ||
        /2004/i.test(
            manifestXml
        )
            ? "SCORM_2004"
            : "SCORM_1_2";

    /*
     * SCORM 2004 uses:
     *     adlcp:scormType="sco"
     *
     * SCORM 1.2 uses:
     *     adlcp:scormtype="sco"
     *
     * We first look for a SCO resource with href.
     */
    const resources = Array.from(
        xmlDocument.getElementsByTagName(
            "resource"
        )
    );

    let launchHref: string | null =
        null;

    for (const resource of resources) {
        const scormType =
            resource.getAttribute(
                "adlcp:scormType"
            ) ??
            resource.getAttribute(
                "adlcp:scormtype"
            ) ??
            resource.getAttribute(
                "scormType"
            ) ??
            resource.getAttribute(
                "scormtype"
            );

        const href =
            resource.getAttribute(
                "href"
            );

        if (
            href &&
            (
                !scormType ||
                scormType.toLowerCase() ===
                    "sco"
            )
        ) {
            launchHref = href;
            break;
        }
    }

    /*
     * Fallback: the first HTML file if the authoring tool did not
     * provide the SCORM resource attribute in a browser-readable
     * namespace.
     */
    if (!launchHref) {
        launchHref =
            allPaths.find(
                (path) =>
                    /\.(html?|xhtml)$/i.test(
                        path
                    )
            ) ?? null;
    }

    if (!launchHref) {
        throw new Error(
            "SCORM launch file could not be identified from the manifest."
        );
    }

    const manifestDirectory =
        manifestPath.includes("/")
            ? manifestPath.slice(
                  0,
                  manifestPath.lastIndexOf("/")
              )
            : "";

    const requestedLaunchFile =
        resolveScormPackagePath(
            manifestPath,
            launchHref,
        );

    const launchFile =
        allPaths.find(
            (path) =>
                path.toLowerCase() ===
                requestedLaunchFile.toLowerCase(),
        ) ??
        allPaths.find(
            (path) =>
                path.toLowerCase() ===
                stripScormUrlSuffix(
                    launchHref ?? "",
                )
                    .replace(/^\//, "")
                    .toLowerCase(),
        );

    if (!launchFile) {
        throw new Error(
            `SCORM launch file "${requestedLaunchFile}" was not found in the ZIP. Check the href in imsmanifest.xml.`,
        );
    }

    const packageId =
        `scorm-${contentId}`;

    /*
     * Extract every file at import time.
     * Nothing is left inside the ZIP waiting for Learner View.
     */
    for (const relativePath of allPaths) {
        const zipFile =
            zip.file(
                relativePath
            );

        if (!zipFile) {
            continue;
        }

        const blob =
            await zipFile.async(
                "blob"
            );

        await putScormRuntimeFile(
            packageId,
            relativePath,
            blob,
            getZipMimeType(relativePath),
        );
    }

    /*
     * Before adding SCORM to the learning structure, confirm that
     * the exact launch file has really been persisted in IndexedDB.
     */
    const normalizedLaunchFile =
        normalizePackagePath(
            launchFile ||
            launchHref,
        );

    const launchResourceKey =
        `scorm:${packageId}:${normalizedLaunchFile}`;

    const launchDatabase =
        await openScormRuntimeStorage();

    try {
        const launchRecord =
            await new Promise<
                StoredResourceRecord | undefined
            >((resolve, reject) => {
                const transaction =
                    launchDatabase.transaction(
                        SCORM_RUNTIME_STORE,
                        "readonly",
                    );

                const request =
                    transaction
                        .objectStore(
                            SCORM_RUNTIME_STORE,
                        )
                        .get(
                            launchResourceKey,
                        );

                request.onsuccess =
                    () =>
                        resolve(
                            request.result as
                                | StoredResourceRecord
                                | undefined,
                        );

                request.onerror =
                    () =>
                        reject(
                            request.error ??
                                new Error(
                                    "Unable to verify stored SCORM launch file.",
                                ),
                        );
            });

        if (!launchRecord?.blob) {
            throw new Error(
                "SCORM extraction completed, but the launch file was not stored correctly. Please upload the SCORM ZIP again.",
            );
        }
    } finally {
        launchDatabase.close();
    }

    return {
        packageId,
        launchFile:
            normalizedLaunchFile,
        version:
            detectedVersion,
        fileCount:
            allPaths.length,
    };
}

/*
 * Store a normal uploaded file immediately when the user clicks
 * Add Content.  This covers DOC, DOCX, PPT, PPTX, PPTM, PDF,
 * video, audio, images, HTML and other file-based resources.
 */
async function storeUploadedFile(
    file: File,
    contentId: string
): Promise<string> {
    const resourceKey =
        `content:${contentId}`;

    await putStoredResource({
        key: resourceKey,
        blob: file,
        mimeType:
            file.type ||
            "application/octet-stream",
        fileName:
            file.name,
        createdAt:
            new Date().toISOString(),
    });

    return resourceKey;
}

/* =========================================================
   TEXT EDITOR + AI IMPORT
   Only the two requested capabilities are added here.
========================================================= */

const TEXT_EDITOR_REQUEST_STORAGE_KEY = "neurolxp_text_editor_request";
const TEXT_EDITOR_RESULT_STORAGE_KEY = "neurolxp_text_editor_result";
const TEXT_EDITOR_FILE_DATABASE_NAME = "neurolxp-text-editor-files";
const TEXT_EDITOR_FILE_DATABASE_VERSION = 1;
const TEXT_EDITOR_FILE_STORE_NAME = "files";

/* The editor now lives inside Course Management. */
const COURSE_MANAGEMENT_TEXT_EDITOR_ROUTE =
    "/text_editor_new";

type TextEditorResult = {
    requestId: string;
    source: "learning-structure-builder" | "syllabus-builder";
    confirmed: boolean;
    targetType: "learning-content-new-file" | "learning-content-uploaded-file";
    content: string;
    courseId: string;
    topicId?: string;
    learningId?: string;
    resourceId?: string;
    contentBlockId?: string;
    savedAt: string;
    outputFormat?: "docx" | "txt" | "pdf";
    fileName?: string;
    mimeType?: string;
    fileSize?: string;
    fileDataUrl?: string;
};

type ImportStatus =
    | "Idle"
    | "Uploading"
    | "Analysing"
    | "NeedsReview"
    | "Applied"
    | "Failed";

type ImportedContentBlock = {
    type?: string;
    title?: string;
    body?: string;
    mediaUrl?: string;
    estimatedMinutes?: string;
};

type ImportedTopic = {
    title: string;
    description?: string;
    contentBlocks?: ImportedContentBlock[];
};

type ImportedUnit = {
    title: string;
    description?: string;
    topics?: ImportedTopic[];
};

type ImportedChapter = {
    title: string;
    description?: string;
    units?: ImportedUnit[];
};

type ImportedModule = {
    title: string;
    description?: string;
    chapters?: ImportedChapter[];
    units?: ImportedUnit[];
    topics?: ImportedTopic[];
};

type ImportedSyllabus = {
    syllabusTitle?: string;
    modules: ImportedModule[];
    warnings?: string[];
    unclassifiedContent?: Array<{
        text: string;
        sourcePage?: number | null;
        reason?: string;
    }>;
};

function readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () =>
            resolve(typeof reader.result === "string" ? reader.result : "");
        reader.onerror = () =>
            reject(reader.error ?? new Error("Unable to read the selected file."));
        reader.readAsDataURL(file);
    });
}

function openTextEditorFileDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = window.indexedDB.open(
            TEXT_EDITOR_FILE_DATABASE_NAME,
            TEXT_EDITOR_FILE_DATABASE_VERSION,
        );

        request.onupgradeneeded = () => {
            const database = request.result;
            if (!database.objectStoreNames.contains(TEXT_EDITOR_FILE_STORE_NAME)) {
                database.createObjectStore(TEXT_EDITOR_FILE_STORE_NAME, {
                    keyPath: "id",
                });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () =>
            reject(request.error ?? new Error("Unable to open text-editor file storage."));
    });
}

async function saveTextEditorFilePayload(
    id: string,
    fileDataUrl: string,
): Promise<void> {
    if (!fileDataUrl) return;
    const database = await openTextEditorFileDatabase();
    try {
        const transaction = database.transaction(
            TEXT_EDITOR_FILE_STORE_NAME,
            "readwrite",
        );
        transaction.objectStore(TEXT_EDITOR_FILE_STORE_NAME).put({
            id,
            fileDataUrl,
            savedAt: new Date().toISOString(),
        });
        await new Promise<void>((resolve, reject) => {
            transaction.oncomplete = () => resolve();
            transaction.onerror = () =>
                reject(transaction.error ?? new Error("Unable to save file for the text editor."));
            transaction.onabort = () =>
                reject(transaction.error ?? new Error("Text-editor file storage was cancelled."));
        });
    } finally {
        database.close();
    }
}

function editorOutputFormatForFile(fileName: string): "docx" | "txt" | "pdf" {
    const extension = fileName.split(".").pop()?.toLowerCase();
    if (extension === "pdf") return "pdf";
    if (extension === "txt") return "txt";
    return "docx";
}

/* =========================================================
   HELPERS
========================================================= */


function formatFileSize(size: number): string {
    if (size < 1024) {
        return `${size} B`;
    }

    if (size < 1024 * 1024) {
        return `${(size / 1024).toFixed(1)} KB`;
    }

    if (size < 1024 * 1024 * 1024) {
        return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }

    return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function getContentTypeLabel(type: ContentType): string {
    for (const category of contentCatalog) {
        const option = category.options.find(
            (item) => item.type === type,
        );

        if (option) {
            return option.label;
        }
    }

    return type;
}

function getLearnerPreviewMode(
    contentType: ContentType,
    fileName?: string,
): LearningContent["previewMode"] {
    const extension =
        fileName
            ?.split(".")
            .pop()
            ?.toLowerCase() ?? "";

    if (
        contentType === "SCORM_1_2" ||
        contentType === "SCORM_2004"
    ) {
        return "SCORM";
    }

    if (extension === "pdf") {
        return "PDF";
    }

    if (
        extension === "doc" ||
        extension === "docx"
    ) {
        return "DOCUMENT";
    }

    if (
        extension === "ppt" ||
        extension === "pptx" ||
        extension === "pptm"
    ) {
        return "PRESENTATION";
    }

    if (
        extension === "mp4" ||
        extension === "webm" ||
        extension === "mov" ||
        extension === "mp3" ||
        extension === "wav" ||
        extension === "ogg" ||
        extension === "m4a" ||
        extension === "png" ||
        extension === "jpg" ||
        extension === "jpeg" ||
        extension === "gif" ||
        extension === "webp"
    ) {
        return "MEDIA";
    }

    if (
        extension === "html" ||
        extension === "htm" ||
        contentType === "WEB_PRESENTATION" ||
        contentType === "PROGRESSIVE_WEB_APP"
    ) {
        return "WEB";
    }

    if (
        contentType === "GOOGLE_SLIDES" ||
        contentType === "LIVE_STREAMING" ||
        contentType === "MOBILE_LEARNING"
    ) {
        return "WEB";
    }

    return "DOWNLOAD";
}

function isValidLearningResourceUrl(
    value: string,
): boolean {
    try {
        const parsed = new URL(value.trim());

        return (
            parsed.protocol === "http:" ||
            parsed.protocol === "https:"
        );
    } catch {
        return false;
    }
}

function getCategoryForType(
    type: ContentType,
): ContentCategory {
    for (const category of contentCatalog) {
        if (
            category.options.some(
                (item) => item.type === type,
            )
        ) {
            return category.category;
        }
    }

    return "DOCUMENTS_PRESENTATIONS";
}

/* =========================================================
   COMPONENT
========================================================= */

export default function LearningStructureBuilder({
    tenant,
    role: _role,
    courseId,
    onBack,
    onNext,
}: LearningStructureBuilderProps) {
    const normalizedTenant =
        String(tenant ?? "")
            .trim()
            .toLowerCase()
            .replace(/-/g, "_")
            .replace(/\s+/g, "_");

    const isAcademicTenant =
        normalizedTenant === "university" ||
        normalizedTenant === "college";

    const [modules, setModules] = useState<ModuleItem[]>([]);

    /*
     * University / College only.
     * The existing `modules[].learnings[]` remains the canonical leaf
     * storage used by Content and Assessment. This additional hierarchy
     * only organizes those learning items as:
     * Module -> Chapter -> Unit -> Topic.
     */
    const [academicHierarchy, setAcademicHierarchy] =
        useState<AcademicModuleHierarchy[]>([]);

    const [expandedAcademicChapters, setExpandedAcademicChapters] =
        useState<Set<string>>(new Set());

    const [expandedAcademicUnits, setExpandedAcademicUnits] =
        useState<Set<string>>(new Set());

    const [expandedModules, setExpandedModules] =
        useState<Set<string>>(new Set());

    const [selectedLearningId, setSelectedLearningId] =
        useState<string | null>(null);

    const [showContentSelector, setShowContentSelector] =
        useState(false);

    const [selectedContentType, setSelectedContentType] =
        useState<ContentOption | null>(null);

    const [showAssessmentModal, setShowAssessmentModal] =
        useState(false);

    const [assessmentTitle, setAssessmentTitle] =
        useState("");

    const [assessmentId, setAssessmentId] =
        useState("");

    const [contentTitle, setContentTitle] =
        useState("");

    const [contentDescription, setContentDescription] =
        useState("");

    const [contentUrl, setContentUrl] =
        useState("");

    const [contentDuration, setContentDuration] =
        useState("");

    const [contentRequired, setContentRequired] =
        useState(true);

    const [selectedFile, setSelectedFile] =
        useState<File | null>(null);

    const [isAddingContent, setIsAddingContent] =
        useState(false);

    /* Requested capability 1: Text Editor hand-off. */
    const [isPreparingEditor, setIsPreparingEditor] =
        useState(false);

    /* Requested capability 2: AI syllabus analysis/import. */
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importStatus, setImportStatus] = useState<ImportStatus>("Idle");
    const [importProgressMessage, setImportProgressMessage] = useState("");
    const [importResult, setImportResult] = useState<ImportedSyllabus | null>(null);

    useEffect(() => {
        void (async () => {
            try {
                if (
                    typeof window !== "undefined" &&
                    "serviceWorker" in navigator
                ) {
                    await navigator.serviceWorker.register(
                        "/scorm-service-worker.js",
                        { scope: "/scorm-runtime/" },
                    );
                }
            } catch (error) {
                console.warn(
                    "SCORM service worker registration failed:",
                    error,
                );
            }
        })();
    }, []);

    /*
     * Load the saved structure whenever this step opens.
     *
     * The Learning Structure is stored inside the SAME course draft
     * used by CourseWizard. This keeps Module -> Learning -> Content
     * -> Assessment available to Review / Inline Learner View.
     */
    useEffect(() => {
        if (!courseId) {
            return;
        }

        const draft = getCourseDraft(courseId);

        if (!draft) {
            return;
        }

        if (!Array.isArray(draft.structure)) {
            return;
        }

        let savedModules =
            draft.structure as ModuleItem[];

        /* Restore a confirmed Text Editor result to the exact Topic/Learning. */
        try {
            const rawResult = window.localStorage.getItem(
                TEXT_EDITOR_RESULT_STORAGE_KEY,
            );
            const editorResult = rawResult
                ? (JSON.parse(rawResult) as TextEditorResult)
                : null;

            if (
                editorResult?.confirmed &&
                editorResult.courseId === courseId &&
                (editorResult.source === "learning-structure-builder" ||
                    editorResult.source === "syllabus-builder")
            ) {
                const targetLearningId =
                    editorResult.learningId || editorResult.topicId || "";
                const targetContentId =
                    editorResult.resourceId || editorResult.contentBlockId || "";

                savedModules = savedModules.map((module) => ({
                    ...module,
                    learnings: module.learnings.map((learning) =>
                        learning.id !== targetLearningId
                            ? learning
                            : {
                                  ...learning,
                                  contents: learning.contents.map((content) =>
                                      content.id !== targetContentId
                                          ? content
                                          : {
                                                ...content,
                                                title:
                                                    editorResult.fileName ||
                                                    content.title,
                                                fileName:
                                                    editorResult.fileName ||
                                                    content.fileName,
                                                fileType:
                                                    editorResult.mimeType ||
                                                    content.fileType,
                                                editorContent:
                                                    editorResult.content ||
                                                    content.editorContent ||
                                                    "",
                                                outputFormat:
                                                    editorResult.outputFormat ||
                                                    content.outputFormat,
                                                editorManaged: true,
                                                status: "READY",
                                            },
                                  ),
                              },
                    ),
                }));

                window.localStorage.removeItem(
                    TEXT_EDITOR_RESULT_STORAGE_KEY,
                );

                saveCourseDraft({
                    ...draft,
                    structure: savedModules,
                    updatedAt: new Date().toISOString(),
                });
            }
        } catch (error) {
            console.error("Unable to restore Text Editor result:", error);
        }

        setModules(savedModules);

        if (isAcademicTenant) {
            const savedAcademicHierarchy =
                Array.isArray(
                    (draft as any).academicStructure,
                )
                    ? ((draft as any).academicStructure as
                          AcademicModuleHierarchy[])
                    : [];

            setAcademicHierarchy(
                savedAcademicHierarchy,
            );

            const chapterIds = new Set<string>();
            const unitIds = new Set<string>();

            savedAcademicHierarchy.forEach(
                (academicModule) => {
                    academicModule.chapters.forEach(
                        (chapter) => {
                            chapterIds.add(
                                chapter.id,
                            );

                            chapter.units.forEach(
                                (unit) =>
                                    unitIds.add(
                                        unit.id,
                                    ),
                            );
                        },
                    );
                },
            );

            setExpandedAcademicChapters(
                chapterIds,
            );

            setExpandedAcademicUnits(
                unitIds,
            );
        }

        const expanded = new Set(
            savedModules.map(
                (module) => module.id,
            ),
        );

        setExpandedModules(expanded);

        const firstLearning =
            savedModules.find(
                (module) =>
                    Array.isArray(
                        module.learnings,
                    ) &&
                    module.learnings.length > 0,
            )?.learnings?.[0];

        setSelectedLearningId(
            firstLearning?.id ?? null,
        );
    }, [courseId, isAcademicTenant]);

    /*
     * Persist the complete Learning Structure into the
     * existing course draft.
     *
     * This does NOT create another course or another draft.
     * It updates the same courseId record.
     */
    function handleSaveAndContinue() {
        const draft =
            getCourseDraft(courseId);

        if (!draft) {
            console.error(
                "Course draft not found while saving Learning Structure:",
                courseId,
            );

            return;
        }

        const updatedDraft = {
            ...draft,

            /*
             * IMPORTANT:
             * Store the exact tree created in this page.
             */
            structure:
                modules,

            ...(isAcademicTenant
                ? {
                      academicStructure:
                          academicHierarchy,
                  }
                : {}),

            /*
             * Step 3 is index 2, therefore after completing
             * this step the completed-step count must be at
             * least 3.
             *
             * If the user already completed Step 7, keep 7.
             */
            completedThroughStep:
                Math.max(
                    draft.completedThroughStep ?? 0,
                    3,
                ),

            /*
             * Do not move currentStep backward if the draft
             * already contains a later wizard position.
             * CourseWizard will set the visible next step.
             */
            currentStep:
                Math.max(
                    draft.currentStep ?? 0,
                    3,
                ),

            updatedAt:
                new Date().toISOString(),
        };

        saveCourseDraft(
            updatedDraft,
        );

        /*
         * Only navigate after the structure has been
         * successfully written to the same draft.
         */
        onNext();
    }

    /*
     * Keep the current structure in the same course draft while editing.
     * This is frontend-only persistence and never creates a second draft.
     */
    useEffect(() => {
        if (!courseId) {
            return;
        }

        const draft = getCourseDraft(courseId);

        if (!draft) {
            return;
        }

        /*
         * Avoid replacing an existing saved tree with the initial empty
         * component state before the loading effect restores it.
         */
        if (
            modules.length === 0 &&
            Array.isArray(draft.structure) &&
            draft.structure.length > 0
        ) {
            return;
        }

        saveCourseDraft({
            ...draft,
            structure: modules,
            ...(isAcademicTenant
                ? {
                      academicStructure:
                          academicHierarchy,
                  }
                : {}),
            updatedAt: new Date().toISOString(),
        });
    }, [
        courseId,
        modules,
        academicHierarchy,
        isAcademicTenant,
    ]);

    const selectedLearning = useMemo(
        () =>
            modules
                .flatMap(
                    (module) => module.learnings,
                )
                .find(
                    (learning) =>
                        learning.id ===
                        selectedLearningId,
                ),
        [modules, selectedLearningId],
    );

    const totalLearnings = modules.reduce(
        (total, module) =>
            total + module.learnings.length,
        0,
    );

    const totalContent = modules.reduce(
        (total, module) =>
            total +
            module.learnings.reduce(
                (learningTotal, learning) =>
                    learningTotal +
                    learning.contents.length,
                0,
            ),
        0,
    );

    const totalAssessments = modules.reduce(
        (total, module) =>
            total +
            module.learnings.reduce(
                (learningTotal, learning) =>
                    learningTotal +
                    learning.assessments.length,
                0,
            ),
        0,
    );

    function handleAddModule() {
        const moduleNumber = modules.length + 1;

        const newModule: ModuleItem = {
            id: `module-${Date.now()}`,
            title: `Module ${moduleNumber}`,
            description: "",
            learnings: [],
        };

        setModules((previous) => [
            ...previous,
            newModule,
        ]);

        if (isAcademicTenant) {
            setAcademicHierarchy(
                (previous) => [
                    ...previous,
                    {
                        moduleId:
                            newModule.id,
                        chapters: [],
                    },
                ],
            );
        }

        setExpandedModules((previous) => {
            const next = new Set(previous);
            next.add(newModule.id);
            return next;
        });
    }

    function handleAddLearning(moduleId: string) {
        const module = modules.find(
            (item) => item.id === moduleId,
        );

        if (!module) {
            return;
        }

        const learningNumber =
            module.learnings.length + 1;

        const newLearning: LearningItem = {
            id: `learning-${Date.now()}`,
            title: `Learning ${learningNumber}`,
            description: "",
            contents: [],
            assessments: [],
        };

        setModules((previous) =>
            previous.map((item) =>
                item.id === moduleId
                    ? {
                          ...item,
                          learnings: [
                              ...item.learnings,
                              newLearning,
                          ],
                      }
                    : item,
            ),
        );

        setSelectedLearningId(newLearning.id);
    }

    function handleAddAcademicChapter(
        moduleId: string,
    ) {
        if (!isAcademicTenant) {
            return;
        }

        setAcademicHierarchy(
            (previous) => {
                const existing =
                    previous.find(
                        (item) =>
                            item.moduleId ===
                            moduleId,
                    );

                const chapterNumber =
                    (existing?.chapters.length ??
                        0) + 1;

                const chapter: AcademicChapterItem = {
                    id: `chapter-${Date.now()}-${Math.random()
                        .toString(36)
                        .slice(2, 7)}`,
                    title: `Chapter ${chapterNumber}`,
                    description: "",
                    units: [],
                };

                setExpandedAcademicChapters(
                    (current) => {
                        const next =
                            new Set(current);
                        next.add(chapter.id);
                        return next;
                    },
                );

                if (!existing) {
                    return [
                        ...previous,
                        {
                            moduleId,
                            chapters: [
                                chapter,
                            ],
                        },
                    ];
                }

                return previous.map(
                    (item) =>
                        item.moduleId ===
                        moduleId
                            ? {
                                  ...item,
                                  chapters: [
                                      ...item.chapters,
                                      chapter,
                                  ],
                              }
                            : item,
                );
            },
        );
    }

    function handleAddAcademicUnit(
        moduleId: string,
        chapterId: string,
    ) {
        if (!isAcademicTenant) {
            return;
        }

        const academicModule =
            academicHierarchy.find(
                (item) =>
                    item.moduleId ===
                    moduleId,
            );

        const chapter =
            academicModule?.chapters.find(
                (item) =>
                    item.id === chapterId,
            );

        if (!chapter) {
            return;
        }

        const unit: AcademicUnitItem = {
            id: `unit-${Date.now()}-${Math.random()
                .toString(36)
                .slice(2, 7)}`,
            title: `Unit ${
                chapter.units.length + 1
            }`,
            description: "",
            topicIds: [],
        };

        setAcademicHierarchy(
            (previous) =>
                previous.map(
                    (item) =>
                        item.moduleId !==
                        moduleId
                            ? item
                            : {
                                  ...item,
                                  chapters:
                                      item.chapters.map(
                                          (chapterItem) =>
                                              chapterItem.id ===
                                              chapterId
                                                  ? {
                                                        ...chapterItem,
                                                        units: [
                                                            ...chapterItem.units,
                                                            unit,
                                                        ],
                                                    }
                                                  : chapterItem,
                                      ),
                              },
                ),
        );

        setExpandedAcademicUnits(
            (current) => {
                const next =
                    new Set(current);
                next.add(unit.id);
                return next;
            },
        );
    }

    function handleAddAcademicTopic(
        moduleId: string,
        chapterId: string,
        unitId: string,
    ) {
        if (!isAcademicTenant) {
            return;
        }

        const module = modules.find(
            (item) =>
                item.id === moduleId,
        );

        const academicModule =
            academicHierarchy.find(
                (item) =>
                    item.moduleId ===
                    moduleId,
            );

        const chapter =
            academicModule?.chapters.find(
                (item) =>
                    item.id === chapterId,
            );

        const unit =
            chapter?.units.find(
                (item) =>
                    item.id === unitId,
            );

        if (!module || !unit) {
            return;
        }

        const topicNumber =
            unit.topicIds.length + 1;

        const topic: LearningItem = {
            id: `learning-${Date.now()}-${Math.random()
                .toString(36)
                .slice(2, 7)}`,
            title: `Topic ${topicNumber}`,
            description: "",
            contents: [],
            assessments: [],
        };

        setModules((previous) =>
            previous.map((item) =>
                item.id === moduleId
                    ? {
                          ...item,
                          learnings: [
                              ...item.learnings,
                              topic,
                          ],
                      }
                    : item,
            ),
        );

        setAcademicHierarchy(
            (previous) =>
                previous.map(
                    (item) =>
                        item.moduleId !==
                        moduleId
                            ? item
                            : {
                                  ...item,
                                  chapters:
                                      item.chapters.map(
                                          (chapterItem) =>
                                              chapterItem.id !==
                                              chapterId
                                                  ? chapterItem
                                                  : {
                                                        ...chapterItem,
                                                        units: chapterItem.units.map(
                                                            (unitItem) =>
                                                                unitItem.id ===
                                                                unitId
                                                                    ? {
                                                                          ...unitItem,
                                                                          topicIds: [
                                                                              ...unitItem.topicIds,
                                                                              topic.id,
                                                                          ],
                                                                      }
                                                                    : unitItem,
                                                        ),
                                                    },
                                      ),
                              },
                ),
        );

        setSelectedLearningId(
            topic.id,
        );
    }

    function toggleAcademicChapter(
        chapterId: string,
    ) {
        setExpandedAcademicChapters(
            (previous) => {
                const next =
                    new Set(previous);

                if (next.has(chapterId)) {
                    next.delete(chapterId);
                } else {
                    next.add(chapterId);
                }

                return next;
            },
        );
    }

    function toggleAcademicUnit(
        unitId: string,
    ) {
        setExpandedAcademicUnits(
            (previous) => {
                const next =
                    new Set(previous);

                if (next.has(unitId)) {
                    next.delete(unitId);
                } else {
                    next.add(unitId);
                }

                return next;
            },
        );
    }

    function toggleModule(moduleId: string) {
        setExpandedModules((previous) => {
            const next = new Set(previous);

            if (next.has(moduleId)) {
                next.delete(moduleId);
            } else {
                next.add(moduleId);
            }

            return next;
        });
    }

    function persistCurrentStructureBeforeNavigation() {
        const draft = getCourseDraft(courseId);
        if (!draft) return;

        saveCourseDraft({
            ...draft,
            structure: modules,
            ...(isAcademicTenant
                ? { academicStructure: academicHierarchy }
                : {}),
            updatedAt: new Date().toISOString(),
        });
    }

    function navigateToTextEditor(request: Record<string, unknown>) {
        window.localStorage.removeItem(TEXT_EDITOR_RESULT_STORAGE_KEY);
        window.localStorage.setItem(
            TEXT_EDITOR_REQUEST_STORAGE_KEY,
            JSON.stringify(request),
        );

        const params = new URLSearchParams({
            requestId: String(request.requestId ?? ""),
            source: "learning-structure-builder",
            targetType: String(request.targetType ?? ""),
            courseId,
            learningId: String(request.learningId ?? ""),
            topicId: String(request.topicId ?? ""),
            resourceId: String(request.resourceId ?? ""),
            returnUrl: String(request.returnUrl ?? ""),
        });

        const editorUrl =
            `${window.location.origin}${COURSE_MANAGEMENT_TEXT_EDITOR_ROUTE}?${params.toString()}`;

        window.location.href = editorUrl;
    }

    function handleCreateContentInTextEditor() {
        if (!selectedLearning || isPreparingEditor) return;

        const outputFormat = window.prompt(
            "Create content as DOCX, TXT, or PDF:",
            "docx",
        )?.trim().toLowerCase();

        if (!outputFormat) return;
        if (!["docx", "txt", "pdf"].includes(outputFormat)) {
            window.alert("Please enter DOCX, TXT, or PDF.");
            return;
        }

        setIsPreparingEditor(true);
        try {
            const contentId = `content-editor-${Date.now()}-${Math.random()
                .toString(36)
                .slice(2, 7)}`;
            const format = outputFormat as "docx" | "txt" | "pdf";
            const fileName = `New Learning Content.${format}`;

            const placeholder: LearningContent = {
                id: contentId,
                title: "New Learning Content",
                description: "",
                category: "DOCUMENTS_PRESENTATIONS",
                type: "DOC_DOCX",
                storage: "FILE",
                fileName,
                fileType:
                    format === "pdf"
                        ? "application/pdf"
                        : format === "txt"
                          ? "text/plain"
                          : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                previewMode: format === "pdf" ? "PDF" : "DOCUMENT",
                required: true,
                status: "PENDING",
                outputFormat: format,
                editorManaged: true,
            };

            const nextModules = modules.map((module) => ({
                ...module,
                learnings: module.learnings.map((learning) =>
                    learning.id === selectedLearning.id
                        ? {
                              ...learning,
                              contents: [...learning.contents, placeholder],
                          }
                        : learning,
                ),
            }));

            setModules(nextModules);
            const draft = getCourseDraft(courseId);
            if (draft) {
                saveCourseDraft({
                    ...draft,
                    structure: nextModules,
                    ...(isAcademicTenant
                        ? { academicStructure: academicHierarchy }
                        : {}),
                    updatedAt: new Date().toISOString(),
                });
            }

            const returnUrl = `${window.location.pathname}${window.location.search}`;
            const requestId = `EDITOR-${Date.now()}`;

            navigateToTextEditor({
                requestId,
                source: "learning-structure-builder",
                targetType: "learning-content-new-file",
                label: "Create Learning Content",
                content: "",
                courseId,
                learningId: selectedLearning.id,
                topicId: selectedLearning.id,
                resourceId: contentId,
                contentBlockId: contentId,
                returnUrl,
                createdAt: new Date().toISOString(),
                fileName,
                mimeType: placeholder.fileType,
                resourceType: "Learning Content",
                fileDataUrl: "",
                fileStorageKey: "",
                editorMode: "create-new-file",
                requestedOutputFormat: format,
                allowedOutputFormats: ["docx", "txt", "pdf"],
            });
        } finally {
            setIsPreparingEditor(false);
        }
    }

    async function handleUploadAndEditContent(file: File | null) {
        if (!selectedLearning || !file || isPreparingEditor) return;

        if (!/\.(doc|docx|txt|pdf|html|htm|md|markdown|odt)$/i.test(file.name)) {
            window.alert(
                "Please upload an editable DOC, DOCX, TXT, PDF, HTML, Markdown, or ODT document.",
            );
            return;
        }

        setIsPreparingEditor(true);
        try {
            const contentId = `content-editor-${Date.now()}-${Math.random()
                .toString(36)
                .slice(2, 7)}`;
            const requestId = `EDITOR-${Date.now()}`;
            const fileDataUrl = await readFileAsDataUrl(file);
            await saveTextEditorFilePayload(requestId, fileDataUrl);

            const resourceKey = await storeUploadedFile(file, contentId);
            const format = editorOutputFormatForFile(file.name);

            const content: LearningContent = {
                id: contentId,
                title: file.name.replace(/\.[^.]+$/, "") || file.name,
                description: "",
                category: "DOCUMENTS_PRESENTATIONS",
                type: "DOC_DOCX",
                storage: "FILE",
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type || "application/octet-stream",
                resourceKey,
                resourceKind: "BLOB",
                previewMode: getLearnerPreviewMode("DOC_DOCX", file.name),
                required: true,
                status: "PENDING",
                outputFormat: format,
                editorManaged: true,
            };

            const nextModules = modules.map((module) => ({
                ...module,
                learnings: module.learnings.map((learning) =>
                    learning.id === selectedLearning.id
                        ? { ...learning, contents: [...learning.contents, content] }
                        : learning,
                ),
            }));

            setModules(nextModules);
            const draft = getCourseDraft(courseId);
            if (draft) {
                saveCourseDraft({
                    ...draft,
                    structure: nextModules,
                    ...(isAcademicTenant
                        ? { academicStructure: academicHierarchy }
                        : {}),
                    updatedAt: new Date().toISOString(),
                });
            }

            const returnUrl = `${window.location.pathname}${window.location.search}`;
            navigateToTextEditor({
                requestId,
                source: "learning-structure-builder",
                targetType: "learning-content-uploaded-file",
                label: "Upload & Edit Learning Content",
                content: "",
                courseId,
                learningId: selectedLearning.id,
                topicId: selectedLearning.id,
                resourceId: contentId,
                contentBlockId: contentId,
                returnUrl,
                createdAt: new Date().toISOString(),
                fileName: file.name,
                mimeType: file.type || "application/octet-stream",
                resourceType: "Learning Content",
                fileDataUrl: "",
                fileStorageKey: requestId,
                editorMode: "edit-uploaded-file",
                requestedOutputFormat: format,
                allowedOutputFormats: ["docx", "txt", "pdf"],
            });
        } catch (error) {
            console.error("Unable to prepare uploaded content for editor:", error);
            window.alert(
                error instanceof Error
                    ? error.message
                    : "Unable to open the uploaded document in the Text Editor.",
            );
        } finally {
            setIsPreparingEditor(false);
        }
    }

    function handleImportFileChange(file: File | null) {
        setImportFile(file);
        setImportResult(null);
        setImportStatus("Idle");
        setImportProgressMessage("");
    }

    async function handleAnalyseImport() {
        if (!importFile) {
            window.alert("Select a PDF, DOCX, XLSX, XLS, or CSV syllabus document first.");
            return;
        }

        try {
            setImportStatus("Uploading");
            setImportProgressMessage("Uploading syllabus document...");

            const draft = getCourseDraft(courseId) as any;
            const body = new FormData();
            body.append("file", importFile);
            body.append("courseTitle", draft?.setup?.courseTitle || draft?.setup?.title || "");
            body.append("courseCode", draft?.setup?.courseCode || draft?.setup?.code || "");
            body.append(
                "courseOutcomes",
                JSON.stringify(draft?.courseOutcomes || []),
            );
            body.append(
                "requestedHierarchy",
                isAcademicTenant
                    ? "Module > Chapter > Unit > Topic"
                    : "Module > Learning",
            );
            body.append("includeRelatedContent", "true");

            setImportStatus("Analysing");
            setImportProgressMessage(
                "Analysing TOC, hierarchy, topics, and related learning content...",
            );

            const response = await fetch("/api/syllabus-import/analyse", {
                method: "POST",
                body,
            });
            const data = (await response.json()) as {
                result?: ImportedSyllabus;
                error?: string;
            };

            if (!response.ok || !data.result) {
                throw new Error(data.error || "Document analysis failed.");
            }

            setImportResult(data.result);
            setImportStatus("NeedsReview");
            setImportProgressMessage("");
        } catch (error) {
            setImportStatus("Failed");
            setImportProgressMessage("");
            window.alert(
                error instanceof Error
                    ? error.message
                    : "Unable to analyse the syllabus document.",
            );
        }
    }

    function importedTopicContent(topic: ImportedTopic): LearningContent[] {
        const blocks = topic.contentBlocks ?? [];
        if (blocks.length === 0 && !topic.description?.trim()) return [];

        const sourceBlocks =
            blocks.length > 0
                ? blocks
                : [{ title: topic.title, body: topic.description ?? "", type: "Text" }];

        return sourceBlocks.map((block, index) => ({
            id: `content-ai-${Date.now()}-${index}-${Math.random()
                .toString(36)
                .slice(2, 7)}`,
            title: block.title?.trim() || `${topic.title} Content ${index + 1}`,
            description: block.body?.trim() || "",
            category: "KNOWLEDGE_CONTENT" as ContentCategory,
            type: "DIGITAL_DOCUMENTATION" as ContentType,
            storage: "INTEGRATION" as ContentStorage,
            url: block.mediaUrl?.trim() || undefined,
            previewMode: block.mediaUrl ? "WEB" : "DOCUMENT",
            required: true,
            status: "READY" as const,
            editorContent: block.body?.trim() || "",
            editorManaged: true,
        }));
    }

    function handleApplyImportedSyllabus() {
        if (!importResult) return;

        const nextModules: ModuleItem[] = [];
        const nextAcademicHierarchy: AcademicModuleHierarchy[] = [];

        importResult.modules.forEach((importedModule, moduleIndex) => {
            const moduleId = `module-ai-${Date.now()}-${moduleIndex}-${Math.random()
                .toString(36)
                .slice(2, 7)}`;
            const learnings: LearningItem[] = [];
            const chapters: AcademicChapterItem[] = [];

            if (isAcademicTenant) {
                const sourceChapters: ImportedChapter[] =
                    importedModule.chapters?.length
                        ? importedModule.chapters
                        : (importedModule.units ?? []).map((unit) => ({
                              title: unit.title,
                              description: unit.description,
                              units: [unit],
                          }));

                sourceChapters.forEach((chapter, chapterIndex) => {
                    const academicUnits: AcademicUnitItem[] = [];
                    const sourceUnits = chapter.units?.length
                        ? chapter.units
                        : [{ title: `Unit 1`, description: "", topics: [] }];

                    sourceUnits.forEach((unit, unitIndex) => {
                        const topicIds: string[] = [];
                        (unit.topics ?? []).forEach((topic, topicIndex) => {
                            const topicId = `learning-ai-${Date.now()}-${moduleIndex}-${chapterIndex}-${unitIndex}-${topicIndex}-${Math.random()
                                .toString(36)
                                .slice(2, 7)}`;
                            topicIds.push(topicId);
                            learnings.push({
                                id: topicId,
                                title: topic.title || `Topic ${topicIndex + 1}`,
                                description: topic.description ?? "",
                                contents: importedTopicContent(topic),
                                assessments: [],
                            });
                        });

                        academicUnits.push({
                            id: `unit-ai-${Date.now()}-${moduleIndex}-${chapterIndex}-${unitIndex}`,
                            title: unit.title || `Unit ${unitIndex + 1}`,
                            description: unit.description ?? "",
                            topicIds,
                        });
                    });

                    chapters.push({
                        id: `chapter-ai-${Date.now()}-${moduleIndex}-${chapterIndex}`,
                        title: chapter.title || `Chapter ${chapterIndex + 1}`,
                        description: chapter.description ?? "",
                        units: academicUnits,
                    });
                });
            } else {
                const sourceTopics: ImportedTopic[] = [
                    ...(importedModule.topics ?? []),
                    ...(importedModule.units ?? []).flatMap((unit) => unit.topics ?? []),
                    ...(importedModule.chapters ?? []).flatMap((chapter) =>
                        (chapter.units ?? []).flatMap((unit) => unit.topics ?? []),
                    ),
                ];

                sourceTopics.forEach((topic, topicIndex) => {
                    learnings.push({
                        id: `learning-ai-${Date.now()}-${moduleIndex}-${topicIndex}-${Math.random()
                            .toString(36)
                            .slice(2, 7)}`,
                        title: topic.title || `Learning ${topicIndex + 1}`,
                        description: topic.description ?? "",
                        contents: importedTopicContent(topic),
                        assessments: [],
                    });
                });
            }

            nextModules.push({
                id: moduleId,
                title: importedModule.title || `Module ${moduleIndex + 1}`,
                description: importedModule.description ?? "",
                learnings,
            });

            if (isAcademicTenant) {
                nextAcademicHierarchy.push({ moduleId, chapters });
            }
        });

        if (nextModules.length === 0) {
            window.alert("AI analysis did not return a usable learning structure.");
            return;
        }

        setModules(nextModules);
        if (isAcademicTenant) {
            setAcademicHierarchy(nextAcademicHierarchy);
            setExpandedAcademicChapters(
                new Set(nextAcademicHierarchy.flatMap((m) => m.chapters.map((c) => c.id))),
            );
            setExpandedAcademicUnits(
                new Set(
                    nextAcademicHierarchy.flatMap((m) =>
                        m.chapters.flatMap((c) => c.units.map((u) => u.id)),
                    ),
                ),
            );
        }
        setExpandedModules(new Set(nextModules.map((module) => module.id)));
        setSelectedLearningId(nextModules[0]?.learnings[0]?.id ?? null);

        const draft = getCourseDraft(courseId);
        if (draft) {
            saveCourseDraft({
                ...draft,
                structure: nextModules,
                ...(isAcademicTenant
                    ? { academicStructure: nextAcademicHierarchy }
                    : {}),
                updatedAt: new Date().toISOString(),
            });
        }

        setImportStatus("Applied");
    }

    function openContentSelector() {
        if (!selectedLearning) {
            return;
        }

        setSelectedContentType(null);
        setContentTitle("");
        setContentDescription("");
        setContentUrl("");
        setContentDuration("");
        setContentRequired(true);
        setSelectedFile(null);
        setShowContentSelector(true);
    }

    function selectContentType(
        option: ContentOption,
    ) {
        setSelectedContentType(option);
        setShowContentSelector(false);
    }

    function closeContentForm() {
        setSelectedContentType(null);
        setSelectedFile(null);
        setContentTitle("");
        setContentDescription("");
        setContentUrl("");
        setContentDuration("");
        setContentRequired(true);
    }

    async function handleAddContent() {
        if (isAddingContent) {
            return;
        }

        if (
            !selectedLearning ||
            !selectedContentType ||
            !contentTitle.trim()
        ) {
            return;
        }

        const isFileContent =
            selectedContentType.storage === "FILE";

        const isScormContent =
            selectedContentType.type ===
                "SCORM_1_2" ||
            selectedContentType.type ===
                "SCORM_2004";

        if (isFileContent && !selectedFile) {
            window.alert(
                "Please select a file before adding the content.",
            );
            return;
        }

        const normalizedUrl =
            contentUrl.trim();

        if (!isFileContent) {
            if (!normalizedUrl) {
                window.alert(
                    "Please enter the resource URL before adding the content.",
                );
                return;
            }

            if (
                !isValidLearningResourceUrl(
                    normalizedUrl,
                )
            ) {
                window.alert(
                    "Please enter a valid HTTP or HTTPS resource URL.",
                );
                return;
            }
        }

        const normalizedDuration =
            contentDuration.trim();

        if (normalizedDuration) {
            const durationValue =
                Number(normalizedDuration);

            if (
                !Number.isFinite(durationValue) ||
                durationValue < 0
            ) {
                window.alert(
                    "Duration must be a valid number greater than or equal to 0.",
                );
                return;
            }
        }

        if (selectedFile) {
            if (selectedFile.size <= 0) {
                window.alert(
                    "The selected file is empty.",
                );
                return;
            }

            const fileName =
                selectedFile.name.toLowerCase();

            const type =
                selectedContentType.type;

            if (
                type === "DOC_DOCX" &&
                !/\.(doc|docx)$/i.test(fileName)
            ) {
                window.alert(
                    "Please select a DOC or DOCX file.",
                );
                return;
            }

            if (
                type === "PPT_PPTX" &&
                !/\.(ppt|pptx|pptm)$/i.test(
                    fileName,
                )
            ) {
                window.alert(
                    "Please select a PPT, PPTX, or PPTM file.",
                );
                return;
            }

            if (
                (
                    type === "DIGITAL_MANUAL" ||
                    type ===
                        "DIGITAL_DOCUMENTATION"
                ) &&
                !/\.(pdf|doc|docx|html|htm)$/i.test(
                    fileName,
                )
            ) {
                window.alert(
                    "Please select a supported PDF, DOC, DOCX, or HTML file.",
                );
                return;
            }

            if (
                type === "MP4_VIDEO" &&
                !/\.(mp4|webm|mov)$/i.test(
                    fileName,
                )
            ) {
                window.alert(
                    "Please select an MP4, WEBM, or MOV video file.",
                );
                return;
            }

            if (
                (
                    type === "INTERACTIVE_VIDEO" ||
                    type ===
                        "SHORT_FORM_VIDEO"
                ) &&
                !/\.(mp4|webm|mov)$/i.test(
                    fileName,
                )
            ) {
                window.alert(
                    "Please select a supported MP4, WEBM, or MOV video file.",
                );
                return;
            }

            if (
                isScormContent &&
                !isScormZipFile(selectedFile)
            ) {
                window.alert(
                    "Please select a valid SCORM ZIP package (.zip).",
                );
                return;
            }
        }

        const contentId =
            `content-${Date.now()}-${Math.random()
                .toString(36)
                .slice(2, 8)}`;

        let resourceKey:
            | string
            | undefined;

        let resourceKind:
            | "BLOB"
            | "SCORM_PACKAGE"
            | undefined;

        let scormPackageId:
            | string
            | undefined;

        let scormLaunchFile:
            | string
            | undefined;

        let scormLaunchUrl:
            | string
            | undefined;

        let scormVersion:
            | "SCORM_1_2"
            | "SCORM_2004"
            | undefined;

        setIsAddingContent(true);

        try {
            if (
                isFileContent &&
                selectedFile
            ) {
                if (isScormContent) {
                    /*
                     * SCORM is validated and extracted at content-add time.
                     * The course draft stores only launch metadata; the ZIP
                     * itself is never used by Learner View.
                     */
                    const extracted =
                        await extractScormPackage(
                            selectedFile,
                            contentId,
                            selectedContentType.type,
                        );

                    if (
                        !extracted.packageId ||
                        !extracted.launchFile ||
                        extracted.fileCount <= 0
                    ) {
                        throw new Error(
                            "The SCORM ZIP was read, but no usable SCORM package files were extracted.",
                        );
                    }

                    scormPackageId =
                        extracted.packageId;

                    scormLaunchFile =
                        extracted.launchFile;

                    scormVersion =
                        extracted.version;

                    scormLaunchUrl =
                        buildScormLaunchUrl(
                            scormPackageId,
                            scormLaunchFile,
                        );

                    /*
                     * Stable reference to the stored launch file.
                     *
                     * This must match the IndexedDB key written by
                     * putScormRuntimeFile().
                     */
                    resourceKey =
                        `scorm:${scormPackageId}:${normalizePackagePath(
                            scormLaunchFile,
                        )}`;

                    resourceKind =
                        "SCORM_PACKAGE";
                } else {
                    /*
                     * Normal file content is stored immediately in IndexedDB.
                     * The course structure stores only the stable resourceKey.
                     */
                    resourceKey =
                        await storeUploadedFile(
                            selectedFile,
                            contentId,
                        );

                    resourceKind =
                        "BLOB";
                }
            }

            const durationValue =
                normalizedDuration
                    ? Number(
                          normalizedDuration,
                      )
                    : undefined;

            const content: LearningContent = {
                id: contentId,
                title:
                    contentTitle.trim(),
                description:
                    contentDescription.trim(),
                category:
                    getCategoryForType(
                        selectedContentType.type,
                    ),
                type:
                    selectedContentType.type,
                storage:
                    selectedContentType.storage,
                fileName:
                    selectedFile?.name,
                fileSize:
                    selectedFile?.size,
                fileType:
                    selectedFile?.type ||
                    undefined,
                url:
                    normalizedUrl ||
                    undefined,

                resourceKey,
                resourceKind,

                previewMode:
                    getLearnerPreviewMode(
                        selectedContentType.type,
                        selectedFile?.name,
                    ),

                scormPackageId,
                scormLaunchFile,
                scormLaunchUrl,
                scormVersion,

                duration:
                    durationValue,
                required:
                    contentRequired,
                status:
                    "READY",
            };

            setModules(
                (previous) =>
                    previous.map(
                        (module) => ({
                            ...module,
                            learnings:
                                module.learnings.map(
                                    (learning) =>
                                        learning.id ===
                                        selectedLearning.id
                                            ? {
                                                  ...learning,
                                                  contents: [
                                                      ...learning.contents,
                                                      content,
                                                  ],
                                              }
                                            : learning,
                                ),
                        }),
                    ),
            );

            closeContentForm();
        } catch (error) {
            console.error(
                "Unable to import learning content:",
                error,
            );

            /*
             * Roll back browser storage if adding content fails.
             * This prevents partially extracted SCORM packages or orphaned
             * normal files from remaining after a failed add operation.
             */
            try {
                if (scormPackageId) {
                    await deleteScormPackage(
                        scormPackageId,
                    );
                } else if (
                    resourceKind === "BLOB" &&
                    resourceKey
                ) {
                    await deleteStoredResource(
                        resourceKey,
                    );
                }
            } catch (cleanupError) {
                console.error(
                    "Unable to clean up failed learning content import:",
                    cleanupError,
                );
            }

            window.alert(
                error instanceof Error
                    ? error.message
                    : "Unable to import the selected content.",
            );
        } finally {
            setIsAddingContent(false);
        }
    }

    async function handleDeleteContent(
        contentId: string,
    ) {
        let contentToDelete: LearningContent | undefined;

        for (const module of modules) {
            for (const learning of module.learnings) {
                const found = learning.contents.find(
                    (content) => content.id === contentId,
                );

                if (found) {
                    contentToDelete = found;
                    break;
                }
            }

            if (contentToDelete) {
                break;
            }
        }

        if (!contentToDelete) {
            return;
        }

        try {
            if (
                contentToDelete.resourceKind ===
                    "SCORM_PACKAGE" &&
                contentToDelete.scormPackageId
            ) {
                await deleteScormPackage(
                    contentToDelete.scormPackageId,
                );
            } else if (contentToDelete.resourceKey) {
                await deleteStoredResource(
                    contentToDelete.resourceKey,
                );
            }
        } catch (error) {
            console.error(
                "Unable to remove stored learning content:",
                error,
            );

            window.alert(
                "The content could not be removed from storage. Please try again.",
            );
            return;
        }

        setModules((previous) =>
            previous.map((module) => ({
                ...module,
                learnings:
                    module.learnings.map((learning) => ({
                        ...learning,
                        contents: learning.contents.filter(
                            (content) => content.id !== contentId,
                        ),
                    })),
            })),
        );
    }

    function handleAddAssessment() {
        if (
            !selectedLearning ||
            !assessmentTitle.trim() ||
            !assessmentId.trim()
        ) {
            return;
        }

        const assessment: AssessmentLink = {
            id: `assessment-link-${Date.now()}`,
            title: assessmentTitle.trim(),
            assessmentId:
                assessmentId.trim(),
            status: "LINKED",
        };

        setModules((previous) =>
            previous.map((module) => ({
                ...module,
                learnings:
                    module.learnings.map(
                        (learning) =>
                            learning.id ===
                            selectedLearning.id
                                ? {
                                      ...learning,
                                      assessments: [
                                          ...learning.assessments,
                                          assessment,
                                      ],
                                  }
                                : learning,
                    ),
            })),
        );

        setAssessmentTitle("");
        setAssessmentId("");
        setShowAssessmentModal(false);
    }

    function handleDeleteAssessment(
        assessmentIdToDelete: string,
    ) {
        setModules((previous) =>
            previous.map((module) => ({
                ...module,
                learnings:
                    module.learnings.map(
                        (learning) => ({
                            ...learning,
                            assessments:
                                learning.assessments.filter(
                                    (assessment) =>
                                        assessment.id !==
                                        assessmentIdToDelete,
                                ),
                        }),
                    ),
            })),
        );
    }

    return (
        <div className={styles.container}>
            {/* =================================================
                HEADER
            ================================================= */}

            <header className={styles.header}>
                <div className={styles.headerText}>
                    <span className={styles.eyebrow}>
                        STEP 3
                    </span>

                    <h1>
                        Learning Structure
                    </h1>

                    <p>
                        {isAcademicTenant
                            ? "Build the academic syllabus hierarchy as Module → Chapter → Unit → Topic and manage content and assessment links at the Topic level."
                            : "Build your course structure and manage content and assessment links at the learning level."}
                    </p>
                </div>
            </header>

            {/* =================================================
                AI ANALYSE & IMPORT — requested capability 2
            ================================================= */}
            <section className={styles.detailCard}>
                <div className={styles.cardHeader}>
                    <div>
                        <h3>AI Analyse & Import Syllabus</h3>
                        <span>
                            Upload an existing syllabus. AI analyses the TOC and related
                            content, then imports it into this editable Learning Structure.
                        </span>
                    </div>
                    <span className={styles.readyBadge}>{importStatus}</span>
                </div>

                <div className={styles.formGroup}>
                    <input
                        type="file"
                        accept=".pdf,.doc,.docx,.xlsx,.xls,.csv"
                        onChange={(event) =>
                            handleImportFileChange(event.target.files?.[0] ?? null)
                        }
                    />
                </div>

                {importFile && (
                    <small>
                        {importFile.name} • {formatFileSize(importFile.size)}
                    </small>
                )}

                {importProgressMessage && <p>{importProgressMessage}</p>}

                <div className={styles.contentActions}>
                    <button
                        type="button"
                        className={styles.secondaryButton}
                        disabled={
                            !importFile ||
                            importStatus === "Uploading" ||
                            importStatus === "Analysing"
                        }
                        onClick={() => void handleAnalyseImport()}
                    >
                        Analyse Document with AI
                    </button>

                    {importResult && importStatus === "NeedsReview" && (
                        <button
                            type="button"
                            className={styles.primaryButton}
                            onClick={handleApplyImportedSyllabus}
                        >
                            Apply to Learning Structure
                        </button>
                    )}
                </div>

                {importResult && importStatus === "NeedsReview" && (
                    <div className={styles.emptySection}>
                        <strong>
                            {importResult.modules.length} module(s) detected
                        </strong>
                        <p>
                            Review before applying. Related topic/learning content will be
                            imported together with the detected TOC.
                        </p>
                        {(importResult.warnings ?? []).map((warning, index) => (
                            <p key={`${warning}-${index}`}>Warning: {warning}</p>
                        ))}
                        {(importResult.unclassifiedContent ?? []).map((item, index) => (
                            <p key={`${item.text}-${index}`}>
                                Unclassified: {item.text}
                            </p>
                        ))}
                    </div>
                )}
            </section>

            {/* =================================================
                SUMMARY
            ================================================= */}

            <div className={styles.summaryBar}>
                <div className={styles.summaryItem}>
                    <span>MODULES</span>
                    <strong>
                        {modules.length}
                    </strong>
                </div>

                <div className={styles.summaryItem}>
                    <span>
                        {isAcademicTenant
                            ? "TOPICS"
                            : "LEARNINGS"}
                    </span>
                    <strong>
                        {totalLearnings}
                    </strong>
                </div>

                <div className={styles.summaryItem}>
                    <span>CONTENT</span>
                    <strong>
                        {totalContent}
                    </strong>
                </div>

                <div className={styles.summaryItem}>
                    <span>ASSESSMENTS</span>
                    <strong>
                        {totalAssessments}
                    </strong>
                </div>
            </div>

            {/* =================================================
                MAIN WORKSPACE
            ================================================= */}

            <div className={styles.workspace}>
                {/* LEFT TREE */}

                <aside className={styles.treePanel}>
                    <div className={styles.treeHeader}>
                        <div>
                            <span>
                                COURSE STRUCTURE
                            </span>

                            <small>
                                {modules.length}{" "}
                                {modules.length ===
                                1
                                    ? "module"
                                    : "modules"}
                            </small>
                        </div>

                        <button
                            type="button"
                            className={
                                styles.primarySmallButton
                            }
                            onClick={
                                handleAddModule
                            }
                        >
                            + Add Module
                        </button>
                    </div>

                    <div className={styles.tree}>
                        {isAcademicTenant ? (
                            modules.length === 0 ? (
                                <div
                                    className={
                                        styles.emptyTree
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
                                        No academic modules yet
                                    </strong>

                                    <p>
                                        Add the first Module,
                                        then build Chapter → Unit → Topic.
                                    </p>

                                    <button
                                        type="button"
                                        onClick={
                                            handleAddModule
                                        }
                                        className={
                                            styles.primaryButton
                                        }
                                    >
                                        Add First Module
                                    </button>
                                </div>
                            ) : (
                                modules.map(
                                    (
                                        module,
                                        moduleIndex,
                                    ) => {
                                        const isExpanded =
                                            expandedModules.has(
                                                module.id,
                                            );

                                        const academicModule =
                                            academicHierarchy.find(
                                                (item) =>
                                                    item.moduleId ===
                                                    module.id,
                                            );

                                        const chapters =
                                            academicModule?.chapters ??
                                            [];

                                        return (
                                            <div
                                                key={
                                                    module.id
                                                }
                                                className={
                                                    styles.moduleTreeItem
                                                }
                                            >
                                                <div
                                                    className={
                                                        styles.moduleRow
                                                    }
                                                >
                                                    <button
                                                        type="button"
                                                        className={
                                                            styles.expandButton
                                                        }
                                                        onClick={() =>
                                                            toggleModule(
                                                                module.id,
                                                            )
                                                        }
                                                    >
                                                        {isExpanded
                                                            ? "⌄"
                                                            : "›"}
                                                    </button>

                                                    <div
                                                        className={
                                                            styles.moduleNumber
                                                        }
                                                    >
                                                        {moduleIndex + 1}
                                                    </div>

                                                    <span
                                                        className={
                                                            styles.moduleTitle
                                                        }
                                                    >
                                                        {module.title}
                                                    </span>

                                                    <span
                                                        className={
                                                            styles.moduleCount
                                                        }
                                                    >
                                                        {chapters.length}
                                                    </span>
                                                </div>

                                                {isExpanded && (
                                                    <div
                                                        className={
                                                            styles.learningTree
                                                        }
                                                    >
                                                        {chapters.map(
                                                            (
                                                                chapter,
                                                                chapterIndex,
                                                            ) => {
                                                                const chapterExpanded =
                                                                    expandedAcademicChapters.has(
                                                                        chapter.id,
                                                                    );

                                                                return (
                                                                    <div
                                                                        key={
                                                                            chapter.id
                                                                        }
                                                                        style={{
                                                                            marginBottom:
                                                                                6,
                                                                        }}
                                                                    >
                                                                        <div
                                                                            style={{
                                                                                display:
                                                                                    "flex",
                                                                                alignItems:
                                                                                    "center",
                                                                                gap: 6,
                                                                                padding:
                                                                                    "6px 4px 6px 14px",
                                                                            }}
                                                                        >
                                                                            <button
                                                                                type="button"
                                                                                className={
                                                                                    styles.expandButton
                                                                                }
                                                                                onClick={() =>
                                                                                    toggleAcademicChapter(
                                                                                        chapter.id,
                                                                                    )
                                                                                }
                                                                            >
                                                                                {chapterExpanded
                                                                                    ? "⌄"
                                                                                    : "›"}
                                                                            </button>

                                                                            <span
                                                                                style={{
                                                                                    fontSize:
                                                                                        11,
                                                                                    fontWeight:
                                                                                        700,
                                                                                    color:
                                                                                        "#174f84",
                                                                                    minWidth:
                                                                                        42,
                                                                                }}
                                                                            >
                                                                                {moduleIndex +
                                                                                    1}
                                                                                .
                                                                                {chapterIndex +
                                                                                    1}
                                                                            </span>

                                                                            <span
                                                                                className={
                                                                                    styles.learningTitle
                                                                                }
                                                                            >
                                                                                {chapter.title}
                                                                            </span>
                                                                        </div>

                                                                        {chapterExpanded && (
                                                                            <div
                                                                                style={{
                                                                                    paddingLeft:
                                                                                        16,
                                                                                }}
                                                                            >
                                                                                {chapter.units.map(
                                                                                    (
                                                                                        unit,
                                                                                        unitIndex,
                                                                                    ) => {
                                                                                        const unitExpanded =
                                                                                            expandedAcademicUnits.has(
                                                                                                unit.id,
                                                                                            );

                                                                                        return (
                                                                                            <div
                                                                                                key={
                                                                                                    unit.id
                                                                                                }
                                                                                                style={{
                                                                                                    marginBottom:
                                                                                                        5,
                                                                                                }}
                                                                                            >
                                                                                                <div
                                                                                                    style={{
                                                                                                        display:
                                                                                                            "flex",
                                                                                                        alignItems:
                                                                                                            "center",
                                                                                                        gap: 6,
                                                                                                        padding:
                                                                                                            "5px 4px 5px 14px",
                                                                                                    }}
                                                                                                >
                                                                                                    <button
                                                                                                        type="button"
                                                                                                        className={
                                                                                                            styles.expandButton
                                                                                                        }
                                                                                                        onClick={() =>
                                                                                                            toggleAcademicUnit(
                                                                                                                unit.id,
                                                                                                            )
                                                                                                        }
                                                                                                    >
                                                                                                        {unitExpanded
                                                                                                            ? "⌄"
                                                                                                            : "›"}
                                                                                                    </button>

                                                                                                    <span
                                                                                                        style={{
                                                                                                            fontSize:
                                                                                                                11,
                                                                                                            fontWeight:
                                                                                                                700,
                                                                                                            color:
                                                                                                                "#687386",
                                                                                                            minWidth:
                                                                                                                56,
                                                                                                        }}
                                                                                                    >
                                                                                                        {moduleIndex +
                                                                                                            1}
                                                                                                        .
                                                                                                        {chapterIndex +
                                                                                                            1}
                                                                                                        .
                                                                                                        {unitIndex +
                                                                                                            1}
                                                                                                    </span>

                                                                                                    <span
                                                                                                        className={
                                                                                                            styles.learningTitle
                                                                                                        }
                                                                                                    >
                                                                                                        {unit.title}
                                                                                                    </span>
                                                                                                </div>

                                                                                                {unitExpanded && (
                                                                                                    <div
                                                                                                        style={{
                                                                                                            paddingLeft:
                                                                                                                18,
                                                                                                        }}
                                                                                                    >
                                                                                                        {unit.topicIds.map(
                                                                                                            (
                                                                                                                topicId,
                                                                                                                topicIndex,
                                                                                                            ) => {
                                                                                                                const topic =
                                                                                                                    module.learnings.find(
                                                                                                                        (
                                                                                                                            learning,
                                                                                                                        ) =>
                                                                                                                            learning.id ===
                                                                                                                            topicId,
                                                                                                                    );

                                                                                                                if (!topic) {
                                                                                                                    return null;
                                                                                                                }

                                                                                                                const isSelected =
                                                                                                                    selectedLearningId ===
                                                                                                                    topic.id;

                                                                                                                return (
                                                                                                                    <button
                                                                                                                        key={
                                                                                                                            topic.id
                                                                                                                        }
                                                                                                                        type="button"
                                                                                                                        className={`${styles.learningRow} ${
                                                                                                                            isSelected
                                                                                                                                ? styles.learningSelected
                                                                                                                                : ""
                                                                                                                        }`}
                                                                                                                        onClick={() =>
                                                                                                                            setSelectedLearningId(
                                                                                                                                topic.id,
                                                                                                                            )
                                                                                                                        }
                                                                                                                    >
                                                                                                                        <span
                                                                                                                            className={
                                                                                                                                styles.treeLine
                                                                                                                            }
                                                                                                                        >
                                                                                                                            └
                                                                                                                        </span>

                                                                                                                        <span
                                                                                                                            className={
                                                                                                                                styles.learningNumber
                                                                                                                            }
                                                                                                                        >
                                                                                                                            {moduleIndex +
                                                                                                                                1}
                                                                                                                            .
                                                                                                                            {chapterIndex +
                                                                                                                                1}
                                                                                                                            .
                                                                                                                            {unitIndex +
                                                                                                                                1}
                                                                                                                            .
                                                                                                                            {topicIndex +
                                                                                                                                1}
                                                                                                                        </span>

                                                                                                                        <span
                                                                                                                            className={
                                                                                                                                styles.learningTitle
                                                                                                                            }
                                                                                                                        >
                                                                                                                            {topic.title}
                                                                                                                        </span>

                                                                                                                        <span
                                                                                                                            className={
                                                                                                                                styles.learningCount
                                                                                                                            }
                                                                                                                        >
                                                                                                                            {topic.contents.length}
                                                                                                                            /
                                                                                                                            {topic.assessments.length}
                                                                                                                        </span>
                                                                                                                    </button>
                                                                                                                );
                                                                                                            },
                                                                                                        )}

                                                                                                        <button
                                                                                                            type="button"
                                                                                                            className={
                                                                                                                styles.addLearningButton
                                                                                                            }
                                                                                                            onClick={() =>
                                                                                                                handleAddAcademicTopic(
                                                                                                                    module.id,
                                                                                                                    chapter.id,
                                                                                                                    unit.id,
                                                                                                                )
                                                                                                            }
                                                                                                        >
                                                                                                            + Add Topic
                                                                                                        </button>
                                                                                                    </div>
                                                                                                )}
                                                                                            </div>
                                                                                        );
                                                                                    },
                                                                                )}

                                                                                <button
                                                                                    type="button"
                                                                                    className={
                                                                                        styles.addLearningButton
                                                                                    }
                                                                                    onClick={() =>
                                                                                        handleAddAcademicUnit(
                                                                                            module.id,
                                                                                            chapter.id,
                                                                                        )
                                                                                    }
                                                                                >
                                                                                    + Add Unit
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            },
                                                        )}

                                                        <button
                                                            type="button"
                                                            className={
                                                                styles.addLearningButton
                                                            }
                                                            onClick={() =>
                                                                handleAddAcademicChapter(
                                                                    module.id,
                                                                )
                                                            }
                                                        >
                                                            + Add Chapter
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    },
                                )
                            )
                        ) : (
                            <>
                        {modules.length === 0 ? (
                            <div
                                className={
                                    styles.emptyTree
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
                                    {isAcademicTenant
                                        ? "No academic modules yet"
                                        : "No modules yet"}
                                </strong>

                                <p>
                                    {isAcademicTenant
                                        ? "Start the academic structure by adding the first module. Then add Chapter → Unit → Topic."
                                        : "Start building the course by adding your first module."}
                                </p>

                                <button
                                    type="button"
                                    onClick={
                                        handleAddModule
                                    }
                                    className={
                                        styles.primaryButton
                                    }
                                >
                                    Add First Module
                                </button>
                            </div>
                        ) : (
                            modules.map(
                                (
                                    module,
                                    moduleIndex,
                                ) => {
                                    const isExpanded =
                                        expandedModules.has(
                                            module.id,
                                        );

                                    return (
                                        <div
                                            key={
                                                module.id
                                            }
                                            className={
                                                styles.moduleTreeItem
                                            }
                                        >
                                            <div
                                                className={
                                                    styles.moduleRow
                                                }
                                            >
                                                <button
                                                    type="button"
                                                    className={
                                                        styles.expandButton
                                                    }
                                                    onClick={() =>
                                                        toggleModule(
                                                            module.id,
                                                        )
                                                    }
                                                >
                                                    {isExpanded
                                                        ? "⌄"
                                                        : "›"}
                                                </button>

                                                <div
                                                    className={
                                                        styles.moduleNumber
                                                    }
                                                >
                                                    {moduleIndex +
                                                        1}
                                                </div>

                                                <span
                                                    className={
                                                        styles.moduleTitle
                                                    }
                                                >
                                                    {
                                                        module.title
                                                    }
                                                </span>

                                                <span
                                                    className={
                                                        styles.moduleCount
                                                    }
                                                >
                                                    {
                                                        module
                                                            .learnings
                                                            .length
                                                    }
                                                </span>
                                            </div>

                                            {isExpanded && (
                                                <div
                                                    className={
                                                        styles.learningTree
                                                    }
                                                >
                                                    {module.learnings.map(
                                                        (
                                                            learning,
                                                            learningIndex,
                                                        ) => {
                                                            const isSelected =
                                                                selectedLearningId ===
                                                                learning.id;

                                                            return (
                                                                <button
                                                                    key={
                                                                        learning.id
                                                                    }
                                                                    type="button"
                                                                    className={`${styles.learningRow} ${
                                                                        isSelected
                                                                            ? styles.learningSelected
                                                                            : ""
                                                                    }`}
                                                                    onClick={() =>
                                                                        setSelectedLearningId(
                                                                            learning.id,
                                                                        )
                                                                    }
                                                                >
                                                                    <span
                                                                        className={
                                                                            styles.treeLine
                                                                        }
                                                                    >
                                                                        └
                                                                    </span>

                                                                    <span
                                                                        className={
                                                                            styles.learningNumber
                                                                        }
                                                                    >
                                                                        {moduleIndex +
                                                                            1}
                                                                        .
                                                                        {learningIndex +
                                                                            1}
                                                                    </span>

                                                                    <span
                                                                        className={
                                                                            styles.learningTitle
                                                                        }
                                                                    >
                                                                        {
                                                                            learning.title
                                                                        }
                                                                    </span>

                                                                    <span
                                                                        className={
                                                                            styles.learningCount
                                                                        }
                                                                    >
                                                                        {
                                                                            learning
                                                                                .contents
                                                                                .length
                                                                        }
                                                                        /
                                                                        {
                                                                            learning
                                                                                .assessments
                                                                                .length
                                                                        }
                                                                    </span>
                                                                </button>
                                                            );
                                                        },
                                                    )}

                                                    <button
                                                        type="button"
                                                        className={
                                                            styles.addLearningButton
                                                        }
                                                        onClick={() =>
                                                            handleAddLearning(
                                                                module.id,
                                                            )
                                                        }
                                                    >
                                                        + Add Learning
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                },
                            )
                        )}
                            </>
                        )}
                    </div>
                </aside>

                {/* RIGHT DETAILS */}

                <main
                    className={
                        styles.detailPanel
                    }
                >
                    {!selectedLearning ? (
                        <div
                            className={
                                styles.noSelection
                            }
                        >
                            <div
                                className={
                                    styles.noSelectionIcon
                                }
                            >
                                ◫
                            </div>

                            <h2>
                                {isAcademicTenant
                                    ? "Select a topic"
                                    : "Select a learning unit"}
                            </h2>

                            <p>
                                {isAcademicTenant
                                    ? "Select a Topic from the academic hierarchy to add content and link an assessment."
                                    : "Select a learning unit from the structure tree to add content and link an assessment."}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div
                                className={
                                    styles.detailHeader
                                }
                            >
                                <div>
                                    <span
                                        className={
                                            styles.detailEyebrow
                                        }
                                    >
                                        {isAcademicTenant
                                            ? "ACADEMIC TOPIC"
                                            : "LEARNING UNIT"}
                                    </span>

                                    <h2>
                                        {
                                            selectedLearning.title
                                        }
                                    </h2>

                                    <p>
                                        {isAcademicTenant
                                            ? "Manage learning resources and assessment links for this Topic."
                                            : "Manage learning resources and assessment links for this unit."}
                                    </p>
                                </div>

                                <div
                                    className={
                                        styles.learningStats
                                    }
                                >
                                    <div>
                                        <strong>
                                            {
                                                selectedLearning
                                                    .contents
                                                    .length
                                            }
                                        </strong>
                                        <span>
                                            Content
                                        </span>
                                    </div>

                                    <div>
                                        <strong>
                                            {
                                                selectedLearning
                                                    .assessments
                                                    .length
                                            }
                                        </strong>
                                        <span>
                                            Assessment
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* CONTENT */}

                            <section
                                className={
                                    styles.detailCard
                                }
                            >
                                <div
                                    className={
                                        styles.cardHeader
                                    }
                                >
                                    <div>
                                        <h3>
                                            Content
                                        </h3>

                                        <span>
                                            Add documents,
                                            presentations,
                                            video, standards,
                                            web, interactive,
                                            and knowledge
                                            resources.
                                        </span>
                                    </div>

                                    <div className={styles.contentActions}>
                                        <button
                                            type="button"
                                            className={styles.secondaryButton}
                                            onClick={handleCreateContentInTextEditor}
                                            disabled={isPreparingEditor}
                                        >
                                            Create Content
                                        </button>

                                        <label className={styles.secondaryButton}>
                                            Upload & Edit Content
                                            <input
                                                type="file"
                                                accept=".doc,.docx,.txt,.pdf,.html,.htm,.md,.markdown,.odt"
                                                style={{ display: "none" }}
                                                disabled={isPreparingEditor}
                                                onChange={(event) => {
                                                    const file = event.target.files?.[0] ?? null;
                                                    event.target.value = "";
                                                    void handleUploadAndEditContent(file);
                                                }}
                                            />
                                        </label>

                                        <button
                                            type="button"
                                            className={styles.secondaryButton}
                                            onClick={openContentSelector}
                                        >
                                            Add Resource
                                        </button>
                                    </div>
                                </div>

                                {selectedLearning
                                    .contents
                                    .length ===
                                0 ? (
                                    <div
                                        className={
                                            styles.emptySection
                                        }
                                    >
                                        <div
                                            className={
                                                styles.emptySectionIcon
                                            }
                                        >
                                            +
                                        </div>

                                        <strong>
                                            No content added
                                        </strong>

                                        <p>
                                            Add the
                                            resources
                                            learners will
                                            use in this
                                            learning unit.
                                        </p>

                                        <button
                                            type="button"
                                            className={
                                                styles.outlineButton
                                            }
                                            onClick={
                                                handleCreateContentInTextEditor
                                            }
                                        >
                                            Create First
                                            Content
                                        </button>
                                    </div>
                                ) : (
                                    <div
                                        className={
                                            styles.contentList
                                        }
                                    >
                                        {selectedLearning.contents.map(
                                            (content) => (
                                                <article
                                                    key={
                                                        content.id
                                                    }
                                                    className={
                                                        styles.contentCard
                                                    }
                                                >
                                                    <div
                                                        className={
                                                            styles.contentIcon
                                                        }
                                                    >
                                                        {content.storage ===
                                                        "FILE"
                                                            ? "▣"
                                                            : content.storage ===
                                                                "URL"
                                                              ? "↗"
                                                              : "◇"}
                                                    </div>

                                                    <div
                                                        className={
                                                            styles.contentInfo
                                                        }
                                                    >
                                                        <div
                                                            className={
                                                                styles.contentTop
                                                            }
                                                        >
                                                            <h4>
                                                                {
                                                                    content.title
                                                                }
                                                            </h4>

                                                            <span
                                                                className={
                                                                    styles.readyBadge
                                                                }
                                                            >
                                                                ✓ Ready
                                                            </span>
                                                        </div>

                                                        <p>
                                                            {getContentTypeLabel(
                                                                content.type,
                                                            )}
                                                        </p>

                                                        {content.fileName && (
                                                            <small>
                                                                {
                                                                    content.fileName
                                                                }{" "}
                                                                •{" "}
                                                                {formatFileSize(
                                                                    content.fileSize ??
                                                                        0,
                                                                )}
                                                                {content.resourceKind ===
                                                                    "SCORM_PACKAGE" &&
                                                                    content.scormLaunchFile
                                                                    ? ` • Extracted • Launch: ${content.scormLaunchFile}`
                                                                    : content.resourceKind ===
                                                                          "BLOB"
                                                                      ? " • Stored"
                                                                      : ""}
                                                            </small>
                                                        )}

                                                        {content.url && (
                                                            <small>
                                                                {
                                                                    content.url
                                                                }
                                                            </small>
                                                        )}
                                                    </div>

                                                    <div
                                                        className={
                                                            styles.contentActions
                                                        }
                                                    >
                                                        {content.required && (
                                                            <span
                                                                className={
                                                                    styles.requiredBadge
                                                                }
                                                            >
                                                                Required
                                                            </span>
                                                        )}

                                                        <button
                                                            type="button"
                                                            className={
                                                                styles.deleteButton
                                                            }
                                                            onClick={() =>
                                                                handleDeleteContent(
                                                                    content.id,
                                                                )
                                                            }
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </article>
                                            ),
                                        )}
                                    </div>
                                )}
                            </section>

                            {/* ASSESSMENT */}

                            <section
                                className={
                                    styles.detailCard
                                }
                            >
                                <div
                                    className={
                                        styles.cardHeader
                                    }
                                >
                                    <div>
                                        <h3>
                                            Assessment
                                        </h3>

                                        <span>
                                            Link an assessment
                                            created in the
                                            Assessment Module.
                                        </span>
                                    </div>

                                    <button
                                        type="button"
                                        className={
                                            styles.secondaryButton
                                        }
                                        onClick={() =>
                                            setShowAssessmentModal(
                                                true,
                                            )
                                        }
                                    >
                                        + Link Assessment
                                    </button>
                                </div>

                                {selectedLearning
                                    .assessments
                                    .length ===
                                0 ? (
                                    <div
                                        className={
                                            styles.emptySection
                                        }
                                    >
                                        <div
                                            className={
                                                styles.emptySectionIcon
                                            }
                                        >
                                            ✓
                                        </div>

                                        <strong>
                                            No assessment linked
                                        </strong>

                                        <p>
                                            Assessment creation
                                            happens in the
                                            Assessment Module.
                                            This page only
                                            maintains the
                                            relationship.
                                        </p>

                                        <button
                                            type="button"
                                            className={
                                                styles.outlineButton
                                            }
                                            onClick={() =>
                                                setShowAssessmentModal(
                                                    true,
                                                )
                                            }
                                        >
                                            Link Assessment
                                        </button>
                                    </div>
                                ) : (
                                    <div
                                        className={
                                            styles.assessmentList
                                        }
                                    >
                                        {selectedLearning.assessments.map(
                                            (assessment) => (
                                                <div
                                                    key={
                                                        assessment.id
                                                    }
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

                                                    <div
                                                        className={
                                                            styles.assessmentInfo
                                                        }
                                                    >
                                                        <strong>
                                                            {
                                                                assessment.title
                                                            }
                                                        </strong>

                                                        <span>
                                                            Assessment
                                                            ID:{" "}
                                                            {
                                                                assessment.assessmentId
                                                            }
                                                        </span>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        className={
                                                            styles.deleteButton
                                                        }
                                                        onClick={() =>
                                                            handleDeleteAssessment(
                                                                assessment.id,
                                                            )
                                                        }
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                )}
                            </section>
                        </>
                    )}
                </main>
            </div>

            {/* =================================================
                CONTENT SELECTOR
            ================================================= */}

            {showContentSelector && (
                <div
                    className={
                        styles.modalOverlay
                    }
                >
                    <div
                        className={
                            styles.contentSelectorModal
                        }
                    >
                        <div
                            className={
                                styles.modalHeader
                            }
                        >
                            <div>
                                <span>
                                    ADD CONTENT
                                </span>

                                <h2>
                                    Choose a content
                                    format
                                </h2>

                                <p>
                                    Select the learning
                                    resource type to
                                    add to this learning
                                    unit.
                                </p>
                            </div>

                            <button
                                type="button"
                                className={
                                    styles.closeButton
                                }
                                onClick={() =>
                                    setShowContentSelector(
                                        false,
                                    )
                                }
                            >
                                ×
                            </button>
                        </div>

                        <div
                            className={
                                styles.categoryGrid
                            }
                        >
                            {contentCatalog.map(
                                (category) => (
                                    <section
                                        key={
                                            category.category
                                        }
                                        className={
                                            styles.categoryCard
                                        }
                                    >
                                        <div
                                            className={
                                                styles.categoryHeader
                                            }
                                        >
                                            <h3>
                                                {
                                                    category.title
                                                }
                                            </h3>

                                            <p>
                                                {
                                                    category.description
                                                }
                                            </p>
                                        </div>

                                        <div
                                            className={
                                                styles.optionGrid
                                            }
                                        >
                                            {category.options.map(
                                                (
                                                    option,
                                                ) => (
                                                    <button
                                                        key={
                                                            option.type
                                                        }
                                                        type="button"
                                                        className={
                                                            styles.contentOption
                                                        }
                                                        onClick={() =>
                                                            selectContentType(
                                                                option,
                                                            )
                                                        }
                                                    >
                                                        <strong>
                                                            {
                                                                option.label
                                                            }
                                                        </strong>

                                                        <span>
                                                            {
                                                                option.description
                                                            }
                                                        </span>

                                                        <small>
                                                            {option.storage ===
                                                            "FILE"
                                                                ? "Upload file"
                                                                : option.storage ===
                                                                    "URL"
                                                                  ? "External URL"
                                                                  : "Integration"}
                                                        </small>
                                                    </button>
                                                ),
                                            )}
                                        </div>
                                    </section>
                                ),
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* =================================================
                CONTENT FORM
            ================================================= */}

            {selectedContentType && (
                <div
                    className={
                        styles.modalOverlay
                    }
                >
                    <div
                        className={
                            styles.formModal
                        }
                    >
                        <div
                            className={
                                styles.modalHeader
                            }
                        >
                            <div>
                                <span>
                                    ADD CONTENT
                                </span>

                                <h2>
                                    {
                                        selectedContentType.label
                                    }
                                </h2>

                                <p>
                                    {
                                        selectedContentType.description
                                    }
                                </p>
                            </div>

                            <button
                                type="button"
                                className={
                                    styles.closeButton
                                }
                                onClick={
                                    closeContentForm
                                }
                            >
                                ×
                            </button>
                        </div>

                        <div
                            className={
                                styles.formGrid
                            }
                        >
                            <label
                                className={
                                    styles.formField
                                }
                            >
                                <span>
                                    Content Title *
                                </span>

                                <input
                                    type="text"
                                    value={
                                        contentTitle
                                    }
                                    onChange={(event) =>
                                        setContentTitle(
                                            event.target
                                                .value,
                                        )
                                    }
                                    placeholder="Enter content title"
                                />
                            </label>

                            <label
                                className={
                                    styles.formField
                                }
                            >
                                <span>
                                    Description
                                </span>

                                <textarea
                                    value={
                                        contentDescription
                                    }
                                    onChange={(event) =>
                                        setContentDescription(
                                            event.target
                                                .value,
                                        )
                                    }
                                    placeholder="Describe this learning resource"
                                    rows={4}
                                />
                            </label>

                            {selectedContentType.storage ===
                                "FILE" && (
                                <label
                                    className={
                                        styles.fileField
                                    }
                                >
                                    <span>
                                        Select File *
                                    </span>

                                    <input
                                        type="file"
                                        accept={
                                            selectedContentType.type ===
                                                "SCORM_1_2" ||
                                            selectedContentType.type ===
                                                "SCORM_2004"
                                                ? ".zip,application/zip,application/x-zip-compressed"
                                                : selectedContentType.accept
                                        }
                                        onChange={(
                                            event,
                                        ) => {
                                            const file =
                                                event.target
                                                    .files?.[0] ??
                                                null;

                                            setSelectedFile(
                                                file,
                                            );
                                        }}
                                    />

                                    {selectedFile && (
                                        <div
                                            className={
                                                styles.selectedFile
                                            }
                                        >
                                            <strong>
                                                ✓{" "}
                                                {
                                                    selectedFile.name
                                                }
                                            </strong>

                                            <span>
                                                {formatFileSize(
                                                    selectedFile.size,
                                                )}
                                                {(
                                                    selectedContentType.type ===
                                                        "SCORM_1_2" ||
                                                    selectedContentType.type ===
                                                        "SCORM_2004"
                                                )
                                                    ? " • Package will be extracted immediately"
                                                    : " • File will be stored immediately"}
                                            </span>
                                        </div>
                                    )}
                                </label>
                            )}

                            {selectedContentType.storage !==
                                "FILE" && (
                                <label
                                    className={
                                        styles.formField
                                    }
                                >
                                    <span>
                                        Resource URL *
                                    </span>

                                    <input
                                        type="url"
                                        value={
                                            contentUrl
                                        }
                                        onChange={(event) =>
                                            setContentUrl(
                                                event.target
                                                    .value,
                                            )
                                        }
                                        placeholder="https://..."
                                    />
                                </label>
                            )}

                            {selectedContentType.storage ===
                                "FILE" &&
                                selectedContentType.type.includes(
                                    "VIDEO",
                                ) && (
                                    <label
                                        className={
                                            styles.formField
                                        }
                                    >
                                        <span>
                                            Duration
                                            (minutes)
                                        </span>

                                        <input
                                            type="number"
                                            min="0"
                                            value={
                                                contentDuration
                                            }
                                            onChange={(event) =>
                                                setContentDuration(
                                                    event.target
                                                        .value,
                                                )
                                            }
                                            placeholder="e.g. 24"
                                        />
                                    </label>
                                )}

                            <label
                                className={
                                    styles.checkboxField
                                }
                            >
                                <input
                                    type="checkbox"
                                    checked={
                                        contentRequired
                                    }
                                    onChange={(event) =>
                                        setContentRequired(
                                            event.target
                                                .checked,
                                        )
                                    }
                                />

                                <span>
                                    Required learning
                                    resource
                                </span>
                            </label>
                        </div>

                        <div
                            className={
                                styles.modalFooter
                            }
                        >
                            <button
                                type="button"
                                className={
                                    styles.cancelButton
                                }
                                onClick={
                                    closeContentForm
                                }
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className={
                                    styles.primaryButton
                                }
                                onClick={
                                    handleAddContent
                                }
                                disabled={
                                    isAddingContent
                                }
                            >
                                Add Content
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* =================================================
                ASSESSMENT LINK
            ================================================= */}

            {showAssessmentModal && (
                <div
                    className={
                        styles.modalOverlay
                    }
                >
                    <div
                        className={
                            styles.assessmentModal
                        }
                    >
                        <div
                            className={
                                styles.modalHeader
                            }
                        >
                            <div>
                                <span>
                                    ASSESSMENT LINK
                                </span>

                                <h2>
                                    Link Assessment
                                </h2>

                                <p>
                                    The actual assessment
                                    is created in the
                                    Assessment Module.
                                    This page only stores
                                    the link.
                                </p>
                            </div>

                            <button
                                type="button"
                                className={
                                    styles.closeButton
                                }
                                onClick={() =>
                                    setShowAssessmentModal(
                                        false,
                                    )
                                }
                            >
                                ×
                            </button>
                        </div>

                        <div
                            className={
                                styles.formGrid
                            }
                        >
                            <label
                                className={
                                    styles.formField
                                }
                            >
                                <span>
                                    Assessment ID *
                                </span>

                                <input
                                    type="text"
                                    value={
                                        assessmentId
                                    }
                                    onChange={(event) =>
                                        setAssessmentId(
                                            event.target
                                                .value,
                                        )
                                    }
                                    placeholder="e.g. ASM-DDDM-M1-L1"
                                />
                            </label>

                            <label
                                className={
                                    styles.formField
                                }
                            >
                                <span>
                                    Assessment Title *
                                </span>

                                <input
                                    type="text"
                                    value={
                                        assessmentTitle
                                    }
                                    onChange={(event) =>
                                        setAssessmentTitle(
                                            event.target
                                                .value,
                                        )
                                    }
                                    placeholder="e.g. Business Data Fundamentals Quiz"
                                />
                            </label>
                        </div>

                        <div
                            className={
                                styles.assessmentNotice
                            }
                        >
                            <strong>
                                Assessment Module
                            </strong>

                            <p>
                                Assessment creation
                                and question management
                                will happen in the
                                Assessment Module.
                                Only the relationship
                                is maintained here.
                            </p>
                        </div>

                        <div
                            className={
                                styles.modalFooter
                            }
                        >
                            <button
                                type="button"
                                className={
                                    styles.cancelButton
                                }
                                onClick={() =>
                                    setShowAssessmentModal(
                                        false,
                                    )
                                }
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className={
                                    styles.primaryButton
                                }
                                onClick={
                                    handleAddAssessment
                                }
                            >
                                Link Assessment
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* =================================================
                FOOTER
            ================================================= */}

            <footer
                className={
                    styles.footer
                }
            >
                <button
                    type="button"
                    className={
                        styles.backButton
                    }
                    onClick={onBack}
                >
                    ← Back
                </button>

                <div
                    className={
                        styles.footerRight
                    }
                >
                    <span
                        className={
                            styles.footerHint
                        }
                    >
                        {isAcademicTenant
                            ? "Academic hierarchy, content and assessment links are maintained together."
                            : "Structure, content and assessment links are maintained together."}
                    </span>

                    <button
                        type="button"
                        className={
                            styles.nextButton
                        }
                        onClick={
                            handleSaveAndContinue
                        }
                    >
                        Save & Continue →
                    </button>
                </div>
            </footer>
        </div>
    );
}