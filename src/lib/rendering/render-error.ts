export class RenderError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 500,
    public readonly code = "RENDER_FAILED",
  ) {
    super(message);
    this.name = "RenderError";
  }
}
