import { createAPIClient } from "@dddforum/shared/src/api";
import { appConfig } from "../config";

export const api = createAPIClient(appConfig.apiURL);
