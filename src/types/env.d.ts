declare module 'react-native-config' {
  export interface NativeConfig {
    API_URL: string;
    GOOGLE_API_KEY: string;
    ENV: string;
  }

  export const Config: NativeConfig;
  export default Config;
}
