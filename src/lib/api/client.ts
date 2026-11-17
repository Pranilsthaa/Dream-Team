import { create, isCancel, type AxiosInstance } from "axios";

import { ApiError, toApiError } from "./api-error";
import { authorizeRequest, recoverRequest, sessionEnded, type ApiSession } from "./authentication";
import { logApiError, logApiRequest, logApiResponse } from "./logger";

function configuredBaseUrl(): string | undefined {
  const url = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (url) return url;
  if (typeof __DEV__ !== "undefined" && __DEV__)
    return "http://10.0.2.2:3001/api";
  return undefined;
}

export function createApiClient(baseURL: string | undefined, getSession?: () => ApiSession | undefined): AxiosInstance {
  const client = create({
    baseURL: baseURL?.replace(/\/+$/, ""),
    timeout: 15_000,
    headers: { Accept: "application/json", "Content-Type": "application/json" },
  });

  client.interceptors.request.use(async (config) => {
    if (!config.baseURL || !/^https?:\/\//i.test(config.baseURL)) {
      throw new ApiError(
        "Set EXPO_PUBLIC_API_URL to the API base URL before connecting.",
        0,
        "configuration",
      );
    }
    if (getSession) await authorizeRequest(client, config, getSession);
    logApiRequest(client, config);
    return config;
  });
  client.interceptors.response.use(
    (response) => {
      if (typeof __DEV__ !== "undefined" && __DEV__) logApiResponse(response);
      const attempt = response.config._sessionAttempt;
      if (attempt && (getSession?.() !== attempt.owner || !attempt.owner.isAuthorizationCurrent(attempt.grant))) throw sessionEnded();
      return response;
    },
    async (error) => {
      if (typeof __DEV__ !== "undefined" && __DEV__) logApiError(error);
      try {
        if (getSession) {
          const response = await recoverRequest(error, client, getSession);
          if (response) return response;
        }
      } catch (recoveryError) {
        throw isCancel(recoveryError) ? recoveryError : toApiError(recoveryError);
      }
      throw isCancel(error) ? error : toApiError(error);
    },
  );

  return client;
}

let activeSession: ApiSession | undefined;

// Connect the app session and release it only if it is still the active owner.
export function bindApiSession(session: ApiSession) {
  activeSession = session;
  return () => { if (activeSession === session) activeSession = undefined; };
}

export const publicApiClient = createApiClient(configuredBaseUrl());
export const apiClient = createApiClient(configuredBaseUrl(), () => activeSession);
