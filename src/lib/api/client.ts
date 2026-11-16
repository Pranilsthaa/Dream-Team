import { create, isCancel, type AxiosInstance } from "axios";

import { ApiError, toApiError } from "./api-error";
import { logApiError, logApiRequest, logApiResponse } from "./logger";

function configuredBaseUrl(): string | undefined {
  const url = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (url) return url;
  if (typeof __DEV__ !== "undefined" && __DEV__)
    return "http://10.0.2.2:3001/api";
  return undefined;
}

export function createApiClient(baseURL: string | undefined): AxiosInstance {
  const client = create({
    baseURL: baseURL?.replace(/\/+$/, ""),
    timeout: 15_000,
    headers: { Accept: "application/json", "Content-Type": "application/json" },
  });

  client.interceptors.request.use((config) => {
    logApiRequest(client, config);
    if (!config.baseURL || !/^https?:\/\//i.test(config.baseURL)) {
      throw new ApiError(
        "Set EXPO_PUBLIC_API_URL to the API base URL before connecting.",
        0,
        "configuration",
      );
    }
    return config;
  });
  client.interceptors.response.use(
    (response) => {
      if (__DEV__) logApiResponse(response);
      return response;
    },
    (error) => {
      if (__DEV__) logApiError(error);
      return Promise.reject(isCancel(error) ? error : toApiError(error));
    },
  );

  return client;
}

export const apiClient = createApiClient(configuredBaseUrl());
