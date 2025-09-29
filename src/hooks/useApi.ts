import axios from 'axios';
import type { AxiosRequestConfig, AxiosError } from 'axios';

export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface ApiOptions<T = unknown> extends AxiosRequestConfig {
  enabled?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: AxiosError) => void;
  refetchInterval?: number;
}

export interface ApiResource<T> {
  getState(): ApiState<T>;
  fetch(): Promise<ApiState<T>>;
  startAutoRefetch(): void;
  stopAutoRefetch(): void;
}

export function createApiResource<T = unknown>(
  url: string,
  options: ApiOptions<T> = {}
): ApiResource<T> {
  const {
    enabled = true,
    refetchInterval,
    onSuccess,
    onError,
    ...axiosConfig
  } = options;

  let state: ApiState<T> = {
    data: null,
    loading: false,
    error: null,
  };

  let intervalId: ReturnType<typeof setInterval> | null = null;

  const setState = (nextState: ApiState<T>) => {
    state = nextState;
  };

  const fetch = async (): Promise<ApiState<T>> => {
    if (!enabled || !url) {
      return state;
    }

    setState({ ...state, loading: true, error: null });

    try {
      const response = await axios<T>(url, axiosConfig);
      setState({ data: response.data, loading: false, error: null });
      onSuccess?.(response.data);
    } catch (error) {
      const axiosError = error as AxiosError;
      const responseData = axiosError.response?.data as Record<string, unknown> | undefined;
      const errorMessage =
        responseData && typeof responseData === 'object' && 'message' in responseData
          ? String(responseData.message)
          : axiosError.message || 'An error occurred';

      setState({ data: null, loading: false, error: errorMessage });
      onError?.(axiosError);
    }

    return state;
  };

  const startAutoRefetch = () => {
    if (!refetchInterval || intervalId) return;
    intervalId = setInterval(fetch, refetchInterval);
  };

  const stopAutoRefetch = () => {
    if (!intervalId) return;
    clearInterval(intervalId);
    intervalId = null;
  };

  return {
    getState: () => state,
    fetch,
    startAutoRefetch,
    stopAutoRefetch,
  };
}

export async function apiMutation<T = unknown>(
  url: string,
  config?: AxiosRequestConfig,
  callbacks?: {
    onSuccess?: (data: T) => void;
    onError?: (error: AxiosError) => void;
  }
): Promise<T> {
  try {
    const response = await axios<T>(url, config);
    callbacks?.onSuccess?.(response.data);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    callbacks?.onError?.(axiosError);

    const responseData = axiosError.response?.data as Record<string, unknown> | undefined;
    const errorMessage =
      responseData && typeof responseData === 'object' && 'message' in responseData
        ? String(responseData.message)
        : axiosError.message || 'An error occurred';

    throw new Error(errorMessage);
  }
}