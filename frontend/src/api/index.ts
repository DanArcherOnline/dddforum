import { getApiBaseUrl } from "../api";
import { createUsersAPI } from "@dddforum/shared/src/api/users";
import { createPostsAPI } from "@dddforum/shared/src/api/posts";

export const api = {
  users: createUsersAPI(getApiBaseUrl()),
  posts: createPostsAPI(getApiBaseUrl()),
};
