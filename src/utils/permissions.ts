import { PermissionsAndroid } from 'react-native';

export const requestGalleryPermission = async (): Promise<boolean> => {
  try {
    const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      return true;
    } else {
      // console.log('Gallery permission denied');
      return false;
    }
  } catch (err) {
    // console.warn(err);
    return false;
  }
};
