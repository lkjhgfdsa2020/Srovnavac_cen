const url = "https://www.lidl.cz/p/api/gridboxes/CZ/cs?erpNumbers=800012305";
fetch(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
  }
})
  .then(res => res.json())
  .then(data => console.log(JSON.stringify(data[0].fullTitle)))
  .catch(console.error);
