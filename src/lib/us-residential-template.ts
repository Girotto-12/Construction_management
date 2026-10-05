import type { Plan, PlanTask, PlanResource, ResourceKind } from './planning';
// Original illustrative template; durations and quantities require project review.
const phases = ['Preconstruction & Permits','Selections & Procurement','Sitework & Excavation','Foundation & Underground Utilities','Framing','Roofing & Dry-In','MEP Rough-In','Inspections & Insulation','Drywall & Interior Finishes','Fixtures & Equipment','Exterior Work','Final Inspections & Handover'];
const rows = `
survey|Survey and site investigation|5||0|Surveyor|1|0
design|Architectural and structural coordination|15|survey|0|Design team|1|0
permit|Permit review allowance|20|design|0|General contractor|1|0
selections|Owner selections and finish schedule|10|design|1|Owner / designer|1|0
windows-order|Window and exterior door procurement allowance|35|selections|1|Purchasing|1|0
trusses-order|Engineered truss procurement allowance|20|design|1|Purchasing|1|0
cabinets-order|Cabinet procurement allowance|40|selections|1|Purchasing|1|0
mobilize|Mobilization and erosion controls|3|permit|2|Site contractor|1|2
layout|Building layout and utility locating|2|mobilize|2|Surveyor / site contractor|1|0
excavate|Excavation|5|layout|2|Excavation contractor|1|3
footing-forms|Footing forms and reinforcing|4|excavate|3|Concrete contractor|1|2
footing-check|Footing inspection allowance|1|footing-forms|3|General contractor|1|0
footings|Place footings and curing allowance|5|footing-check|3|Concrete contractor|1|3
foundation|Foundation walls and curing allowance|8|footings|3|Concrete contractor|1|3
waterproof|Waterproofing and perimeter drainage|3|foundation|3|Waterproofing contractor|1|2
underground|Underground plumbing and utility sleeves|4|foundation|3|Plumbing contractor|1|2
underground-check|Underground inspection allowance|1|underground|3|General contractor|1|0
backfill|Foundation review allowance and backfill|4|waterproof,underground-check|3|Site contractor|1|2
slab|Slab preparation placement and curing allowance|6|backfill|3|Concrete contractor|1|4
floor-frame|Floor framing|5|slab|4|Framing contractor|1|4
wall-frame|Wall framing|8|floor-frame|4|Framing contractor|1|6
roof-frame|Roof trusses and sheathing|5|wall-frame,trusses-order|4|Framing contractor|1|4
roofing|Roof underlayment and roofing|5|roof-frame|5|Roofing contractor|1|4
windows|Windows and exterior doors|4|roof-frame,windows-order|5|Window installer|1|3
weather-barrier|Weather barrier and flashing|3|windows|5|Exterior contractor|1|2
plumbing|Plumbing rough-in|6|roofing,weather-barrier|6|Plumbing contractor|1|4
hvac|HVAC rough-in|6|plumbing|6|HVAC contractor|1|4
electrical|Electrical and low-voltage rough-in|6|hvac|6|Electrical contractor|1|4
rough-check|Framing and MEP inspection allowance|3|electrical|7|General contractor|1|0
insulation|Air sealing and insulation|4|rough-check|7|Insulation contractor|1|3
insulation-check|Insulation inspection allowance|1|insulation|7|General contractor|1|0
drywall|Hang drywall|5|insulation-check|8|Drywall contractor|1|4
drywall-finish|Tape mud sand and drying allowance|8|drywall|8|Drywall contractor|1|3
prime|Primer and first paint coat|4|drywall-finish|8|Painting contractor|1|2
tile|Wet-area waterproofing review and tile|8|prime|8|Tile contractor|1|3
cabinets|Install cabinets|5|tile,cabinets-order|8|Cabinet installer|1|3
counters|Countertop template fabrication and installation|10|cabinets|8|Countertop contractor|1|2
trim|Interior doors and trim|5|cabinets|8|Finish carpenter|1|3
flooring|Finish flooring|5|counters,trim|8|Flooring contractor|1|3
paint-final|Final paint and touch-ups|4|flooring|8|Painting contractor|1|2
fixtures|Plumbing fixtures and electrical trim|5|paint-final|9|Plumbing / electrical contractors|1|3
startup|Appliances and HVAC startup|3|fixtures|9|Equipment installers|1|2
siding|Exterior cladding and trim|10|weather-barrier|10|Exterior contractor|1|4
gutters|Gutters and downspouts|2|siding,roofing|10|Gutter contractor|1|1
flatwork|Driveway walks and exterior flatwork|5|siding|10|Concrete contractor|1|2
grade|Final grading and landscaping|5|flatwork,gutters|10|Landscape contractor|1|2
final-check|Final inspections and correction allowance|5|startup,grade|11|General contractor|1|0
punch|Punch list and final cleaning|5|final-check|11|General contractor|1|0
occupancy|Occupancy approval allowance|3|punch|11|General contractor|1|0
handover|Owner walkthrough manuals and handover|1|occupancy|11|General contractor|1|0
`;
export function createUsResidentialPlan(): Plan {
 const tasks: PlanTask[] = rows.trim().split('\n').map(row => {
 const [id,name,days,pred,phase,owner,quantity,weight] = row.split('|');
 return {id,name,duration:Number(days),predecessors:pred?pred.split(','):[],phase:phases[Number(phase)],owner,quantity:Number(quantity),unit:'lot',weight:Number(weight)};
 });
 const resource=(id:string,taskId:string,kind:ResourceKind,name:string,quantity:number,unit:string,leadDays:number,duration=1):PlanResource=>({id,taskId,kind,name,quantity,unit,leadDays,duration,offset:0,unitCostCents:0,transportCents:0,supplier:'To be assigned',status:'quoting'});
 return {version:1,revision:0,name:'US single-family home · illustrative template',start:'2026-10-05',currency:'USD',tasks,resources:[
 resource('concrete','footings','material','Ready-mix concrete · sample quantity',30,'cu yd',7),
 resource('drywall-board','drywall','material','Drywall board · sample quantity',8000,'sq ft',14),
 resource('floor-material','flooring','material','Flooring · sample quantity',2000,'sq ft',30),
 resource('design-contract','design','contract','Design and engineering scope',1,'lot',14),
 resource('plumbing-contract','plumbing','contract','Plumbing rough-in subcontract',1,'lot',21,6),
 resource('frame-crew','wall-frame','team','Framing labor · separate scope from subcontracts',4,'worker/day',14,8),
 resource('excavator','excavate','machine','Excavator rental',1,'machine/day',7,5),
 resource('crane','roof-frame','machine','Truss crane rental',1,'machine/day',14,1)
 ]};
}
