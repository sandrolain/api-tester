type ValidationType =
  | "unknown"
  | "undefined"
  | "boolean"
  | "string"
  | "number"
  | "function"
  | "object"
  | "symbol"
  | "bigint"
  | "array"
  | "null";

type Path = (string | number)[];

interface ValidationArgs<T> {
  value: T;
  path: Path;
  errors: Error[];
}

class ValidationError<T> extends Error {
  constructor(readonly error: string, readonly path: Path, readonly value: T) {
    super(`${formatPath(path)}: ${error}`);
  }
}

function error<T>(message: string, args: ValidationArgs<T>) {
  const err = new ValidationError(message, args.path, args.value);
  args.errors.push(err);
}

export type ValidationFunction<T> = (args: ValidationArgs<T>) => void;

export class ValidationAssertion<T> {
  constructor(readonly match: ValidationFunction<T>) {}
}

export class $ {
  static exact(match: any) {
    return new ValidationAssertion((args) => {
      if (match === args.value) {
        return;
      }
      error(`Not exact equal`, args);
    });
  }

  static number() {
    return new ValidationAssertion((args) => {
      if (typeof args.value !== "number") {
        error(`Not a number`, args);
      }
    });
  }

  static string() {
    return new ValidationAssertion((args) => {
      if (args.value !== "string") {
        error(`Not a string`, args);
      }
    });
  }

  static regexp(regexp: RegExp, name?: string) {
    return new ValidationAssertion((args) => {
      if (typeof args.value !== "string") {
        return error(`Not a string to match ${name ?? regexp}`, args);
      }
      if (!regexp.test(args.value)) {
        error(`Not match ${name ?? regexp}`, args);
      }
    });
  }

  static email() {
    return this.regexp(
      /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i,
      "Email"
    );
  }

  static nullable(schema: any) {
    return new ValidationAssertion((args) => {
      if (args.value !== null) {
        compareObject(args.value, schema, [...args.path], args.errors);
      }
    });
  }
}

function compareObject<T = any>(
  value: T,
  schema: any,
  path: Path,
  errors: Error[]
) {
  if (schema instanceof ValidationAssertion) {
    return schema.match({
      value,
      path,
      errors,
    });
  }

  const valueType = getType(value);
  const schemaType = getType(schema);

  if (valueType !== schemaType) {
    return error(
      `Unmatching types, expected "${schemaType}", given "${valueType}"`,
      { path, errors, value }
    );
  }

  switch (schemaType) {
    case "array":
      if (schema.length > 0) {
        const schemaVal = schema[0];
        // TODO: nel caso di length > 1, comparare esattamente l'array
        for (let i = 0; i < (value as any[]).length; i++) {
          compareObject((value as any[])[i], schemaVal, [...path, i], errors);
        }
      }
      break;
    case "object":
      const valueKeys = new Set(Object.keys(value as object));
      const schemaEntries = Object.entries(schema as object);
      for (const [schemaKey, schemaVal] of schemaEntries) {
        compareObject(
          (value as any)[schemaKey],
          schemaVal,
          [...path, schemaKey],
          errors
        );
        valueKeys.delete(schemaKey);
      }
      for (const valueKey of valueKeys.values()) {
        error(`Extra key "${formatPath([...path, valueKey])}"`, {
          value,
          path,
          errors,
        });
      }
    default:
  }
}

export function compare<T = any>(value: T, schema: any): Error[] {
  const errors: Error[] = [];
  compareObject(value, schema, [], errors);
  return errors;
}

function getType(value: any): ValidationType {
  if (value === null) {
    return "null";
  }
  const type = typeof value;
  if (type === "object") {
    if (Array.isArray(value)) {
      return "array";
    }
  }
  return type;
}

function formatPath(path: Path): string {
  const res: string[] = [];
  for (const item of path) {
    if (typeof item === "string") {
      res.push(`.${item}`);
    } else {
      res.push(`[${item}]`);
    }
  }
  return res.join("");
}
