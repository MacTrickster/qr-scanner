import dynamic from 'next/dynamic';

// Динамічний імпорт компонента QR сканера для клієнтської сторони
const QRScannerWithNoSSR = dynamic(
  () => import('../components/QRScanner'),
  { ssr: false }
);

export default function Home() {
  return (
    <div>
      <QRScannerWithNoSSR />
    </div>
  );
}
