(()=>{var G=Object,g,f=G.getPrototypeOf,W=document,M,T,b,ee={isConnected:1},Ae=1e3,C,z={},Ce=f(ee),te=f(f),le=(e,t,l,n)=>(e??(setTimeout(l,n),new Set)).add(t),ne=(e,t,l)=>{let n=T;T=t;try{return e(l)}catch(r){return console.error(r),l}finally{T=n}},O=e=>e.filter(t=>t._dom?.isConnected),re=e=>C=le(C,e,()=>{for(let t of C)t._bindings=O(t._bindings),t._listeners=O(t._listeners);C=g},Ae),_={get val(){return T?.add(this),this._val},get oldVal(){return T?.add(this),this._oldVal},set val(e){let t=this;if(e!==t._val){t._val=e;let l=[...t._listeners=O(t._listeners)];for(let n of l)F(n.f,n.s,n._dom),n._dom=g;t._bindings.length?M=le(M,t,Be):t._oldVal=e}}},oe=e=>({__proto__:_,_val:e,_oldVal:e,_bindings:[],_listeners:[]}),ie=e=>f(e??0)===_,Me=e=>ie(e)?e.val:e,Oe=e=>ie(e)?e.oldVal:e,k=(e,t)=>{let l=new Set,n={f:e},r=b;b=[];let o=ne(e,l,t);o=(o??W).nodeType?o:new Text(o);for(let i of l)re(i),i._bindings.push(n);for(let i of b)i._dom=o;return b=r,n._dom=o},F=(e,t=oe(),l)=>{let n=new Set,r={f:e,s:t};r._dom=l??b?.push(r)??ee,t.val=ne(e,n,t._val);for(let o of n)re(o),o._listeners.push(r);return t},ae=(e,...t)=>{for(let l of t.flat(1/0)){let n=f(l??0),r=n===_?k(()=>l.val):n===te?k(l):l;r!=g&&e.append(r)}return e},Pe=e=>(e._isBindingFunc=1,e),j=e=>new Proxy((t,...l)=>{let[n,...r]=f(l[0]??0)===Ce?l:[{},...l],o=e?W.createElementNS(e,t):W.createElement(t);for(let[i,a]of G.entries(n)){let s=w=>w?G.getOwnPropertyDescriptor(w,i)??s(f(w)):g,u=t+","+i,d=z[u]??(z[u]=s(f(o))?.set??0),A=i.startsWith("on")?(w,xe)=>{let Y=i.slice(2);o.removeEventListener(Y,xe),o.addEventListener(Y,w)}:d?d.bind(o):o.setAttribute.bind(o,i),H=f(a??0);H===te&&(!i.startsWith("on")||a._isBindingFunc)&&(a=F(a),H=_),H===_?k(()=>(A(a.val,a._oldVal),o)):A(a)}return ae(o,...r)},{get:(t,l)=>t.bind(g,l)}),se=(e,t)=>t?t!==e&&e.replaceWith(t):e.remove(),Be=()=>{let e=[...M].filter(t=>t._val!==t._oldVal);M=g;for(let t of new Set(e.flatMap(l=>l._bindings=O(l._bindings))))se(t._dom,k(t.f,t._dom)),t._dom=g;for(let t of e)t._oldVal=t._val},Ee=(e,t)=>se(e,k(t,e)),c={add:ae,_:Pe,tags:j(),tagsNS:j,state:oe,val:Me,oldVal:Oe,derive:F,hydrate:Ee};var{fromEntries:Ve,entries:fe,keys:Ke,getPrototypeOf:me}=Object,{get:Le,set:de,deleteProperty:ue,ownKeys:Ne}=Reflect,h=Symbol,{state:X,derive:He,add:Ge,tags:st}=c,We=me(X()),P,Fe=1e3,pe,v=h(),Xe=h(),Re=h(),B=h(),D=h(),R=h();var ce=e=>e?.[Re]?He(()=>I(e())):X(I(e)),I=e=>{if(!(e instanceof Object)||e[v])return e;let t=new Proxy((e[v]=Ve(fe(e).map(([l,n])=>[l,ce(n)])),e[Xe]=e,e[B]=[],e[D]=X(1),e),{get:(l,n)=>me(l[v][n]??0)===We?l[v][n].val:(n==="length"&&l[D].val,Le(l,n,t)),set(l,n,r){let o=l[v];if(n in o)return o[n].val=I(r),1;let i=n in l;if(de(l,n,r))return i||de(o,n,ce(r))&&(++l[D].val,Ze(t,n,o[n])),1},deleteProperty:(l,n)=>(ue(l[v],n)&&qe(l,n),ue(l,n)&&++l[D].val),ownKeys:l=>(l[D].val,Ne(l))});return t};var J=e=>e[B]=e[B].filter(t=>t._containerDom.isConnected),Je=(e,t,l,n)=>()=>{let r=n(l,()=>delete e[t],t);return r[R]=t,r},ge=(e,t,l,{_containerDom:n,f:r},o)=>{if(Ge(n,Je(e,t,l,r)),!o&&Array.isArray(e)&&t!=e.length-1){let i={};for(let s of n.childNodes)i[s[R]]=s;let a=n.firstChild;for(let s of Ke(e))a===i[s]?a=a.nextSibling:n.insertBefore(i[s],a)}},Ze=(e,t,l)=>J(e).forEach(ge.bind(pe,e,t,l)),qe=(e,t)=>{for(let l of J(e))[...l._containerDom.childNodes].find(n=>n[R]===t)?.remove()},Ue=e=>(P??(P=(setTimeout(()=>(P.forEach(J),P=pe),Fe),new Set))).add(e),ve=(e,t,l)=>{let n={_containerDom:e(),f:l};t[B].push(n),Ue(t);for(let[r,o]of fe(t[v]))ge(t,r,o,n,1);return n._containerDom};var{div:m,input:$,button:p,span:E,br:V,label:L,select:we,option:U,dialog:be,h2:Te,h3:Qe,form:_e,iframe:Ye,"x-dialog":ke}=c.tags,he="timers",K="random",y=[["random","Random"],["air-raid","Air Raid","QaAK2JPE5p4?si=YXV04T1up7wfZxZZ"],["bell","Bell","475-VWbH3wY?si=lROSHQltHmUmtqpZ&start=2"],["fire-truck","Fire Truck","5rpMLGS-eBs?si=P0A12rm0JRMw0gBP"],["kyrie","Kyrie eleison","djkLm3WpUOE?si=De1srN8wGi3BTvlI"],["song","Song","mIxkMXqH8hI?si=4LxW-dKjtD7JACoX"],["tibetan","Tibetan","aXH-QsPTeEI?si=-TjIBSVmy8UWbprt"],["warfare","Warfare","Zjc8Ptc1o6U?si=bvqK34G4kopK8q1B"]];function ze(){let e=!0,t=JSON.parse(localStorage.getItem(he)??'{"sound":"random","timers":[]}'),l=I({sound:t.sound||"random",allowedSounds:t.allowedSounds??[],timers:t.timers.filter(r=>r)});K=l.sound;let n=l.timers;return c.derive(()=>{if(e)return e=!1,{sound:l.sound,showSoundOptions:l.allowedSounds.filter(o=>o),timers:n.map(o=>({...o}))};let r=JSON.stringify(l);localStorage.setItem(he,r)}),[ve(m,n,({val:r})=>{let{hours:o,minutes:i,seconds:a}=r,s=c.state(0),u=c.state("stopped");return m(m(L($({class:"plain",type:"text",value:r.title||null,placeholder:"Title",onchange:d=>r.title=d.target.value}),E({class:"editable-pencil",innerHTML:"&#9998;"}))),m(Z(o,"Hrs",d=>r.hours=+(d.target?.value||0)),":",Z(i,"Min",d=>r.minutes=+(d.target?.value||0)),":",Z(a,"Sec",d=>r.seconds=+(d.target?.value||0))," \u2014 ",je(r,l.allowedSounds,s,u),p({class:()=>u.val==="stopped"?"":"hidden",onclick:()=>{u.val="running",ye(r,s,u)}},"Start"),p({onclick:()=>{u.val="running",ye(r,s,u)},innerHTML:"&#8635;",class:()=>u.val==="alarm"?"":"hidden"}),p({innerHTML:"&#9881;",onclick:tt(r)}),p({onclick:()=>{let d=n.findIndex(A=>A.id===r.id);d>=0&&n.splice(d,1)}},"\u274C")))}),V(),m(p({onclick:()=>n.push({id:nt(n),hours:0,minutes:0,seconds:0,title:"",sound:null})},"Add Timer")),V(),m(L("Sound"),V(),we({onchange:r=>K=l.sound=r.target.value},y.map(([r,o])=>U({value:r,selected:r===K},o))),p({innerHTML:"&#9881;",onclick:et(l)}))]}function Z(e,t,l){return $({class:"clock-input",type:"number",value:e||"",placeholder:t,onchange:l})}function je(e,t,l,n){let r=p({class:()=>n.val==="alarm"?"naked overlay":"naked",title:"Click to stop.","aria-label":"Click to stop.",onclick:()=>{n.val="stopped",Q(e.id)}},()=>{let o=l.val;if(n.val==="running"){let i=q(Math.floor(o/3600)),a=q(Math.floor(o/60)%60),s=q(o%60);return`${i}:${a}:${s}`}return""});return E({class:"relative-container"},r,E(()=>n.val==="alarm"?E(De(e.sound??K,t)):""))}var N=document.getElementById("dialogs");function et(e){return()=>{N&&(e.allowedSounds.length===0&&e.allowedSounds.push(...y.slice(1).map(([t])=>t)),c.add(N,ke(be({class:"modal"},m(Te({class:"inline"},"Options"),_e({class:"inline",method:"dialog"},p({value:"cancel"},"Close"))),Qe("Allowed Sounds"),y.slice(1).map(([t,l])=>m({onchange:n=>{if(n.target.checked)e.allowedSounds.push(t);else{let r=e.allowedSounds.indexOf(t);r>=0&&e.allowedSounds.splice(r,1)}}},L($({type:"checkbox",value:t,checked:e.allowedSounds.includes(t)}),l)))))))}}function tt(e){return()=>{N&&c.add(N,ke(be({class:"modal"},m(Te({class:"inline"},"Options"),_e({class:"inline",method:"dialog"},p({value:"cancel"},"Close"))),L("Sound",V(),we({onchange:t=>{e.sound=t.target.value}},U({value:"default",selected:e.sound==null},"Default"),y.map(([t,l])=>U({value:t,selected:t===e.sound},l)))))))}}var lt=y.slice(1).map(([e])=>e);function De(e,t){if(e==="random"){let n=lt.filter(r=>t.length===0||t.includes(r));return De(n[Math.floor(Math.random()*n.length)],t)}let l=y.find(([n])=>n===e);if(l)return Ye({width:"112",height:"63",style:"position:relative;top:23px;",src:`https://www.youtube.com/embed/${l[2]}&autoplay=1`,title:"Time up",frameborder:"0",allow:"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"})}function nt(e){return Math.max(...e.map(l=>l.id),0)+1}var Se=document.getElementById("timer");Se?c.add(Se,ze()):console.error("No timer element found");var S={},x=null;function rt(e,t,l){let n=Ie(e),r=Date.now()/1e3;S[e.id]={fn:t,startedAt:r,totalSeconds:n,id:e.id,timeoutId:setTimeout(()=>{Q(e.id),l(e.id)},n*1e3)},ot()}function ot(){x||(x=setInterval(()=>{let e=Date.now()/1e3;for(let t of Object.values(S)){let l=e-t.startedAt,n=Math.round(t.totalSeconds-l);t.fn(n)}},1e3))}function Q(e){S[e]&&(clearTimeout(S[e].timeoutId),delete S[e],Object.keys(S).length===0&&x&&(clearInterval(x),x=null))}function ye(e,t,l){t.val=Ie(e),rt(e,n=>t.val=n,n=>{l.val="alarm",Q(n)})}function Ie(e){let{hours:t,minutes:l,seconds:n}=e;return t*3600+l*60+n}function q(e){return e.toString().padStart(2,"0")}})();
