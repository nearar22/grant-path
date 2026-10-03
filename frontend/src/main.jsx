import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "genlayer-js";
import { studioDevnet } from "genlayer-js/chains";
import { createTransactionKit } from "@genlayer/transaction-kit";
import { GenLayerTransactionPanel } from "@genlayer/transaction-kit-react";
import { ArrowRight, BookOpen, Check, CircleAlert, ExternalLink, FileSearch, Flag, LoaderCircle, LockKeyhole, Plus, RotateCcw, Sparkles, Wallet, X } from "lucide-react";
import "./styles.css";
import "./tx.css";

const ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "";
const RPC = import.meta.env.VITE_GENLAYER_RPC_URL || "https://studio-next.genlayer.com/api";
const CHAIN_ID = Number(import.meta.env.VITE_GENLAYER_CHAIN_ID || "61997");
const CHAIN = { ...studioDevnet, id: CHAIN_ID, name: "GenLayer Studio Next", rpcUrls: { default: { http: [RPC] } } };
const EXPLORER = "https://explorer-studio-dev.genlayer.com";
const DEMO_SOURCE = "https://raw.githubusercontent.com/nearar22/grant-path/main/docs/demo-grant.txt";

const clean = value => value instanceof Map ? Object.fromEntries([...value].map(([k,v])=>[k,clean(v)])) : Array.isArray(value) ? value.map(clean) : value && typeof value === "object" ? Object.fromEntries(Object.entries(value).map(([k,v])=>[k,clean(v)])) : typeof value === "bigint" ? Number(value) : value;
const short = value => value ? `${value.slice(0,6)}…${value.slice(-4)}` : "";
const makeId = () => `grant-${Date.now().toString().slice(-8)}`;

function App(){
  const [caseId,setCaseId]=useState("grantpath-demo01");
  const [title,setTitle]=useState("Community energy pilot");
  const [goal,setGoal]=useState("Check whether this community energy project is ready for the published funding round before investing time in a full application.");
  const [profile,setProfile]=useState("Our cooperative is registered in Morocco and works with small manufacturers. The project reduces electricity use through automated machine scheduling. We have a working internal prototype, but no public demonstration page yet.");
  const [sources,setSources]=useState([DEMO_SOURCE]);
  const [record,setRecord]=useState(null);
  const [wallet,setWallet]=useState(null);
  const [action,setAction]=useState(null);
  const [notice,setNotice]=useState("");
  const [loading,setLoading]=useState(false);
  const client=useMemo(()=>createClient({chain:CHAIN}),[]);
  const kit=useMemo(()=>wallet&&window.ethereum?createTransactionKit({chain:CHAIN,provider:window.ethereum,account:wallet}):null,[wallet]);

  const read=useCallback(async()=>{
    if(!ADDRESS||!caseId.trim())return;
    setLoading(true);
    try{setRecord(clean(await client.readContract({address:ADDRESS,functionName:"get_case",args:[caseId.trim()],jsonSafeReturn:true})));setNotice("");}
    catch{setRecord(null);setNotice("No on-chain application was found for this ID. Start a fresh path or load the public demo.");}
    finally{setLoading(false);}
  },[caseId,client]);
  useEffect(()=>{void read();},[read]);

  async function connect(){
    if(!window.ethereum){setNotice("Install a browser wallet to write. Public assessment records remain readable without one.");return;}
    try{
      const accounts=await window.ethereum.request({method:"eth_requestAccounts"});
      const hex=`0x${CHAIN_ID.toString(16)}`;
      try{await window.ethereum.request({method:"wallet_switchEthereumChain",params:[{chainId:hex}]});}
      catch(error){if(error?.code!==4902)throw error;await window.ethereum.request({method:"wallet_addEthereumChain",params:[{chainId:hex,chainName:"GenLayer Studio Next",rpcUrls:[RPC],nativeCurrency:{name:"GEN",symbol:"GEN",decimals:18}}]});}
      setWallet(accounts[0]);setNotice("");
    }catch(error){setNotice(error?.message||"Wallet connection did not complete.");}
  }

  const tx=useMemo(()=>{
    if(!ADDRESS||!action)return null;
    const base={kind:"write",address:ADDRESS};
    if(action==="create")return {...base,method:"create_case",args:[caseId.trim(),title.trim(),goal.trim(),profile.trim(),JSON.stringify(sources.map(x=>x.trim()).filter(Boolean))]};
    if(action==="assess")return {...base,method:"assess",args:[caseId.trim()]};
    if(action==="revise")return {...base,method:"revise_profile",args:[caseId.trim(),profile.trim()]};
    return {...base,method:"finalize",args:[caseId.trim()]};
  },[action,caseId,title,goal,profile,sources]);
  function submit(next){if(!kit){setNotice("Connect your Studio Next wallet first.");return;}setNotice("");setAction(next);}
  function done(status){if(status.phase==="finalized"){setAction(null);if(status.successful){void read();}else setNotice(`Transaction failed: ${status.executionResultName||status.statusName||"contract rejected the input"}.`);}}
  const assessment=record?.assessment||null;
  const currentStep=!record?1:record.status==="READY"?2:3;
  const statusTone={PASS:"pass",FAIL:"fail",MISSING:"missing"};

  return <div className="shell">
    <header className="topbar"><a className="wordmark" href="#"><span>GP</span><b>GrantPath</b></a><div className="top-actions"><span className="network"><i/> STUDIO NEXT · {CHAIN_ID}</span><button className="wallet" onClick={connect}><Wallet size={16}/>{wallet?short(wallet):"Connect wallet"}</button></div></header>
    <main>
      <section className="intro"><p className="kicker">APPLICATION READINESS, WITHOUT THE GUESSWORK</p><h1>Find the missing proof<br/><em>before</em> you apply.</h1><p className="dek">GrantPath reads the official call, compares it with your real project profile, and leaves a validator-audited trail for every pass, blocker, and unanswered requirement.</p><div className="trust-line"><LockKeyhole size={16}/><span>Advisory only. Sources are fetched by GenLayer validators and bound to SHA-256 receipts.</span></div></section>
      <section className="path-grid">
        <nav className="steps" aria-label="Application path">
          {[{n:1,t:"Frame the application",s:"Goal, profile, official call"},{n:2,t:"Run the source audit",s:"Validator consensus"},{n:3,t:"Close the evidence gaps",s:"Revise or finalize"}].map(step=><div className={`step ${currentStep>=step.n?"active":""}`} key={step.n}><span>{currentStep>step.n?<Check size={16}/>:step.n}</span><div><b>{step.t}</b><small>{step.s}</small></div></div>)}
          <div className="case-loader"><label>Public case ID</label><div><input value={caseId} onChange={e=>setCaseId(e.target.value)}/><button onClick={()=>void read()} aria-label="Load case">{loading?<LoaderCircle className="spin" size={17}/>:<ArrowRight size={17}/>}</button></div></div>
          {ADDRESS&&<a className="contract-link" href={`${EXPLORER}/address/${ADDRESS}`} target="_blank">View contract <ExternalLink size={13}/></a>}
        </nav>

        <div className="workspace">
          {notice&&<div className="notice"><CircleAlert size={17}/><span>{notice}</span><button onClick={()=>setNotice("")}><X size={15}/></button></div>}
          {!record&&<section className="application-sheet">
            <div className="sheet-number">01</div><div className="sheet-head"><p>YOUR WORKING FILE</p><h2>Start with what the grant will actually see.</h2></div>
            <label className="field"><span>Application title</span><input value={title} onChange={e=>setTitle(e.target.value)} maxLength={120}/></label>
            <label className="field"><span>What are you trying to fund?</span><textarea value={goal} onChange={e=>setGoal(e.target.value)} rows={3} maxLength={800}/><small>{goal.length}/800</small></label>
            <label className="field profile"><span>Your evidence-bearing profile</span><textarea value={profile} onChange={e=>setProfile(e.target.value)} rows={7} maxLength={5000}/><small>Use concrete facts the official criteria can test. {profile.length}/5000</small></label>
            <div className="source-ribbon"><div className="ribbon-title"><BookOpen size={18}/><div><b>Official call sources</b><small>One to three public HTTPS pages</small></div></div>{sources.map((source,index)=><div className="source-line" key={index}><span>{String(index+1).padStart(2,"0")}</span><input aria-label={`Source ${index+1}`} value={source} onChange={e=>setSources(list=>list.map((x,i)=>i===index?e.target.value:x))}/>{sources.length>1&&<button onClick={()=>setSources(list=>list.filter((_,i)=>i!==index))}><X size={15}/></button>}</div>)}{sources.length<3&&<button className="add-source" onClick={()=>setSources(list=>[...list,""])}><Plus size={15}/> Add another official page</button>}</div>
            <button className="primary" onClick={()=>submit("create")}>Open this application path <ArrowRight size={18}/></button>
          </section>}

          {record&&<section className="result-sheet">
            <div className="result-top"><div><p>CASE {record.id}</p><h2>{record.title}</h2></div><span className={`phase phase-${record.status.toLowerCase()}`}>{record.status}</span></div>
            {record.status==="READY"&&<div className="audit-call"><FileSearch size={34}/><div><h3>{record.revision?"Your revised profile is ready":"The sources are pinned. Now test the fit."}</h3><p>Validators will fetch every page, check the deadline and bind each material requirement to exact source and profile quotes.</p></div><button onClick={()=>submit("assess")}><Sparkles size={17}/> Run assessment</button></div>}
            {assessment&&<>
              <div className="verdict"><div className={`verdict-mark ${assessment.overall.toLowerCase()}`}>{assessment.overall==="READY"?<Check/>:<Flag/>}</div><div><small>APPLICATION MAP</small><h3>{assessment.overall.replaceAll("_"," ")}</h3><p>Deadline: <b>{assessment.deadline_status}</b> · Revision {record.revision}</p></div></div>
              <div className="criterion-list">{assessment.criteria.map(item=><article key={item.index} className={statusTone[item.state]}><span className="criterion-index">{String(item.index+1).padStart(2,"0")}</span><div><div className="criterion-state">{item.state}</div><blockquote>“{item.requirement_quote}”</blockquote>{item.profile_quote?<p><b>Your proof:</b> “{item.profile_quote}”</p>:<p className="gap">No matching applicant evidence was found.</p>}<small>SOURCE {item.source_index+1}</small></div></article>)}</div>
              <div className="receipts"><b>Source receipts</b>{assessment.source_receipts.map(receipt=><a key={receipt.index} href={receipt.url} target="_blank"><span>{receipt.host}</span><code>{receipt.sha256.slice(0,12)}…{receipt.sha256.slice(-8)}</code><ExternalLink size={13}/></a>)}</div>
              {record.status==="ASSESSED"&&<div className="decision-bar"><div><b>Keep working or seal this map?</b><small>Only the case owner can revise or finalize.</small></div><button className="secondary" onClick={()=>submit("revise")}><RotateCcw size={16}/> Save revised profile</button><button className="primary compact" onClick={()=>submit("finalize")}>Finalize <Check size={16}/></button></div>}
            </>}
          </section>}
          {!ADDRESS&&<div className="config-warning">Contract deployment is not configured in this build.</div>}
        </div>
      </section>
    </main>
    <footer><span>GrantPath is an advisory readiness tool, not a grantmaker decision.</span><a href="https://github.com/nearar22/grant-path" target="_blank">Source code <ExternalLink size={13}/></a></footer>
    {action&&kit&&tx&&<div className="tx-overlay"><section className="tx-box"><div className="tx-head"><span>GENLAYER CHECKPOINT</span><button onClick={()=>setAction(null)}><X size={17}/></button></div><GenLayerTransactionPanel kit={kit} tx={tx} network="GenLayer Studio Next" theme="light" trackUntil="finalized" onDone={done}/></section></div>}
  </div>;
}

createRoot(document.getElementById("root")).render(<App/>);
