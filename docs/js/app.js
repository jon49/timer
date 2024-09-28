function L(n){if(n instanceof HTMLElement&&n.attributes!==void 0){let t={},e=!1;for(let i of Array.from(n.attributes)){let s=i.name;if(s[0]==="#"){let a=s.length>1?s.slice(1).split(","):[],r=i.value;r in t?t[r].push(...a):t[r]=a,n.removeAttribute(s),e=!0}}return e?t:0}else{let t=n.nodeValue;return t&&t[0]==="#"?(n.nodeValue="",{[t.slice(1)]:[]}):0}}var T=document.createTreeWalker(document,NodeFilter.SHOW_ALL,null);T.roll=function(n){for(;--n;)this.nextNode();return this.currentNode};var S=(()=>{let n=0;function t(e){let i=T;i.currentNode=e;let s={},a={},r=[],u=0,h;do{if(h=L(e)){let w=u+1;s[n]=h;for(let p of Object.keys(h))p in a?a[p].push(n):a[p]=[n];r.push({idx:w,id:n}),u=1}else u++;n++}while(e=i.nextNode());return{refs:s,names:a,indices:r}}return t})();function H(n,t){let e={},i=T;return i.currentNode=n,t.indices.map(s=>e[s.id]=i.roll(s.idx)),e}var f=class{_refPaths;root;_nodes;constructor(t,e,i,s){this._refPaths=e,this.root=s||t.cloneNode(!0),this._nodes=H(this.root,this._refPaths),i&&this.update(i)}getNodes(t){let e={};for(let i of t)e[i]=this._nodes[this._refPaths.names[i][0]];return e}update(t){if(t)return Object.keys(t).forEach(e=>{this._refPaths.names[e]?.forEach(i=>{let s=this._nodes[i];if(s instanceof Text)s.nodeValue=t[e];else if(s instanceof HTMLElement){let a=this._refPaths.refs[i];a[e]?a[e].forEach(r=>r==="text"?s.textContent=t[e]:s.setAttribute(r,t[e])):console.error(`Key '${e}' value not defined.`)}})}),this}},g=document.createElement("x");function M(n,...t){let e=String.raw(n,...t);return g.innerHTML=e,g.firstElementChild}function c(n,...t){let e=n instanceof HTMLTemplateElement?n.content.firstElementChild:n instanceof Element?n:M(n,...t);if(e===null)throw new Error("Template is empty.");let i=S(e);return(s,a)=>new f(e,i,s,a)}var v="timers",l=[["random","Random"],["air-raid","Air Raid","QaAK2JPE5p4?si=YXV04T1up7wfZxZZ"],["bell","Bell","475-VWbH3wY?si=lROSHQltHmUmtqpZ&start=2"],["kyrie","Kyrie eleison","djkLm3WpUOE?si=De1srN8wGi3BTvlI"],["song","Song","mIxkMXqH8hI?si=4LxW-dKjtD7JACoX"],["tibetan","Tibetan","aXH-QsPTeEI?si=-TjIBSVmy8UWbprt"],["warfare","Warfare","Zjc8Ptc1o6U?si=bvqK34G4kopK8q1B"]],m=class extends HTMLElement{activeTimers;data;timers;$timers;interval;constructor(){super(),this.activeTimers=[],this.data=JSON.parse(localStorage.getItem(v)??'{"sound":"random","timers":[], "allowedSounds":[]}'),this.data.allowedSounds==null&&(this.data.allowedSounds=[]),this.timers=this.data.timers.map(e=>new o(e,this.data));let t=c`
<div>
<div #=timers></div>

<br>
<div>
<button data-action=addTimer>Add Timer</button>
</div>
<br>
<div>
<label>Sound</label>
<br>

<select data-action=saveOption name=sound>
    ${l.map(([e,i])=>`
        <option value="${e}" ${e===this.data.sound?"selected":""}>${i}</option>
    `).join("")}
</select>

    <button data-action=editSettings>&#9881;</button>
</div>
</div>
`();this.$timers=t.getNodes(["timers"]).timers,this.$timers.append(...this.timers),this.append(t.root);for(let e of["click","change","timerUpdated","clockStarted","clockStopped","timerDeleted"])this.addEventListener(e,this)}handleEvent(t){t.stopPropagation(),t.preventDefault();let e=t.target;if(e instanceof HTMLElement){let i=e.dataset.action||e.closest("[data-action]")?.dataset?.action;i?this[i]instanceof Function?this[i](t):console.error(`Action ${i} not implemented.`):this[t.type]instanceof Function&&this[t.type](t)}}addTimer(){let t={id:Date.now(),hours:0,minutes:0,seconds:0,title:"",sound:null};this.data.timers.push(t);let e=new o(t,this.data);this.timers.push(e),this.$timers?.append(e),this.save()}clockStarted(t){let e=t.target;e instanceof o&&(this.activeTimers.push(e),this.tick())}clockStopped(t){t.target instanceof o&&(this.activeTimers=this.activeTimers.filter(i=>i!==t.target),this.interval&&this.activeTimers.length===0&&(clearInterval(this.interval),this.interval=null))}editSettings(){let t=d("dialogs");if(!t){console.error("Dialogs container not found.");return}this.data.allowedSounds.length===0&&this.data.allowedSounds.push(...l.slice(1).map(([i])=>i));let e=`
<x-dialog>
    <dialog class=modal>
        <div>
            <h2 class=inline>Options</h2>
            <form class=inline method=dialog>
                <button value=Cancel>Close</button>
            </form>
        <div>
        <h3>Allowed Sounds</h3>
        <form id=allowed-sounds data-action=saveAllowedSounds>
        ${l.slice(1).map(([i,s])=>`
        <div>
            <label>
                <input type=checkbox value="${i}" ${this.data.allowedSounds.includes(i)?"checked":""}>
                ${s}
            </label>
        </div>
        `).join("")}
        </form>
    </dialog>
</x-dialog>`;t.innerHTML=e,d("allowed-sounds")?.addEventListener("change",this)}timerUpdated(t){let e=t.target;if(!(e instanceof o))return;let i=e.timer,s=this.data.timers.findIndex(a=>a.id===i.id);if(s===-1){console.error("Timer not found.");return}this.data.timers[s]=i,this.save()}timerDeleted(t){let e=t.target;if(!(e instanceof o))return;let i=e.timer.id;e.remove(),this.data.timers=this.data.timers.filter(s=>s.id!==i),this.save()}tick(){this.interval||(this.interval=setInterval(()=>{for(let t of this.activeTimers)t.tick()},1e3))}saveAllowedSounds(t){let e=t.target;if(e instanceof HTMLInputElement){this.data.allowedSounds=[];for(let i of e.form?.querySelectorAll("input[type=checkbox]")??[])i instanceof HTMLInputElement&&i.checked&&this.data.allowedSounds.push(i.value);this.save()}}saveOption(t){let e=t.target;if(!(e instanceof HTMLInputElement||e instanceof HTMLSelectElement))return;let i=this.data;switch(e.name){case"sound":i.sound=e.value;break}this.save()}save(){localStorage.setItem(v,JSON.stringify(this.data))}},x=c`
<div>
<div>
    <label>
        <input data-action=save name=title class=plain type=text #value=title placeholder=Title>
        <span class=editable-pencil>&#9998;</span>
    </label>
</div>
<div>
    <!-- Timer input -->
    <input data-action=save class=clock-input name=hours type=number #value=hours placeholder=Hrs>:<input data-action=save class=clock-input name=minutes type=number #value=minutes placeholder=Min>:<input data-action=save class=clock-input name=seconds type=number #value=seconds placeholder=Sec>

    <!-- Clock display -->
    <span class=relative-container>
        <button
            #=stopEl
            data-action=stopClock
            class=naked
            title="Click to stop."
            aria-label="Click to stop."></button>
        <span #=alarmEl></span>
    </span>

    <button #=startEl data-action=startClock>Start</button>
    <button #=restartEl data-action=restartClock>&#8635;</button>
    <button #=settingsEl data-action=editSettings>&#9881;</button>
    <button #=deleteEl data-action=deleteTimer>❌</button>

</div>
</div>`,o=class extends HTMLElement{cache;timer;info;startedAt;totalTime;timeoutId;node;constructor(t,e){super(),this.cache=new Map,this.timer=t,this.info=e;let i=x();this.node=i.getNodes(["startEl","restartEl","stopEl","settingsEl","deleteEl","alarmEl"]),this.node.clockEl=this.node.stopEl,window.test=this.template,i.update(t),this.appendChild(i.root),this.addEventListener("click",this),this.addEventListener("change",this),this.stopClock()}handleEvent(t){t.stopPropagation();let e=t.target;if(e instanceof HTMLElement){let i=e.dataset.action;i&&(this[i]instanceof Function?this[i](t):console.error(`Action ${i} not implemented.`))}}save(t){let e=t.target;if(!(e instanceof HTMLInputElement||e instanceof HTMLSelectElement))return;let i=this.timer,s=e.value;switch(e.name){case"hours":case"minutes":case"seconds":i[e.name]=+s;break;case"title":i.title=s;break;case"sound":i.sound=s==="default"?null:s;break}this.sendNotification("timerUpdated")}stopClock(){this.node.stopEl.classList.remove("overlay"),b(this.node.startEl),k(this.node.restartEl),this.node.alarmEl.textContent="",this.clearClock()}startClock(){k(this.node.startEl),b(this.node.restartEl),this.setClock(),this.sendNotification("clockStarted"),this.timeoutId=setTimeout(()=>{this.sendNotification("timerExpired")},this.getTotalSeconds()*1e3)}restartClock(){this.stopClock(),this.startClock()}deleteTimer(){this.sendNotification("timerDeleted")}clearClock(){this.startedAt=null,this.node.clockEl.textContent="",clearTimeout(this.timeoutId),this.timeoutId=void 0,this.sendNotification("clockStopped")}startAlarm(){this.clearClock();let t=y(this.timer.sound||this.info.sound,this.info.allowedSounds);if(!t){this.stopClock();return}this.node.alarmEl.innerHTML=t,this.node.stopEl.classList.add("overlay"),clearTimeout(this.timeoutId),this.timeoutId=void 0}editSettings(){let t=d("dialogs");if(!t){console.error("Dialogs container not found.");return}let e=`
<x-dialog>
    <dialog class=modal>
        <div>
            <h2 class=inline>Options</h2>
            <form class=inline method=dialog>
                <button value=Cancel>Close</button>
            </form>
        <div>
        <label>
            Sound <br>
            <select id=option-dialog data-action=save name=sound>
                <option value=default ${this.timer.sound==null?"selected":""}>Default</option>
                ${l.map(([i,s])=>`
                    <option value="${i}" ${i===this.timer.sound?"selected":""}>${s}</option>
                `).join("")}
            </select>
        </label>
    </dialog>
</x-dialog>`;t.innerHTML=e,d("option-dialog")?.addEventListener("change",this)}setClock(t=null){t??=this.getTotalSeconds();let e=E(Math.floor(t/3600)),i=E(Math.floor(t/60)%60),s=E(t%60);this.node.clockEl.textContent=`${e}:${i}:${s}`}getTotalSeconds(){return this.timer.hours*3600+this.timer.minutes*60+ +this.timer.seconds}tick(){this.startedAt==null&&(this.startedAt=Date.now()/1e3,this.totalTime=this.getTotalSeconds());let e=Date.now()/1e3-this.startedAt,i=Math.round((this.totalTime??0)-e);if(i<=0){this.startAlarm();return}this.setClock(i)}sendNotification(t){this.dispatchEvent(new CustomEvent(t,{bubbles:!0}))}};customElements.define("x-app",m);customElements.define("x-timer",o);var N=d("timer");N?.append(new m);function b(n){n.style.display=""}function k(n){n.style.display="none"}function E(n){return n.toString().padStart(2,"0")}var A=l.slice(1).map(([n])=>n);function y(n,t){if(n==="random"){let i=A.filter(s=>t.length===0||t.includes(s));return y(i[Math.floor(Math.random()*i.length)],t)}let e=l.find(([i])=>i===n);if(e)return`
    <iframe
        width=112
        height=63
        style="position:relative;top:23px;"
        src="https://www.youtube.com/embed/${e[2]}&autoplay=1"
        title="Time up"
        frameborder=0
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    ></iframe>`}function d(n){return document.getElementById(n)}
