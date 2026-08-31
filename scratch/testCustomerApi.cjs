const axios = require('axios');
async function test() {
  try {
    const res = await axios.get('http://localhost:5000/api/customers?limit=1000&t=' + new Date().getTime());
    console.log(res.data.data);
  } catch(e) { console.error(e.response ? e.response.data : e.message); }
}
test();
