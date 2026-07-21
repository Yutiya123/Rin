import { AwsClient } from "aws4fetch";
import { path_join } from "./path";

// 工具：去除首尾斜杠
function trimSlash(str: string) {
  return str.replace(/^\/+|\/+$/g, "");
}

export function createS3Client(env: Env): AwsClient {
    const accessKeyId = env.S3_ACCESS_KEY_ID;
    const secretAccessKey = env.S3_SECRET_ACCESS_KEY;
    
    return new AwsClient({
        accessKeyId,
        secretAccessKey,
        service: "s3",
    });
}

export async function putObject(
    client: AwsClient,
    env: Env,
    key: string,
    body: Blob | ArrayBuffer | Uint8Array | string,
    contentType?: string
) {
    let endpointRaw = env.S3_ENDPOINT;
    const bucket = env.S3_BUCKET;
    const forcePathStyle = env.S3_FORCE_PATH_STYLE === 'true';

    // 自动补全 https://，统一标准化
    let endpoint = trimSlash(endpointRaw);
    if (!endpoint.startsWith("http")) {
        endpoint = `https://${endpoint}`;
    }

    // 强制使用 Path-Style（国产S3标准，直接废弃虚拟主机分支，彻底规避 new URL 报错）
    const url = path_join(endpoint, bucket, key);
    
    const headers: Record<string, string> = {};
    if (contentType) {
        headers["Content-Type"] = contentType;
    }
    
    const response = await client.fetch(url, {
        method: "PUT",
        body: body as BodyInit,
        headers,
    });
    
    if (!response.ok) {
        throw new Error(`Failed to upload to S3: ${response.status} ${response.statusText}`);
    }
    
    return response;
}

export function buildS3ObjectUrl(env: Env, key: string): string {
    let endpointRaw = env.S3_ENDPOINT;
    const bucket = env.S3_BUCKET;
    const forcePathStyle = env.S3_FORCE_PATH_STYLE === 'true';

    let endpoint = trimSlash(endpointRaw);
    if (!endpoint.startsWith("http")) {
        endpoint = `https://${endpoint}`;
    }

    // 固定 Path-Style，不再走虚拟主机URL分支
    return path_join(endpoint, bucket, key);
}
