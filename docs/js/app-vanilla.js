var h="timers",o=[["random","Random"],["air-raid","Air Raid","QaAK2JPE5p4?si=YXV04T1up7wfZxZZ"],["bell","Bell","475-VWbH3wY?si=lROSHQltHmUmtqpZ&start=2"],["kyrie","Kyrie eleison","djkLm3WpUOE?si=De1srN8wGi3BTvlI"],["song","Song","mIxkMXqH8hI?si=4LxW-dKjtD7JACoX"],["tibetan","Tibetan","aXH-QsPTeEI?si=-TjIBSVmy8UWbprt"],["warfare","Warfare","Zjc8Ptc1o6U?si=bvqK34G4kopK8q1B"]],c=class extends HTMLElement{data;timers;$timers;interval;constructor(){super(),this.data=JSON.parse(localStorage.getItem(h)??'{"sound":"random","timers":[], "allowedSounds":[]}'),this.data.allowedSounds==null&&(this.data.allowedSounds=[]),this.timers=this.data.timers.map(e=>new s(e,this.data));let t=g(`
<div>
<div x=timers></div>

<br>
<div>
<button data-action=addTimer>Add Timer</button>
</div>
<br>
<div>
<label>Sound</label>
<br>

<select data-action=saveOption name=sound>
    ${o.map(([e,i])=>`
        <option value="${e}" ${e===this.data.sound?"selected":""}>${i}</option>
    `).join("")}
</select>

    <button data-action=editSettings>&#9881;</button>
</div>
</div>`).content;this.$timers=f(t).timers,this.$timers.append(...this.timers),this.append(t);for(let e of["click","change","timerUpdated","clockStarted","clockStopped","timerDeleted"])this.addEventListener(e,this)}handleEvent(t){t.stopPropagation(),t.preventDefault();let e=t.target;if(e instanceof HTMLElement){let i=e.dataset.action||e.closest("[data-action]")?.dataset?.action;i?this[i]instanceof Function?this[i](t):console.error(`Action ${i} not implemented.`):this[t.type]instanceof Function&&this[t.type](t)}}addTimer(){let t={id:Date.now(),hours:0,minutes:0,seconds:0,title:"",sound:null};this.data.timers.push(t);let e=new s(t,this.data);this.timers.push(e),this.$timers?.append(e),this.save()}clockStarted(t){t.target instanceof s&&this.tick()}clockStopped(t){t.target instanceof s}editSettings(){let t=l("dialogs");if(!t){console.error("Dialogs container not found.");return}this.data.allowedSounds.length===0&&this.data.allowedSounds.push(...o.slice(1).map(([i])=>i));let e=`
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
        ${o.slice(1).map(([i,n])=>`
        <div>
            <label>
                <input type=checkbox value="${i}" ${this.data.allowedSounds.includes(i)?"checked":""}>
                ${n}
            </label>
        </div>
        `).join("")}
        </form>
    </dialog>
</x-dialog>`;t.innerHTML=e,l("allowed-sounds")?.addEventListener("change",this)}timerUpdated(t){let e=t.target;if(!(e instanceof s))return;let i=e.timer,n=this.data.timers.findIndex(E=>E.id===i.id);if(n===-1){console.error("Timer not found.");return}this.data.timers[n]=i,this.save()}timerDeleted(t){let e=t.target;if(!(e instanceof s))return;let i=e.timer.id;e.remove(),this.data.timers=this.data.timers.filter(n=>n.id!==i),this.save()}tick(){if(this.interval)return;let t=this;this.interval=setInterval(()=>{requestAnimationFrame(function(){let e=!1;for(let i of t.timers){let n=i.tick();e=e||n}!e&&t.interval&&(clearInterval(t.interval),t.interval=null)})},1e3)}saveAllowedSounds(t){let e=t.target;if(e instanceof HTMLInputElement){this.data.allowedSounds=[];for(let i of e.form?.querySelectorAll("input[type=checkbox]")??[])i instanceof HTMLInputElement&&i.checked&&this.data.allowedSounds.push(i.value);this.save()}}saveOption(t){let e=t.target;if(!(e instanceof HTMLInputElement||e instanceof HTMLSelectElement))return;let i=this.data;switch(e.name){case"sound":i.sound=e.value;break}this.save()}save(){localStorage.setItem(h,JSON.stringify(this.data))}},v=g(`
<div>
<div>
    <label>
        <input x=title data-action=save class=plain name=title type=text placeholder=Title>
        <span class=editable-pencil>&#9998;</span>
    </label>
</div>
<div>
    <!-- Timer input -->
    <input
        class="plain clock" data-action=save name=hours type=number x=hours placeholder=h
    >:<input
        class="plain clock" data-action=save name=minutes type=number x=minutes placeholder=m
    >:<input
        class="plain clock" data-action=save name=seconds type=number x=seconds placeholder=s>

    <span x=clockSeperator>&#9876;</span>

    <!-- Clock display -->
    <span class=relative-container>
        <button
            x=stopEl
            data-action=stopClock
            class=naked
            title="Click to stop."
            aria-label="Click to stop."></button>
        <span x=alarmEl></span>
    </span>

    <button x=startEl data-action=startClock>Start</button>
    <button x=restartEl data-action=restartClock>&#8635;</button>
    <button x=settingsEl data-action=editSettings>&#9881;</button>
    <button x=deleteEl data-action=deleteTimer>\u274C</button>

</div>
</div>`),s=class extends HTMLElement{cache;timer;info;startedAt;totalTime;timeoutId;node;state="stopped";constructor(t,e){super(),this.cache=new Map,this.timer=t,this.info=e;let i=v.content.cloneNode(!0),n=f(i);this.node={...n,clockEl:n.stopEl},d(n.title,t.title),d(n.hours,t.hours||""),d(n.minutes,t.minutes||""),d(n.seconds,t.seconds||""),this.appendChild(i),this.addEventListener("click",this),this.addEventListener("change",this),this.stopClock()}handleEvent(t){t.stopPropagation();let e=t.target;if(e instanceof HTMLElement){let i=e.dataset.action;i&&(this[i]instanceof Function?this[i](t):console.error(`Action ${i} not implemented.`))}}save(t){let e=t.target;if(!(e instanceof HTMLInputElement||e instanceof HTMLSelectElement))return;let i=this.timer,n=e.value;switch(e.name){case"hours":case"minutes":case"seconds":i[e.name]=+n;break;case"title":i.title=n;break;case"sound":i.sound=n==="default"?null:n;break}this.sendNotification("timerUpdated")}stopClock(){this.node.stopEl.classList.remove("overlay"),m(this.node.startEl),r(this.node.restartEl),r(this.node.clockSeperator),this.node.alarmEl.textContent="",this.clearClock(),this.state="stopped"}startClock(){this.state="started",r(this.node.startEl),m(this.node.clockSeperator),m(this.node.restartEl),this.setClock(),this.sendNotification("clockStarted"),this.timeoutId=setTimeout(()=>{this.sendNotification("timerExpired")},this.getTotalSeconds()*1e3)}restartClock(){this.stopClock(),this.startClock()}deleteTimer(){this.sendNotification("timerDeleted")}startAlarm(){this.clearClock(),r(this.node.clockSeperator);let t=p(this.timer.sound||this.info.sound,this.info.allowedSounds);if(!t){this.stopClock();return}this.node.alarmEl.innerHTML=t,this.node.stopEl.classList.add("overlay"),clearTimeout(this.timeoutId),this.timeoutId=void 0,this.state="alarming"}clearClock(){this.startedAt=null,this.node.clockEl.textContent="",clearTimeout(this.timeoutId),this.timeoutId=void 0,this.sendNotification("clockStopped")}editSettings(){let t=l("dialogs");if(!t){console.error("Dialogs container not found.");return}let e=`
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
                ${o.map(([i,n])=>`
                    <option value="${i}" ${i===this.timer.sound?"selected":""}>${n}</option>
                `).join("")}
            </select>
        </label>
    </dialog>
</x-dialog>`;t.innerHTML=e,l("option-dialog")?.addEventListener("change",this)}setClock(t=null){t??=this.getTotalSeconds();let e=u(Math.floor(t/3600)),i=u(Math.floor(t/60)%60),n=u(t%60);this.node.clockEl.textContent=`${e}:${i}:${n}`}getTotalSeconds(){return this.timer.hours*3600+this.timer.minutes*60+ +this.timer.seconds}tick(){if(this.state!=="started")return!1;this.startedAt==null&&(this.startedAt=Date.now()/1e3,this.totalTime=this.getTotalSeconds());let e=Date.now()/1e3-this.startedAt,i=Math.round((this.totalTime??0)-e);return i<=0?(this.startAlarm(),!1):(this.setClock(i),!0)}sendNotification(t){this.dispatchEvent(new CustomEvent(t,{bubbles:!0}))}};customElements.define("x-app",c);customElements.define("x-timer",s);var T=l("timer");T?.append(new c);function m(a){a.style.display=""}function r(a){a.style.display="none"}function u(a){return a.toString().padStart(2,"0")}var b=o.slice(1).map(([a])=>a);function p(a,t){if(a==="random"){let i=b.filter(n=>t.length===0||t.includes(n));return p(i[Math.floor(Math.random()*i.length)],t)}let e=o.find(([i])=>i===a);if(e)return`
    <iframe
        width=112
        height=63
        style="position:relative;top:23px;"
        src="https://www.youtube.com/embed/${e[2]}&autoplay=1"
        title="Time up"
        frameborder=0
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    ></iframe>`}function l(a){return document.getElementById(a)}function f(a){let t={};for(let e of a.querySelectorAll("[x]"))t[e.getAttribute("x")||""]=e,e.removeAttribute("x");return t}function g(a){let t=document.createElement("template");return t.innerHTML=a,t}function d(a,t){a.value=t.toString()}
