/* eslint-disable prettier/prettier */
import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { UserPayload } from "../interfaces/auth.interface";

// Interface to type the request with user - compatible with frontend
interface RequestWithUser extends Request {
  user: UserPayload;
}

export const CurrentUser = createParamDecorator(
  <T extends keyof UserPayload>(
    data: T | undefined,
    ctx: ExecutionContext
  ): UserPayload | UserPayload[T] => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    const user: UserPayload = request.user;

    return data ? user[data] : user;
  }
);

export const AdminRequired = () => {
  return () => {
    // This decorator can be used with the AdminGuard
    // to document endpoints that require admin rights
  };
};
