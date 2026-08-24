import React, { useState, useEffect } from 'react';
import { Search, Plus, Ticket, CheckCircle, Clock, Edit, MoreVertical, Calendar, RefreshCcw, Tag, ChevronRight, ChevronLeft, Download } from 'lucide-react';
import { Table, Dropdown, Select, Input, Space, Button, Modal, Drawer, Form, message, InputNumber, Row, Col, DatePicker, Spin } from 'antd';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import dayjs from 'dayjs';
import { getOffers, createOffer, updateOffer, deleteOffer } from '../../services/api';

const sparklineData = [{ v: 40 }, { v: 30 }, { v: 60 }, { v: 45 }, { v: 70 }, { v: 90 }, { v: 120 }];
const sparklineData2 = [{ v: 10 }, { v: 15 }, { v: 12 }, { v: 22 }, { v: 18 }, { v: 28 }, { v: 25 }];
const initialCoupons = [
  { 
    id: 1, 
    image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=100', 
    title: 'Wardrobe Refresh', 
    desc: 'Revamp your look with our trending new styles.', 
    code: 'REFRESH20', 
    discount: '20%', 
    discountType: 'Percentage',
    minOrder: '₹1,499', 
    validity: '01 Aug 2026 - 31 Aug 2026', 
    usage: 385, 
    maxUsage: 500, 
    status: 'Active' 
  },
  { 
    id: 2, 
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=100', 
    title: 'Beauty Edit', 
    desc: 'Premium beauty styles exclusively for you.', 
    code: 'EDIT25', 
    discount: '25%', 
    discountType: 'Percentage',
    minOrder: '₹1,999', 
    validity: '01 Aug 2026 - 20 Aug 2026', 
    usage: 320, 
    maxUsage: 500, 
    status: 'Active' 
  },
  { 
    id: 3, 
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=100', 
    title: 'New Season', 
    desc: 'Stunning new collection for the season.', 
    code: 'STYLE15', 
    discount: '15%', 
    discountType: 'Percentage',
    minOrder: '₹999', 
    validity: '10 Aug 2026 - 31 Aug 2026', 
    usage: 180, 
    maxUsage: 300, 
    status: 'Active' 
  },
  { 
    id: 4, 
    image: 'https://images.unsplash.com/photo-1550614000-4b95dd247545?w=100', 
    title: 'Chic Picks', 
    desc: 'Handpicked favorites at special prices.', 
    code: 'CHIC10', 
    discount: '10%', 
    discountType: 'Percentage',
    minOrder: '₹1,299', 
    validity: '01 Aug 2026 - 15 Aug 2026', 
    usage: 150, 
    maxUsage: 150, 
    status: 'Expired' 
  },
  { 
    id: 5, 
    image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=100', 
    title: 'Festive Treat', 
    desc: 'Celebrate more, save more this festive season.', 
    code: 'FEST20', 
    discount: '20%', 
    discountType: 'Percentage',
    minOrder: '₹2,499', 
    validity: '15 Aug 2026 - 05 Sep 2026', 
    usage: 95, 
    maxUsage: 300, 
    status: 'Scheduled' 
  },
  { 
    id: 6, 
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=100', 
    title: 'First Order Bonus', 
    desc: 'Special discount for your first purchases.', 
    code: 'WELCOME10', 
    discount: '10%', 
    discountType: 'Percentage',
    minOrder: '₹799', 
    validity: '01 Aug 2026 - 31 Dec 2026', 
    usage: 450, 
    maxUsage: 1000, 
    status: 'Active' 
  },
];

const CouponManagement = () => {
  const [coupons, setCoupons] = useState([]);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const { data } = await getOffers();
      if (data.success) {
        const mapped = data.data.map(c => ({
          ...c,
          id: c._id,
          image: c.image || 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=100',
          title: c.title,
          desc: c.description || c.category,
          code: c.couponCode,
          discount: c.discountType === 'Percentage' ? `${c.discountValue}%` : `₹${c.discountValue}`,
          discountType: c.discountType,
          minOrder: `₹${c.minPurchase}`,
          validity: `${dayjs(c.startDate).format('DD MMM YYYY')} - ${dayjs(c.endDate).format('DD MMM YYYY')}`,
          usage: 0,
          maxUsage: 100,
          status: c.isActive ? 'Active' : 'Expired'
        }));
        setCoupons(mapped);
      }
    } catch (error) {
      console.error(error);
      message.error("Failed to fetch coupons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleMenuClick = (key, record) => {
    if (key === '1') {
      setSelectedCoupon(record);
      setIsDrawerOpen(true);
    } else if (key === 'edit') {
      openEditModal(record);
    } else if (key === '2') {
      handleDeactivate(record.id);
    } else if (key === '3') {
      handleDelete(record.id);
    }
  };

  const handleDeactivate = async (id) => {
    setLoading(true);
    try {
      await updateOffer(id, { isActive: false });
      message.success('Coupon deactivated successfully');
      fetchCoupons();
    } catch (error) {
      console.error(error);
      message.error("Failed to deactivate coupon");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Delete Coupon',
      content: 'Are you sure you want to delete this coupon? This action cannot be undone.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        setLoading(true);
        try {
          await deleteOffer(id);
          message.success('Coupon deleted successfully');
          fetchCoupons();
        } catch (error) {
          console.error(error);
          message.error("Failed to delete coupon");
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const openAddModal = () => {
    setModalMode('add');
    form.resetFields();
    setIsModalOpen(true);
  };

  const openEditModal = (record) => {
    setModalMode('edit');
    setSelectedCoupon(record);
    const dates = record.validity.split(' - ');
    form.setFieldsValue({
      ...record,
      validityRange: dates.length === 2 ? [dayjs(dates[0], 'DD MMM YYYY'), dayjs(dates[1], 'DD MMM YYYY')] : null,
      discount: record.discount.replace(/[^0-9.]/g, ''),
      minOrder: record.minOrder.replace(/[^0-9.]/g, '')
    });
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (values) => {
    let startDate = new Date();
    let endDate = new Date(new Date().setMonth(new Date().getMonth() + 1));

    if (values.validityRange && values.validityRange.length === 2) {
      startDate = values.validityRange[0].toDate();
      endDate = values.validityRange[1].toDate();
    }

    const payload = {
      title: values.title,
      description: values.desc || '',
      category: 'All Offers', 
      couponCode: values.code,
      discountType: values.discountType || 'Percentage',
      discountValue: Number(values.discount),
      minPurchase: Number(values.minOrder),
      startDate,
      endDate,
      isActive: selectedCoupon ? selectedCoupon.status === 'Active' : true,
    };

    setLoading(true);
    try {
      if (modalMode === 'add') {
        await createOffer(payload);
        message.success('Coupon created successfully');
      } else {
        await updateOffer(selectedCoupon.id, payload);
        message.success('Coupon updated successfully');
      }
      setIsModalOpen(false);
      fetchCoupons();
    } catch (error) {
      console.error(error);
      message.error(error.response?.data?.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };
  
  const columns = [
    {
      title: 'COUPON',
      key: 'coupon',
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
          <Input
            placeholder="Search coupon"
            value={selectedKeys[0]}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            style={{ marginBottom: 8, display: 'block' }}
          />
          <Space>
            <Button
              type="primary"
              onClick={() => confirm()}
              icon={<Search size={14} />}
              size="small"
              style={{ width: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#d97706', borderColor: '#d97706' }}
            >
              Search
            </Button>
            <Button onClick={() => { clearFilters(); confirm(); }} size="small" style={{ width: 90 }}>
              Reset
            </Button>
          </Space>
        </div>
      ),
      filterIcon: (filtered) => <Search size={14} style={{ color: filtered ? '#d97706' : undefined }} />,
      onFilter: (value, record) => record.title.toLowerCase().includes(value.toLowerCase()),
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <img src={record.image} alt={record.title} style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }} />
          <div>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: '700', color: '#111827' }}>{record.title}</h4>
            <p style={{ margin: 0, fontSize: '11px', color: '#6b7280', maxWidth: '160px', lineHeight: '1.4' }}>{record.desc}</p>
          </div>
        </div>
      )
    },
    {
      title: 'CODE',
      dataIndex: 'code',
      key: 'code',
      align: 'center',
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
          <Input
            placeholder="Search code"
            value={selectedKeys[0]}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            style={{ marginBottom: 8, display: 'block' }}
          />
          <Space>
            <Button
              type="primary"
              onClick={() => confirm()}
              icon={<Search size={14} />}
              size="small"
              style={{ width: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#d97706', borderColor: '#d97706' }}
            >
              Search
            </Button>
            <Button onClick={() => { clearFilters(); confirm(); }} size="small" style={{ width: 90 }}>
              Reset
            </Button>
          </Space>
        </div>
      ),
      filterIcon: (filtered) => <Search size={14} style={{ color: filtered ? '#d97706' : undefined }} />,
      onFilter: (value, record) => record.code.toLowerCase().includes(value.toLowerCase()),
      render: (text) => (
        <span style={{ 
          color: '#d97706', border: '1px solid #fde68a', background: '#fffbeb', 
          padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700' 
        }}>
          {text}
        </span>
      ),
    },
    {
      title: 'DISCOUNT',
      key: 'discount',
      align: 'center',
      render: (_, record) => (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <span style={{ background: '#ecfdf5', color: '#10b981', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '700' }}>{record.discount} OFF</span>
          <span style={{ fontSize: '11px', color: '#9ca3af' }}>{record.discountType}</span>
        </div>
      )
    },
    {
      title: 'MIN. ORDER',
      dataIndex: 'minOrder',
      key: 'minOrder',
      align: 'center',
      render: (text) => <span style={{ fontWeight: '600', color: '#111827', fontSize: '13px' }}>{text}</span>,
    },
    {
      title: 'VALIDITY',
      key: 'validity',
      align: 'center',
      render: (_, record) => {
        const dates = record.validity.split(' - ');
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#4b5563', fontWeight: '500' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={14} color="#9ca3af" /> {dates[0]}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#9ca3af' }}>-</span> {dates[1]}
            </div>
          </div>
        )
      }
    },
    {
      title: 'USAGE',
      key: 'usage',
      align: 'center',
      render: (_, record) => {
        const percent = (record.usage / record.maxUsage) * 100;
        let barColor = '#10b981'; // green
        if (record.status === 'Expired') barColor = '#ef4444'; // red
        else if (record.status === 'Scheduled') barColor = '#d1d5db'; // gray
        
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', width: '100%' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#111827' }}>
              {record.usage} <span style={{ color: '#9ca3af', fontWeight: '500' }}>/ {record.maxUsage}</span>
            </span>
            <div style={{ width: '80px', height: '4px', background: '#f3f4f6', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ width: `${percent}%`, height: '100%', background: barColor, borderRadius: '2px' }} />
            </div>
          </div>
        )
      }
    },
    {
      title: 'STATUS',
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      filters: [
        { text: 'All Status', value: 'All Status' },
        { text: 'Active', value: 'Active' },
        { text: 'Scheduled', value: 'Scheduled' },
        { text: 'Expired', value: 'Expired' },
      ],
      onFilter: (value, record) => {
        if (value === 'All Status') return true;
        return record.status === value;
      },
      render: (status) => {
        let styles = { bg: '#ecfdf5', color: '#10b981' };
        if (status === 'Expired') styles = { bg: '#fef2f2', color: '#ef4444' };
        if (status === 'Scheduled') styles = { bg: '#f3e8ff', color: '#a855f7' };
        return (
          <span style={{ background: styles.bg, color: styles.color, padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
            {status}
          </span>
        );
      }
    },
    {
      title: 'ACTIONS',
      key: 'actions',
      align: 'center',
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <Dropdown menu={{ 
            items: [ 
              { key: '1', label: 'View Details' }, 
              { key: 'edit', label: 'Edit Coupon' },
              { key: '2', label: 'Deactivate' }, 
              { key: '3', label: 'Delete Coupon', danger: true } 
            ],
            onClick: ({ key }) => handleMenuClick(key, record)
          }} trigger={['click']}>
            <button style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MoreVertical size={16} color="#6b7280" />
            </button>
          </Dropdown>
        </div>
      )
    }
  ];

  return (
    <div style={{ padding: '0 8px 32px 8px' }}>
      {/* Header Actions */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '20px', padding: '12px 20px', background: '#fff',
        borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
        border: '1px solid #f3f4f6'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px', height: '48px', background: '#fff',
            borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(217, 119, 6, 0.08), 0 2px 4px rgba(0,0,0,0.02)', border: '1px solid #fef3c7'
          }}>
            <Ticket size={22} color="#d97706" />
          </div>
          <div style={{ width: '3px', height: '20px', background: '#d97706', borderRadius: '4px' }}></div>
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1f2937', letterSpacing: '-0.3px' }}>Coupon Management</h1>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button style={{ background: '#fff', color: '#4b5563', border: '1px solid #e5e7eb', padding: '10px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
            <Download size={15} /> Export
          </button>
          <button onClick={openAddModal} style={{ background: 'linear-gradient(90deg, #d97706 0%, #b45309 100%)', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(217, 119, 6, 0.2)' }}>
            <Plus size={15} /> Add Coupon
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid" style={{ marginBottom: '32px' }}>
        <div className="stat-card dark" style={{ cursor: 'pointer' }}>
          <div className="stat-top">
            <div className="stat-icon gold"><Ticket size={18} color="#c9a05b" /></div>
            <div className="stat-info">
              <span className="stat-title">Total Coupons</span>
              <h2 className="stat-value gold-text">{coupons.length}</h2>
            </div>
          </div>
          <div className="stat-chart-sparkline">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData}>
                <defs>
                  <linearGradient id="glowDarkCoup0" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c9a05b" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#c9a05b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke="#c9a05b" strokeWidth={2} fill="url(#glowDarkCoup0)" dot={{ r: 2.5, fill: '#c9a05b', strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="stat-card light" style={{ cursor: 'pointer' }}>
          <div className="stat-top">
            <div className="stat-icon gold"><CheckCircle size={18} color="#554422" /></div>
            <div className="stat-info">
              <span className="stat-title">Active</span>
              <h2 className="stat-value">{coupons.filter(c => c.status === 'Active').length}</h2>
            </div>
          </div>
          <div className="stat-chart-sparkline">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData2}>
                <defs>
                  <linearGradient id="glowLightCoup1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c9a05b" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#c9a05b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke="#c9a05b" strokeWidth={2} fill="url(#glowLightCoup1)" dot={{ r: 2.5, fill: '#c9a05b', strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="stat-card light" style={{ cursor: 'pointer' }}>
          <div className="stat-top">
            <div className="stat-icon gold"><Clock size={18} color="#554422" /></div>
            <div className="stat-info">
              <span className="stat-title">Expired</span>
              <h2 className="stat-value">{coupons.filter(c => c.status === 'Expired').length}</h2>
            </div>
          </div>
          <div className="stat-chart-sparkline">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData}>
                <defs>
                  <linearGradient id="glowLightCoup2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c9a05b" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#c9a05b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke="#c9a05b" strokeWidth={2} fill="url(#glowLightCoup2)" dot={{ r: 2.5, fill: '#c9a05b', strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="stat-card dark" style={{ cursor: 'pointer' }}>
          <div className="stat-top">
            <div className="stat-icon gold"><Tag size={18} color="#c9a05b" /></div>
            <div className="stat-info">
              <span className="stat-title">Total Usages</span>
              <h2 className="stat-value gold-text">{coupons.reduce((sum, c) => sum + (c.usage || 0), 0)}</h2>
            </div>
          </div>
          <div className="stat-chart-sparkline">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData2}>
                <defs>
                  <linearGradient id="glowDarkCoup3" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c9a05b" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#c9a05b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke="#c9a05b" strokeWidth={2} fill="url(#glowDarkCoup3)" dot={{ r: 2.5, fill: '#c9a05b', strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Main Table Area */}
      <div className="premium-glass-card" style={{ padding: '0px', borderRadius: '16px', background: '#fff', border: '1px solid #f3f4f6', boxShadow: '0 10px 30px rgba(0,0,0,0.04), 0 2px 4px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
        
        {/* Header matching OrderManagement */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 24px 16px', flexWrap: 'wrap', gap: '16px', background: '#fdfbf7', borderBottom: '1px solid #f3f4f6' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#111827', whiteSpace: 'nowrap' }}>
            Coupons <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500', marginLeft: '8px' }}>({coupons.length} total)</span>
          </h2>
        </div>

        <style>
          {`
            .premium-table .ant-table { background: transparent !important; }
            .premium-table .ant-table-thead > tr > th { background: #fdfbf7 !important; border-bottom: 1px solid #f3f4f6 !important; color: #4b5563; font-weight: 700; padding: 16px 24px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap !important; word-break: keep-all !important; }
            .premium-table .ant-table-tbody > tr > td { padding: 12px 24px !important; border-bottom: 1px solid #f3f4f6 !important; background: #fff !important; transition: all 0.2s ease; white-space: nowrap !important; }
            .premium-table .ant-table-tbody > tr:hover > td { background: #fafafa !important; }
            .premium-table .ant-table-thead > tr > th::before { display: none !important; }
            .premium-table .ant-pagination { margin: 16px 24px !important; display: flex; align-items: center; justify-content: flex-end; }
            .premium-table .ant-pagination-total-text { margin-right: auto !important; font-size: 13px; color: #6b7280; font-weight: 500; }
            .premium-table .ant-pagination-item { border: 1px solid #e5e7eb !important; border-radius: 8px !important; background: #fff; font-weight: 600; box-shadow: 0 1px 2px rgba(0,0,0,0.02); transition: all 0.2s ease; }
            .premium-table .ant-pagination-item:hover { border-color: #d97706 !important; color: #d97706; box-shadow: 0 2px 4px rgba(217,119,6,0.1); }
            .premium-table .ant-pagination-item a { color: #4b5563 !important; }
            .premium-table .ant-pagination-item-active { border-color: #d97706 !important; background: #d97706 !important; box-shadow: 0 4px 12px rgba(217, 119, 6, 0.25) !important; }
            .premium-table .ant-pagination-item-active a { color: #fff !important; }
            .premium-table .ant-pagination-prev .ant-pagination-item-link, .premium-table .ant-pagination-next .ant-pagination-item-link { border: 1px solid #e5e7eb !important; border-radius: 8px !important; background: #fff !important; color: #6b7280 !important; box-shadow: 0 1px 2px rgba(0,0,0,0.02); display: flex; align-items: center; justify-content: center; }
            .premium-table .ant-pagination-prev:hover .ant-pagination-item-link, .premium-table .ant-pagination-next:hover .ant-pagination-item-link { border-color: #d97706 !important; color: #d97706 !important; }
            .premium-table .ant-pagination-options-size-changer.ant-select { border-radius: 8px !important; }
            .premium-table .ant-pagination-options-size-changer .ant-select-selector { border-radius: 8px !important; border: 1px solid #e5e7eb !important; box-shadow: 0 1px 2px rgba(0,0,0,0.02) !important; font-weight: 500; color: #4b5563; }
            .premium-table .ant-checkbox-checked .ant-checkbox-inner { background-color: #10b981; border-color: #10b981; }
            .premium-table .ant-table-body::-webkit-scrollbar, .premium-table .ant-table-content::-webkit-scrollbar { display: none; }
            .premium-table .ant-table-body, .premium-table .ant-table-content { -ms-overflow-style: none; scrollbar-width: none; }
            .search-input-wrapper { display: flex; align-items: center; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 24px; padding: 0 16px; height: 42px; width: 320px; transition: all 0.3s ease; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02); }
            .search-input-wrapper:focus-within { background: #fff; border-color: #d97706; box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.1), 0 4px 6px -1px rgba(0,0,0,0.05); transform: translateY(-1px); }
            .search-input-wrapper input { border: none; outline: none; background: transparent; width: 100%; font-size: 14px; color: #111827; }
            .search-input-wrapper input::placeholder { color: #9ca3af; font-weight: 400; }
          `}
        </style>

        <Table 
          className="premium-table"
            columns={columns} 
            dataSource={coupons} 
            rowKey="id"
            rowSelection={{ type: 'checkbox' }}
            pagination={{
              pageSize: 6,
              showSizeChanger: true,
              showTotal: (total, range) => `Showing ${range[0]} to ${range[1]} of ${total} coupons`,
              itemRender: (current, type, originalElement) => {
                if (type === 'prev') {
                  return <a style={{ display: 'flex', alignItems: 'center' }}><ChevronLeft size={16} /></a>;
                }
                if (type === 'next') {
                  return <a style={{ display: 'flex', alignItems: 'center' }}><ChevronRight size={16} /></a>;
                }
                return originalElement;
              }
            }}
            scroll={{ x: 1000 }}
          />
        </div>

      <Drawer
        title={null}
        placement="right"
        closable={false}
        onClose={() => setIsDrawerOpen(false)}
        open={isDrawerOpen}
        size="large"
        styles={{ body: { padding: 0 } }}
      >
        {selectedCoupon && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fafafa' }}>
            <div style={{ padding: '24px', background: '#fff', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: '16px', position: 'sticky', top: 0, zIndex: 10 }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fdfbf7', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Ticket size={24} color="#d97706" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#111827' }}>Coupon Details</h2>
                <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>{selectedCoupon.code} • {selectedCoupon.status}</span>
              </div>
            </div>
            <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
              <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb', marginBottom: '24px' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#111827' }}>Overview</h3>
                <Row gutter={[16, 16]}>
                  <Col span={12}><p style={{ margin: 0, color: '#6b7280', fontSize: '13px' }}>Title</p><p style={{ margin: '4px 0 0', fontWeight: '500', color: '#111827' }}>{selectedCoupon.title}</p></Col>
                  <Col span={12}><p style={{ margin: 0, color: '#6b7280', fontSize: '13px' }}>Code</p><p style={{ margin: '4px 0 0', fontWeight: '500', color: '#d97706' }}>{selectedCoupon.code}</p></Col>
                  <Col span={12}><p style={{ margin: 0, color: '#6b7280', fontSize: '13px' }}>Discount</p><p style={{ margin: '4px 0 0', fontWeight: '500', color: '#10b981' }}>{selectedCoupon.discount} {selectedCoupon.discountType}</p></Col>
                  <Col span={12}><p style={{ margin: 0, color: '#6b7280', fontSize: '13px' }}>Min Order</p><p style={{ margin: '4px 0 0', fontWeight: '500', color: '#111827' }}>{selectedCoupon.minOrder}</p></Col>
                  <Col span={24}><p style={{ margin: 0, color: '#6b7280', fontSize: '13px' }}>Validity</p><p style={{ margin: '4px 0 0', fontWeight: '500', color: '#111827' }}>{selectedCoupon.validity}</p></Col>
                  <Col span={12}><p style={{ margin: 0, color: '#6b7280', fontSize: '13px' }}>Usage</p><p style={{ margin: '4px 0 0', fontWeight: '500', color: '#111827' }}>{selectedCoupon.usage} / {selectedCoupon.maxUsage}</p></Col>
                </Row>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      <Modal
        title={modalMode === 'add' ? 'Add New Coupon' : 'Edit Coupon'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={loading}
        okText={modalMode === 'add' ? 'Create' : 'Save Changes'}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleModalSubmit} style={{ marginTop: '20px' }} initialValues={{ discountType: 'Percentage', maxUsage: 100 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="title" label="Coupon Title" rules={[{ required: true }]}>
                <Input placeholder="e.g. Summer Sale" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="code" label="Coupon Code" rules={[{ required: true }]}>
                <Input placeholder="e.g. SUMMER20" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="discount" label="Discount Value" rules={[{ required: true }]}>
                <Input placeholder="e.g. 20% or ₹500" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="discountType" label="Discount Type" rules={[{ required: true }]}>
                <Select options={[{ label: 'Percentage', value: 'Percentage' }, { label: 'Fixed Amount', value: 'Fixed Amount' }]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="minOrder" label="Min Order Value" rules={[{ required: true }]}>
                <Input placeholder="e.g. ₹999" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="maxUsage" label="Max Usages" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} placeholder="e.g. 500" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="validityRange" label="Validity Period" rules={[{ required: true }]}>
                <DatePicker.RangePicker style={{ width: '100%' }} format="DD MMM YYYY" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="desc" label="Description">
                <Input.TextArea rows={2} placeholder="Brief description of the coupon" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

    </div>
  );
};

export default CouponManagement;
