import { getApiBaseUrl } from "../api";
import { createAPIClient } from "@dddforum/shared/src/api";

export const api = createAPIClient(getApiBaseUrl());
