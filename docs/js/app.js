(()=>{var N=Object,m,c=N.getPrototypeOf,G=document,P,_,b,z={isConnected:1},De=1e3,A,Q={},ke=c(z),j=c(c),ee=(e,t,l,n)=>(e??(setTimeout(l,n),new Set)).add(t),te=(e,t,l)=>{let n=_;_=t;try{return e(l)}catch(r){return console.error(r),l}finally{_=n}},M=e=>e.filter(t=>t._dom?.isConnected),le=e=>A=ee(A,e,()=>{for(let t of A)t._bindings=M(t._bindings),t._listeners=M(t._listeners);A=m},De),T={get val(){return _?.add(this),this._val},get oldVal(){return _?.add(this),this._oldVal},set val(e){let t=this;if(e!==t._val){t._val=e;let l=[...t._listeners=M(t._listeners)];for(let n of l)H(n.f,n.s,n._dom),n._dom=m;t._bindings.length?P=ee(P,t,Ae):t._oldVal=e}}},ne=e=>({__proto__:T,_val:e,_oldVal:e,_bindings:[],_listeners:[]}),re=e=>c(e??0)===T,Ie=e=>re(e)?e.val:e,Ce=e=>re(e)?e.oldVal:e,w=(e,t)=>{let l=new Set,n={f:e},r=b;b=[];let o=te(e,l,t);o=(o??G).nodeType?o:new Text(o);for(let a of l)le(a),a._bindings.push(n);for(let a of b)a._dom=o;return b=r,n._dom=o},H=(e,t=ne(),l)=>{let n=new Set,r={f:e,s:t};r._dom=l??b?.push(r)??z,t.val=te(e,n,t._val);for(let o of n)le(o),o._listeners.push(r);return t},oe=(e,...t)=>{for(let l of t.flat(1/0)){let n=c(l??0),r=n===T?w(()=>l.val):n===j?w(l):l;r!=m&&e.append(r)}return e},xe=e=>(e._isBindingFunc=1,e),Y=e=>new Proxy((t,...l)=>{let[n,...r]=c(l[0]??0)===ke?l:[{},...l],o=e?G.createElementNS(e,t):G.createElement(t);for(let[a,i]of N.entries(n)){let d=S=>S?N.getOwnPropertyDescriptor(S,a)??d(c(S)):m,u=t+","+a,s=Q[u]??(Q[u]=d(c(o))?.set??0),x=a.startsWith("on")?(S,we)=>{let $=a.slice(2);o.removeEventListener($,we),o.addEventListener($,S)}:s?s.bind(o):o.setAttribute.bind(o,a),L=c(i??0);L===j&&(!a.startsWith("on")||i._isBindingFunc)&&(i=H(i),L=T),L===T?w(()=>(x(i.val,i._oldVal),o)):x(i)}return oe(o,...r)},{get:(t,l)=>t.bind(m,l)}),ae=(e,t)=>t?t!==e&&e.replaceWith(t):e.remove(),Ae=()=>{let e=[...P].filter(t=>t._val!==t._oldVal);P=m;for(let t of new Set(e.flatMap(l=>l._bindings=M(l._bindings))))ae(t._dom,w(t.f,t._dom)),t._dom=m;for(let t of e)t._oldVal=t._val},Pe=(e,t)=>ae(e,w(t,e)),f={add:oe,_:xe,tags:Y(),tagsNS:Y,state:ne,val:Ie,oldVal:Ce,derive:H,hydrate:Pe};var{fromEntries:Me,entries:ue,keys:Ee,getPrototypeOf:ce}=Object,{get:Ve,set:ie,deleteProperty:se,ownKeys:Be}=Reflect,g=Symbol,{state:W,derive:Oe,add:Ke,tags:rt}=f,Le=ce(W()),E,Ne=1e3,fe,p=g(),Ge=g(),He=g(),V=g(),D=g(),F=g();var de=e=>e?.[He]?Oe(()=>k(e())):W(k(e)),k=e=>{if(!(e instanceof Object)||e[p])return e;let t=new Proxy((e[p]=Me(ue(e).map(([l,n])=>[l,de(n)])),e[Ge]=e,e[V]=[],e[D]=W(1),e),{get:(l,n)=>ce(l[p][n]??0)===Le?l[p][n].val:(n==="length"&&l[D].val,Ve(l,n,t)),set(l,n,r){let o=l[p];if(n in o)return o[n].val=k(r),1;let a=n in l;if(ie(l,n,r))return a||ie(o,n,de(r))&&(++l[D].val,Fe(t,n,o[n])),1},deleteProperty:(l,n)=>(se(l[p],n)&&Xe(l,n),se(l,n)&&++l[D].val),ownKeys:l=>(l[D].val,Be(l))});return t};var X=e=>e[V]=e[V].filter(t=>t._containerDom.isConnected),We=(e,t,l,n)=>()=>{let r=n(l,()=>delete e[t],t);return r[F]=t,r},me=(e,t,l,{_containerDom:n,f:r},o)=>{if(Ke(n,We(e,t,l,r)),!o&&Array.isArray(e)&&t!=e.length-1){let a={};for(let d of n.childNodes)a[d[F]]=d;let i=n.firstChild;for(let d of Ee(e))i===a[d]?i=i.nextSibling:n.insertBefore(a[d],i)}},Fe=(e,t,l)=>X(e).forEach(me.bind(fe,e,t,l)),Xe=(e,t)=>{for(let l of X(e))[...l._containerDom.childNodes].find(n=>n[F]===t)?.remove()},Re=e=>(E??(E=(setTimeout(()=>(E.forEach(X),E=fe),Ne),new Set))).add(e),pe=(e,t,l)=>{let n={_containerDom:e(),f:l};t[V].push(n),Re(t);for(let[r,o]of ue(t[p]))me(t,r,o,n,1);return n._containerDom};var{div:v,input:Se,button:h,span:I,br:B,label:Z,select:be,option:q,dialog:Ze,h2:qe,form:Ue,iframe:$e}=f.tags,ve="timers",O="random",K=[["random","Random"],["air-raid","Air Raid","QaAK2JPE5p4?si=YXV04T1up7wfZxZZ"],["bell","Bell","475-VWbH3wY?si=lROSHQltHmUmtqpZ&start=2"],["fire-truck","Fire Truck","5rpMLGS-eBs?si=P0A12rm0JRMw0gBP"],["kyrie","Kyrie eleison","djkLm3WpUOE?si=De1srN8wGi3BTvlI"],["song","Song","mIxkMXqH8hI?si=4LxW-dKjtD7JACoX"],["tibetan","Tibetan","aXH-QsPTeEI?si=-TjIBSVmy8UWbprt"],["warfare","Warfare","Zjc8Ptc1o6U?si=bvqK34G4kopK8q1B"]];function Qe(){let e=!0,t=JSON.parse(localStorage.getItem(ve)??'{"sound":"random","timers":[]}'),l=k({sound:t.sound||"random",timers:t.timers.filter(r=>r)});O=l.sound;let n=l.timers;return f.derive(()=>{if(e)return e=!1,{sound:l.sound,timers:n.map(o=>({...o}))};let r=JSON.stringify(l);console.log("saving"),localStorage.setItem(ve,r)}),[pe(v,n,({val:r})=>{let{hours:o,minutes:a,seconds:i}=r,d=f.state(0),u=f.state("stopped");return v(v(Z(Se({class:"plain",type:"text",value:r.title||null,placeholder:"Title",onchange:s=>r.title=s.target.value}),I({class:"editable-pencil",innerHTML:"&#9998;"}))),v(R(o,"Hrs",s=>r.hours=+(s.target?.value||0)),":",R(a,"Min",s=>r.minutes=+(s.target?.value||0)),":",R(i,"Sec",s=>r.seconds=+(s.target?.value||0))," \u2014 ",Ye(r,d,u),h({class:()=>u.val==="stopped"?"":"hidden",onclick:()=>{u.val="running",ye(r,d,u)}},"Start"),h({onclick:()=>{u.val="running",ye(r,d,u)},innerHTML:"&#8635;",class:()=>u.val==="alarm"?"":"hidden"}),h({innerHTML:"&#9881;",onclick:ze(r)}),h({onclick:()=>{let s=n.findIndex(x=>x.id===r.id);s>=0&&n.splice(s,1)}},"\u274C")))}),B(),v(h({onclick:()=>n.push({id:je(n),hours:0,minutes:0,seconds:0,title:"",sound:null})},"Add Timer")),B(),v(Z("Sound"),B(),be({onchange:r=>O=l.sound=r.target.value},K.map(([r,o])=>q({value:r,selected:r===O},o))))]}function R(e,t,l){return Se({class:"clock-input",type:"number",value:e||"",placeholder:t,onchange:l})}function Ye(e,t,l){let n=I({class:()=>l.val==="alarm"?"pointer overlay":"pointer",title:"Click to stop.","aria-label":"Click to stop.",onclick:()=>{l.val="stopped",U(e.id)}},()=>{let r=t.val;if(l.val==="running"){let o=J(Math.floor(r/3600)),a=J(Math.floor(r/60)%60),i=J(r%60);return`${o}:${a}:${i}`}return""});return I({class:"relative-container"},n,I(()=>l.val==="alarm"?I(_e(e.sound??O)):""))}function ze(e){return()=>{let t=document.createElement("x-dialog");f.add(t,Ze({class:"modal"},v(qe({class:"inline"},"Options"),Ue({class:"inline",method:"dialog"},h({value:"cancel"},"Close"))),Z("Sound",B(),be({onchange:l=>{e.sound=l.target.value}},q({value:"default",selected:e.sound==null},"Default"),K.map(([l,n])=>q({value:l,selected:l===e.sound},n)))))),document.body.appendChild(t)}}var ge=K.map(([e])=>e);function _e(e){if(e==="random")return _e(ge[Math.floor(Math.random()*ge.length)]);let t=K.find(([l])=>l===e);if(t)return $e({width:"112",height:"63",style:"position:relative;top:23px;",src:`https://www.youtube.com/embed/${t[2]}&autoplay=1`,title:"Time up",frameborder:"0",allow:"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"})}function je(e){return Math.max(...e.map(l=>l.id),0)+1}var he=document.getElementById("timer");he?f.add(he,Qe()):console.error("No timer element found");var y={},C=null;function et(e,t,l){let n=Te(e),r=Date.now()/1e3;y[e.id]={fn:t,startedAt:r,totalSeconds:n,id:e.id,timeoutId:setTimeout(()=>{U(e.id),l(e.id)},n*1e3)},tt()}function tt(){C||(C=setInterval(()=>{let e=Date.now()/1e3;for(let t of Object.values(y)){let l=e-t.startedAt,n=Math.round(t.totalSeconds-l);t.fn(n)}},1e3))}function U(e){y[e]&&(clearTimeout(y[e].timeoutId),delete y[e],Object.keys(y).length===0&&C&&(clearInterval(C),C=null))}function ye(e,t,l){t.val=Te(e),et(e,n=>t.val=n,n=>{l.val="alarm",U(n)})}function Te(e){let{hours:t,minutes:l,seconds:n}=e;return t*3600+l*60+n}function J(e){return e.toString().padStart(2,"0")}})();
