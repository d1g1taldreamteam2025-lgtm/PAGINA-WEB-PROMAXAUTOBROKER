// Prueba del mapa de carrocerías usando el MISMO código de sync.js
const fs = require('fs');
const src = fs.readFileSync(require('path').join(__dirname,'..','sync.js'),'utf8');
const start = src.indexOf('const BODY_BY_MODEL');
const end = src.indexOf('async function fillMissingBodyType');
eval(src.slice(start, end));
const cases = [
  ['Toyota','Tacoma','truck'], ['Toyota','Tundra','truck'], ['Ford','F-150','truck'],
  ['Toyota','RAV4','suv'], ['Toyota','RAV 4','suv'], ['Toyota','4Runner','suv'], ['Toyota','Highlander','suv'],
  ['Toyota','Corolla Cross','suv'], ['Toyota','Corolla','sedan'], ['Toyota','Camry','sedan'], ['Toyota','Prius','sedan'],
  ['Toyota','Sienna','van'], ['Chrysler','Pacifica','van'], ['Ram','ProMaster Cargo Van','van'],
  ['Chevrolet','Express Cargo Van','van'], ['Honda','Odyssey','van'], ['Kia','Carnival','van'],
  ['Nissan','Sentra','sedan'], ['Nissan','Versa','sedan'], ['Nissan','Rogue','suv'],
  ['Hyundai','Elantra','sedan'], ['Hyundai','Tucson','suv'], ['Honda','Civic','sedan'], ['Honda','CR-V','suv'],
  ['Ford','Escape','suv'], ['Jeep','Compass','suv'], ['Ford','Mustang','coupe'],
  ['LEXUS','RX','suv'], ['Mercedes-Benz','GLC','suv'], ['Volkswagen','Jetta','sedan'],
  ['GMC','Savana 2500','van'], ['Toyota','Land Cruiser','suv'], ['Toyota','Sequoia','suv'],
  ['Toyota','Crown','sedan'], ['Subaru','Outback','suv'], ['Acura','MDX','suv'],
];
let bad=0;
for (const [mk,md,want] of cases){
  const got = inferBody(mk,md);
  const ok = got===want;
  if(!ok){bad++;console.log('FAIL', mk, md, '=>', got, 'esperado', want);} else console.log('PASS', mk, md, '=>', got);
}
console.log('NOTA: motos/jetski/UTV nunca llegan a inferBody (fillMissingBodyType filtra category=in.(cars,vans)).');
console.log(bad? ('FALLOS: '+bad) : 'TODOS PASS');
process.exit(bad?1:0);
