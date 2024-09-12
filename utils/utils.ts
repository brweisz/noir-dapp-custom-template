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