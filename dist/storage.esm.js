function a(s){s.magic("storage",e=>(o,r)=>{let t=r.toUpperCase(),n=["GET","DELETE"];if(n.includes(t)||console.error(`Expected ${n} but got ${t}.`),t==="GET")return l(o);t==="DELETE"&&c(e,o)});function l(e){return localStorage.getItem(e)}function c(e,o){localStorage.removeItem(o);let r={bubbles:!0,cancelable:!0},t=/[A-Z]?[a-z]+|[0-9]+|[A-Z]+(?![a-z])/g,n=o.replace("_x_","").match(t).join("-").toLowerCase();e.dispatchEvent(new CustomEvent("storage-delete",r)),e.dispatchEvent(new CustomEvent(`storage-delete-${n}`,r))}}var u=a;export{u as default};