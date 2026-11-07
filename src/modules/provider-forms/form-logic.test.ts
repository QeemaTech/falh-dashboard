import test from "node:test";
import assert from "node:assert/strict";
import {
  buildTypeFilterOptions,
  emptyQuestion,
  filterOptionLabel,
  formatAnswerValue,
  isQuestionVisible,
  mappingChoices,
  moveId,
  orphanAnswerKeys,
  suggestKey,
  validateQuestionDraft,
  visibleQuestions,
} from "./form-logic.ts";
import type { FilterType, FormQuestion } from "../../services/provider-forms-api.ts";

const q = (over: Partial<FormQuestion> = {}): FormQuestion => ({
  ...emptyQuestion(),
  key: "someKey",
  labelAr: "سؤال",
  labelEn: "Question",
  ...over,
});

// ---------- Dynamic provider type filters ----------

const types: FilterType[] = [
  { id: "1", code: "COMPANY", nameAr: "شركة", nameEn: "Company", isActive: true, archived: false },
  { id: "2", code: "AGRICULTURE", nameAr: "الزراعة", nameEn: "Agriculture", isActive: true, archived: false, providersCount: 3 },
  { id: "3", code: "OLD_TYPE", nameAr: "قديم", nameEn: "Old", isActive: false, archived: true, providersCount: 1 },
  { id: "4", code: "PAUSED", nameAr: "", nameEn: "Paused", isActive: false, archived: false },
];

test("filters come from backend types, never include COMPANY, and keep archived/inactive ones", () => {
  const options = buildTypeFilterOptions(types, "en");
  assert.deepEqual(options.map((o) => o.code), ["AGRICULTURE", "OLD_TYPE", "PAUSED"]);
  assert.equal(options.some((o) => o.code === "COMPANY"), false);
  const suffix = { archived: "Archived", inactive: "Inactive" };
  assert.deepEqual(options.map((o) => filterOptionLabel(o, suffix)), ["Agriculture", "Old (Archived)", "Paused (Inactive)"]);
});

test("filter labels follow the language and fall back to the other language", () => {
  const ar = buildTypeFilterOptions(types, "ar");
  assert.equal(ar[0].label, "الزراعة");
  assert.equal(ar[2].label, "Paused", "empty Arabic name falls back to English");
});

test("a brand-new type shows up in filters without any code change", () => {
  const added: FilterType[] = [...types, { id: "9", code: "BEE_KEEPING", nameAr: "نحالة", nameEn: "Bee keeping", isActive: true, archived: false }];
  assert.ok(buildTypeFilterOptions(added, "en").some((o) => o.code === "BEE_KEEPING"));
});

// ---------- Form builder ----------

test("question draft: key, labels and reserved keys", () => {
  assert.deepEqual(validateQuestionDraft(q()), {});
  assert.equal(validateQuestionDraft(q({ key: "Bad Key" })).key, "invalidKey");
  assert.equal(validateQuestionDraft(q({ key: "city" })).key, "reservedKey");
  assert.equal(validateQuestionDraft(q({ key: "dup" }), ["dup"], true).key, "duplicateKey");
  assert.equal(validateQuestionDraft(q({ key: "dup" }), ["dup"], false).key, undefined, "editing keeps its own key");
  assert.equal(validateQuestionDraft(q({ labelEn: "" })).labelEn, "required");
});

test("question draft: options, ranges, mapping and public rules", () => {
  assert.equal(validateQuestionDraft(q({ fieldType: "SELECT" })).options, "optionsRequired");
  const opt = (value: string) => ({ value, labelAr: "أ", labelEn: "A" });
  assert.equal(validateQuestionDraft(q({ fieldType: "RADIO", options: [opt("a"), opt("a")] })).options, "optionDuplicate");
  assert.equal(validateQuestionDraft(q({ fieldType: "RADIO", options: [opt("bad value")] })).options, "optionInvalid");
  assert.deepEqual(validateQuestionDraft(q({ fieldType: "RADIO", options: [opt("a"), opt("b")] })), {});
  assert.equal(validateQuestionDraft(q({ validation: { minLength: 9, maxLength: 3 } })).validation, "rangeInvalid");
  assert.equal(validateQuestionDraft(q({ fieldType: "NUMBER", mapsTo: "yearsOfExperience" })).mapsTo, "mappingYears");
  assert.deepEqual(
    validateQuestionDraft(q({ fieldType: "NUMBER", mapsTo: "yearsOfExperience", validation: { integerOnly: true, min: 0 } })),
    {}
  );
  assert.equal(validateQuestionDraft(q({ mapsTo: "specializations" })).mapsTo, "mappingType");
  assert.equal(validateQuestionDraft(q({ fieldType: "FILE", isPublic: true })).isPublic, "filePublic");
});

test("mapping choices respect the field type and exclude targets already used", () => {
  assert.deepEqual(mappingChoices("TEXTAREA"), ["bio", "education"]);
  assert.deepEqual(mappingChoices("TEXTAREA", ["bio"]), ["education"]);
  assert.deepEqual(mappingChoices("MULTI_SELECT"), ["specializations"]);
  assert.deepEqual(mappingChoices("DATE"), []);
});

test("suggestKey builds valid keys from English labels", () => {
  assert.equal(suggestKey("Years of experience"), "yearsOfExperience");
  assert.equal(suggestKey("  Do you have a licence? "), "doYouHaveALicence");
  assert.equal(suggestKey("123 go"), "q123Go");
  assert.equal(suggestKey("???"), "");
});

test("reordering moves one question and is a no-op at the edges", () => {
  assert.deepEqual(moveId(["a", "b", "c"], "b", -1), ["b", "a", "c"]);
  assert.deepEqual(moveId(["a", "b", "c"], "b", 1), ["a", "c", "b"]);
  assert.deepEqual(moveId(["a", "b", "c"], "a", -1), ["a", "b", "c"]);
  assert.deepEqual(moveId(["a", "b", "c"], "c", 1), ["a", "b", "c"]);
  assert.deepEqual(moveId(["a"], "zzz", 1), ["a"]);
});

// ---------- Form preview ----------

test("preview hides conditional questions until their condition holds, in order", () => {
  const form = [
    q({ key: "has", sortOrder: 20, fieldType: "RADIO", options: [{ value: "yes", labelAr: "نعم", labelEn: "Yes" }] }),
    q({ key: "name", sortOrder: 10 }),
    q({ key: "detail", sortOrder: 30, visibleWhen: { questionKey: "has", operator: "equals", value: "yes" } }),
    q({ key: "any", sortOrder: 40, visibleWhen: { questionKey: "has", operator: "in", value: ["yes", "maybe"] } }),
  ];
  assert.deepEqual(visibleQuestions(form, {}).map((x) => x.key), ["name", "has"]);
  assert.deepEqual(visibleQuestions(form, { has: "yes" }).map((x) => x.key), ["name", "has", "detail", "any"]);
  assert.equal(isQuestionVisible(q({ visibleWhen: { questionKey: "tick", operator: "equals", value: true } }), { tick: true }), true);
  assert.equal(isQuestionVisible(q({ visibleWhen: { questionKey: "tick", operator: "equals", value: true } }), { tick: false }), false);
});

// ---------- Historical answers display ----------

test("answers are displayed with the labels of the version they were submitted with", () => {
  const radio = q({ key: "lic", fieldType: "RADIO", options: [{ value: "yes", labelAr: "نعم", labelEn: "Yes" }, { value: "no", labelAr: "لا", labelEn: "No" }] });
  assert.deepEqual(formatAnswerValue(radio, "yes", "en"), { kind: "text", text: "Yes" });
  assert.deepEqual(formatAnswerValue(radio, "yes", "ar"), { kind: "text", text: "نعم" });
  assert.deepEqual(formatAnswerValue(radio, "retired_value", "en"), { kind: "text", text: "retired_value" }, "unknown option values are shown, not lost");

  const multi = q({ key: "areas", fieldType: "MULTI_SELECT", options: [{ value: "a", labelAr: "تربة", labelEn: "Soil" }, { value: "b", labelAr: "ري", labelEn: "Water" }] });
  assert.deepEqual(formatAnswerValue(multi, ["a", "b"], "en"), { kind: "text", text: "Soil, Water" });
  assert.deepEqual(formatAnswerValue(multi, ["a", "b"], "ar"), { kind: "text", text: "تربة، ري" });

  assert.deepEqual(formatAnswerValue(q({ fieldType: "CHECKBOX" }), true, "en"), { kind: "text", text: "Yes" });
  assert.deepEqual(formatAnswerValue(q({ fieldType: "NUMBER" }), 7, "en"), { kind: "text", text: "7" });
  assert.deepEqual(formatAnswerValue(q({ fieldType: "FILE" }), ["/uploads/a.pdf"], "en"), { kind: "files", paths: ["/uploads/a.pdf"] });
  assert.deepEqual(formatAnswerValue(q(), undefined, "en"), { kind: "text", text: "-" });
  assert.deepEqual(formatAnswerValue(multi, [], "en"), { kind: "text", text: "-" });
});

test("answers of questions missing from the version are reported instead of dropped", () => {
  assert.deepEqual(orphanAnswerKeys([q({ key: "a" })], { a: 1, gone: 2 }), ["gone"]);
});
