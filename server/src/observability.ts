export function log(event:string,fields:Record<string,unknown>={}){
 console.log(JSON.stringify({timestamp:new Date().toISOString(),event,...fields}));
}

export function safeRequestId(value:string|undefined){
 return value&&/^[A-Za-z0-9_-]{8,100}$/.test(value)?value:crypto.randomUUID();
}
