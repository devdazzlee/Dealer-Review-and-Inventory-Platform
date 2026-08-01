import {
  ListDealersQuery,
  CreateDealerBody,
} from "../validators/dealer.validator";
import type { SubmitReviewInput } from "../validators/review.validator";

declare global {
  namespace Express {
    interface Request {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      validatedQuery?: any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      validatedBody?: any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      validatedParams?: any;
      visitorId?: string;
    }
  }
}

export {};

// Keep imports referenced so types stay available to consumers
export type { ListDealersQuery, CreateDealerBody, SubmitReviewInput };
