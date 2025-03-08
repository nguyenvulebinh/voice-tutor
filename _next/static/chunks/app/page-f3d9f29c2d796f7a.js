(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[931],{513:function(e,t,r){Promise.resolve().then(r.bind(r,8482))},8482:function(e,t,r){"use strict";r.r(t),r.d(t,{default:function(){return h}});var o=r(3827),s=r(4090);let n={API_BASE_URL:"https://voice-tutor-api.vercel.app/api",CORRECTIONS_ENDPOINT:"/corrections",CHAT_ENDPOINT:"/chat"};async function a(e,t){try{let r=new FormData;r.append("file",e),r.append("accessCode",t),console.log("Sending audio for transcription...");let o=await fetch("".concat(n.API_BASE_URL,"/transcribe"),{method:"POST",body:r});if(!o.ok){let e=await o.json();throw Error(e.error||"Failed to transcribe audio")}let s=await o.json();if(console.log("Received transcription:",s),!s.text)throw Error("No transcription received");return{data:s.text}}catch(e){return console.error("STT error details:",{name:e instanceof Error?e.name:"Unknown",message:e instanceof Error?e.message:"Unknown error",stack:e instanceof Error?e.stack:void 0}),{data:"",error:e instanceof Error?e.message:"Failed to transcribe audio"}}}async function i(e,t){let r=arguments.length>2&&void 0!==arguments[2]?arguments[2]:[];try{var o,s,a,i;console.log("Sending correction request:",{textLength:e.length,hasAccessCode:!!t,accessCodeLength:null==t?void 0:t.length,messageCount:r.length,userAgent:window.navigator.userAgent});let c=await fetch("".concat(n.API_BASE_URL).concat(n.CORRECTIONS_ENDPOINT),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:e,messages:r,accessCode:t,assistantId:"asst_j3C1nTEVWalxXCuIXEECu4lK"})});if(console.log("Correction response status:",c.status),console.log("Correction response headers:",Object.fromEntries(c.headers.entries())),!c.ok){let e=await c.json();throw console.error("Correction error response:",e),Error(e.error||"Failed to get corrections: ".concat(c.status))}let l=await c.json();return console.log("Correction result:",{hasCorrections:!!(null===(o=l.corrections)||void 0===o?void 0:o.length),correctionsCount:null===(s=l.corrections)||void 0===s?void 0:s.length,hasRecommendations:!!(null===(a=l.recommendations)||void 0===a?void 0:a.length),recommendationsCount:null===(i=l.recommendations)||void 0===i?void 0:i.length}),l}catch(e){return console.error("Correction error:",e),{error:e instanceof Error?e.message:"Failed to get corrections and improvements"}}}async function c(e){try{console.log("Sending verification request...");let t=await fetch("".concat(n.API_BASE_URL).concat(n.CHAT_ENDPOINT),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[{role:"user",content:e}],isVerification:!0,accessCode:e})});if(console.log("Verification response status:",t.status),!t.ok){let e=await t.json();throw console.error("Verification error response:",e),Error(e.error||"Failed to verify access code")}let r=await t.json();return console.log("Verification result:",r.verified),r.verified}catch(e){return console.error("Verification error:",e),!1}}async function l(e,t,r){try{var o,s,a,i,c;let l;console.log("Sending chat request:",{messageCount:e.length,lastMessage:{role:e[e.length-1].role,contentPreview:e[e.length-1].content.slice(0,50)+"..."},hasAccessCode:!!t,accessCodeLength:null==t?void 0:t.length});let d=await fetch("".concat(n.API_BASE_URL,"/chat"),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:e,accessCode:t})});if(console.log("Chat response status:",d.status),!d.ok){let e=await d.json();throw console.error("Chat error response:",e),Error(e.error||"Failed to get chat response")}let u=null===(o=d.body)||void 0===o?void 0:o.getReader();if(!u)throw Error("No response stream available");console.log("Starting to read response stream...");let g=0;for(;;){let{done:e,value:t}=await u.read();if(e){console.log("Response stream complete:",{totalChunks:g,finalResponseLength:null==l?void 0:null===(s=l.text)||void 0===s?void 0:s.length});break}let o=new TextDecoder().decode(t);for(let e of(g++,console.log("Processing chunk ".concat(g,":"),{chunkSize:o.length}),o.split("\n")))if(e.startsWith("data: "))try{let t=JSON.parse(e.slice(6));if(l=t,console.log("Received response update:",{status:t.status,textLength:null===(a=t.text)||void 0===a?void 0:a.length,hasCorrections:!!(null===(i=t.corrections)||void 0===i?void 0:i.length),correctionsCount:null===(c=t.corrections)||void 0===c?void 0:c.length}),null==r||r(t),"completed"===t.status||"error"===t.status){if(console.log("Stream ended with status:",t.status),u.cancel(),t.error)throw Error(t.error);return{data:t}}}catch(e){console.error("Error parsing SSE data:",e)}}return l?{data:l}:{error:"No response received"}}catch(e){return console.error("Chat error:",e),{error:e instanceof Error?e.message:"Failed to get chat response"}}}async function d(e){await new Promise(e=>setTimeout(e,1e3));try{return{data:"data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjIwLjEwMAAAAAAAAAAAAAAA//tQwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAACAAABhgC1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1//tQxAAAAAAAAAAAAAAAAAAAAAADS"}}catch(e){return console.error("TTS error:",e),{data:"",error:e instanceof Error?e.message:"Failed to synthesize speech"}}}let u=[{id:"1",text:"Welcome to Voice Tutor! Please enter the access code to continue",type:"assistant"}],g=[{id:"welcome",text:"Willkommen! I am your German language tutor. How can I help you today?",type:"assistant"}];function m(){let[e,t]=(0,s.useState)(u),[r,n]=(0,s.useState)(""),[m,h]=(0,s.useState)(!1),[p,f]=(0,s.useState)(!1),[v,x]=(0,s.useState)(!1),[y,b]=(0,s.useState)(null),[w,A]=(0,s.useState)(null),j=(0,s.useRef)(null),N=(0,s.useRef)([]),S=(0,s.useRef)(null),E=(0,s.useRef)(null),C=(0,s.useCallback)(()=>{var e;null===(e=S.current)||void 0===e||e.scrollIntoView({behavior:"smooth"})},[]);(0,s.useEffect)(()=>{C()},[e,C]),(0,s.useEffect)(()=>{let e=localStorage.getItem("voice_tutor_verified"),r=localStorage.getItem("voice_tutor_access_code"),o=localStorage.getItem("voice_tutor_messages");if("true"===e&&r){if(x(!0),b(r),o)try{let e=JSON.parse(o);t(e)}catch(e){console.error("Error parsing stored messages:",e),t([...g])}else t([...g])}},[]),(0,s.useEffect)(()=>{v&&localStorage.setItem("voice_tutor_messages",JSON.stringify(e))},[e,v]),(0,s.useEffect)(()=>{let e=()=>{localStorage.removeItem("voice_tutor_verified"),localStorage.removeItem("voice_tutor_access_code"),localStorage.removeItem("voice_tutor_messages")};return window.addEventListener("beforeunload",e),()=>window.removeEventListener("beforeunload",e)},[]),(0,s.useEffect)(()=>{let e=e=>{E.current&&!E.current.contains(e.target)&&A(null)};return document.addEventListener("mousedown",e),()=>{document.removeEventListener("mousedown",e)}},[]);let _=async()=>{if(v)try{let e=await navigator.mediaDevices.getUserMedia({audio:{channelCount:1,sampleRate:16e3,echoCancellation:!0,noiseSuppression:!0,autoGainControl:!0}}),t="audio/webm";for(let e of["audio/webm","audio/ogg;codecs=opus","audio/webm;codecs=opus","audio/mp3","audio/wav"])if(MediaRecorder.isTypeSupported(e)){t=e;break}console.log("Using MIME type:",t);let r=new MediaRecorder(e,{mimeType:t,audioBitsPerSecond:128e3});j.current=r,N.current=[],r.ondataavailable=e=>{e.data.size>0&&(console.log("Received audio chunk:",{size:e.data.size,type:e.data.type}),N.current.push(e.data))},r.onstop=async()=>{try{let e=new Blob(N.current,{type:t});if(console.log("Audio recording completed:",{chunks:N.current.length,totalSize:e.size,type:e.type}),0===e.size)throw Error("No audio data recorded");await k(e)}catch(e){console.error("Error in onstop handler:",e),alert("Error processing the recording. Please try again.")}},r.onerror=e=>{console.error("MediaRecorder error:",e.error),alert("Error during recording. Please try again.")},r.start(1e3),console.log("Started recording"),h(!0)}catch(e){console.error("Error accessing microphone:",e),alert("Error accessing microphone. Please ensure you have granted microphone permissions.")}},k=async e=>{f(!0);try{if(console.log("Processing audio...",{size:e.size,type:e.type,valid:e.size>0}),!y)throw Error("Access code not found. Please try logging in again.");let t=await a(e,y);if(t.error)throw console.error("STT service error:",t.error),Error(t.error);if(!t.data)throw Error("No transcription received");console.log("Transcription received:",t.data),await R(t.data)}catch(e){console.error("Error processing audio:",e),e instanceof Error&&"Invalid access code"===e.message&&(x(!1),b(null),localStorage.removeItem("voice_tutor_verified"),localStorage.removeItem("voice_tutor_access_code"),t(u)),alert(e instanceof Error?e.message:"Error processing audio. Please try again.")}finally{f(!1)}},I=async e=>{f(!0);try{console.log("Attempting verification...");let r=await c(e).catch(e=>{throw console.error("Verification fetch error:",{message:e.message,status:e.status,statusText:e.statusText,url:e.url}),Error("Failed to connect to the verification server. Please check your internet connection and try again.")});console.log("Verification response:",r),r?(console.log("Verification successful"),x(!0),b(e),localStorage.setItem("voice_tutor_verified","true"),localStorage.setItem("voice_tutor_access_code",e),t([...g]),localStorage.setItem("voice_tutor_messages",JSON.stringify(g))):(console.log("Verification failed"),t(t=>[...t,{id:Date.now().toString(),text:e,type:"user"},{id:(Date.now()+1).toString(),text:"Invalid code. Please try again",type:"assistant"}]))}catch(e){console.error("Verification error:",e),t(t=>[...t,{id:Date.now().toString(),text:e instanceof Error?e.message:"Network error during verification. Please check your internet connection and try again.",type:"assistant"}])}finally{n(""),f(!1)}},R=async r=>{if(!v||!y){await I(r);return}let o={id:Date.now().toString(),text:r,type:"user"};t(e=>[...e,o]),n(""),f(!0);try{let n={id:"temp-"+Date.now().toString(),text:"",type:"assistant"};t(e=>[...e,n]);let m=e.filter(e=>!e.id.startsWith("temp-")&&"welcome"!==e.id).map(e=>({role:e.type,content:e.text})).concat({role:o.type,content:r}),h=[],p=e.filter(e=>"assistant"===e.type&&!e.id.startsWith("temp-")).slice(-1).pop();p&&h.push({role:"assistant",content:p.text}),h.push({role:"user",content:r});let[f,w]=await Promise.all([i(r,y,h).catch(e=>(console.error("[Debug] Correction API error details:",{error:e.message,accessCode:y?"present":"missing",isVerified:v,status:e.status||"unknown",response:e.response}),("Invalid access code"===e.message||401===e.status)&&(console.log("[Debug] Detected invalid access code, reverting to verification state"),x(!1),b(null),localStorage.removeItem("voice_tutor_verified"),localStorage.removeItem("voice_tutor_access_code"),t(u)),{error:e.message,rawResponse:void 0})),l(m,y,e=>{var r;(null===(r=e.text)||void 0===r?void 0:r.trim())&&t(t=>t.map(t=>t.id===n.id?{...t,text:e.text}:t))})]);if(f&&!f.error&&f.rawResponse)try{var s,a,c,g;console.log("[Debug] Starting to process corrections response"),console.log("[Debug] Raw response from corrections API:",f.rawResponse);let e=f.rawResponse.replace(/```json\n|\n```/g,"");console.log("[Debug] Cleaned JSON string:",e);let r=JSON.parse(e);console.log("[Debug] Successfully parsed corrections:",r),console.log("[Debug] Has corrections:",!!(null==r?void 0:null===(s=r.corrections)||void 0===s?void 0:s.length)),console.log("[Debug] Has recommendations:",!!(null==r?void 0:null===(a=r.recommendations)||void 0===a?void 0:a.length)),(null==r?void 0:null===(c=r.corrections)||void 0===c?void 0:c.length)||(null==r?void 0:null===(g=r.recommendations)||void 0===g?void 0:g.length)?(console.log("[Debug] Updating message with corrections/recommendations"),t(e=>{let t=e.map(e=>e.id===o.id?{...e,corrections:r.corrections,recommendations:r.recommendations,debugInfo:f.rawResponse}:e);return console.log("[Debug] Updated messages:",t),t})):console.log("[Debug] No corrections or recommendations to display")}catch(e){console.error("[Debug] Error parsing corrections response:",e),console.log("[Debug] Raw response that caused error:",f.rawResponse)}else console.log("[Debug] No valid correction response:",{hasResponse:!!f,hasError:!!(null==f?void 0:f.error),hasRawResponse:!!(null==f?void 0:f.rawResponse)});if(w.error)throw Error(w.error);let A=w.data;if(null==A?void 0:A.text){let e=await d({text:A.text,language:A.language||"de"}).catch(e=>(console.error("TTS API fetch error:",e),{data:void 0}));t(t=>t.map(t=>t.id===n.id?{...t,text:A.text,audio:e.data}:t))}}catch(e){console.error("Error in conversation:",e),t(t=>[...t.slice(0,-1),{id:Date.now().toString(),text:e instanceof Error?e.message:"Connection error. Please check your internet and try again.",type:"assistant"}])}finally{f(!1)}};return(0,o.jsxs)("div",{className:"flex flex-col h-[100dvh] max-w-4xl mx-auto relative",children:[(0,o.jsx)("div",{className:"flex-1 overflow-y-auto bg-gray-50 pb-[76px]",children:(0,o.jsxs)("div",{className:"p-4 space-y-4",children:[e.map(e=>(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)("div",{className:"flex ".concat("user"===e.type?"justify-end":"justify-start"),children:(0,o.jsx)("div",{className:"max-w-[80%] rounded-lg p-3 shadow-sm ".concat("user"===e.type?"bg-blue-500 text-white":"bg-white text-gray-800"),children:(0,o.jsxs)("p",{className:"whitespace-pre-wrap break-words",children:[e.text,"assistant"===e.type&&e.id.startsWith("temp-")&&""===e.text&&(0,o.jsxs)("span",{className:"inline-flex items-center",children:[(0,o.jsx)("span",{className:"typing-dot",children:"."}),(0,o.jsx)("span",{className:"typing-dot",children:"."}),(0,o.jsx)("span",{className:"typing-dot",children:"."})]})]})})},e.id),"user"===e.type&&(e.corrections&&e.corrections.length>0||e.recommendations&&e.recommendations.length>0)&&(0,o.jsx)("div",{className:"flex justify-end mt-2",children:(0,o.jsxs)("div",{className:"max-w-[80%] rounded-lg p-3 shadow-sm bg-yellow-50 text-gray-800",children:[e.corrections&&e.corrections.length>0&&(0,o.jsxs)("div",{className:"text-sm",children:[(0,o.jsx)("p",{className:"font-medium mb-2",children:"Corrections:"}),e.corrections.map((e,t)=>(0,o.jsxs)("div",{className:"mb-3 last:mb-0 border-b border-yellow-100 pb-3 last:border-0 last:pb-0",children:[(0,o.jsxs)("div",{className:"flex items-start gap-2",children:[(0,o.jsx)("div",{className:"text-red-500 shrink-0",children:(0,o.jsx)("svg",{className:"w-4 h-4 mt-1",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:(0,o.jsx)("path",{d:"M6 18L18 6M6 6l12 12",strokeLinecap:"round",strokeLinejoin:"round"})})}),(0,o.jsx)("p",{className:"line-through text-red-500",children:e.original})]}),(0,o.jsxs)("div",{className:"flex items-start gap-2 mt-1",children:[(0,o.jsx)("div",{className:"text-green-500 shrink-0",children:(0,o.jsx)("svg",{className:"w-4 h-4 mt-1",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:(0,o.jsx)("path",{d:"M5 13l4 4L19 7",strokeLinecap:"round",strokeLinejoin:"round"})})}),(0,o.jsx)("p",{className:"text-green-700",children:e.corrected})]}),(0,o.jsx)("p",{className:"text-xs mt-2 text-gray-600 pl-6",children:e.explanation})]},t))]}),e.recommendations&&e.recommendations.length>0&&(0,o.jsxs)("div",{className:"text-sm mt-4 first:mt-0",children:[(0,o.jsx)("p",{className:"font-medium mb-2",children:"Recommendations:"}),e.recommendations.map((e,t)=>(0,o.jsxs)("div",{className:"mb-3 last:mb-0 border-b border-yellow-100 pb-3 last:border-0 last:pb-0",children:[(0,o.jsx)("p",{className:"text-gray-600",children:e.original}),(0,o.jsxs)("p",{className:"font-medium mt-1 text-yellow-700",children:["→ ",e.suggestion]}),(0,o.jsx)("p",{className:"text-xs mt-2 text-gray-600",children:e.explanation})]},t))]})]})})]})),(0,o.jsx)("div",{ref:S})]})}),(0,o.jsx)("div",{className:"fixed bottom-0 left-0 right-0 bg-gray-50 border-t border-gray-200",children:(0,o.jsx)("div",{className:"max-w-4xl mx-auto",children:(0,o.jsx)("form",{onSubmit:e=>{e.preventDefault(),r.trim()&&!p&&R(r.trim())},className:"p-4",children:m?(0,o.jsxs)("div",{className:"flex items-center justify-between px-6 py-3 rounded-full bg-blue-50",children:[(0,o.jsxs)("span",{className:"text-gray-600 flex items-center gap-2",children:[(0,o.jsx)("span",{className:"recording-pulse",children:(0,o.jsx)("span",{className:"block w-2 h-2 rounded-full bg-red-500"})}),"Listening..."]}),(0,o.jsx)("button",{type:"button",onClick:()=>{if(j.current&&m)try{j.current.stop(),j.current.stream.getTracks().forEach(e=>{e.stop(),console.log("Stopped audio track:",e.label)}),h(!1)}catch(e){console.error("Error stopping recording:",e),alert("Error stopping the recording. Please refresh the page and try again.")}},className:"w-6 h-6 flex items-center justify-center rounded-full bg-blue-100 text-blue-500 hover:bg-blue-200",children:(0,o.jsx)("svg",{className:"w-4 h-4",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:(0,o.jsx)("path",{d:"M6 18L18 6M6 6l12 12",strokeLinecap:"round",strokeLinejoin:"round"})})})]}):(0,o.jsxs)("div",{className:"flex items-center gap-2",children:[(0,o.jsx)("input",{type:"text",value:r,onChange:e=>n(e.target.value),placeholder:v?"Type your message...":"Enter access code...",disabled:p,className:"flex-1 px-4 py-3 rounded-full bg-white border-none focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 text-gray-700 disabled:opacity-50"}),(0,o.jsxs)("div",{className:"flex items-center gap-2",children:[v&&(0,o.jsx)("button",{type:"button",onClick:_,disabled:p,className:"p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50",title:"Start recording",children:(0,o.jsxs)("svg",{className:"w-6 h-6",viewBox:"0 0 24 24",fill:"none",children:[(0,o.jsx)("circle",{cx:"12",cy:"12",r:"10",stroke:"currentColor",strokeWidth:"2",className:p?"text-gray-300":"text-blue-500"}),(0,o.jsx)("circle",{cx:"12",cy:"12",r:"4",fill:p?"#D1D5DB":"#3B82F6"})]})}),r.trim()&&(0,o.jsx)("button",{type:"submit",disabled:p,className:"p-2 text-blue-500 hover:text-blue-600 disabled:text-gray-300",children:(0,o.jsx)("svg",{className:"w-6 h-6",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:(0,o.jsx)("path",{d:"M20 12l-6-6v3.5C7 10 4 13 4 18c2.5-3.5 6-4 10-4v3.5l6-6z",strokeLinejoin:"round"})})})]})]})})})})]})}function h(){return(0,o.jsx)("main",{className:"min-h-screen bg-gray-50",children:(0,o.jsx)("div",{className:"container mx-auto py-8",children:(0,o.jsx)(m,{})})})}}},function(e){e.O(0,[971,69,744],function(){return e(e.s=513)}),_N_E=e.O()}]);