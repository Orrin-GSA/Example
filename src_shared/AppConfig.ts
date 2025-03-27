// A wrapper class for environment values. Custom values are provided by .env files. See below for more details.
// https://parceljs.org/features/node-emulation/#environment-variables


// the command 'parcel build index.html' will set the NODE_ENV to 'production', as opposed to 'parcel index.html' which will set it to 'development'. 
export const isDevelopment = process.env.NODE_ENV === 'development' ? true : false;

//  This should help prevent publishes to the container from having isLocal enabled accidentally.
/** If true, should pull data from local sources instead of google. */
//@ts-expect-error Hack
export const inContainer = typeof google !== 'undefined';

// Avoid using isLocal where possible.
export const isLocal = !inContainer;
//@ts-expect-error Hack
export const useLocalData = isDevelopment && (typeof google === 'undefined' || process.env.USE_LOCAL_DATA === 'true');

const AppConfig = {
    isDevelopment,
    useLocalData,
    inContainer
};

export default AppConfig;