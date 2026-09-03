import fs from 'fs';

const testUpdate = async () => {
  try {
    const res = await fetch('http://localhost:5000/api/products/6a98de84eb4f89889002546c', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    
    const text = await res.text();
    console.log('STATUS:', res.status);
    
    try {
      const data = JSON.parse(text);
      console.log('DATA:', data);
    } catch (e) {
      fs.writeFileSync('error.html', text);
      console.log('Wrote HTML to error.html');
      // Print first 500 chars to see stack trace
      console.log(text.substring(0, 1000));
    }
  } catch (err) {
    console.log('ERROR:', err.message);
  }
};
testUpdate();
