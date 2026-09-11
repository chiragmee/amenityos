import QRCode from "qrcode";

/** Real, scannable QR code encoding the booking's actual access token —
 * replaces the earlier placeholder (a deterministic noise SVG that only
 * looked like a QR code but decoded to nothing). */
export function generateAccessQrDataUri(accessToken: string): Promise<string> {
  return QRCode.toDataURL(accessToken, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 300,
  });
}
