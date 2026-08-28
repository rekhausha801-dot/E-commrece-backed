const axios = require('axios');
axios.post('http://localhost:5000/api/auth/admin/login', {
  email: 'rathi@gmail.com',
  password: 'rathi123'
}).then(res => console.log('SUCCESS:', res.data))
  .catch(err => console.log('ERROR:', err.response?.data || err.message));
