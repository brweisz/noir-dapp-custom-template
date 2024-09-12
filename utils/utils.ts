export function bytesToHex(arrayOfBytes: Uint8Array){
  return "0x"+Array.from(arrayOfBytes)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}