export {};
declare global {
  interface Window {
    Telegram?: any;
    Tesseract?: any;
    XLSX?: any;
    jspdf?: { jsPDF: any };
    CribbitI18n?: any;
    CribbitForms?: any;
    CribbitAppConfig?: any;
  }
  const Tesseract: any;
  const XLSX: any;
}
