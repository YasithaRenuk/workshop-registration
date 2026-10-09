export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
  }
}

export function isUniqueViolation(e: unknown) {
  return (
    typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002"
  );
}