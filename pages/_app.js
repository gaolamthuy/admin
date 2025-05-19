// import 'antd/dist/reset.css'; // Ant Design global styles (potentially redundant with antd v5 CSS-in-JS and _document.js setup)
import { StyleProvider } from '@ant-design/cssinjs';
import { AuthProvider } from '../components/AuthProvider';
import Head from 'next/head';

function MyApp({ Component, pageProps }) {
  // Use the layout defined at the page level, if available
  const getLayout = Component.getLayout || ((page) => page);

  return (
    <StyleProvider hashPriority="high">
      <Head>
        <title>Print Service Dashboard</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <AuthProvider>
        {getLayout(<Component {...pageProps} />)}
      </AuthProvider>
    </StyleProvider>
  );
}

export default MyApp; 