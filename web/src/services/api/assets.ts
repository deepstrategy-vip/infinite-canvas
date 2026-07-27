import axios from "axios";

import { buildApiUrl, type AiConfig } from "@/stores/use-config-store";

type RequestOptions = { signal?: AbortSignal };

export type UploadedAsset = {
    id: string;
    url: string;
    mimeType: string;
    size: number;
    expiresAt?: string;
};

type AssetResponse = {
    id?: string;
    url?: string;
    mime_type?: string;
    size?: number;
    expires_at?: string;
};

type AssetEnvelope = AssetResponse | { code?: number | string; data?: AssetResponse | null; msg?: string; message?: string; error?: { message?: string } };

/**
 * Video providers fetch reference material themselves, so it has to sit on a
 * public HTTPS URL. Canvas material lives in IndexedDB as a Blob and was being
 * inlined as a data URL, which the video endpoint rejects outright and which
 * would blow past the request-body limit long before that.
 *
 * Uploading returns a short-lived public URL to put in the request instead.
 */
const ASSETS_PATH = "/api/v3/assets";

function assetsUrl(config: AiConfig) {
    return buildApiUrl(config.baseUrl, ASSETS_PATH);
}

function readApiErrorMessage(value: unknown): string {
    if (!value) return "";
    if (typeof value === "string") {
        try {
            return readApiErrorMessage(JSON.parse(value)) || value;
        } catch {
            return value;
        }
    }
    if (typeof value !== "object") return "";
    const payload = value as { msg?: unknown; message?: unknown; error?: { message?: unknown } };
    return readApiErrorMessage(payload.msg) || readApiErrorMessage(payload.message) || readApiErrorMessage(payload.error?.message);
}

function statusMessage(status: number | undefined, fallback: string) {
    if (status === 401 || status === 403) return "鉴权失败，请检查 API Key、套餐权限或模型权限";
    if (status === 413) return "素材超出大小限制，请压缩后重试";
    if (status === 415) return "素材格式不受支持，请改用常见的图片、视频或音频格式";
    if (status === 429) return "请求被限流或额度不足，请稍后重试";
    return status ? `${fallback}（${status}）` : fallback;
}

function readAxiosError(error: unknown, fallback: string) {
    if (axios.isCancel(error)) return "请求已取消";
    if (axios.isAxiosError<{ error?: { message?: string }; msg?: string; message?: string }>(error)) {
        return readApiErrorMessage(error.response?.data) || statusMessage(error.response?.status, fallback);
    }
    if (error instanceof DOMException && error.name === "AbortError") return "请求已取消";
    return error instanceof Error ? readApiErrorMessage(error.message) || error.message : fallback;
}

function unwrapAsset(payload: AssetEnvelope): AssetResponse {
    if (payload && typeof payload === "object" && "data" in payload && payload.data) return payload.data;
    return payload as AssetResponse;
}

function fileNameFor(blob: Blob, fallbackName?: string) {
    if (fallbackName) return fallbackName;
    const [, subtype] = (blob.type || "").split("/");
    const extension = (subtype || "bin").split(";")[0].replace(/[^a-z0-9]/gi, "") || "bin";
    return `asset.${extension}`;
}

/**
 * Uploads one Blob and returns the public URL a provider can fetch.
 *
 * The API key is the caller's own, so an upload is attributed to the account
 * that will be billed for the generation it feeds.
 */
export async function uploadAsset(config: AiConfig, blob: Blob, fileName?: string, options?: RequestOptions): Promise<UploadedAsset> {
    if (!config.baseUrl.trim()) throw new Error("请先配置 Base URL");
    if (!config.apiKey.trim()) throw new Error("请先配置 API Key");
    if (!blob.size) throw new Error("素材为空，请重新添加");

    const formData = new FormData();
    formData.append("file", blob, fileNameFor(blob, fileName));

    try {
        const response = await axios.request<AssetEnvelope>({
            method: "post",
            url: assetsUrl(config),
            data: formData,
            headers: { Authorization: `Bearer ${config.apiKey}` },
            signal: options?.signal,
        });
        const asset = unwrapAsset(response.data);
        if (!asset?.url) throw new Error("素材上传失败：服务端未返回可访问地址");
        return {
            id: asset.id || "",
            url: asset.url,
            mimeType: asset.mime_type || blob.type || "",
            size: typeof asset.size === "number" ? asset.size : blob.size,
            expiresAt: asset.expires_at,
        };
    } catch (error) {
        throw new Error(readAxiosError(error, "素材上传失败"));
    }
}

/**
 * Uploads once per Blob within a single generation.
 *
 * A canvas commonly wires the same picture into several reference slots, and a
 * task is rejected as a whole, so repeating an upload would multiply both the
 * wait and the stored copies for no gain.
 */
export function createAssetUploader(config: AiConfig, options?: RequestOptions) {
    const uploads = new Map<string, Promise<UploadedAsset>>();
    return (blob: Blob, cacheKey?: string, fileName?: string) => {
        const key = cacheKey || `${blob.size}:${blob.type}`;
        const existing = uploads.get(key);
        if (existing) return existing;
        const pending = uploadAsset(config, blob, fileName, options);
        uploads.set(key, pending);
        return pending;
    };
}
