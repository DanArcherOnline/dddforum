import { MarketingService } from "../../modules/marketing/marketingService"
import { PostsService } from "../../modules/posts/postsService"
import { UserService } from "../../modules/users/userService"

export interface Application {
  users: UserService;
  posts: PostsService;
  marketing: MarketingService;
}
