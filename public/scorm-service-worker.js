/* =========================================================
   NeuroLXP SCORM Runtime Service Worker
========================================================= */

const SCORM_SW_VERSION =
    "runtime-v7";

const RUNTIME_PREFIX =
    "/scorm-runtime/";

/*
 * CURRENT storage used by Learning Structure.
 */
const CURRENT_DATABASE_NAME =
    "neurolxp-course-content";

const CURRENT_FILE_STORE =
    "files";

/*
 * Older SCORM database.
 *
 * Retained only so SCORM packages uploaded using previous
 * versions can still be opened.
 */
const LEGACY_DATABASE_NAME =
    "neurolxp-scorm-demo";

const LEGACY_FILE_STORE =
    "files";

const CURRENT_SCORM_KEY_PREFIX =
    "scorm:";


/* =========================================================
   INSTALL
========================================================= */

self.addEventListener(
    "install",
    () => {
        console.log(
            `[SCORM SW] Installing ${SCORM_SW_VERSION}`
        );

        self.skipWaiting();
    }
);


/* =========================================================
   ACTIVATE
========================================================= */

self.addEventListener(
    "activate",
    (event) => {
        console.log(
            `[SCORM SW] Activating ${SCORM_SW_VERSION}`
        );

        event.waitUntil(
            self.clients.claim()
        );
    }
);


/* =========================================================
   PATH NORMALIZATION
========================================================= */

function normalizePackagePath(
    value
) {
    if (!value) {
        return "";
    }

    let decoded =
        String(value);

    try {
        decoded =
            decodeURIComponent(
                decoded
            );
    } catch {
        /*
         * Keep original value when malformed URL
         * encoding is encountered.
         */
    }

    decoded =
        decoded.replace(
            /\\/g,
            "/"
        );

    decoded =
        decoded.replace(
            /^\/+/,
            ""
        );

    const parts =
        decoded.split("/");

    const normalizedParts =
        [];

    for (
        const part
        of parts
    ) {
        if (
            !part ||
            part === "."
        ) {
            continue;
        }

        if (
            part === ".."
        ) {
            normalizedParts.pop();

            continue;
        }

        normalizedParts.push(
            part
        );
    }

    return normalizedParts.join(
        "/"
    );
}


/* =========================================================
   INDEXEDDB
========================================================= */

/*
 * IMPORTANT:
 *
 * No explicit database version is supplied here.
 *
 * This allows the worker to read the currently installed
 * database version even if Learning Structure upgrades it.
 */
function openDatabase(
    databaseName
) {
    return new Promise(
        (
            resolve,
            reject
        ) => {
            const request =
                indexedDB.open(
                    databaseName
                );

            request.onsuccess =
                () => {
                    resolve(
                        request.result
                    );
                };

            request.onerror =
                () => {
                    reject(
                        request.error ||
                            new Error(
                                `Unable to open IndexedDB: ${databaseName}`
                            )
                    );
                };

            request.onblocked =
                () => {
                    reject(
                        new Error(
                            `IndexedDB is blocked: ${databaseName}`
                        )
                    );
                };
        }
    );
}


/* =========================================================
   READ DATABASE RECORD
========================================================= */

async function readRecord(
    databaseName,
    storeName,
    key
) {
    let database;

    try {
        database =
            await openDatabase(
                databaseName
            );

        if (
            !database.objectStoreNames.contains(
                storeName
            )
        ) {
            return null;
        }

        const transaction =
            database.transaction(
                storeName,
                "readonly"
            );

        const store =
            transaction.objectStore(
                storeName
            );

        const request =
            store.get(
                key
            );

        return await new Promise(
            (
                resolve,
                reject
            ) => {
                request.onsuccess =
                    () => {
                        resolve(
                            request.result ||
                                null
                        );
                    };

                request.onerror =
                    () => {
                        reject(
                            request.error ||
                                new Error(
                                    `Unable to read SCORM resource: ${key}`
                                )
                        );
                    };
            }
        );
    } catch (
        error
    ) {
        console.warn(
            `[SCORM SW] Unable to read ${databaseName}/${storeName}`,
            error
        );

        return null;
    } finally {
        if (database) {
            database.close();
        }
    }
}


/* =========================================================
   CURRENT STORAGE LOOKUP

   Learning Structure now stores:

       scorm:{packageId}:{relativePath}

   Example:

       scorm:scorm-content-123:index.html

       scorm:scorm-content-123:css/style.css

========================================================= */

async function readCurrentScormFile(
    packageId,
    filePath
) {
    const normalizedPackageId =
        String(
            packageId || ""
        ).trim();

    const normalizedFilePath =
        normalizePackagePath(
            filePath
        );

    if (
        !normalizedPackageId ||
        !normalizedFilePath
    ) {
        return null;
    }

    /*
     * PRIMARY corrected key.
     */
    const currentKey =
        `${CURRENT_SCORM_KEY_PREFIX}${normalizedPackageId}:${normalizedFilePath}`;

    /*
     * Older/intermediate build compatibility.
     */
    const alternateKey =
        `${normalizedPackageId}:${normalizedFilePath}`;

    /*
     * Extra compatibility keys.
     */
    const keys = [
        currentKey,
        alternateKey,
        normalizedFilePath,
        `${normalizedPackageId}/${normalizedFilePath}`,
    ];

    for (
        const key
        of keys
    ) {
        const record =
            await readRecord(
                CURRENT_DATABASE_NAME,
                CURRENT_FILE_STORE,
                key
            );

        if (record) {
            console.debug(
                "[SCORM SW] Current resource found:",
                {
                    packageId:
                        normalizedPackageId,

                    filePath:
                        normalizedFilePath,

                    key,
                }
            );

            return {
                record,
                key,
                databaseName:
                    CURRENT_DATABASE_NAME,
            };
        }
    }

    return null;
}


/* =========================================================
   LEGACY STORAGE LOOKUP
========================================================= */

async function readLegacyScormFile(
    packageId,
    filePath
) {
    const normalizedPackageId =
        String(
            packageId || ""
        ).trim();

    const normalizedFilePath =
        normalizePackagePath(
            filePath
        );

    if (
        !normalizedPackageId ||
        !normalizedFilePath
    ) {
        return null;
    }

    const keys = [
        `scorm:${normalizedPackageId}:${normalizedFilePath}`,

        `${normalizedPackageId}:${normalizedFilePath}`,

        normalizedFilePath,

        `${normalizedPackageId}/${normalizedFilePath}`,
    ];

    for (
        const key
        of keys
    ) {
        const record =
            await readRecord(
                LEGACY_DATABASE_NAME,
                LEGACY_FILE_STORE,
                key
            );

        if (record) {
            console.debug(
                "[SCORM SW] Legacy resource found:",
                {
                    packageId:
                        normalizedPackageId,

                    filePath:
                        normalizedFilePath,

                    key,
                }
            );

            return {
                record,
                key,
                databaseName:
                    LEGACY_DATABASE_NAME,
            };
        }
    }

    return null;
}


/* =========================================================
   READ SCORM RESOURCE
========================================================= */

async function readScormFile(
    packageId,
    filePath
) {
    /*
     * FIRST:
     *
     * neurolxp-course-content/files
     */
    const current =
        await readCurrentScormFile(
            packageId,
            filePath
        );

    if (current) {
        return current;
    }

    /*
     * SECOND:
     *
     * old neurolxp-scorm-demo database.
     */
    return await readLegacyScormFile(
        packageId,
        filePath
    );
}


/* =========================================================
   MIME TYPES
========================================================= */

function getMimeType(
    filePath,
    storedMime = ""
) {
    if (
        storedMime &&
        typeof storedMime ===
            "string"
    ) {
        return storedMime;
    }

    const cleanPath =
        String(
            filePath || ""
        )
            .split("?")[0]
            .split("#")[0]
            .toLowerCase();

    if (
        cleanPath.endsWith(
            ".html"
        ) ||
        cleanPath.endsWith(
            ".htm"
        )
    ) {
        return "text/html; charset=utf-8";
    }

    if (
        cleanPath.endsWith(
            ".xhtml"
        )
    ) {
        return "application/xhtml+xml; charset=utf-8";
    }

    if (
        cleanPath.endsWith(
            ".css"
        )
    ) {
        return "text/css; charset=utf-8";
    }

    if (
        cleanPath.endsWith(
            ".js"
        ) ||
        cleanPath.endsWith(
            ".mjs"
        )
    ) {
        return "text/javascript; charset=utf-8";
    }

    if (
        cleanPath.endsWith(
            ".json"
        )
    ) {
        return "application/json; charset=utf-8";
    }

    if (
        cleanPath.endsWith(
            ".xml"
        )
    ) {
        return "application/xml; charset=utf-8";
    }

    if (
        cleanPath.endsWith(
            ".txt"
        )
    ) {
        return "text/plain; charset=utf-8";
    }

    if (
        cleanPath.endsWith(
            ".svg"
        )
    ) {
        return "image/svg+xml";
    }

    if (
        cleanPath.endsWith(
            ".png"
        )
    ) {
        return "image/png";
    }

    if (
        cleanPath.endsWith(
            ".jpg"
        ) ||
        cleanPath.endsWith(
            ".jpeg"
        )
    ) {
        return "image/jpeg";
    }

    if (
        cleanPath.endsWith(
            ".gif"
        )
    ) {
        return "image/gif";
    }

    if (
        cleanPath.endsWith(
            ".webp"
        )
    ) {
        return "image/webp";
    }

    if (
        cleanPath.endsWith(
            ".ico"
        )
    ) {
        return "image/x-icon";
    }

    if (
        cleanPath.endsWith(
            ".bmp"
        )
    ) {
        return "image/bmp";
    }

    if (
        cleanPath.endsWith(
            ".mp4"
        )
    ) {
        return "video/mp4";
    }

    if (
        cleanPath.endsWith(
            ".webm"
        )
    ) {
        return "video/webm";
    }

    if (
        cleanPath.endsWith(
            ".mov"
        )
    ) {
        return "video/quicktime";
    }

    if (
        cleanPath.endsWith(
            ".ogv"
        )
    ) {
        return "video/ogg";
    }

    if (
        cleanPath.endsWith(
            ".mp3"
        )
    ) {
        return "audio/mpeg";
    }

    if (
        cleanPath.endsWith(
            ".wav"
        )
    ) {
        return "audio/wav";
    }

    if (
        cleanPath.endsWith(
            ".ogg"
        )
    ) {
        return "audio/ogg";
    }

    if (
        cleanPath.endsWith(
            ".m4a"
        )
    ) {
        return "audio/mp4";
    }

    if (
        cleanPath.endsWith(
            ".pdf"
        )
    ) {
        return "application/pdf";
    }

    if (
        cleanPath.endsWith(
            ".woff"
        )
    ) {
        return "font/woff";
    }

    if (
        cleanPath.endsWith(
            ".woff2"
        )
    ) {
        return "font/woff2";
    }

    if (
        cleanPath.endsWith(
            ".ttf"
        )
    ) {
        return "font/ttf";
    }

    if (
        cleanPath.endsWith(
            ".otf"
        )
    ) {
        return "font/otf";
    }

    if (
        cleanPath.endsWith(
            ".wasm"
        )
    ) {
        return "application/wasm";
    }

    return "application/octet-stream";
}


/* =========================================================
   GET STORED MIME TYPE
========================================================= */

function getStoredMimeType(
    storedFile
) {
    if (
        !storedFile ||
        typeof storedFile !==
            "object"
    ) {
        return "";
    }

    return (
        storedFile.mimeType ||
        storedFile.fileType ||
        (
            typeof storedFile.type ===
                "string"
                ? storedFile.type
                : ""
        ) ||
        (
            storedFile.blob instanceof
                Blob
                ? storedFile.blob.type
                : ""
        ) ||
        (
            storedFile.content instanceof
                Blob
                ? storedFile.content.type
                : ""
        ) ||
        ""
    );
}


/* =========================================================
   GET STORED CONTENT
========================================================= */

function getStoredContent(
    record
) {
    if (!record) {
        return null;
    }

    if (
        record instanceof Blob
    ) {
        return record;
    }

    if (
        record instanceof ArrayBuffer
    ) {
        return record;
    }

    if (
        ArrayBuffer.isView(
            record
        )
    ) {
        return record;
    }

    if (
        typeof record ===
            "object"
    ) {
        /*
         * Corrected Learning Structure writes both:
         *
         * blob
         * content
         */
        const possibleValues = [
            record.blob,
            record.content,
            record.file,
            record.data,
            record.body,
            record.value,
        ];

        for (
            const value
            of possibleValues
        ) {
            if (
                value instanceof Blob ||
                value instanceof ArrayBuffer ||
                ArrayBuffer.isView(
                    value
                )
            ) {
                return value;
            }
        }

        if (
            typeof record.content ===
                "string"
        ) {
            return record.content;
        }

        if (
            typeof record.data ===
                "string"
        ) {
            return record.data;
        }
    }

    if (
        typeof record ===
            "string"
    ) {
        return record;
    }

    return null;
}


/* =========================================================
   CONTENT SIZE
========================================================= */

function getContentSize(
    content
) {
    if (
        content instanceof Blob
    ) {
        return content.size;
    }

    if (
        content instanceof ArrayBuffer
    ) {
        return content.byteLength;
    }

    if (
        ArrayBuffer.isView(
            content
        )
    ) {
        return content.byteLength;
    }

    if (
        typeof content ===
            "string"
    ) {
        return new TextEncoder()
            .encode(
                content
            )
            .byteLength;
    }

    return 0;
}


/* =========================================================
   CONTENT → ARRAY BUFFER
========================================================= */

async function contentToArrayBuffer(
    content
) {
    if (
        content instanceof ArrayBuffer
    ) {
        return content;
    }

    if (
        ArrayBuffer.isView(
            content
        )
    ) {
        return content.buffer.slice(
            content.byteOffset,
            content.byteOffset +
                content.byteLength
        );
    }

    if (
        content instanceof Blob
    ) {
        return await content.arrayBuffer();
    }

    if (
        typeof content ===
            "string"
    ) {
        return new TextEncoder()
            .encode(
                content
            )
            .buffer;
    }

    throw new Error(
        "Unsupported SCORM content format."
    );
}


/* =========================================================
   HTTP RANGE SUPPORT

   Required for video/audio seeking inside SCORM.
========================================================= */

function parseRangeHeader(
    rangeHeader,
    totalLength
) {
    if (
        !rangeHeader ||
        !rangeHeader.startsWith(
            "bytes="
        )
    ) {
        return null;
    }

    const range =
        rangeHeader
            .replace(
                "bytes=",
                ""
            )
            .split(",")[0]
            .trim();

    const [
        startText,
        endText,
    ] =
        range.split("-");

    let start =
        startText
            ? Number(
                  startText
              )
            : NaN;

    let end =
        endText
            ? Number(
                  endText
              )
            : NaN;

    /*
     * bytes=-500
     */
    if (
        Number.isNaN(
            start
        ) &&
        !Number.isNaN(
            end
        )
    ) {
        const suffixLength =
            Math.min(
                end,
                totalLength
            );

        start =
            totalLength -
            suffixLength;

        end =
            totalLength -
            1;
    }

    /*
     * bytes=500-
     */
    if (
        !Number.isNaN(
            start
        ) &&
        Number.isNaN(
            end
        )
    ) {
        end =
            totalLength -
            1;
    }

    if (
        Number.isNaN(
            start
        ) ||
        Number.isNaN(
            end
        )
    ) {
        return null;
    }

    start =
        Math.max(
            0,
            start
        );

    end =
        Math.min(
            totalLength - 1,
            end
        );

    if (
        start > end ||
        start >= totalLength
    ) {
        return null;
    }

    return {
        start,
        end,
    };
}


/* =========================================================
   RESPONSE HEADERS
========================================================= */

function createHeaders(
    mimeType
) {
    const headers =
        new Headers();

    headers.set(
        "Content-Type",
        mimeType
    );

    headers.set(
        "Cache-Control",
        "no-store, max-age=0"
    );

    headers.set(
        "X-Content-Type-Options",
        "nosniff"
    );

    headers.set(
        "Accept-Ranges",
        "bytes"
    );

    /*
     * SCORM packages frequently use iframes, scripts,
     * video and other embedded resources.
     */
    headers.set(
        "Cross-Origin-Resource-Policy",
        "same-origin"
    );

    return headers;
}


/* =========================================================
   FULL RESPONSE
========================================================= */

async function createFullResponse(
    content,
    mimeType
) {
    const headers =
        createHeaders(
            mimeType
        );

    const size =
        getContentSize(
            content
        );

    if (
        size > 0
    ) {
        headers.set(
            "Content-Length",
            String(
                size
            )
        );
    }

    return new Response(
        content,
        {
            status: 200,
            headers,
        }
    );
}


/* =========================================================
   RANGE RESPONSE
========================================================= */

async function createRangeResponse(
    content,
    mimeType,
    rangeHeader
) {
    const buffer =
        await contentToArrayBuffer(
            content
        );

    const totalLength =
        buffer.byteLength;

    const range =
        parseRangeHeader(
            rangeHeader,
            totalLength
        );

    if (!range) {
        return new Response(
            null,
            {
                status: 416,

                headers: {
                    "Content-Range":
                        `bytes */${totalLength}`,
                },
            }
        );
    }

    const sliced =
        buffer.slice(
            range.start,
            range.end + 1
        );

    const headers =
        createHeaders(
            mimeType
        );

    headers.set(
        "Content-Range",
        `bytes ${range.start}-${range.end}/${totalLength}`
    );

    headers.set(
        "Content-Length",
        String(
            sliced.byteLength
        )
    );

    return new Response(
        sliced,
        {
            status: 206,
            headers,
        }
    );
}


/* =========================================================
   ERROR RESPONSE
========================================================= */

function createErrorResponse(
    message,
    status = 500
) {
    return new Response(
        message,
        {
            status,

            headers: {
                "Content-Type":
                    "text/plain; charset=utf-8",

                "Cache-Control":
                    "no-store",
            },
        }
    );
}


/* =========================================================
   PARSE RUNTIME URL

   Expected:

   /scorm-runtime/{packageId}/{relativePath}

========================================================= */

function parseRuntimePath(
    pathname
) {
    if (
        !pathname.startsWith(
            RUNTIME_PREFIX
        )
    ) {
        return null;
    }

    const relative =
        pathname.slice(
            RUNTIME_PREFIX.length
        );

    const firstSlash =
        relative.indexOf(
            "/"
        );

    if (
        firstSlash <= 0
    ) {
        return null;
    }

    let packageId =
        relative.slice(
            0,
            firstSlash
        );

    let filePath =
        relative.slice(
            firstSlash + 1
        );

    try {
        packageId =
            decodeURIComponent(
                packageId
            );
    } catch {
        /*
         * Use original package ID.
         */
    }

    filePath =
        normalizePackagePath(
            filePath
        );

    if (
        !packageId ||
        !filePath
    ) {
        return null;
    }

    return {
        packageId,
        filePath,
    };
}


/* =========================================================
   SERVE SCORM RESOURCE
========================================================= */

async function serveScormResource(
    request,
    packageId,
    filePath
) {
    try {
        const result =
            await readScormFile(
                packageId,
                filePath
            );

        if (!result) {
            console.warn(
                "[SCORM SW] File not found:",
                {
                    packageId,
                    filePath,

                    expectedKey:
                        `scorm:${packageId}:${filePath}`,
                }
            );

            return createErrorResponse(
                `SCORM file not found: ${filePath}`,
                404
            );
        }

        const storedFile =
            result.record;

        const content =
            getStoredContent(
                storedFile
            );

        if (
            content === null ||
            content === undefined
        ) {
            console.warn(
                "[SCORM SW] SCORM record contains no usable content:",
                {
                    packageId,
                    filePath,

                    key:
                        result.key,

                    database:
                        result.databaseName,
                }
            );

            return createErrorResponse(
                `SCORM resource is empty: ${filePath}`,
                404
            );
        }

        const storedMime =
            getStoredMimeType(
                storedFile
            );

        const mimeType =
            getMimeType(
                filePath,
                storedMime
            );

        const rangeHeader =
            request.headers.get(
                "Range"
            );

        if (rangeHeader) {
            return await createRangeResponse(
                content,
                mimeType,
                rangeHeader
            );
        }

        return await createFullResponse(
            content,
            mimeType
        );
    } catch (
        error
    ) {
        console.error(
            "[SCORM SW] Runtime request failed:",
            error
        );

        return createErrorResponse(
            error instanceof Error
                ? error.message
                : "Unable to load SCORM runtime resource.",
            500
        );
    }
}


/* =========================================================
   FETCH
========================================================= */

self.addEventListener(
    "fetch",
    (event) => {
        const request =
            event.request;

        /*
         * Only SCORM runtime GET / HEAD requests are handled.
         */
        if (
            request.method !== "GET" &&
            request.method !== "HEAD"
        ) {
            return;
        }

        const url =
            new URL(
                request.url
            );

        /*
         * Do not intercept external URLs.
         */
        if (
            url.origin !==
                self.location.origin
        ) {
            return;
        }

        if (
            !url.pathname.startsWith(
                RUNTIME_PREFIX
            )
        ) {
            return;
        }

        const runtimePath =
            parseRuntimePath(
                url.pathname
            );

        if (!runtimePath) {
            event.respondWith(
                Promise.resolve(
                    createErrorResponse(
                        "Invalid SCORM runtime URL.",
                        400
                    )
                )
            );

            return;
        }

        const {
            packageId,
            filePath,
        } =
            runtimePath;

        /*
         * HEAD
         */
        if (
            request.method ===
            "HEAD"
        ) {
            event.respondWith(
                (
                    async () => {
                        const result =
                            await readScormFile(
                                packageId,
                                filePath
                            );

                        if (!result) {
                            return createErrorResponse(
                                "SCORM file not found.",
                                404
                            );
                        }

                        const content =
                            getStoredContent(
                                result.record
                            );

                        if (
                            content === null ||
                            content === undefined
                        ) {
                            return createErrorResponse(
                                "SCORM resource is empty.",
                                404
                            );
                        }

                        const storedMime =
                            getStoredMimeType(
                                result.record
                            );

                        const mimeType =
                            getMimeType(
                                filePath,
                                storedMime
                            );

                        const headers =
                            createHeaders(
                                mimeType
                            );

                        const size =
                            getContentSize(
                                content
                            );

                        if (
                            size > 0
                        ) {
                            headers.set(
                                "Content-Length",
                                String(
                                    size
                                )
                            );
                        }

                        return new Response(
                            null,
                            {
                                status: 200,
                                headers,
                            }
                        );
                    }
                )()
            );

            return;
        }

        event.respondWith(
            serveScormResource(
                request,
                packageId,
                filePath
            )
        );
    }
);


/* =========================================================
   MESSAGE HANDLING
========================================================= */

self.addEventListener(
    "message",
    (event) => {
        const data =
            event.data;

        if (
            !data ||
            typeof data !==
                "object"
        ) {
            return;
        }

        if (
            data.type ===
            "SKIP_WAITING"
        ) {
            self.skipWaiting();

            return;
        }

        if (
            data.type ===
            "SCORM_RUNTIME_PING"
        ) {
            if (
                event.source &&
                typeof event.source.postMessage ===
                    "function"
            ) {
                event.source.postMessage(
                    {
                        type:
                            "SCORM_RUNTIME_PONG",

                        version:
                            SCORM_SW_VERSION,
                    }
                );
            }
        }
    }
);


/* =========================================================
   ERROR LOGGING
========================================================= */

self.addEventListener(
    "error",
    (event) => {
        console.error(
            "[SCORM SW] Error:",
            event.error ||
                event.message
        );
    }
);


self.addEventListener(
    "unhandledrejection",
    (event) => {
        console.error(
            "[SCORM SW] Unhandled rejection:",
            event.reason
        );
    }
);


/* =========================================================
   END
========================================================= */