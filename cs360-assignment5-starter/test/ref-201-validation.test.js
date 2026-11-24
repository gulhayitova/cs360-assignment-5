import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { normalizeCourse, requireCourse, requireGrade } from "../src/validation.js";
import { TranscriptStore } from "../src/transcriptStore.js";

describe("REF-201: shared validation", () => {
  test("requireCourse trims, upper-cases, and rejects blanks", () => {
    assert.equal(requireCourse("  cs360 "), "CS360");
    assert.throws(() => requireCourse("   "), /Course name is required/);
    assert.throws(() => requireCourse(undefined), /Course name is required/);
  });

  test("requireGrade accepts integers 0..100 (including numeric strings)", () => {
    assert.equal(requireGrade("85"), 85);
    assert.equal(requireGrade(0), 0);
    assert.equal(requireGrade(100), 100);
    for (const bad of [-1, 101, 85.5, "abc", undefined, NaN]) {
      assert.throws(() => requireGrade(bad), /Grade must be an integer from 0 to 100/);
    }
  });

  test("normalizeCourse never throws", () => {
    assert.equal(normalizeCourse(" cs101 "), "CS101");
    assert.equal(normalizeCourse(undefined), "");
  });

  test("addGrade and changeGrade keep their public error messages", () => {
    const store = new TranscriptStore();
    const id = store.addStudent("Noah");
    store.addGrade(id, "CS360", 70);

    for (const fn of ["addGrade", "changeGrade"]) {
      assert.throws(() => store[fn](id, "", 90), /Course name is required/);
      assert.throws(() => store[fn](id, "CS360", 101), /Grade must be an integer from 0 to 100/);
    }
    assert.throws(() => store.changeGrade(id, "NOPE", 90), /Grade not found for course NOPE/);
  });
});