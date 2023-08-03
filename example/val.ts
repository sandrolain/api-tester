import { $, compare } from "../src/validation";

console.log(
  compare(
    {
      one: 123,
      two: ["aaa@sandro.com", null, "aaaa"],
      three: "try",
      four: {
        x: "abc",
      },
      five: (one: number) => {},
      six: [1, 2, "a"],
      seven: [13242, "hello", false, 123],
      eight: [13242, "hello"],
    },
    {
      one: 1,
      two: [$.nullable($.email())],
      three: $.custom((value, path) => {
        throw new Error(`"${path}" with value "${value}" will never validate`);
      }),
      four: {
        x: $.match(/[0-9]+/),
      },
      five: (one: any, two: any) => null,
      six: $.size(2, [1]),
      seven: [1, "a", true],
      eight: [1, "a", true],
    }
  ).map((err) => err.message)
);
