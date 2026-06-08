import { APIResponse, GenericErrors } from "./types";

export type AddEmailToListResponse = APIResponse<boolean, GenericErrors>;

export const createMarketingAPI = (apiURL: string) => {
  return {
    addEmailToList: async (email: string): Promise<AddEmailToListResponse> => {
      try {
        const successResponse = await fetch(`${apiURL}/marketing/new`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        if (!successResponse.ok) throw successResponse;
        return await successResponse.json() as AddEmailToListResponse;
      } catch (err) {
        // @ts-ignore
        return await err.json() as AddEmailToListResponse;
      }
    },
  };
};
