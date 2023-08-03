import assert from "assert/strict";
import { compare } from "./validation";

const JsonHeaders: HeadersEntries = [["Content-Type", "application/json"]];

export async function get<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<ResponseResult<T>> {
  init = initInit(init);
  init.method = "GET";
  init.redirect = "manual";
  return getResponseResult(await fetch(input, init));
}

export async function postJson<R = any, T = any>(
  input: RequestInfo | URL,
  body: R,
  init?: RequestInit
): Promise<ResponseResult<T>> {
  init = initInit(init);
  init.method = "POST";
  init.body = JSON.stringify(body);
  init.redirect = "manual";
  appendHeaders(init, JsonHeaders);
  return getResponseResult(await fetch(input, init));
}

function initInit(init?: RequestInit): RequestInit {
  return init ?? {};
}

function initHeaders(init: RequestInit) {
  if (!init.headers) {
    init.headers = new Headers();
  }
}

function appendHeaders(init: RequestInit, headers: HeadersEntries) {
  initHeaders(init);
  if (init.headers instanceof Headers) {
    for (const [n, v] of headers) {
      init.headers.append(n, v);
    }
    return;
  }
  if (init.headers instanceof Array) {
    init.headers.push(...headers);
    return;
  }
  if (init.headers) {
    for (const [n, v] of headers) {
      init.headers[n] = v;
    }
  }
}

type HeadersEntries = [string, string][];
type SearchParamsEntries = [string, string][];
type SearchParamsRecord = Record<string, string>;
type SearchParamsInit =
  | URLSearchParams
  | SearchParamsEntries
  | SearchParamsRecord;

function headersEntries(headers: HeadersInit): HeadersEntries {
  if (headers instanceof Headers) {
    return [...headers.entries()];
  }
  if (headers instanceof Array) {
    return [...headers];
  }
  return [...Object.entries(headers)];
}

async function getResponseResult<T>(
  response: Response
): Promise<ResponseResult<T>> {
  let body: T | null = null;
  switch (response.headers.get("content-type")) {
    case "application/json":
      body = await response.json();
  }
  return new ResponseResult(response, body);
}

class ResponseResult<T = unknown> {
  constructor(
    public readonly response: Response,
    public readonly body: T | null
  ) {}

  expectInformational() {
    const { status } = this.response;
    if (status >= 0 && status < 100) {
      return;
    }
    throw new assert.AssertionError({
      message: `Expected Informational Status but was ${status}`,
      stackStartFn: ResponseResult.prototype.expectInformational,
    });
  }

  expectSuccess() {
    const { status } = this.response;
    if (status >= 200 && status < 300) {
      return;
    }
    throw new assert.AssertionError({
      message: `Expected Success Status but was ${status}`,
      stackStartFn: ResponseResult.prototype.expectSuccess,
    });
  }

  expectRedirect() {
    const { status } = this.response;
    if (status >= 300 && status < 400) {
      return;
    }
    throw new assert.AssertionError({
      message: `Expected Redirect Status but was ${status}`,
      stackStartFn: ResponseResult.prototype.expectRedirect,
    });
  }

  expectClientError() {
    const { status } = this.response;
    if (status >= 400 && status < 500) {
      return;
    }
    throw new assert.AssertionError({
      message: `Expected Client Error Status but was ${status}`,
      stackStartFn: ResponseResult.prototype.expectClientError,
    });
  }

  expectServerError() {
    const { status } = this.response;
    if (status >= 500 && status < 600) {
      return;
    }
    throw new assert.AssertionError({
      message: `Expected Server Error Status but was ${status}`,
      stackStartFn: ResponseResult.prototype.expectServerError,
    });
  }

  expectBodySchema(schema: any) {
    const errors = compare(this.body, schema);
    if (errors.length === 0) {
      return;
    }
    throw new assert.AssertionError({
      message: `Invalid body schema: ${errors
        .map((err) => err.message)
        .join(". ")}`,
      stackStartFn: ResponseResult.prototype.expectBodySchema,
    });
  }
}

export function url(url: string, params?: SearchParamsInit): URL {
  const res = new URL(url);
  if (params) {
    appendParams(res, params);
  }
  return res;
}

export function searchParams(params: SearchParamsInit): URLSearchParams {
  return new URLSearchParams(params);
}

export function appendParams(url: URL, params: SearchParamsInit) {
  for (const [n, v] of searchParams(params).entries()) {
    url.searchParams.append(n, v);
  }
}
