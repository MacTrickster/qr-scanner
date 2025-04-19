import dynamic from 'next/dynamic';
import Head from 'next/head';
import { appStyles } from '../style/style';

// Динамічний імпорт компонента QR сканера для клієнтської сторони
const QRScannerWithNoSSR = dynamic(
  () => import('../components/QRScanner'),
  { ssr: false }
);

export default function Home() {
  return (
    <>
      <Head>
        <title>Складська База | QR Scanner</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#4285f4" />
        <style>{appStyles}</style>
      </Head>
      <div className="app-wrapper">
        <QRScannerWithNoSSR />
      </div>
    </>
  );
}
