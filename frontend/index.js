/**
 * @format
 */
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

import { fetch as polyfillFetch } from 'react-native-fetch-api';
import { TextDecoder, TextEncoder } from 'text-encoding';
import { ReadableStream } from 'web-streams-polyfill';

global.ReadableStream = ReadableStream;

global.fetch = polyfillFetch;
global.TextDecoder = TextDecoder;
global.TextEncoder = TextEncoder;

AppRegistry.registerComponent(appName, () => App);