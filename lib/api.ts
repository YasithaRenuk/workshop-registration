import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { ApiError } from "./errors";

type Ctx<P> = { params: Promise<P> };

export function route<P = Record<string, never>>(
  handler: (req: NextRequest, ctx: Ctx<P>) => Promise<Response>
) {
  return async (req: NextRequest, ctx: Ctx<P>) => {
    try {
      return await handler(req, ctx);
    } catch (e) {
      if (e instanceof ApiError) {
        return NextResponse.json(
          { error: { code: e.code, message: e.message } },
          { status: e.status }
        );
      }
      if (e instanceof ZodError) {
        return NextResponse.json(
          {
            error: {
              code: "VALIDATION_ERROR",
              message: "Invalid input.",
              issues: e.issues.map((i) => ({
                path: i.path.join("."),
                message: i.message,
              })),
            },
          },
          { status: 400 }
        );
      }
      console.error(e);
      return NextResponse.json(
        { error: { code: "INTERNAL", message: "Something went wrong." } },
        { status: 500 }
      );
    }
  };
}

export async function readJson(req: Request) {
  try {
    return await req.json();
  } catch {
    throw new ApiError(400, "INVALID_JSON", "Request body must be valid JSON.");
  }
}