import { afterEach, describe, expect, spyOn, test } from "bun:test";
import axios, { type AxiosRequestConfig } from "axios";

import { PLUGIN_TEMPLATES } from "../src/services/api/model-plugin";
import { createVideoGenerationTask } from "../src/services/api/video";
import { defaultConfig, encodeChannelModel } from "../src/stores/use-config-store";

const template = PLUGIN_TEMPLATES.video.find((item) => item.label === "OneToken Seedance 2.0");
const requestSpies: Array<ReturnType<typeof spyOn>> = [];

afterEach(() => {
    requestSpies.splice(0).forEach((mock) => mock.mockRestore());
});

describe("OneToken Seedance 2.0 model script", () => {
    test("sends multimodal references only to the OneToken task API", async () => {
        expect(template).toBeDefined();
        const requests: AxiosRequestConfig[] = [];
        const requestSpy = spyOn(axios, "request").mockImplementation(async (config) => {
            requests.push(config);
            if (config.method === "post") return { data: { id: "task-1" } };
            return { data: { status: "succeeded", content: { video_url: "https://cdn.example.com/output.mp4" } } };
        });
        requestSpies.push(requestSpy);

        const model = "doubao-seedance-2-0-260128";
        const modelValue = encodeChannelModel("onetoken", model);
        const task = await createVideoGenerationTask(
            {
                ...defaultConfig,
                channels: [
                    {
                        id: "onetoken",
                        name: "OneToken",
                        baseUrl: "https://api.onetoken.love/api/v3/",
                        apiKey: "test-key",
                        apiFormat: "openai",
                        models: [{ name: model, capability: "video", script: template!.script }],
                    },
                ],
                models: [modelValue],
                model: modelValue,
                videoModel: modelValue,
                baseUrl: "https://api.onetoken.love/api/v3/",
                apiKey: "test-key",
                videoSeconds: "-1",
                vquality: "1080p",
                size: "9:16",
                videoGenerateAudio: "true",
            },
            "按参考素材生成视频",
            [{ id: "image-1", name: "image.png", type: "image/png", dataUrl: "data:image/png;base64,aW1hZ2U=" }],
            [{ id: "video-1", name: "video.mp4", type: "video/mp4", url: "https://cdn.example.com/reference.mp4" }],
            [{ id: "audio-1", name: "audio.mp3", type: "audio/mpeg", url: "https://cdn.example.com/reference.mp3" }],
        );

        expect(task.provider).toBe("plugin");
        expect(requests.map((request) => request.url)).toEqual(["https://api.onetoken.love/api/v3/contents/generations/tasks", "https://api.onetoken.love/api/v3/contents/generations/tasks/task-1"]);
        expect(requests[0].headers).toMatchObject({
            Authorization: "Bearer test-key",
            "Content-Type": "application/json",
        });
        expect(requests[0].headers?.["Idempotency-Key"]).toBeString();
        expect(requests[0].data).toEqual({
            model,
            content: [
                { type: "text", text: "按参考素材生成视频" },
                { type: "image_url", role: "reference_image", image_url: { url: "data:image/png;base64,aW1hZ2U=" } },
                { type: "video_url", role: "reference_video", video_url: { url: "https://cdn.example.com/reference.mp4" } },
                { type: "audio_url", role: "reference_audio", audio_url: { url: "https://cdn.example.com/reference.mp3" } },
            ],
            resolution: "1080p",
            ratio: "9:16",
            duration: 5,
            generate_audio: true,
            watermark: false,
        });
    });

    test("rejects an audio-only reference before creating a task", async () => {
        expect(template).toBeDefined();
        const model = "doubao-seedance-2-0-260128";
        const modelValue = encodeChannelModel("onetoken", model);
        const config = {
            ...defaultConfig,
            channels: [
                {
                    id: "onetoken",
                    name: "OneToken",
                    baseUrl: "https://api.onetoken.love/api/v3",
                    apiKey: "test-key",
                    apiFormat: "openai" as const,
                    models: [{ name: model, capability: "video" as const, script: template!.script }],
                },
            ],
            models: [modelValue],
            model: modelValue,
            videoModel: modelValue,
        };

        await expect(createVideoGenerationTask(config, "", [], [], [{ id: "audio-1", name: "audio.mp3", type: "audio/mpeg", url: "https://cdn.example.com/reference.mp3" }])).rejects.toThrow("参考音频不能单独使用");
    });
});
