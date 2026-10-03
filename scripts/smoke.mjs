import { createAccount, createClient, isSuccessful } from "genlayer-js";
import { studioDevnet } from "genlayer-js/chains";

const contract=process.env.CONTRACT_ADDRESS?.trim(),raw=process.env.GENLAYER_PRIVATE_KEY?.trim(),source=process.env.DEMO_SOURCE_URL?.trim();
if(!contract||!raw||!source)throw new Error("CONTRACT_ADDRESS, GENLAYER_PRIVATE_KEY, and DEMO_SOURCE_URL are required");
const key=raw.startsWith("0x")?raw:`0x${raw}`;
const chain={...studioDevnet,id:61997,name:"GenLayer Studio Next",rpcUrls:{default:{http:["https://studio-next.genlayer.com/api"]}}};
const client=createClient({chain,account:createAccount(key)});
const caseId=`grant-demo-${Date.now().toString(36)}`;
const initial="Applicant is a registered organization operating in Morocco. Project reduces electricity consumption through automated scheduling for small workshops. The pilot has internal test results but does not yet have a public demonstration URL.";
const revised=initial+" Public demonstration URL is available at https://example.org/demo.";

async function write(label,functionName,args,intelligent=false){
  const fees=await client.estimateTransactionFees({leaderTimeunitsAllocation:intelligent?500n:180n,validatorTimeunitsAllocation:intelligent?600n:360n});
  const hash=await client.writeContract({address:contract,functionName,args,fees});console.log(`${label}_TX=${hash}`);
  const receipt=await client.waitForTransactionReceipt({hash,waitUntil:"finalized",retries:300,interval:3000,fullTransaction:true});
  const status=String(receipt.statusName??receipt.status??"unknown"),execution=String(receipt.txExecutionResultName??receipt.txExecutionResult??"unknown"),consensus=String(receipt.resultName??receipt.result_name??"unknown");
  console.log(`${label}_STATUS=${status};EXECUTION_RESULT=${execution};CONSENSUS=${consensus}`);
  if(!isSuccessful(receipt)||status!=="FINALIZED"||execution!=="FINISHED_WITH_RETURN"||consensus==="MAJORITY_DISAGREE")throw new Error(`${label} failed`);
  return hash;
}

await write("CREATE","create_case",[caseId,"Green workshop application","Check readiness for the Green Builders funding round before preparing the full application.",initial,JSON.stringify([source])]);
await write("ASSESS_INITIAL","assess",[caseId],true);
const first=await client.readContract({address:contract,functionName:"get_case",args:[caseId],jsonSafeReturn:true});
console.log(`INITIAL_STATE=${JSON.stringify(first)}`);
if(first.status!=="ASSESSED"||!first.assessment?.source_receipts?.length)throw new Error("Initial assessment did not persist receipts");
await write("REVISE","revise_profile",[caseId,revised]);
await write("ASSESS_REVISED","assess",[caseId],true);
await write("FINALIZE","finalize",[caseId]);
const finalState=await client.readContract({address:contract,functionName:"get_case",args:[caseId],jsonSafeReturn:true});
console.log(`FINAL_STATE=${JSON.stringify(finalState)}\nDEMO_CASE=${caseId}`);
if(finalState.status!=="FINAL"||finalState.revision!==1||!finalState.assessment?.source_receipts?.length)throw new Error("Final live state is incorrect");
