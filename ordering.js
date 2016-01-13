function order() {
  var obj = {arr: [['M'],['M'],['M'],['M'],['M'],['N'],['N'],['N'],['N']], count: {I: 11, A: 22, L: 22,}};
  var counter = 0;
  var err = false;
  while(!(obj.count.I === 0 && obj.count.A === 0 && obj.count.L === 0)) {
    for(i = 0; i < 9; i++){
      counter++;
      if(obj.count.I === 0 && obj.count.A === 0 && obj.count.L === 0) {
        break;
      }
      var nod = ['I', 'A', 'L'][Math.floor(Math.random() * 3)];
      var last = obj.arr[i][obj.arr[i].length -1];
      if((last === 'A' && obj.count.I === 0 && obj.count.L === 0) ||
         (last === 'I' && obj.count.A === 0 && obj.count.L === 0) ||
         (last === 'L' && obj.count.I === 0 && obj.count.A === 0)) {
      } else {
        while(true) {
          counter++;
          if(obj.count[nod] > 0 && nod !== last) {
            break;
          } else {
            nod = ['I', 'A', 'L'][Math.floor(Math.random() * 3)];
          }
        }
        obj.arr[i].push(nod);
        obj.count[nod] = obj.count[nod] - 1;
      }
      if(counter > 10000) {
        err = true;
        break;
      }
    }
  }
  if(err) order();
  return obj.arr;
}
console.log(order());
