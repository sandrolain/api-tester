import test, { before, after } from "node:test";
import { get, postJson, url } from "../src/client";
import { GenericContainer, StartedTestContainer } from "testcontainers";

test("HTTP tests", async () => {
  const container = await new GenericContainer("kennethreitz/httpbin")
    .withExposedPorts({
      container: 80,
      host: 80,
    })
    .start();

  after(() => {
    container.stop();
  });

  await test("GET 200", async () => {
    const res = await get("http://localhost/status/200");
    res.expectSuccess();
  });
  await test("POST 404", async () => {
    const res = await postJson("http://localhost/status/404", { foo: "bar" });
    res.expectClientError();
  });
  await test("POST", async () => {
    const res = await postJson("http://localhost/anything", { foo: "bar" });
    res.expectSuccess();
  });
  await test("Redirect", async () => {
    const res = await get(
      url("http://localhost/redirect-to", {
        url: "http://localhost/status/404",
      })
    );
    res.expectRedirect();
  });
});
