declare module '*.svg' {
  const content: any;
  export default content;
}
declare module 'next/*';

interface Window {
  Pusher: any;
}

interface ImportMetaEnv {
  readonly NEXT_PUBLIC_PUSHER_KEY: string;
  readonly NEXT_PUBLIC_PUSHER_CLUSTER: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

