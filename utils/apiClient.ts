export async function postCompileContract(contractSourceCode: string){
  const response = await fetch('/api/compile-contract', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ contractSourceCode }),
  });
  let response_data = await response.json();
  return response_data.object;
}