export class GastroError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GastroError";
  }
}
