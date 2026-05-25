declare module '*.svg' {
  const content: any;
  export default content;
}
declare module 'next/*';

interface Window {
  Pusher: any;
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

interface ImportMetaEnv {
  readonly NEXT_PUBLIC_PUSHER_KEY: string;
  readonly NEXT_PUBLIC_PUSHER_CLUSTER: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
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
