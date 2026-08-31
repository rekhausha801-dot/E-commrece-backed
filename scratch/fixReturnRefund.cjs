const fs = require('fs');
const path = '../client/src/pages/customer/ReturnRefund.jsx';
let content = fs.readFileSync(path, 'utf8');

// Replace static ReturnRefund with dynamic one
const newCode = `import React, { useState, useEffect } from 'react';
import { 
  Package, FileText, Wallet, CheckCircle2, ChevronRight, 
  UploadCloud, Headset, Clock, Truck, FileCheck, CheckCircle
} from 'lucide-react';
import { getMyOrders, returnOrder } from '../../services/api';
import './ReturnRefund.css';

const ReturnRefund = () => {
  const [activeTab, setActiveTab] = useState('Request Return');
  const [comments, setComments] = useState('');
  const [uploadedImage, setUploadedImage] = useState(null);
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState({});
  const [returnReason, setReturnReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data } = await getMyOrders();
      if (data.success && data.data) {
        setOrders(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch orders', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setUploadedImage(imageUrl);
    }
  };

  const toggleItemSelection = (orderId, itemIndex) => {
    const key = \`\${orderId}-\${itemIndex}\`;
    setSelectedItems(prev => {
      const next = { ...prev };
      if (next[key]) delete next[key];
      else next[key] = true;
      return next;
    });
  };

  const submitReturn = async () => {
    const selectedKeys = Object.keys(selectedItems);
    if (selectedKeys.length === 0) {
      alert("Please select at least one item to return.");
      return;
    }
    if (!returnReason) {
      alert("Please select a reason for return.");
      return;
    }

    setSubmitting(true);
    try {
      // Group by orderId
      const ordersToReturn = {};
      selectedKeys.forEach(key => {
        const [orderId, itemIndex] = key.split('-');
        if (!ordersToReturn[orderId]) ordersToReturn[orderId] = [];
        ordersToReturn[orderId].push(itemIndex);
      });

      for (const orderId of Object.keys(ordersToReturn)) {
         await returnOrder(orderId, {
           reason: returnReason,
           comments: comments
         });
      }
      
      alert("Return request submitted successfully!");
      setComments('');
      setReturnReason('');
      setSelectedItems({});
      setUploadedImage(null);
      fetchOrders();
    } catch (error) {
      alert("Failed to submit return: " + (error.response?.data?.message || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  // Find eligible return items (Delivered orders)
  const eligibleItems = [];
  orders.forEach(order => {
    if (order.orderStatus === 'Delivered' || order.status === 'Delivered') {
      const products = order.items || order.products || [];
      products.forEach((prod, index) => {
        eligibleItems.push({ order, prod, index });
      });
    }
  });

  const returnedOrders = orders.filter(o => o.orderStatus === 'Returned' || o.orderStatus === 'Return Requested');

  return (
    <div className="return-refund-container">
      {/* Header */}
      <div className="rr-header">
        <h1 className="rr-title">Return & Refund</h1>
        <p className="rr-subtitle">Request a return or track your refund status</p>
      </div>

      {/* Top Stepper */}
      <div className="rr-top-stepper">
        <div className="rr-step">
          <div className="rr-step-icon-wrapper active">
            <Package size={24} className="rr-step-icon" />
            <div className="rr-step-active-badge">
              <CheckCircle2 size={10} color="#fff" />
            </div>
          </div>
          <div className="rr-step-text">
            <h4><span className="rr-step-num">1.</span> Select Item</h4>
            <p>Choose the item you want to return</p>
          </div>
        </div>
        <div className="rr-step">
          <div className="rr-step-icon-wrapper">
            <FileText size={24} className="rr-step-icon" />
          </div>
          <div className="rr-step-text">
            <h4><span className="rr-step-num">2.</span> Submit Request</h4>
            <p>Fill the return reason and submit request</p>
          </div>
        </div>
        <div className="rr-step">
          <div className="rr-step-icon-wrapper">
            <Wallet size={24} className="rr-step-icon" />
          </div>
          <div className="rr-step-text">
            <h4><span className="rr-step-num">3.</span> Get Refund</h4>
            <p>We will inspect and process your refund</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="rr-tabs">
        <button 
          className={\`rr-tab-btn \${activeTab === 'Request Return' ? 'active' : ''}\`}
          onClick={() => setActiveTab('Request Return')}
        >
          Request Return
        </button>
        <button 
          className={\`rr-tab-btn \${activeTab === 'Return History' ? 'active' : ''}\`}
          onClick={() => setActiveTab('Return History')}
        >
          Return History
        </button>
      </div>

      {/* Main Content Area */}
      {activeTab === 'Request Return' && (
        <div className="rr-content-grid">
          {/* Left Column - Form */}
          <div className="rr-left-col">
            
            <div className="rr-card">
              <h3 className="rr-card-title">Select Order Item</h3>
              
              {loading ? (
                <div style={{ padding: '20px', textAlign: 'center' }}>Loading eligible items...</div>
              ) : eligibleItems.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No delivered items eligible for return found.</div>
              ) : (
                eligibleItems.map(({ order, prod, index }) => (
                  <div className="rr-item-selection" key={\`\${order._id || order.id}-\${index}\`}>
                    <label className="rr-checkbox-container">
                      <input 
                        type="checkbox" 
                        checked={!!selectedItems[\`\${order._id || order.id}-\${index}\`]}
                        onChange={() => toggleItemSelection(order._id || order.id, index)} 
                      />
                      <span className="rr-checkmark"></span>
                    </label>
                    <div className="rr-item-box">
                      <img 
                        src={prod.productImage || prod.image || "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&q=80&w=150"} 
                        alt={prod.productName || prod.name} 
                        className="rr-item-img" 
                      />
                      <div className="rr-item-details">
                        <h4>{prod.productName || prod.name}</h4>
                        <p>Size: {prod.size || 'Free'} <span className="divider">|</span> Color: {prod.color || 'Default'}</p>
                        <p>Qty: {prod.quantity || 1} <span className="divider">|</span> <span className="price">?{prod.price || order.totalAmount || order.total}</span></p>
                        <p>Order ID: {order.orderId || order._id || order.id}</p>
                        <p>Order Date: {new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}

              <div className="rr-form-group">
                <label>Reason for Return <span className="required">*</span></label>
                <select className="rr-select" value={returnReason} onChange={(e) => setReturnReason(e.target.value)}>
                  <option value="">Select a reason</option>
                  <option value="Size issue">Size issue</option>
                  <option value="Defective product">Defective product</option>
                  <option value="Item not as described">Item not as described</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="rr-form-group">
                <label>Comments <span className="optional">(Optional)</span></label>
                <div className="rr-textarea-wrapper">
                  <textarea 
                    className="rr-textarea" 
                    placeholder="Add any additional comments..."
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    maxLength={200}
                  ></textarea>
                  <div className="rr-char-count">{comments.length}/200</div>
                </div>
              </div>

              <div className="rr-form-group">
                <label>Upload Photos <span className="optional">(Optional)</span></label>
                <div className="rr-upload-zone">
                  {uploadedImage ? (
                    <div className="rr-image-preview">
                      <img src={uploadedImage} alt="Uploaded" className="rr-preview-img" />
                      <button type="button" className="rr-remove-img-btn" onClick={() => setUploadedImage(null)}>?</button>
                    </div>
                  ) : (
                    <>
                      <input 
                        type="file" 
                        id="return-image" 
                        accept="image/png, image/jpeg" 
                        style={{ display: 'none' }} 
                        onChange={handleImageUpload} 
                      />
                      <label htmlFor="return-image" className="rr-upload-label">
                        <UploadCloud size={24} className="rr-upload-icon" />
                        <p>Drag & drop or click to upload</p>
                        <span>JPG, PNG up to 5MB</span>
                      </label>
                    </>
                  )}
                </div>
              </div>

              <button className="rr-submit-btn" onClick={submitReturn} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Return Request'}
              </button>
            </div>
          </div>

          {/* Right Column - Info */}
          <div className="rr-right-col">

            <div className="rr-card rr-info-card">
              <h3 className="rr-card-title">Refund Information</h3>
              <div className="rr-info-list">
                <div className="rr-info-item">
                  <div className="rr-info-label">
                    <div className="rr-info-icon-box">
                      <Wallet size={16} />
                    </div>
                    <span>Refund Method</span>
                  </div>
                  <div className="rr-info-value">Original Payment Method</div>
                </div>
                <div className="rr-info-item">
                  <div className="rr-info-label">
                    <div className="rr-info-icon-box">
                      <Clock size={16} />
                    </div>
                    <span>Refund Time</span>
                  </div>
                  <div className="rr-info-value">5-7 Business Days</div>
                </div>
                <div className="rr-info-item">
                  <div className="rr-info-label">
                    <div className="rr-info-icon-box">
                      <Truck size={16} />
                    </div>
                    <span>Return Pick-up</span>
                  </div>
                  <div className="rr-info-value">Free Pick-up Available</div>
                </div>
              </div>
            </div>

            <div className="rr-card rr-policy-card">
              <h3 className="rr-card-title">Return Policy</h3>
              <ul className="rr-policy-list">
                <li>
                  <CheckCircle2 size={16} className="rr-check-icon" />
                  <span>You can request a return within 7 days of delivery.</span>
                </li>
                <li>
                  <CheckCircle2 size={16} className="rr-check-icon" />
                  <span>Items must be unused, unwashed and in original condition.</span>
                </li>
                <li>
                  <CheckCircle2 size={16} className="rr-check-icon" />
                  <span>Refunds will be issued to the original payment method.</span>
                </li>
                <li>
                  <CheckCircle2 size={16} className="rr-check-icon" />
                  <span>For more details, please visit our <a href="#">Return Policy</a> page.</span>
                </li>
              </ul>
            </div>

            <div className="rr-card rr-help-card">
              <div className="rr-help-content">
                <div className="rr-help-icon-wrapper">
                  <Headset size={24} className="rr-help-icon" />
                </div>
                <div>
                  <h4>Need Help with Return?</h4>
                  <p>Our support team is here to help you</p>
                </div>
              </div>
              <button className="rr-contact-btn">
                <Headset size={16} /> Contact Support
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Return Process Bottom Stepper */}
      {activeTab === 'Request Return' && (
        <div className="rr-card rr-process-card">
          <h3 className="rr-card-title">Return Process</h3>
          <div className="rr-bottom-stepper">
            <div className="rr-process-step">
              <div className="rr-process-icon"><FileCheck size={24} /></div>
              <h5>Return Requested</h5>
            </div>
            <div className="rr-process-line"></div>
            <div className="rr-process-step">
              <div className="rr-process-icon"><CheckCircle size={24} /></div>
              <h5>Return Approved</h5>
            </div>
            <div className="rr-process-line"></div>
            <div className="rr-process-step">
              <div className="rr-process-icon"><Truck size={24} /></div>
              <h5>Pick-up Scheduled</h5>
            </div>
            <div className="rr-process-line"></div>
            <div className="rr-process-step">
              <div className="rr-process-icon"><Package size={24} /></div>
              <h5>Item Received</h5>
            </div>
            <div className="rr-process-line"></div>
            <div className="rr-process-step">
              <div className="rr-process-icon"><Wallet size={24} /></div>
              <h5>Refund Processed</h5>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Return History' && (
        <div className="rr-card" style={{ padding: '60px', textAlign: 'center', color: '#666' }}>
          {loading ? 'Loading history...' : returnedOrders.length > 0 ? (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {returnedOrders.map(order => (
                  <div key={order._id || order.id} style={{ border: '1px solid #eee', padding: '20px', borderRadius: '12px', textAlign: 'left' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <strong style={{ fontSize: '16px' }}>Order ID: {order.orderId || order._id || order.id}</strong>
                      <span style={{ padding: '4px 12px', background: '#fff3e0', color: '#f57c00', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>{order.orderStatus}</span>
                    </div>
                    <p style={{ fontSize: '14px', margin: '0 0 10px 0' }}>Date: {new Date(order.createdAt).toLocaleDateString()}</p>
                    <p style={{ fontSize: '14px', margin: '0' }}>Amount: ?{order.totalAmount || order.total}</p>
                  </div>
                ))}
             </div>
          ) : 'No past returns found.'}
        </div>
      )}

    </div>
  );
};

export default ReturnRefund;
`;

fs.writeFileSync(path, newCode);
