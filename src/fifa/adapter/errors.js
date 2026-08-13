// Erros de protocolo do FIFA19Adapter.

export const ERROR_CODES = Object.freeze({
  UNMAPPED_ROUTE: "UNMAPPED_ROUTE",
  UNKNOWN_SERVICE: "UNKNOWN_SERVICE",
  UNKNOWN_METHOD: "UNKNOWN_METHOD",
  PARSE_ERROR: "PARSE_ERROR"
});

export class ProtocolError extends Error {
  constructor(code, message, statusCode = 400) {
    super(message);
    this.name = "ProtocolError";
    this.code = code;
    this.statusCode = statusCode;
  }
}
