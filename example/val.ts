import { $, compare } from "../src/validation";

console.log(
  compare(
    {
      one: 123,
      two: ["aaa@sandro.com", null, "aaaa"],
    },
    {
      one: 1,
      two: [$.nullable($.email())],
    }
  ).map((err) => err.message)
);
