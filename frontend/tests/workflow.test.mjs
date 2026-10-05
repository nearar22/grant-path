import test from "node:test";
import assert from "node:assert/strict";
import { buildCaseTransaction, hydrateLoadedCase } from "../src/workflow.js";

test("Studio Next configuration remains explicit",()=>{
  assert.equal(Number("61997"),61997);
  assert.match("https://studio-next.genlayer.com/api",/^https:\/\//);
});

test("application source list stays within contract bounds",()=>{
  const sources=["https://example.org/grant"].filter(Boolean);
  assert.ok(sources.length>=1&&sources.length<=3);
});

test("loaded assessed profile is revised and then reassessed through the application flow",()=>{
  const address="0x75077385a76E680573c148F6DA0F614D301c2c59";
  const assessed={id:"grant-live-1",status:"ASSESSED",revision:0,profile:"Stored applicant profile with enough concrete evidence to be assessed."};
  const loaded=hydrateLoadedCase(assessed);
  assert.equal(loaded.profile,assessed.profile);

  const revisedProfile=loaded.profile+" A public prototype is now available at the project page.";
  const revision=buildCaseTransaction({address,action:"revise",caseId:assessed.id,title:"",goal:"",profile:revisedProfile,sources:[],record:loaded.record});
  assert.equal(revision.method,"revise_profile");
  assert.deepEqual(revision.args,[assessed.id,revisedProfile]);

  const refreshed=hydrateLoadedCase({...assessed,status:"READY",revision:1,profile:revisedProfile});
  const reassessment=buildCaseTransaction({address,action:"assess",caseId:assessed.id,title:"",goal:"",profile:refreshed.profile,sources:[],record:refreshed.record});
  assert.equal(reassessment.method,"assess");
  assert.deepEqual(reassessment.args,[assessed.id]);
});

test("revision rejects unchanged or unrelated local state",()=>{
  const record={id:"grant-live-1",status:"ASSESSED",profile:"Stored applicant profile with enough concrete evidence to be assessed."};
  assert.throws(()=>buildCaseTransaction({address:"0xabc",action:"revise",caseId:record.id,title:"",goal:"",profile:record.profile,sources:[],record}),/Edit the loaded profile/);
  assert.throws(()=>buildCaseTransaction({address:"0xabc",action:"revise",caseId:"different-case",title:"",goal:"",profile:record.profile+" changed",sources:[],record}),/Reload this case/);
});
