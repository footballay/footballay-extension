import * as footballayApi from "./footballayApi";
import {
  GET_AVAILABLE_LEAGUES,
  type FootballayApiResponse
} from "@/shared/footballayApiProtocol";

type PayloadParseResult<T> = { ok: true; value: T } | { ok: false };

type FootballayApiOperation = {
  handle: (payload: unknown) => Promise<FootballayApiResponse<unknown>>;
};

/**
 * This registry is the runtime source of truth for supported operations.
 * Adding an operation means adding its payload parser and execution here;
 * no separate type set or allowlist needs to be maintained.
 */
const footballayApiOperations = {
  [GET_AVAILABLE_LEAGUES]: defineOperation(parseNoPayload, () => footballayApi.getAvailableLeagues())
} satisfies Record<string, FootballayApiOperation>;

export async function handleApiRequest(message: unknown): Promise<FootballayApiResponse<unknown>> {
  const request = parseRequestEnvelope(message);
  if (!request) {
    return invalidRequest();
  }

  if (!Object.hasOwn(footballayApiOperations, request.type)) {
    return invalidRequest();
  }

  const operation = footballayApiOperations[request.type as keyof typeof footballayApiOperations];
  return operation.handle(request.payload);
}

function parseRequestEnvelope(value: unknown): { type: string; payload?: unknown } | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const request = value as Record<string, unknown>;
  if (typeof request.type !== "string") return undefined;
  if (hasUnsupportedEnvelopeField(request)) return undefined;
  return { type: request.type, payload: request.payload };
}

function hasUnsupportedEnvelopeField(record: Record<string, unknown>): boolean {
  return !Object.keys(record).every((key) => key === "type" || key === "payload");
}

function defineOperation<TPayload, TResponse>(
    parsePayload: (payload: unknown) => PayloadParseResult<TPayload>,
    execute: (payload: TPayload) => Promise<TResponse>,
): FootballayApiOperation {
  return {
    async handle(payload) {
      const parsedPayload = parsePayload(payload);
      if (!parsedPayload.ok) return invalidRequest();

      try {
        return { ok: true, data: await execute(parsedPayload.value) };
      } catch (error) {
        return {
          ok: false,
          error: error instanceof Error ? error.message : "Footballay API request failed"
        };
      }
    }
  };
}

function parseNoPayload(payload: unknown): PayloadParseResult<undefined> {
    return payload === undefined ? { ok: true, value: undefined } : { ok: false };
}

function invalidRequest(): FootballayApiResponse<never> {
  return { ok: false, error: "Invalid Footballay API request" };
}
