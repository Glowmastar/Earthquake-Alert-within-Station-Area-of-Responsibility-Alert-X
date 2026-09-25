let csrfToken='';
export class ApiError extends Error{constructor(message:string,public status:number){super(message);}}
async function request<T=any>(path:string,method='GET',body?:unknown):Promise<T>{
 const response=await fetch(`/api${path}`,{method,credentials:'same-origin',headers:{...(body===undefined?{}:{'Content-Type':'application/json'}),...(method==='GET'?{}:{'X-CSRF-Token':csrfToken})},body:body===undefined?undefined:JSON.stringify(body)});
 if(!response.ok){let data:any={};try{data=await response.json();}catch{}if(response.status===401&&path!=='/auth/login')window.dispatchEvent(new Event('alertx-session-expired'));
 throw new ApiError(data.error||`Request failed (${response.status})`,response.status);}
 if(response.status===204)return undefined as T;
 return response.json();
}
export const api={
 get:<T=any>(p:string)=>request<T>(p),post:<T=any>(p:string,b?:unknown)=>request<T>(p,'POST',b),patch:<T=any>(p:string,b:unknown)=>request<T>(p,'PATCH',b),
 async me(){const r=await request('/auth/me');csrfToken=r.csrfToken;return r.user;},
 async login(email:string,password:string){const r=await request('/auth/login','POST',{email,password});csrfToken=r.csrfToken;return r.user;},
 async logout(){await request('/auth/logout','POST');csrfToken='';}
};
// Remove credentials from the previous build. Only the server's HttpOnly cookie is used.
try{for(const key of ['alertx_token','alertx_auth'])localStorage.removeItem(key);}catch{/* Storage may be unavailable in private contexts. */}
