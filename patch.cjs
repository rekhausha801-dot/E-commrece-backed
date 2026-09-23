const fs = require('fs');
const path = require('path');

const clientSrc = path.join(__dirname, '../client/src');

const contextFile = path.join(clientSrc, 'context/NotificationContext.jsx');
let contextData = fs.readFileSync(contextFile, 'utf8');

contextData = contextData.replace(
  "time: new Date(n.createdAt).toLocaleDateString(),",
  "time: new Date(n.createdAt).toLocaleDateString(),\n          createdAt: n.createdAt,"
);

contextData = contextData.replace(
  "id: Date.now(),\n      read: false,",
  "id: Date.now(),\n      createdAt: new Date().toISOString(),\n      read: false,"
);
// In case it has \r\n
contextData = contextData.replace(
  "id: Date.now(),\r\n      read: false,",
  "id: Date.now(),\r\n      createdAt: new Date().toISOString(),\r\n      read: false,"
);

fs.writeFileSync(contextFile, contextData);

const notifFile = path.join(clientSrc, 'pages/customer/Notifications.jsx');
let notifData = fs.readFileSync(notifFile, 'utf8');

const formatTimeFn = `
  const formatTimeAgo = (createdAt, fallbackTime) => {
    if (!createdAt) return fallbackTime || 'Just now';
    const date = new Date(createdAt);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return \`\${Math.floor(diffInSeconds / 60)} mins ago\`;
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return \`\${hours} hour\${hours > 1 ? 's' : ''} ago\`;
    }
    if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return \`\${days} day\${days > 1 ? 's' : ''} ago\`;
    }
    return date.toLocaleDateString();
  };
`;

if (!notifData.includes('formatTimeAgo')) {
  notifData = notifData.replace(
    "  const getIconForType = (type) => {",
    formatTimeFn + "\n  const getIconForType = (type) => {"
  );
  
  notifData = notifData.replace(
    "<span className=\"notification-time\">{notification.time}</span>",
    "<span className=\"notification-time\">{formatTimeAgo(notification.createdAt, notification.time)}</span>"
  );
  
  fs.writeFileSync(notifFile, notifData);
}

console.log("Done");
