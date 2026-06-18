const WORDS = Array.from(new Set(
  `the of and to in is was he for it with as his on be at by had not are but from or have an they which one you were her all she there would their we him been has when who will more no if out so said what up its about into than them can only other new some could time these two may then do first any my now such like our over man me even most made after also did many before must through back years where much your way well down should because each just those people how too little state good very make world still own see men work long get here between both life being under never day same another know while last might us great old year off come since against go came right used take three states himself few house use during without again place around however home small found thought went say part once general high upon school every don does got united left number course war until always away something fact though water less public put thing almost hand enough far took head yet government system better set told nothing night end why called didn eyes find going look asked later knew point next city business give group toward young days let room side given several order ran keep word feel light power line type sound learn quick brown fox jumps lazy dog`.split(/\s+/)
));

export function makePassage(n = 200): string {
  const out: string[] = [];
  let prev = -1;
  for (let i = 0; i < n; i++) {
    let idx: number;
    do {
      idx = Math.floor(Math.random() * WORDS.length);
    } while (idx === prev);
    prev = idx;
    out.push(WORDS[idx]);
  }
  return out.join(" ");
}
