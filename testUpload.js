import fs from 'fs';
import FormData from 'form-data';

const testUpdate = async () => {
  try {
    const formData = new FormData();
    formData.append('name', 'custom t-shirt');
    
    // Create a dummy file
    fs.writeFileSync('dummy.jpg', 'fake image data');
    formData.append('coverImage', fs.createReadStream('dummy.jpg'));

    const res = await fetch('http://localhost:5000/api/products/6a98de84eb4f89889002546c', {
      method: 'PUT',
      body: formData
    });
    
    const text = await res.text();
    console.log('STATUS:', res.status);
    console.log('DATA:', text.substring(0, 500));
  } catch (err) {
    console.log('ERROR:', err.message);
  }
};
testUpdate();
