import { createUsersAPI } from "./users";
import { createMarketingAPI } from "./marketing";
import { createPostsAPI } from "./posts";

export const createAPIClient = (apiURL: string) => {
  return {
    users: createUsersAPI(apiURL),
    posts: createPostsAPI(apiURL),
    marketing: createMarketingAPI(apiURL),
  };
};
