const os = require('os');

const getLocalIp = () => {
    const interfaces = os.networkInterfaces();
    for (let interfaceName in interfaces) {
        for (let iface of interfaces[interfaceName]) {
            if (!iface.internal && iface.family === 'IPv4') {
                return iface.address;
            }
        }
    }
    return 'IP not found';
};

//console.log("Local IP Address:", getLocalIp());
module.exports = getLocalIp;
