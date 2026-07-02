export type CameraFacing = "user" | "environment";

export const PHOTO_MIME_TYPE = "image/jpeg";
export const PHOTO_TARGET_SIZE = 480;
const PHOTO_QUALITY = 0.75;

/**
 * Crops the video's current frame to a centered square and downscales it to
 * PHOTO_TARGET_SIZE — since the photo rides in the URL/short-link payload
 * alongside everything else, keeping it small (JPEG, modest resolution) is
 * what keeps links fast to open, same reasoning as the audio bitrate cap.
 * The front camera's preview is shown mirrored (natural "selfie" framing),
 * so the capture is mirrored to match what the user actually saw on screen.
 */
export function captureSquarePhoto(video: HTMLVideoElement, facing: CameraFacing): Promise<Uint8Array> {
  const size = Math.min(video.videoWidth, video.videoHeight);
  const sx = (video.videoWidth - size) / 2;
  const sy = (video.videoHeight - size) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = PHOTO_TARGET_SIZE;
  canvas.height = PHOTO_TARGET_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.reject(new Error("Canvas not supported."));

  if (facing === "user") {
    ctx.translate(PHOTO_TARGET_SIZE, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(video, sx, sy, size, size, 0, 0, PHOTO_TARGET_SIZE, PHOTO_TARGET_SIZE);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Couldn't process that photo."));
          return;
        }
        blob
          .arrayBuffer()
          .then((buf) => resolve(new Uint8Array(buf)))
          .catch(reject);
      },
      PHOTO_MIME_TYPE,
      PHOTO_QUALITY,
    );
  });
}
