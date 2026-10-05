// Shared destinations for the US planning demo; custom locations are preserved.
export const DEFAULT_MATERIAL_LOCATIONS=['Whole project','Kitchen','Living room','Primary bedroom','Bathroom','Garage','Exterior'];
export function materialLocations(...sources:string[][]){const seen=new Set<string>();return [...DEFAULT_MATERIAL_LOCATIONS,...sources.flat()].filter(value=>{const key=value.trim().toLowerCase();if(!key||seen.has(key))return false;seen.add(key);return true;});}
