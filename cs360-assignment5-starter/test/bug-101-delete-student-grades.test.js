import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import { createAppServer } from "../src/server.js";
import { TranscriptStore } from "../src/transcriptStore.js";

describe("BUG-101: deleting a student removes stored grades", () => {
  test("store: grades are gone after deleteStudent", () => {
    const store = new TranscriptStore();
    const studentID = store.addStudent("Ada");
    store.addGrade(studentID, "CS360", 90);

    store.deleteStudent(studentID);

    assert.equal(store.getGrade(studentID, "CS360"), undefined);
    assert.throws(() => store.getTranscript(studentID), /Student not found/);
  });

  describe("HTTP", () => {
    let server;
    let baseURL;

    before(async () => {
      server = createAppServer();
      await new Promise((resolve) => server.listen(0, resolve));
      baseURL = `http://localhost:${server.address().port}`;
    });

    after(async () => {
      await new Promise((resolve) => server.close(resolve));
    });

    const call = (method, path, body) =>
      fetch(`${baseURL}${path}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      });

    test("grade request for a deleted student returns 404", async () => {
      const created = await call("POST", "/transcripts", { name: "Ada" });
      const { studentID } = await created.json();
      await call("POST", `/transcripts/${studentID}/CS360`, { grade: 90 });
      assert.equal((await call("GET", `/transcripts/${studentID}/CS360`)).status, 200);

      assert.equal((await call("DELETE", `/transcripts/${studentID}`)).status, 204);

      assert.equal((await call("GET", `/transcripts/${studentID}/CS360`)).status, 404);
    });
  });
});