const ASSET_NAME = /^[a-zA-Z0-9_-]+\.(png|webp|svg|jpe?g)$/;

export const isAssetName = (file: string): boolean => ASSET_NAME.test(file);
