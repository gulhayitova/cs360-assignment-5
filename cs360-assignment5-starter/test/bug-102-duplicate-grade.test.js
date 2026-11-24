import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { TranscriptStore } from "../src/transcriptStore.js";

describe("BUG-102: duplicate grade for the same student and course", () => {
  test("a second addGrade throws and keeps the original grade", () => {
    const store = new TranscriptStore();
    const id = store.addStudent("Lin");
    store.addGrade(id, "CS360", 80);

    assert.throws(
      () => store.addGrade(id, "CS360", 95),
      /Grade already exists for course CS360/,
    );
    assert.equal(store.getGrade(id, "CS360"), 80);
  });

  test("course matching is case-insensitive", () => {
    const store = new TranscriptStore();
    const id = store.addStudent("Lin");
    store.addGrade(id, "cs360", 80);

    assert.throws(
      () => store.addGrade(id, " CS360 ", 95),
      /Grade already exists for course CS360/,
    );
  });

  test("changeGrade still corrects an existing grade", () => {
    const store = new TranscriptStore();
    const id = store.addStudent("Lin");
    store.addGrade(id, "CS360", 80);

    store.changeGrade(id, "CS360", 95);

    assert.equal(store.getGrade(id, "CS360"), 95);
  });

  test("different courses and different students are unaffected", () => {
    const store = new TranscriptStore();
    const a = store.addStudent("Lin");
    const b = store.addStudent("Noah");

    store.addGrade(a, "CS360", 80);
    store.addGrade(a, "CS101", 70);
    store.addGrade(b, "CS360", 60);

    assert.equal(store.getGrade(b, "CS360"), 60);
  });

  test("HTTP: duplicate POST returns 409 (not 201)", async () => {
    const { createAppServer } = await import("../src/server.js");
    const server = createAppServer();
    await new Promise((r) => server.listen(0, r));
    const base = `http://localhost:${server.address().port}`;
    try {
      const { studentID } = await (
        await fetch(`${base}/transcripts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Lin" }),
        })
      ).json();
      const post = (grade) =>
        fetch(`${base}/transcripts/${studentID}/CS360`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ grade }),
        });
      assert.equal((await post(80)).status, 201);
      assert.equal((await post(95)).status, 409);
    } finally {
      await new Promise((r) => server.close(r));
    }
  });
});