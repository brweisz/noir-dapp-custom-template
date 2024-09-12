// @ts-nocheck

export function bytesToHex(arrayOfBytes: Uint8Array){
  return "0x"+Array.from(arrayOfBytes)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function extractInputNames(programSourceCode: any){
  let firstLine = programSourceCode.split("\n")[0]
  let parts = firstLine.split(":")
  let inputNames = []
  for(let i = 0; i < parts.length - 1; i++){
    let partSplitted = parts[i].split(new RegExp("[ (]", 'g'))
    inputNames.push(partSplitted[partSplitted.length - 1])
  }
  return inputNames
}

export function extractInputsFromFormElements(elements) {
  let inputElements = Array.from(elements).filter(el => el.tagName == 'INPUT' && el.type === 'text');
  let inputs = inputElements.reduce((acc, current) => {
    acc[current.name] = current.value;
    return acc;
  }, {});
  return { inputs };
}