import axios from 'axios';
import pdfParse from 'pdf-parse';

async function run() {
  const url = 'https://object.storage.eu01.onstackit.cloud/leaflets/pdfs/019df2f5-1946-7ef1-82df-7b38446eadf0/Online-lidl-cz-magazin-kveten-11-5-24-5-2026-00.pdf';
  const res = await axios.get(url, { responseType: 'arraybuffer' });
  console.log("Is Buffer?", Buffer.isBuffer(res.data));
  console.log("Is ArrayBuffer?", res.data instanceof ArrayBuffer);
  
  try {
    const data = await pdfParse(res.data);
    console.log("Success");
  } catch (e: any) {
    console.error("Error thrown:", e.message);
  }
}
run().catch(console.error);
