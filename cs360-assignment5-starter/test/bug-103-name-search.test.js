import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { TranscriptStore } from "../src/transcriptStore.js";

describe("BUG-103: name search trims whitespace and ignores case", () => {
  test("matches regardless of case and surrounding whitespace", () => {
    const store = new TranscriptStore();
    const id = store.addStudent("Ali Valiyev");

    assert.deepEqual(store.getStudentIDs("ali valiyev"), [id]);
    assert.deepEqual(store.getStudentIDs("  ALI VALIYEV  "), [id]);
  });

  test("keeps the stored display name unchanged", () => {
    const store = new TranscriptStore();
    const id = store.addStudent("Ali Valiyev");

    store.getStudentIDs("  ali valiyev ");

    assert.equal(store.getTranscript(id).student.studentName, "Ali Valiyev");
  });

  test("does not collapse internal whitespace and still excludes other names", () => {
    const store = new TranscriptStore();
    store.addStudent("Ali Valiyev");
    store.addStudent("Ali Karimov");

    assert.deepEqual(store.getStudentIDs("ali  valiyev"), []);
    assert.equal(store.getStudentIDs("ALI KARIMOV").length, 1);
  });
});