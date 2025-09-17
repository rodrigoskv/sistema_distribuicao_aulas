// armazenamento em memória (sem DB)
let CONFIG = { teachers: [], classes: [], resources: [], bncc: {}, settings: {} };
let SCHEDULE = null;

export const getConfig = () => CONFIG;
export const setConfig = (c) => { CONFIG = c || CONFIG; };
export const getSchedule = () => SCHEDULE;
export const setSchedule = (s) => { SCHEDULE = s; };

export function loadSeed(){
  return {
    settings: {
      periodsPerShift: 5,
      days: ["Mon","Tue","Wed","Thu","Fri"],
      shifts: ["M","V"],
      contraTurnoPeriods: 2
    },
    resources: [
      { id:"lab", name:"Laboratório de Informática", kind:"exclusive" },
      { id:"gym", name:"Quadra/Ginásio", kind:"exclusive" },
      { id:"arts", name:"Sala de Artes", kind:"exclusive" }
    ],
    classes: [
      { id:"1A", name:"1º Ano A", year:1, shift:"M" },
      { id:"5A", name:"5º Ano A", year:5, shift:"M" },
      { id:"6A", name:"6º Ano A", year:6, shift:"M" },
      { id:"9A", name:"9º Ano A", year:9, shift:"V" }
    ],
    teachers: [
      { id:"t1", name:"Prof. Maria", subjects:["Portugues","Ciencias"], availability:{ "Mon":["M"], "Tue":["M","V"], "Wed":["M"], "Thu":["V"], "Fri":["M"] }, isRegente:true },
      { id:"t2", name:"Prof. João", subjects:["Matematica"], availability:{ "Mon":["M","V"], "Tue":["M"], "Wed":["V"], "Thu":["M"], "Fri":["V"] }, isRegente:true },
      { id:"t3", name:"Prof. Ana", subjects:["Historia","Geografia"], availability:{ "Mon":["V"], "Tue":["M","V"], "Wed":["M"], "Thu":["M"], "Fri":["M","V"] } },
      { id:"t4", name:"Prof. Carla", subjects:["EducacaoFisica"], needsResource:"gym", availability:{ "Mon":["M","V"], "Tue":["M"], "Wed":["M"], "Thu":["M","V"], "Fri":["M"] } },
      { id:"t5", name:"Prof. Lucas", subjects:["Artes"], needsResource:"arts", availability:{ "Mon":["V"], "Tue":["V"], "Wed":["M"], "Thu":["M"], "Fri":["V"] } },
      { id:"t6", name:"Prof. Tiago", subjects:["Ingles"], availability:{ "Mon":["M"], "Tue":["M"], "Wed":["V"], "Thu":["V"], "Fri":["M","V"] } }
    ],
    bncc: {
      "1": { Portugues:5, Matematica:5, Ciencias:2, Historia:2, Geografia:2, Artes:1, EducacaoFisica:2, Ingles:0 },
      "2": { Portugues:5, Matematica:5, Ciencias:2, Historia:2, Geografia:2, Artes:1, EducacaoFisica:2, Ingles:0 },
      "3": { Portugues:5, Matematica:5, Ciencias:2, Historia:2, Geografia:2, Artes:1, EducacaoFisica:2, Ingles:1 },
      "4": { Portugues:5, Matematica:5, Ciencias:2, Historia:2, Geografia:2, Artes:1, EducacaoFisica:2, Ingles:1 },
      "5": { Portugues:5, Matematica:5, Ciencias:2, Historia:2, Geografia:2, Artes:1, EducacaoFisica:2, Ingles:2 },
      "6": { Portugues:4, Matematica:4, Ciencias:3, Historia:2, Geografia:2, Artes:1, EducacaoFisica:2, Ingles:2 },
      "7": { Portugues:4, Matematica:4, Ciencias:3, Historia:2, Geografia:2, Artes:1, EducacaoFisica:2, Ingles:2 },
      "8": { Portugues:4, Matematica:4, Ciencias:3, Historia:2, Geografia:2, Artes:1, EducacaoFisica:2, Ingles:2 },
      "9": { Portugues:4, Matematica:4, Ciencias:3, Historia:2, Geografia:2, Artes:1, EducacaoFisica:2, Ingles:2 }
    }
  };
}
