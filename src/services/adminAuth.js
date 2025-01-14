const ALLOWED_IPS = ['104.28.213.229', 'localhost']; // Добавьте сюда разрешенные IP

export const checkAdminAccess = async () => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return ALLOWED_IPS.includes(data.ip);
  } catch (error) {
    console.error('Error checking IP:', error);
    return false;
  }
};
