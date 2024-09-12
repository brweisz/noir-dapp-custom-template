import { compile, createFileManager } from '@noir-lang/noir_wasm';
import { CompiledCircuit } from '@noir-lang/types';

function stringToStream(text: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const uint8array = encoder.encode(text);
  return new ReadableStream({
    start(controller) {
      controller.enqueue(uint8array);
      controller.close();
    }
  });
}

function defaultNargoToml(){
  return `[package]
  name = "noirPlayground"
  type = "bin"

  [dependencies]
  `
}

export function defaultCode(){
  return `fn main(x: Field, y:Field){
  assert(x==y);
}`
}

export async function compileCircuit(noirProgram: string) {
  const fm = createFileManager('/');
  await fm.writeFile('./src/main.nr', stringToStream(noirProgram));
  await fm.writeFile('./Nargo.toml', stringToStream(defaultNargoToml()));
  try {
    const result = await compile(fm);
    return result.program as CompiledCircuit;
  } catch(e){
    throw new Error("Compilation failed: " + e)

  }
}
