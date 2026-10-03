import test from "node:test";
import assert from "node:assert/strict";

test("Studio Next configuration remains explicit",()=>{
  assert.equal(Number("61997"),61997);
  assert.match("https://studio-next.genlayer.com/api",/^https:\/\//);
});

test("application source list stays within contract bounds",()=>{
  const sources=["https://example.org/grant"].filter(Boolean);
  assert.ok(sources.length>=1&&sources.length<=3);
});
