import { SearchSpider } from '../spider.js';

async function main() {
  const spider = new SearchSpider();
  await spider.run();
}

main().catch(console.error);
