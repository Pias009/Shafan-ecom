declare module '*.svg' {
  const content: any;
  export default content;
}
declare module 'next/*';

interface Window {
  gapi: any;
  tamaraWidgetConfig?: {
    publicKey: string;
    lang: string;
    country?: string;
  };
  TamaraWidgetV2?: {
    refresh: () => void;
  };
}

declare namespace JSX {
  interface IntrinsicElements {
    "tamara-widget": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      type?: string;
      amount?: string;
      "inline-type"?: string;
      config?: string;
    };
  }
}
