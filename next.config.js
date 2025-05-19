/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@ant-design',
    'antd',
    'rc-util',
    'rc-pagination',
    'rc-picker',
    'rc-table',
    'rc-tree',
    'rc-select',
    'rc-cascader',
    'rc-checkbox',
    'rc-dropdown',
    'rc-menu',
    'rc-input',
    'rc-input-number',
    'rc-motion',
    'rc-notification',
    'rc-tooltip',
    'rc-trigger',
    '@rc-component'
  ],
  experimental: {
    esmExternals: false
  }
};

module.exports = nextConfig; 